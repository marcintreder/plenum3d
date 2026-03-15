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
        percent: { type: 'number', description: 'Percentage change. -50 = 50% smaller, 100 = 2× bigger, -25 = 25% smaller' },
      },
    },
  },
  {
    name: 'smooth_objects',
    description: 'Apply Laplacian smoothing to round sharp angles and edges. Use when asked to round, soften, or smooth a part.',
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
        color: { type: 'string', description: 'Hex color string. Common: #E02424=red, #1D4ED8=blue, #15803D=green, #111111=black, #F9FAFB=white, #9CA3AF=silver, #EAB308=yellow, #EA580C=orange, #7C3AED=purple, #78350F=brown' },
      },
    },
  },
  {
    name: 'move_objects',
    description: 'Move objects by a delta in world coordinates. Y is up/down, X is left/right, Z is forward/backward.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        x: { type: 'number', description: 'Delta in X axis (left/right)' },
        y: { type: 'number', description: 'Delta in Y axis (up/down)' },
        z: { type: 'number', description: 'Delta in Z axis (forward/backward)' },
      },
    },
  },
  {
    name: 'rotate_objects',
    description: 'Rotate objects around an axis by degrees. Use to tilt, spin, or reorient parts.',
    input_schema: {
      type: 'object',
      required: ['target', 'degrees'],
      properties: {
        target: { type: 'string' },
        degrees: { type: 'number', description: 'Degrees to rotate. Positive = counterclockwise when viewed from above (Y axis).' },
        axis: { type: 'string', enum: ['x', 'y', 'z'], description: 'Axis to rotate around. Default: y (vertical spin). x = tilt forward/back, z = tilt left/right.' },
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
    description: 'Create a new named group from matching objects.',
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
    name: 'ungroup_objects',
    description: 'Dissolve a group, releasing its objects as ungrouped individuals. The objects remain in the scene.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string', description: 'Group name to dissolve.' },
      },
    },
  },
  {
    name: 'change_material',
    description: 'Change material type and physical properties (metalness, roughness) of objects.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        materialType: { type: 'string', enum: ['standard', 'physical', 'wireframe'] },
        metalness: { type: 'number', description: '0.0 = matte, 1.0 = fully metallic' },
        roughness: { type: 'number', description: '0.0 = mirror-smooth, 1.0 = fully rough' },
      },
    },
  },
  {
    name: 'delete_objects',
    description: 'Permanently remove objects from the scene.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string', description: 'Name pattern or group name to delete.' },
      },
    },
  },
  {
    name: 'add_primitive',
    description: 'Add a new primitive shape (cube, sphere, cylinder, or cone) to the scene.',
    input_schema: {
      type: 'object',
      required: ['primitive_type'],
      properties: {
        primitive_type: { type: 'string', enum: ['cube', 'sphere', 'cylinder', 'cone'] },
        color: { type: 'string', description: 'Hex color for the new shape.' },
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
  const lines = [];
  for (const g of groups) {
    const members = objects.filter(o => o.groupId === g.id).map(o => o.name);
    if (members.length) lines.push(`${g.name}: ${members.join(', ')}`);
  }
  const ungrouped = objects.filter(o => !o.groupId).map(o => o.name);
  if (ungrouped.length) lines.push(`Ungrouped: ${ungrouped.join(', ')}`);
  return `SCENE (${objects.length} objects):\n${lines.join('\n')}`;
}

// ── Shared system prompt text ─────────────────────────────────────────────────

function buildSystemPrompt(sceneDesc) {
  return `You are an AI assistant controlling a 3D sculpting tool called Sculpt3D. Translate the user's natural language command into tool calls that modify the scene.

${sceneDesc}

Rules:
- Scale: "50% smaller" → percent=-50 | "50% bigger/larger" → percent=+50 | "double" → percent=+100 | "half" → percent=-50
- Targets: use group names for categories (e.g. "wheels"), object names for specific parts (e.g. "nose cone"), "all" for everything
- Colors: red=#E02424, blue=#1D4ED8, green=#15803D, black=#111111, white=#F9FAFB, silver=#9CA3AF, yellow=#EAB308, orange=#EA580C, purple=#7C3AED, brown=#78350F, gold=#D97706
- When user says "round", "smooth", or "soften" something → use smooth_objects
- Rotation: "spin 90 degrees" → degrees=90, axis=y | "tilt forward" → axis=x | default axis is y
- Only call tools that match the user's request. Prefer specific targets over "all".`;
}

// ── Call Anthropic with tool use ─────────────────────────────────────────────

async function callAnthropicAgent(command, sceneDesc, apiKey, log) {
  log('info', 'Sending agent command to Anthropic (claude-sonnet-4-6)…');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(sceneDesc),
      messages: [{ role: 'user', content: command }],
      tools: AGENT_TOOLS,
      tool_choice: { type: 'auto' },
    }),
  });
  if (!res.ok) throw new Error(`Anthropic agent error: ${res.statusText}`);
  const data = await res.json();
  const ops = (data.content || [])
    .filter(b => b.type === 'tool_use')
    .map(b => ({ tool: b.name, input: b.input }));
  log('success', `Anthropic returned ${ops.length} operation${ops.length !== 1 ? 's' : ''}`);
  return ops;
}

// ── Call OpenAI with function calling ────────────────────────────────────────

