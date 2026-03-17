import * as THREE from 'three';
import { extractObjectStructure } from './utils/objectStructure.js';

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Three.js 3D artist. Write JavaScript code that builds a high-quality 3D model.

The code runs with THREE available. Return an array of part descriptors:

return [
  {
    geometry: <any THREE.BufferGeometry>,
    color: '#RRGGBB',
    name: 'part name',
    position: [x, y, z],
    rotation: [rx, ry, rz],   // Euler radians, optional
    metalness: 0.0,            // optional
    roughness: 0.5,            // optional
  },
  ...
];

━━━ SPATIAL DISCIPLINE — the only rule that matters ━━━

Define all key dimensions as const variables. Derive EVERY position as math, never a magic number.

  const hullR = 0.22, hullH = 2.0;
  const wingW = 1.4, wingD = 0.55, wingThick = 0.05;
  const wingX = hullR + wingW / 2 - 0.03;   // flush to hull surface, slight overlap

Then use those variables in every position:
  position: [wingX, -0.2, 0.1]   ✓
  position: [0.85, -0.2, 0.1]    ✗  (magic number — breaks when you change hullR)

This guarantees parts connect. Do this for every part.

━━━ GEOMETRY — use the full Three.js API ━━━

Do NOT limit yourself to simple primitives. Choose the geometry that best represents the shape:

• LatheGeometry — car bodies, vases, rocket fuselages, any rotationally symmetric shape
  const pts = [new THREE.Vector2(0,0), new THREE.Vector2(0.4,0.3), ...];
  new THREE.LatheGeometry(pts, 32)

• ExtrudeGeometry — flat shapes with depth: wings, panels, brackets
  const shape = new THREE.Shape(); shape.moveTo(...); shape.bezierCurveTo(...);
  new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false })

• TubeGeometry — pipes, cables, tentacles, coils
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...), ...]);
  new THREE.TubeGeometry(curve, 20, 0.04, 8, false)

• CapsuleGeometry — limbs, fuselages, pill shapes
• TorusGeometry / TorusKnotGeometry — rings, engines, decorative elements
• IcosahedronGeometry / OctahedronGeometry — rocky, crystalline, sci-fi shapes
• SphereGeometry — domes, eyes, spherical tanks
• BoxGeometry — panels, blocks, structural members

━━━ QUALITY RULES ━━━

