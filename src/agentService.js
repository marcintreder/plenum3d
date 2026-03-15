// ── Agent tool definitions ────────────────────────────────────────────────────

const AGENT_TOOLS = [
  {
    name: 'scale_objects',
    description: 'Scale objects toward their centroid. Use to make things bigger or smaller.',
    input_schema: {
      type: 'object',
      required: ['target', 'percent'],
      properties: {
        target: { type: 'string', description: 'Name pattern, group name, or "all". Examples: "wheels", "front wing", "chassis", "all"' },
        percent: { type: 'number', description: 'Percentage change. -50 = 50% smaller, 100 = 2x bigger, -25 = 25% smaller' },
      },
    },
  },
  {
    name: 'smooth_objects',
    description: 'Apply Laplacian smoothing to round sharp angles and edges.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        iterations: { type: 'number', description: '1–5, default 2' },
        factor: { type: 'number', description: '0.1–1.0 how much to smooth, default 0.5' },
      },
    },
  },
  {
    name: 'change_color',
    description: 'Change the color of objects.',
    input_schema: {
      type: 'object',
      required: ['target', 'color'],
      properties: {
        target: { type: 'string' },
        color: { type: 'string', description: 'Hex color string like #FF0000 for red, #0000FF for blue, #111111 for black' },
      },
    },
  },
  {
    name: 'move_objects',
    description: 'Move objects by a delta in world coordinates.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        x: { type: 'number', description: 'Delta in X axis' },
        y: { type: 'number', description: 'Delta in Y axis (up/down)' },
        z: { type: 'number', description: 'Delta in Z axis' },
      },
    },
  },
  {
    name: 'toggle_visibility',
    description: 'Show or hide objects.',
    input_schema: {
      type: 'object',
      required: ['target', 'visible'],
      properties: {
        target: { type: 'string' },
        visible: { type: 'boolean' },
      },
    },
  },
  {
    name: 'group_objects',
    description: 'Create a new group from matching objects.',
    input_schema: {
      type: 'object',
      required: ['target', 'group_name'],
      properties: {
        target: { type: 'string' },
        group_name: { type: 'string', description: 'Name for the new group' },
      },
    },
  },
  {
    name: 'change_material',
    description: 'Change material properties of objects.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        materialType: { type: 'string', enum: ['standard', 'physical', 'wireframe'] },
        metalness: { type: 'number', description: '0.0–1.0' },
        roughness: { type: 'number', description: '0.0–1.0' },
      },
    },
  },
];

// ── Target resolution: find objects matching a string ────────────────────────

export function resolveTargets(target, objects, groups) {
  const t = (target || '').toLowerCase().trim();
  if (!t || t === 'all') return objects;

  // Try exact group name match
  const group = groups.find(g => g.name.toLowerCase() === t || t === g.id.toLowerCase());
  if (group) return objects.filter(o => o.groupId === group.id);

  // Try partial group name match
  const partialGroup = groups.find(g =>
    g.name.toLowerCase().includes(t) || t.includes(g.name.toLowerCase())
  );
  if (partialGroup) return objects.filter(o => o.groupId === partialGroup.id);

  // Try object name pattern
  const byName = objects.filter(o => o.name.toLowerCase().includes(t));
  if (byName.length) return byName;

  // Fallback: first word match
  return objects.filter(o => o.name.toLowerCase().split(' ')[0] === t.split(' ')[0]);
}

// ── Scene description for agent context ─────────────────────────────────────

function buildSceneDescription(objects, groups) {
  const groupNames = Object.fromEntries(groups.map(g => [g.id, g.name]));

  const objList = objects
    .slice(0, 60) // cap to avoid huge prompts
    .map(o => {
      const grp = o.groupId ? ` [group: ${groupNames[o.groupId] || o.groupId}]` : '';
      return `• "${o.name}"${grp} — ${o.vertices?.length ?? 0} vertices, color ${o.color}`;
    })
    .join('\n');

  const groupList = groups.map(g => {
    const count = objects.filter(o => o.groupId === g.id).length;
    return `• "${g.name}" (${count} parts)`;
  }).join('\n');

  return `GROUPS:\n${groupList}\n\nOBJECTS (${objects.length} total):\n${objList}`;
}