async function callOpenAIAgent(command, sceneDesc, apiKey, log) {
  log('info', 'Sending agent command to OpenAI (gpt-4o)…');
  const tools = AGENT_TOOLS.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildSystemPrompt(sceneDesc) },
        { role: 'user', content: command },
      ],
      tools,
      tool_choice: 'auto',
    }),
  });
  if (!res.ok) throw new Error(`OpenAI agent error: ${res.statusText}`);
  const data = await res.json();
  const calls = [];
  for (const choice of data.choices) {
    for (const tc of (choice.message?.tool_calls || [])) {
      try {
        calls.push({ tool: tc.function.name, input: JSON.parse(tc.function.arguments) });
      } catch { /* skip malformed */ }
    }
    // Legacy function_call fallback
    if (choice.message?.function_call) {
      try {
        const fc = choice.message.function_call;
        calls.push({ tool: fc.name, input: JSON.parse(fc.arguments) });
      } catch { /* skip */ }
    }
  }
  log('success', `OpenAI returned ${calls.length} operation${calls.length !== 1 ? 's' : ''}`);
  return calls;
}

// ── Simple regex fallback (no API key needed) ────────────────────────────────

function parseCommandFallback(command, objects, groups) {
  const ops = [];
  const cmd = command.toLowerCase();

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

  const smoothMatch = cmd.match(/(?:smooth|round|soften)\s+(.+)/i);
  if (smoothMatch) {
    ops.push({ tool: 'smooth_objects', input: { target: smoothMatch[1].trim(), iterations: 2, factor: 0.5 } });
  }

  const colorMap = { red: '#E02424', blue: '#1D4ED8', green: '#15803D', black: '#111111', white: '#F9FAFB', silver: '#9CA3AF', yellow: '#EAB308', orange: '#EA580C', purple: '#7C3AED' };
  const colorMatch = cmd.match(/(?:color|paint|make)\s+(.+?)\s+(red|blue|green|black|white|silver|yellow|orange|purple)/i);
  if (colorMatch) {
    ops.push({ tool: 'change_color', input: { target: colorMatch[1].trim(), color: colorMap[colorMatch[2].toLowerCase()] } });
  }

  return ops;
}

// ── Call Ollama ───────────────────────────────────────────────────────────────

async function callOllamaAgent(command, sceneDesc, ollamaUrl, modelOverride, log) {
  const model = modelOverride || 'mistral';
  log('info', `Sending agent command to Ollama (${model})…`);
  log('warn', 'Large models can be slow — console will update when done.');

  const systemPrompt = `You are an AI assistant controlling a 3D sculpting tool. The user gives natural language commands to modify a 3D scene. Respond ONLY with a JSON array of operations.

${sceneDesc}

Available operations:
- {"tool":"scale_objects","input":{"target":"<name or group>","percent":<number>}}
- {"tool":"smooth_objects","input":{"target":"<name or group>","iterations":<1-5>,"factor":<0.1-1.0>}}
- {"tool":"change_color","input":{"target":"<name or group>","color":"<hex>"}}
- {"tool":"move_objects","input":{"target":"<name or group>","x":<n>,"y":<n>,"z":<n>}}
- {"tool":"rotate_objects","input":{"target":"<name or group>","degrees":<n>,"axis":"x"|"y"|"z"}}
- {"tool":"toggle_visibility","input":{"target":"<name or group>","visible":<bool>}}
- {"tool":"change_material","input":{"target":"<name or group>","materialType":"standard"|"physical"|"wireframe","metalness":<0-1>,"roughness":<0-1>}}
- {"tool":"delete_objects","input":{"target":"<name or group>"}}
- {"tool":"add_primitive","input":{"primitive_type":"cube"|"sphere"|"cylinder"|"cone","color":"<hex>"}}
- {"tool":"group_objects","input":{"target":"<name or group>","group_name":"<new group name>"}}
- {"tool":"ungroup_objects","input":{"target":"<group name>"}}

Rules: "50% smaller"→percent=-50, "50% bigger"→percent=+50, "double"→percent=+100, "half"→percent=-50.
Colors: red=#E02424, blue=#1D4ED8, green=#15803D, black=#111111, white=#F9FAFB, silver=#9CA3AF, yellow=#EAB308, orange=#EA580C.
Return ONLY a valid JSON array. No explanation, no markdown.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  let elapsed = 0;
  const heartbeat = setInterval(() => {
    elapsed += 15;
    log('info', `Still processing… (${elapsed}s elapsed)`);
  }, 15_000);

  try {
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
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
    clearInterval(heartbeat);
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function executeAgentCommand(command, { objects, groups }, keys = {}, onLog = null, providerOverride = null) {
  const log = (type, msg) => onLog?.(type, msg);
  const sceneDesc = buildSceneDescription(objects, groups);
  log('info', `Scene: ${objects.length} objects, ${groups.length} groups`);

  const { Anthropic, OpenAI } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';
  const ollamaAgentModel = keys['Ollama Agent Model'] || null;

  try {
    if      (providerOverride === 'Anthropic' || (!providerOverride && Anthropic))
      return await callAnthropicAgent(command, sceneDesc, Anthropic, log);
    if      (providerOverride === 'OpenAI'    || (!providerOverride && OpenAI))
      return await callOpenAIAgent(command, sceneDesc, OpenAI, log);
    return await callOllamaAgent(command, sceneDesc, ollamaUrl, ollamaAgentModel, log);
  } catch (err) {
    if (err.name === 'AbortError') {
      log('error', 'Ollama timed out after 3 minutes. Try a smaller model or simpler command.');
      throw new Error('Ollama agent timed out after 3 minutes.');
    }
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