- Build the object as a real artist would: main body first, attach sub-parts, then surface details.
- Every part must physically touch its neighbour. Use the dimension-variable math above.
- 8–16 parts. Vary X, Y, and Z — no flat arrangements.
- Beautiful, accurate colours. Match the real object's materials (paint, metal, glass, rubber).
- Fit within a 4×4×4 unit bounding box, centred near the origin.
- Return ONLY the JavaScript — no markdown fences, no comments, no explanation.`;

function userPrompt(prompt) {
  return `Create a beautiful, detailed 3D model of: ${prompt}`;
}

function userPromptWithImage(prompt) {
  return `Create a beautiful, detailed 3D model of: ${prompt}\n\nThe attached image is your visual reference — match its proportions, colours, and key details as closely as possible.`;
}

// ── Code executor ─────────────────────────────────────────────────────────────

function stripFences(text) {
  return (text || '').replace(/^```(?:javascript|js)?\s*/m, '').replace(/```\s*$/m, '').trim();
}

function executeModelCode(code, name) {
  // eslint-disable-next-line no-new-func
  const fn = new Function('THREE', code);
  const descriptors = fn(THREE);

  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new Error('Generated code must return a non-empty array of mesh descriptors');
  }

  const parts = descriptors.map((desc, i) => {
    const geom = desc.geometry;
    if (!geom?.isBufferGeometry) throw new Error(`Part ${i} has no valid BufferGeometry`);

    const pos = geom.attributes.position;
    const vertices = [];
    for (let v = 0; v < pos.count; v++) {
      vertices.push([pos.getX(v), pos.getY(v), pos.getZ(v)]);
    }

    const indices = geom.index
      ? Array.from(geom.index.array)
      : Array.from({ length: pos.count }, (_, k) => k);

    geom.dispose();

    return {
      label:        desc.name     || `part-${i}`,
      vertices,
      indices,
      color:        desc.color    || '#888888',
      position:     (desc.position || [0, 0, 0]).map(Number),
      rotation:     (desc.rotation || [0, 0, 0]).map(Number),
      scale:        (desc.scale   || [1, 1, 1]).map(Number),
      metalness:    desc.metalness ?? 0.3,
      roughness:    desc.roughness ?? 0.7,
      materialType: 'physical',
    };
  });

  return { isParts: true, name, parts };
}

// ── Anthropic ─────────────────────────────────────────────────────────────────

async function generateWithAnthropic(prompt, referenceImage, apiKey, log, model) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  const m = model || 'claude-sonnet-4-6';
  log('info', `Generating 3D model (Anthropic / ${m})…`);

  const content = [];
  if (referenceImage) {
    const [header, imgData] = referenceImage.split(',');
    const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: imgData } });
    content.push({ type: 'text', text: userPromptWithImage(prompt) });
  } else {
    content.push({ type: 'text', text: userPrompt(prompt) });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers,
    body: JSON.stringify({ model: m, max_tokens: 4096, system: SYSTEM_PROMPT, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.statusText}`);
  const data = await res.json();
  log('info', 'Executing generated Three.js code…');
  return executeModelCode(stripFences(data.content[0].text), prompt);
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

async function generateWithOpenAI(prompt, referenceImage, apiKey, log, model) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
  const m = model || (referenceImage ? 'gpt-4o' : 'gpt-4o-mini');
  log('info', `Generating 3D model (OpenAI / ${m})…`);

  const userContent = [];
  if (referenceImage) {
    userContent.push({ type: 'image_url', image_url: { url: referenceImage } });
    userContent.push({ type: 'text', text: userPromptWithImage(prompt) });
  } else {
    userContent.push({ type: 'text', text: userPrompt(prompt) });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers,
    body: JSON.stringify({
      model: m,
      max_tokens: 4096,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  const data = await res.json();
  log('info', 'Executing generated Three.js code…');
  return executeModelCode(stripFences(data.choices[0].message.content), prompt);
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function generateWithGemini(prompt, referenceImage, apiKey, log, model) {
  const m = model || 'gemini-2.0-flash';
  log('info', `Generating 3D model (Gemini / ${m})…`);

  const userParts = [];
  if (referenceImage) {
    const [header, imgData] = referenceImage.split(',');
    userParts.push({ inline_data: { mime_type: header.match(/:(.*?);/)?.[1] || 'image/jpeg', data: imgData } });
    userParts.push({ text: userPromptWithImage(prompt) });
  } else {
    userParts.push({ text: userPrompt(prompt) });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: userParts }],
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);
  const data = await res.json();
  log('info', 'Executing generated Three.js code…');
  return executeModelCode(stripFences(data.candidates[0].content.parts[0].text), prompt);
}

// ── Ollama ────────────────────────────────────────────────────────────────────

async function generateWithOllama(prompt, referenceImage, ollamaUrl, modelOverride, log) {
  const modelName = modelOverride || (referenceImage ? 'llava' : 'mistral');
  log('info', `Sending request to Ollama (${modelName})…`);
  log('warn', 'Local models can take 1–3 minutes. Console will update when done.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    const body = {
      model: modelName,
      prompt: referenceImage ? userPromptWithImage(prompt) : userPrompt(prompt),
      system: SYSTEM_PROMPT,
      stream: false,
    };
    if (referenceImage) body.images = [referenceImage.split(',')[1] || referenceImage];

    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    log('info', 'Ollama response received — executing code…');
    const data = await res.json();
    return executeModelCode(stripFences(data.response || ''), prompt);
  } finally {
    clearTimeout(timeout);
  }
}

