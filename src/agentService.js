// ── Agent tool definitions ────────────────────────────────────────────────────

const AGENT_TOOLS = [
  {
    name: 'scale_objects',
    description: 'Scale objects toward their centroid — make bigger or smaller. Synonyms: resize, grow, shrink, expand, compress, enlarge, reduce, increase size, decrease size.',
    input_schema: {
      type: 'object',
      required: ['target', 'percent'],
      properties: {
        target: { type: 'string', description: 'Name pattern, group name, or "all". Examples: "wheels", "front wing", "chassis", "all"' },
        percent: { type: 'number', description: 'Percentage change. -50 = 50% smaller/half-size, +100 = double size, -25 = 25% smaller, +50 = 50% larger' },
      },
    },
  },
  {
    name: 'smooth_objects',
    description: 'Apply Laplacian smoothing to round sharp angles. Synonyms: round, soften, polish, blend, organic, smooth out edges.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        iterations: { type: 'number', description: '1–5, default 2. More iterations = smoother.' },
        factor: { type: 'number', description: '0.1–1.0 smoothing strength, default 0.5' },
      },
    },
  },
  {
    name: 'change_color',
    description: 'Change the color of objects. Synonyms: paint, tint, recolor, set color to, make it [color], turn [color].',
    input_schema: {
      type: 'object',
      required: ['target', 'color'],
      properties: {
        target: { type: 'string' },
        color: { type: 'string', description: 'Hex color. Common: red=#E02424, blue=#1D4ED8, green=#15803D, black=#111111, white=#F9FAFB, silver=#9CA3AF, yellow=#EAB308, orange=#EA580C, purple=#7C3AED, brown=#78350F, gold=#D97706, gray=#6B7280' },
      },
    },
  },
  {
    name: 'move_objects',
    description: 'Move/translate objects by a delta. Synonyms: shift, push, pull, offset, reposition, nudge. Y is up/down, X is left/right, Z is forward/back.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        x: { type: 'number', description: 'Delta X (positive = right)' },
        y: { type: 'number', description: 'Delta Y (positive = up)' },
        z: { type: 'number', description: 'Delta Z (positive = backward)' },
      },
    },
  },
  {
    name: 'rotate_objects',
    description: 'Rotate objects around an axis. Synonyms: turn, spin, tilt, angle, flip, orient. Default axis is Y (vertical spin).',
    input_schema: {
      type: 'object',
      required: ['target', 'degrees'],
      properties: {
        target: { type: 'string' },
        degrees: { type: 'number', description: 'Degrees to rotate. Positive = counterclockwise from above.' },
        axis: { type: 'string', enum: ['x', 'y', 'z'], description: 'y = vertical spin (default), x = tilt forward/back, z = tilt left/right' },
      },
    },
  },
  {
    name: 'toggle_visibility',
    description: 'Show or hide objects. Synonyms: hide=make invisible/conceal/turn off; show=reveal/unhide/make visible.',
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
    name: 'change_material',
    description: 'Change material type and physical properties. Use for: metallic/shiny/glossy → metalness=0.9 roughness=0.1; matte/rough/dull → metalness=0 roughness=0.9; wireframe → materialType=wireframe.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
        materialType: { type: 'string', enum: ['standard', 'physical', 'wireframe'] },
        metalness: { type: 'number', description: '0.0 = matte, 1.0 = fully metallic' },
        roughness: { type: 'number', description: '0.0 = mirror-smooth, 1.0 = fully rough/matte' },
      },
    },
  },
  {
    name: 'group_objects',
    description: 'Create a named group from matching objects. Synonyms: combine, collect, bundle, organize into.',
    input_schema: {
      type: 'object',
      required: ['target', 'group_name'],
      properties: {
        target: { type: 'string' },
        group_name: { type: 'string' },
      },
    },
  },
  {
    name: 'ungroup_objects',
    description: 'Dissolve a group, releasing its objects as ungrouped. Synonyms: separate, split, dissolve group, unmerge.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string', description: 'Group name to dissolve.' },
      },
    },
  },
  {
    name: 'delete_objects',
    description: 'Permanently remove objects from the scene. Synonyms: erase, destroy, get rid of, remove.',
    input_schema: {
      type: 'object',
      required: ['target'],
      properties: {
        target: { type: 'string' },
      },
    },
  },
  {
    name: 'add_primitive',
    description: 'Add a new basic shape to the scene. Synonyms: create, insert, place, spawn, put.',
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

// ── Target resolution ─────────────────────────────────────────────────────────

export function resolveTargets(target, objects, groups) {
  const t = (target || '').toLowerCase().trim();
  if (!t || t === 'all') return objects;

  const group = groups.find(g => g.name.toLowerCase() === t || t === g.id.toLowerCase());
  if (group) return objects.filter(o => o.groupId === group.id);

  const partialGroup = groups.find(g =>
    g.name.toLowerCase().includes(t) || t.includes(g.name.toLowerCase())
  );
  if (partialGroup) return objects.filter(o => o.groupId === partialGroup.id);

  const byName = objects.filter(o => o.name.toLowerCase().includes(t));
  if (byName.length) return byName;

  return objects.filter(o => o.name.toLowerCase().split(' ')[0] === t.split(' ')[0]);
}

// ── Scene description ─────────────────────────────────────────────────────────

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

// ── Shared system prompt ──────────────────────────────────────────────────────

function buildSystemPrompt(sceneDesc) {
  return `You are an AI assistant controlling a 3D sculpting tool called Sculpt3D. Translate the user's natural language command into one or more tool calls.

${sceneDesc}

Synonym guide (natural language → tool):
- "make X smaller / decrease / reduce / shrink / compress X" → scale_objects percent=negative
- "make X bigger / larger / increase / grow / expand / enlarge X" → scale_objects percent=positive
- "double X / 2× X" → scale_objects percent=100
- "half the size / make X tiny" → scale_objects percent=-50
- "paint / color / tint / turn X red/blue/…" → change_color
- "hide / make invisible / conceal X" → toggle_visibility visible=false
- "show / reveal / unhide X" → toggle_visibility visible=true
- "smooth / round / soften / polish X" → smooth_objects
- "move / shift / push X up/down/left/right" → move_objects
- "rotate / turn / spin / tilt X by N degrees" → rotate_objects
- "make X metallic / shiny / glossy" → change_material metalness=0.9 roughness=0.1
- "make X matte / rough / dull" → change_material metalness=0 roughness=0.9
- "wireframe X" → change_material materialType=wireframe
- "delete / remove / erase / get rid of X" → delete_objects
- "add / create / place a cube/sphere/cylinder/cone" → add_primitive
- "group X as Y / combine X into Y" → group_objects
- "ungroup / separate / dissolve X" → ungroup_objects

Target guide:
- Use group names for categories (e.g. "wheels" → target="wheels")
- Use object names for specific parts (e.g. "nose cone" → target="nose cone")
- Use "all" to affect everything

Only call tools that clearly match the user's intent.`;
}

// ── Robust JSON extractor (handles markdown, wrapped objects, partial text) ───

function extractJSON(text) {
  const t = text.trim();
  // Direct parse
  try { return JSON.parse(t); } catch {}
  // Strip markdown code fences
  const fenced = t.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
  try { return JSON.parse(fenced); } catch {}
  // Find outermost array
  const arrIdx = fenced.indexOf('[');
  if (arrIdx !== -1) {
    const arrEnd = fenced.lastIndexOf(']');
    if (arrEnd > arrIdx) {
      try { return JSON.parse(fenced.slice(arrIdx, arrEnd + 1)); } catch {}
    }
  }
  // Find outermost object
  const objIdx = fenced.indexOf('{');
  if (objIdx !== -1) {
    const objEnd = fenced.lastIndexOf('}');
    if (objEnd > objIdx) {
      try { return JSON.parse(fenced.slice(objIdx, objEnd + 1)); } catch {}
    }
  }
  return null;
}

// ── Call Anthropic ────────────────────────────────────────────────────────────

async function callAnthropicAgent(command, sceneDesc, apiKey, log, model) {
  const m = model || 'claude-sonnet-4-6';
  log('info', `Sending agent command to Anthropic (${m})…`);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: m,
      max_tokens: 2048,
      system: buildSystemPrompt(sceneDesc),
      messages: [{ role: 'user', content: command }],
      tools: AGENT_TOOLS,
      tool_choice: { type: 'auto' },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic error ${res.status}: ${body || res.statusText}`);
  }
  const data = await res.json();
  const ops = (data.content || [])
    .filter(b => b.type === 'tool_use')
    .map(b => ({ tool: b.name, input: b.input }));
  log('success', `Anthropic returned ${ops.length} operation${ops.length !== 1 ? 's' : ''}`);
  return ops;
}

// ── Call OpenAI ───────────────────────────────────────────────────────────────

async function callOpenAIAgent(command, sceneDesc, apiKey, log, model) {
  const m = model || 'gpt-4o';
  log('info', `Sending agent command to OpenAI (${m})…`);
  const tools = AGENT_TOOLS.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: m,
      messages: [
        { role: 'system', content: buildSystemPrompt(sceneDesc) },
        { role: 'user', content: command },
      ],
      tools,
      tool_choice: 'auto',
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${body || res.statusText}`);
  }
  const data = await res.json();
  const calls = [];
  for (const choice of data.choices) {
    for (const tc of (choice.message?.tool_calls || [])) {
      try { calls.push({ tool: tc.function.name, input: JSON.parse(tc.function.arguments) }); } catch {}
    }
    if (choice.message?.function_call) {
      try {
        const fc = choice.message.function_call;
        calls.push({ tool: fc.name, input: JSON.parse(fc.arguments) });
      } catch {}
    }
  }
  log('success', `OpenAI returned ${calls.length} operation${calls.length !== 1 ? 's' : ''}`);
  return calls;
}