// ── Call Anthropic with tool use ─────────────────────────────────────────────

async function callAnthropicAgent(command, sceneDesc, apiKey, log) {
  log('info', 'Sending agent command to Anthropic (claude-opus-4-6)…');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: `You are an AI assistant controlling a 3D sculpting tool called Sculpt3D. The user gives natural language commands to modify a 3D scene. Translate their intent into tool calls. You may call multiple tools in sequence.

${sceneDesc}

Rules:
- "50% smaller" → percent = -50
- "50% larger" or "50% bigger" → percent = +50
- "double the size" → percent = +100
- "half the size" → percent = -50
- Use the group name when the user refers to a category (e.g. "wheels" → target "wheels")
- Color names: red=#E02424, blue=#1D4ED8, green=#15803D, black=#111111, white=#F9FAFB, silver=#9CA3AF, yellow=#EAB308, orange=#EA580C
- When user says "round" or "smooth" something, use smooth_objects
- Only call tools that match the user's request`,
      messages: [{ role: 'user', content: command }],
      tools: AGENT_TOOLS,
      tool_choice: { type: 'auto' },
    }),
  });
  if (!res.ok) throw new Error(`Anthropic agent error: ${res.statusText}`);
  const data = await res.json();
  // Extract tool_use blocks
  const ops = (data.content || [])
    .filter(b => b.type === 'tool_use')
    .map(b => ({ tool: b.name, input: b.input }));
  log('success', `Anthropic returned ${ops.length} operation${ops.length !== 1 ? 's' : ''}`);
  return ops;
}

// ── Call OpenAI with function calling ────────────────────────────────────────