// ── Refinement prompt ─────────────────────────────────────────────────────────

const REFINE_SYSTEM_PROMPT = `You are an expert Three.js 3D artist refining an existing 3D object.

You will receive metadata describing the current object (bounding box, vertex count, materials)
and instructions for how to change it. Write JavaScript code that produces the refined version.

The code runs with THREE available. Return an array of part descriptors:

return [
  {
    geometry: <any THREE.BufferGeometry>,
    color: '#RRGGBB',
    name: 'part name',
    position: [x, y, z],
    rotation: [rx, ry, rz],   // Euler radians, optional
    metalness: 0.0,            // optional
    roughness: 0.5,            // optional
  },
  ...
];

━━━ SPATIAL DISCIPLINE — the only rule that matters ━━━

Define all key dimensions as const variables. Derive EVERY position as math, never a magic number.

  const hullR = 0.22, hullH = 2.0;
  const wingW = 1.4, wingD = 0.55, wingThick = 0.05;
  const wingX = hullR + wingW / 2 - 0.03;

Then use those variables in every position:
  position: [wingX, -0.2, 0.1]   ✓
  position: [0.85, -0.2, 0.1]    ✗

━━━ REFINEMENT RULES ━━━

- Study the provided bounding box and preserve the overall scale unless asked to resize.
- Keep the same color and material unless the refinement request mentions changing them.
- Apply ONLY the changes requested — preserve everything else.
- Fit within a 4×4×4 unit bounding box, centred near the origin.
- Return ONLY the JavaScript — no markdown fences, no comments, no explanation.`;