// ── Call Ollama (chat with generate fallback) ─────────────────────────────────

async function callOllamaAgent(command, sceneDesc, ollamaUrl, modelOverride, log) {
  const model = modelOverride || 'mistral';
  log('info', `Sending agent command to Ollama (${model})…`);

  // Compact system prompt for local models — shorter = faster + more reliable
  const systemPrompt = `You control a 3D scene. Respond ONLY with a JSON array of operations. No explanation, no markdown.

${sceneDesc}

Operations:
{"tool":"scale_objects","input":{"target":"<name>","percent":<n>}}   // bigger:positive, smaller:negative. double=100, half=-50
{"tool":"smooth_objects","input":{"target":"<name>","iterations":<1-5>,"factor":<0.1-1>}}
{"tool":"change_color","input":{"target":"<name>","color":"<#hex>"}}   // red=#E02424 blue=#1D4ED8 green=#15803D black=#111111 white=#F9FAFB silver=#9CA3AF yellow=#EAB308 orange=#EA580C
{"tool":"move_objects","input":{"target":"<name>","x":<n>,"y":<n>,"z":<n>}}
{"tool":"rotate_objects","input":{"target":"<name>","degrees":<n>,"axis":"x"|"y"|"z"}}
{"tool":"toggle_visibility","input":{"target":"<name>","visible":<bool>}}
{"tool":"change_material","input":{"target":"<name>","materialType":"standard"|"physical"|"wireframe","metalness":<0-1>,"roughness":<0-1>}}
{"tool":"delete_objects","input":{"target":"<name>"}}
{"tool":"add_primitive","input":{"primitive_type":"cube"|"sphere"|"cylinder"|"cone","color":"<#hex>"}}
{"tool":"group_objects","input":{"target":"<name>","group_name":"<name>"}}
{"tool":"ungroup_objects","input":{"target":"<name>"}}

Examples:
"make wheels smaller" → [{"tool":"scale_objects","input":{"target":"wheels","percent":-30}}]
"paint chassis red" → [{"tool":"change_color","input":{"target":"chassis","color":"#E02424"}}]
"round the nose cone" → [{"tool":"smooth_objects","input":{"target":"nose cone","iterations":2,"factor":0.5}}]`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  let elapsed = 0;
  const heartbeat = setInterval(() => {
    elapsed += 15;
    log('info', `Still processing… (${elapsed}s elapsed)`);
  }, 15_000);

  const parseOps = (text) => {
    const parsed = extractJSON(text);
    if (!parsed) {
      log('warn', 'Could not parse JSON from Ollama response');
      return null; // signal failure
    }
    return Array.isArray(parsed) ? parsed : (parsed.operations || parsed.ops || []);
  };

  try {
    // ── Attempt 1: /api/chat (no format:json — causes 500 on many models) ──────
    let text = null;
    const chatRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: command },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    if (chatRes.ok) {
      const data = await chatRes.json();
      text = data.message?.content || data.response || '';
    } else {
      log('warn', `Chat endpoint returned ${chatRes.status}, trying /api/generate…`);
      // ── Attempt 2: /api/generate fallback ───────────────────────────────────
      const genRes = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          prompt: command,
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!genRes.ok) throw new Error(`Ollama error ${genRes.status}: ${genRes.statusText}`);
      const data = await genRes.json();
      text = data.response || '';
    }

    const ops = parseOps(text);
    if (ops === null) {
      log('warn', 'Ollama returned unparseable response — falling through to regex');
      return [];
    }
    log('success', `Ollama returned ${ops.length} operation${ops.length !== 1 ? 's' : ''}`);
    return ops;
  } finally {
    clearTimeout(timeout);
    clearInterval(heartbeat);
  }
}