async function callOpenAIAgent(command, sceneDesc, apiKey, log) {
  log('info', 'Sending agent command to OpenAI (gpt-4o)…');
  const functions = AGENT_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You control a 3D sculpting tool. Translate the user command into function calls.\n\n${sceneDesc}\n\nRules: "50% smaller" → percent=-50, "50% bigger" → percent=+50. Use group names for categories.`,
        },
        { role: 'user', content: command },
      ],
      functions,
      function_call: 'auto',
    }),
  });
  if (!res.ok) throw new Error(`OpenAI agent error: ${res.statusText}`);
  const data = await res.json();
  const calls = [];
  for (const choice of data.choices) {
    if (choice.message?.function_call) {
      const fc = choice.message.function_call;
      try {
        calls.push({ tool: fc.name, input: JSON.parse(fc.arguments) });
      } catch { /* skip malformed */ }
    }
  }
  log('success', `OpenAI returned ${calls.length} operation${calls.length !== 1 ? 's' : ''}`);
  return calls;
}

// ── Simple regex fallback (no API key needed) ────────────────────────────────

function parseCommandFallback(command, objects, groups) {
  const ops = [];
  const cmd = command.toLowerCase();

  // "decrease/increase/make X% smaller/bigger"
  const scaleMatch = cmd.match(/(?:decrease|reduce|shrink|make|increase|grow)\s+(.+?)\s+(?:by\s+)?(\d+)%\s*(?:smaller|larger|bigger)?/i)
    || cmd.match(/(?:scale|resize)\s+(.+?)\s+(?:by\s+)?(-?\d+)%/i)
    || cmd.match(/(.+?)\s+(\d+)%\s+(?:smaller|larger|bigger)/i);

  if (scaleMatch) {
    const target = scaleMatch[1].trim();
    let pct = parseFloat(scaleMatch[2]);
    if (cmd.includes('smaller') || cmd.includes('decrease') || cmd.includes('reduce') || cmd.includes('shrink')) pct = -Math.abs(pct);
    else pct = Math.abs(pct);
    ops.push({ tool: 'scale_objects', input: { target, percent: pct } });
  }

  // "smooth/round X"
  const smoothMatch = cmd.match(/(?:smooth|round|soften)\s+(.+)/i);
  if (smoothMatch) {
    ops.push({ tool: 'smooth_objects', input: { target: smoothMatch[1].trim(), iterations: 2, factor: 0.5 } });
  }

  // "color X red/blue/..."
  const colorMap = { red: '#E02424', blue: '#1D4ED8', green: '#15803D', black: '#111111', white: '#F9FAFB', silver: '#9CA3AF', yellow: '#EAB308', orange: '#EA580C', purple: '#7C3AED' };
  const colorMatch = cmd.match(/(?:color|paint|make)\s+(.+?)\s+(red|blue|green|black|white|silver|yellow|orange|purple)/i);
  if (colorMatch) {
    ops.push({ tool: 'change_color', input: { target: colorMatch[1].trim(), color: colorMap[colorMatch[2].toLowerCase()] } });
  }

  return ops;
}

// ── Main export ───────────────────────────────────────────────────────────────

async function callOllamaAgent(command, sceneDesc, ollamaUrl, modelOverride, log) {
  const model = modelOverride || 'mistral';
  log('info', `Sending agent command to Ollama (${model})…`);
  // Use /api/chat so the system message is reliably applied across all Ollama versions
  const systemPrompt = `You are an AI assistant controlling a 3D sculpting tool. The user gives natural language commands to modify a 3D scene. Respond ONLY with a JSON array of operations.

${sceneDesc}

Available operations:
- {"tool":"scale_objects","input":{"target":"<name or group>","percent":<number>}}
- {"tool":"smooth_objects","input":{"target":"<name or group>","iterations":<1-5>,"factor":<0.1-1.0>}}
- {"tool":"change_color","input":{"target":"<name or group>","color":"<hex>"}}
- {"tool":"move_objects","input":{"target":"<name or group>","x":<n>,"y":<n>,"z":<n>}}
- {"tool":"toggle_visibility","input":{"target":"<name or group>","visible":<bool>}}

Rules: "50% smaller" → percent=-50, "50% bigger" → percent=+50.
Return ONLY a valid JSON array. No explanation, no markdown, only JSON.`;

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: command },
      ],
      stream: false,
      format: 'json',
    }),
  });
  if (!res.ok) throw new Error(`Ollama agent error: ${res.statusText}`);
  const data = await res.json();
  const text = data.message?.content || data.response || '';
  try {
    const parsed = JSON.parse(text);
    const ops = Array.isArray(parsed) ? parsed : (parsed.operations || []);
    log('success', `Ollama agent returned ${ops.length} operation${ops.length !== 1 ? 's' : ''}`);
    return ops;
  } catch {
    console.warn('Ollama agent returned non-JSON:', text);
    log('warn', 'Ollama returned non-JSON response — no operations applied');
    return [];
  }
}

export async function executeAgentCommand(command, { objects, groups }, keys = {}, onLog = null) {
  const log = (type, msg) => onLog?.(type, msg);
  const sceneDesc = buildSceneDescription(objects, groups);
  log('info', `Scene: ${objects.length} objects, ${groups.length} groups`);

  const { Anthropic, OpenAI } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';
  const ollamaAgentModel = keys['Ollama Agent Model'] || null;

  try {
    if (Anthropic) return await callAnthropicAgent(command, sceneDesc, Anthropic, log);
    if (OpenAI)    return await callOpenAIAgent(command, sceneDesc, OpenAI, log);
    // Try Ollama if URL is configured or default is reachable
    return await callOllamaAgent(command, sceneDesc, ollamaUrl, ollamaAgentModel, log);
  } catch (err) {
    console.warn('Agent API call failed, falling back to regex parser:', err);
    log('warn', 'API call failed, using regex fallback: ' + err.message);
  }

  // Regex fallback — works without any API key or Ollama
  const ops = parseCommandFallback(command, objects, groups);
  if (ops.length > 0) {
    log('info', `Regex fallback matched ${ops.length} operation${ops.length !== 1 ? 's' : ''}`);
  } else {
    log('warn', 'No patterns matched the command');
  }
  return ops;
}