function buildRefinePrompt(structure, userPrompt) {
  return `Current object metadata:\n${JSON.stringify(structure, null, 2)}\n\nRefinement instructions: ${userPrompt}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export const generate3DModel = async (
  prompt,
  referenceImage = null,
  keys = {},
  onLog = null,
  providerOverride = null,
  modelOverride = null,
) => {
  const log = (type, msg) => onLog?.(type, msg);
  const { Anthropic, OpenAI, Gemini } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';
  const ollamaGenerateModel = keys['Ollama Generate Model'] || null;

  const anthropicModel = modelOverride || keys['Anthropic Generate Model'] || null;
  const openAIModel    = modelOverride || keys['OpenAI Generate Model']    || null;
  const geminiModel    = modelOverride || keys['Gemini Generate Model']    || null;

  try {
    if      (providerOverride === 'Anthropic' || (!providerOverride && Anthropic))
      return await generateWithAnthropic(prompt, referenceImage, Anthropic, log, anthropicModel);
    else if (providerOverride === 'OpenAI'    || (!providerOverride && OpenAI))
      return await generateWithOpenAI(prompt, referenceImage, OpenAI, log, openAIModel);
    else if (providerOverride === 'Gemini'    || (!providerOverride && Gemini))
      return await generateWithGemini(prompt, referenceImage, Gemini, log, geminiModel);
    else
      return await generateWithOllama(prompt, referenceImage, ollamaUrl, ollamaGenerateModel, log);
  } catch (error) {
    if (error.name === 'AbortError') {
      log('error', 'Ollama timed out after 3 minutes.');
      throw new Error('Ollama timed out after 3 minutes. Try a simpler prompt or a faster model.');
    }
    log('error', 'Generation failed: ' + error.message);
    throw error;
  }
};

// ── Refinement export ─────────────────────────────────────────────────────────

/**
 * Refine an existing 3D object using AI.
 *
 * 1. Extracts a structured summary of the object via extractObjectStructure.
 * 2. Builds a refinement prompt combining the structure + user instruction.
 * 3. Calls the configured LLM provider with a refinement-focused system prompt.
 * 4. Returns the same { isParts, name, parts } format as generate3DModel so
 *    the caller can patch geometry via store.patchObjectGeometry or addObjects.
 *
 * @param {Object} object         - Store object (vertices, indices, position, …)
 * @param {string} userPrompt     - What the user wants changed
 * @param {Object} keys           - API credentials (same shape as generate3DModel)
 * @param {Function|null} onLog   - Optional logging callback (type, message)
 * @param {string|null} providerOverride
 * @param {string|null} modelOverride
 * @returns {Promise<{isParts: boolean, name: string, parts: Array}>}
 */
export const refineObject = async (
  object,
  userPrompt,
  keys = {},
  onLog = null,
  providerOverride = null,
  modelOverride = null,
) => {
  const log = (type, msg) => onLog?.(type, msg);
  const structure = extractObjectStructure(object);
  const compositePrompt = buildRefinePrompt(structure, userPrompt);

  const { Anthropic, OpenAI, Gemini } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';
  const ollamaGenerateModel = keys['Ollama Generate Model'] || null;
  const anthropicModel = modelOverride || keys['Anthropic Generate Model'] || null;
  const openAIModel    = modelOverride || keys['OpenAI Generate Model']    || null;
  const geminiModel    = modelOverride || keys['Gemini Generate Model']    || null;

  // Temporarily override system prompt for refinement by patching provider calls inline.
  // We reuse the same provider helpers but swap in the refinement system prompt via a
  // thin wrapper that replaces SYSTEM_PROMPT text in the request body.
  const name = object.name || 'Refined Object';

  const callAnthropic = async () => {
    log('info', `Refining object (Anthropic / ${anthropicModel || 'claude-sonnet-4-6'})…`);
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': Anthropic,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers,
      body: JSON.stringify({
        model: anthropicModel || 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: REFINE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [{ type: 'text', text: compositePrompt }] }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.statusText}`);
    const data = await res.json();
    log('info', 'Executing refined Three.js code…');
    return executeModelCode(stripFences(data.content[0].text), name);
  };

  const callOpenAI = async () => {
    log('info', `Refining object (OpenAI / ${openAIModel || 'gpt-4o-mini'})…`);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${OpenAI}` };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers,
      body: JSON.stringify({
        model: openAIModel || 'gpt-4o-mini',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: REFINE_SYSTEM_PROMPT },
          { role: 'user', content: compositePrompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
    const data = await res.json();
    log('info', 'Executing refined Three.js code…');
    return executeModelCode(stripFences(data.choices[0].message.content), name);
  };

  const callGemini = async () => {
    const m = geminiModel || 'gemini-2.0-flash';
    log('info', `Refining object (Gemini / ${m})…`);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${Gemini}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: REFINE_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: compositePrompt }] }],
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);
    const data = await res.json();
    log('info', 'Executing refined Three.js code…');
    return executeModelCode(stripFences(data.candidates[0].content.parts[0].text), name);
  };

  const callOllama = async () => {
    const modelName = ollamaGenerateModel || 'mistral';
    log('info', `Refining object (Ollama / ${modelName})…`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, prompt: compositePrompt, system: REFINE_SYSTEM_PROMPT, stream: false }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
      const data = await res.json();
      log('info', 'Executing refined Three.js code…');
      return executeModelCode(stripFences(data.response || ''), name);
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    if      (providerOverride === 'Anthropic' || (!providerOverride && Anthropic)) return await callAnthropic();
    else if (providerOverride === 'OpenAI'    || (!providerOverride && OpenAI))    return await callOpenAI();
    else if (providerOverride === 'Gemini'    || (!providerOverride && Gemini))    return await callGemini();
    else                                                                            return await callOllama();
  } catch (error) {
    if (error.name === 'AbortError') {
      log('error', 'Ollama timed out after 3 minutes.');
      throw new Error('Ollama timed out after 3 minutes. Try a simpler prompt or a faster model.');
    }
    log('error', 'Refinement failed: ' + error.message);
    throw error;
  }
};