// ── Comprehensive regex fallback (works with no API at all) ───────────────────

function parseCommandFallback(command, objects, groups) {
  const ops = [];
  const cmd = command.toLowerCase().trim();

  // ── Scale ─────────────────────────────────────────────────────────────────────
  const SHRINK = /\b(?:smaller|decrease|reduce|shrink|compress|scale\s+down|miniaturize|less)\b/;
  const GROW   = /\b(?:bigger|larger|increase|grow|expand|enlarge|scale\s+up|more)\b/;

  const pctMatch =
    cmd.match(/(?:decrease|reduce|shrink|compress|increase|grow|expand|make|scale|resize)\s+(?:the\s+)?(.+?)\s+(?:by\s+)?(\d+)\s*%/i) ||
    cmd.match(/(.+?)\s+(\d+)\s*%\s+(?:smaller|larger|bigger|more|less)/i) ||
    cmd.match(/(?:scale|resize)\s+(?:the\s+)?(.+?)\s+(?:by\s+)?(-?\d+)\s*%/i);

  if (pctMatch) {
    const target = pctMatch[1].replace(/\b(?:by|the|a|an)\b/g, '').trim();
    let pct = parseFloat(pctMatch[2]);
    pct = SHRINK.test(cmd) ? -Math.abs(pct) : Math.abs(pct);
    ops.push({ tool: 'scale_objects', input: { target, percent: pct } });
  } else if (/\bdouble\b/.test(cmd)) {
    const t = cmd.replace(/^(?:double|make\s+double|2x)\s+(?:the\s+)?(?:size\s+of\s+)?(?:the\s+)?/i, '').trim() || 'all';
    ops.push({ tool: 'scale_objects', input: { target: t, percent: 100 } });
  } else if (/\bhalf\b/.test(cmd)) {
    const t = cmd.replace(/^(?:make|set)\s+(?:the\s+)?|half(?:\s+(?:the\s+)?size(?:\s+of)?)?(?:\s+(?:the\s+)?)?/gi, '').trim() || 'all';
    ops.push({ tool: 'scale_objects', input: { target: t, percent: -50 } });
  } else if (GROW.test(cmd) && !pctMatch) {
    const t = cmd.replace(/^(?:make|grow|enlarge|expand)\s+(?:the\s+)?/i, '')
                  .replace(/\b(?:bigger|larger|more)\b/g, '').trim() || 'all';
    ops.push({ tool: 'scale_objects', input: { target: t, percent: 50 } });
  } else if (SHRINK.test(cmd) && !pctMatch) {
    const t = cmd.replace(/^(?:make|shrink|reduce|decrease)\s+(?:the\s+)?/i, '')
                  .replace(/\b(?:smaller|less)\b/g, '').trim() || 'all';
    ops.push({ tool: 'scale_objects', input: { target: t, percent: -30 } });
  }

  // ── Smooth ────────────────────────────────────────────────────────────────────
  const smoothMatch = cmd.match(/(?:smooth|round|soften|polish|blend)\s+(?:out\s+)?(?:the\s+)?(.+)/i);
  if (smoothMatch) {
    ops.push({ tool: 'smooth_objects', input: { target: smoothMatch[1].trim(), iterations: 2, factor: 0.5 } });
  }

  // ── Color ─────────────────────────────────────────────────────────────────────
  const colorMap = {
    red: '#E02424', blue: '#1D4ED8', green: '#15803D', black: '#111111',
    white: '#F9FAFB', silver: '#9CA3AF', yellow: '#EAB308', orange: '#EA580C',
    purple: '#7C3AED', brown: '#78350F', gold: '#D97706', gray: '#6B7280', grey: '#6B7280',
  };
  const colorWords = Object.keys(colorMap).join('|');
  const colorMatch =
    cmd.match(new RegExp(`(?:color|paint|make|turn|change|set|tint)\\s+(?:the\\s+)?(.+?)\\s+(?:to\\s+)?(${colorWords})(?:\\s|$)`, 'i')) ||
    cmd.match(new RegExp(`(?:color|paint|make|turn|change|set|tint)\\s+(?:the\\s+)?(.+?)\\s+(${colorWords})`, 'i'));
  if (colorMatch) {
    const name = colorMatch[2].toLowerCase();
    ops.push({ tool: 'change_color', input: { target: colorMatch[1].replace(/\b(to|the|a)\b/g, '').trim(), color: colorMap[name] } });
  }

  // ── Visibility ────────────────────────────────────────────────────────────────
  const hideMatch = cmd.match(/(?:hide|invisible|conceal|turn\s+off)\s+(?:the\s+)?(.+)/i);
  if (hideMatch) ops.push({ tool: 'toggle_visibility', input: { target: hideMatch[1].trim(), visible: false } });
  const showMatch = cmd.match(/(?:show|reveal|unhide|make\s+visible|turn\s+on)\s+(?:the\s+)?(.+)/i);
  if (showMatch) ops.push({ tool: 'toggle_visibility', input: { target: showMatch[1].trim(), visible: true } });

  // ── Move ──────────────────────────────────────────────────────────────────────
  const moveMatch = cmd.match(/(?:move|shift|push|pull|nudge|translate)\s+(?:the\s+)?(.+?)\s+(up|down|left|right|forward|backward|back)\s*(?:by\s+)?(\d*\.?\d+)?/i);
  if (moveMatch) {
    const dir = moveMatch[2].toLowerCase();
    const amt = parseFloat(moveMatch[3] || '1');
    const delta = { x: 0, y: 0, z: 0 };
    if (dir === 'up')                    delta.y =  amt;
    else if (dir === 'down')             delta.y = -amt;
    else if (dir === 'right')            delta.x =  amt;
    else if (dir === 'left')             delta.x = -amt;
    else if (dir === 'forward')          delta.z = -amt;
    else                                 delta.z =  amt; // backward/back
    ops.push({ tool: 'move_objects', input: { target: moveMatch[1].trim(), ...delta } });
  }

  // ── Rotate ────────────────────────────────────────────────────────────────────
  const rotMatch = cmd.match(/(?:rotate|turn|spin|tilt|angle)\s+(?:the\s+)?(.+?)\s+(?:by\s+)?(\d+)\s*(?:degrees?|°)?(?:\s+(?:around\s+)?(?:the\s+)?(x|y|z)(?:\s+axis)?)?/i);
  if (rotMatch) {
    ops.push({ tool: 'rotate_objects', input: {
      target: rotMatch[1].trim(),
      degrees: parseFloat(rotMatch[2]),
      axis: (rotMatch[3] || 'y').toLowerCase(),
    }});
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  const delMatch = cmd.match(/(?:delete|remove|erase|destroy|get\s+rid\s+of)\s+(?:the\s+)?(.+)/i);
  if (delMatch) ops.push({ tool: 'delete_objects', input: { target: delMatch[1].trim() } });

  // ── Material ──────────────────────────────────────────────────────────────────
  if (/\bwireframe\b/.test(cmd)) {
    const t = cmd.replace(/^(?:make|set|turn|switch)\s+(?:the\s+)?/i, '').replace(/\bwireframe\b.*/i, '').trim() || 'all';
    ops.push({ tool: 'change_material', input: { target: t, materialType: 'wireframe' } });
  } else if (/\b(?:metallic?|shiny|glossy|chrome)\b/.test(cmd)) {
    const t = cmd.replace(/^(?:make|set|turn)\s+(?:the\s+)?/i, '').replace(/\b(?:metallic?|shiny|glossy|chrome)\b.*/i, '').trim() || 'all';
    ops.push({ tool: 'change_material', input: { target: t, metalness: 0.9, roughness: 0.1 } });
  } else if (/\b(?:matte|rough|dull)\b/.test(cmd)) {
    const t = cmd.replace(/^(?:make|set|turn)\s+(?:the\s+)?/i, '').replace(/\b(?:matte|rough|dull)\b.*/i, '').trim() || 'all';
    ops.push({ tool: 'change_material', input: { target: t, metalness: 0.0, roughness: 0.9 } });
  }

  return ops;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function executeAgentCommand(command, { objects, groups }, keys = {}, onLog = null, providerOverride = null, modelOverride = null) {
  const log = (type, msg) => onLog?.(type, msg);
  const sceneDesc = buildSceneDescription(objects, groups);
  log('info', `Scene: ${objects.length} objects, ${groups.length} groups`);

  const { Anthropic, OpenAI } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';
  const ollamaAgentModel = keys['Ollama Agent Model'] || null;

  // Resolve per-provider model: explicit override → saved key default → hardcoded default
  const anthropicModel = modelOverride || keys['Anthropic Agent Model'] || null;
  const openAIModel    = modelOverride || keys['OpenAI Agent Model']    || null;

  try {
    if      (providerOverride === 'Anthropic' || (!providerOverride && Anthropic))
      return await callAnthropicAgent(command, sceneDesc, Anthropic, log, anthropicModel);
    if      (providerOverride === 'OpenAI'    || (!providerOverride && OpenAI))
      return await callOpenAIAgent(command, sceneDesc, OpenAI, log, openAIModel);
    return await callOllamaAgent(command, sceneDesc, ollamaUrl, ollamaAgentModel, log);
  } catch (err) {
    if (err.name === 'AbortError') {
      log('error', 'Ollama timed out after 3 minutes. Try a smaller model or simpler command.');
      throw new Error('Ollama agent timed out after 3 minutes.');
    }
    console.warn('Agent API call failed, falling back to regex parser:', err);
    log('warn', 'API call failed — using built-in fallback: ' + err.message);
  }

  const ops = parseCommandFallback(command, objects, groups);
  log(ops.length > 0 ? 'info' : 'warn',
    ops.length > 0
      ? `Regex fallback matched ${ops.length} operation${ops.length !== 1 ? 's' : ''}`
      : 'No patterns matched. Try rephrasing or check your API/Ollama connection.'
  );
  return ops;
}
