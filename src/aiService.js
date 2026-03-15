import { buildPrimitiveMesh } from './utils/primitiveBuilder';
import { laplacianSmooth } from './utils/MeshAnalysis';

// ── Stage 1: Spatial design architect ────────────────────────────────────────
// This stage makes the model reason explicitly about layout before committing
// to coordinates, which eliminates the "multiple trunks in random places" class
// of errors.

const DESIGN_SYSTEM_PROMPT = `You are a 3D spatial layout designer. Given an object description, plan its structure as a precise numbered list of parts.

Coordinate rules (STRICT — follow exactly):
- Y axis is UP. Objects sit on the ground (Y=0 = bottom of object).
- Vertically stacked parts (trees, lamps, rockets, towers, characters): ALL must have X=0 and Z=0. Only the Y value (height) changes.
- Symmetric objects (cars, tables, chairs): centered at X=0, Z=0. Only offset on X or Z for side parts (e.g. wheels, legs).
- position = center of the part, not the bottom edge.
- Keep the whole object within a 4×4×4 unit cube.
- Overlap adjacent parts by ~0.05–0.1 units so there are no gaps.

Output exactly this format, one part per line, nothing else:
[N]. [name] | [shape: box/sphere/cylinder/cone] | pos:[x,y,z] | size:[w,h,d] | color:[descriptive name] | smooth:[yes/no]

smooth=yes for organic/curved/rounded surfaces; smooth=no for flat panels, sharp edges, mechanical parts.

Example — pine tree:
1. trunk | cylinder | pos:[0,0.5,0] | size:[0.3,1.0,0.3] | color:dark brown | smooth:no
2. lower canopy | cone | pos:[0,1.8,0] | size:[1.4,1.6,1.4] | color:dark green | smooth:yes
3. mid canopy | cone | pos:[0,2.6,0] | size:[1.1,1.4,1.1] | color:medium green | smooth:yes
4. upper canopy | cone | pos:[0,3.2,0] | size:[0.8,1.2,0.8] | color:bright green | smooth:yes
5. base roots | cylinder | pos:[0,0.05,0] | size:[0.55,0.1,0.55] | color:very dark brown | smooth:no

Example — car:
1. body | box | pos:[0,0.3,0] | size:[2.0,0.45,0.9] | color:red | smooth:yes
2. cabin | box | pos:[0,0.72,0] | size:[1.1,0.42,0.8] | color:red | smooth:yes
3. windshield | box | pos:[0.44,0.72,0] | size:[0.05,0.38,0.72] | color:light blue | smooth:no
4. rear window | box | pos:[-0.44,0.72,0] | size:[0.05,0.38,0.72] | color:light blue | smooth:no
5. front-left wheel | cylinder | pos:[0.65,0.1,0.52] | size:[0.32,0.14,0.32] | color:black | smooth:no
6. front-right wheel | cylinder | pos:[0.65,0.1,-0.52] | size:[0.32,0.14,0.32] | color:black | smooth:no
7. rear-left wheel | cylinder | pos:[-0.65,0.1,0.52] | size:[0.32,0.14,0.32] | color:black | smooth:no
8. rear-right wheel | cylinder | pos:[-0.65,0.1,-0.52] | size:[0.32,0.14,0.32] | color:black | smooth:no
9. headlights | box | pos:[1.02,0.3,0] | size:[0.04,0.12,0.55] | color:bright yellow | smooth:no

Use 4–10 parts. Be precise. No extra text.`;

// ── Stage 2: Convert design list to parametric JSON ───────────────────────────

const COLOR_HEX = `brown=#78350F, dark brown=#3D2010, red=#C0392B, dark red=#8B1A1A, crimson=#DC143C,
blue=#1D4ED8, dark blue=#1E3A5F, sky blue=#38BDF8, light blue=#AED6F1,
green=#15803D, dark green=#2D6B1A, medium green=#2D8020, bright green=#37851F, lime=#65A30D,
yellow=#EAB308, bright yellow=#FDE047, orange=#EA580C, gold=#D97706,
white=#F9FAFB, gray=#6B7280, silver=#9CA3AF, black=#111111, dark gray=#374151,
beige=#D2B48C, tan=#C4A47C, cream=#FEF3C7, pink=#F472B6, purple=#7C3AED`;

function buildFromDesignPrompt(design) {
  return `Convert this 3D part list into a JSON structure.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation:
{"name":"descriptive name","parts":[{"label":"part name","type":"box|sphere|cylinder|cone","smooth":true|false,"position":[x,y,z],"size":[w,h,d],"color":"#RRGGBB"}]}

Color name → hex reference: ${COLOR_HEX}

Size conventions:
- box: [width, height, depth]
- sphere: [diameter, diameter, diameter]
- cylinder: [diameter, height, diameter]
- cone: [base_diameter, height, base_diameter] (apex points up)

Part list to convert:
${design}`;
}

// ── JSON extractor (robust — handles markdown fences, wrapped objects) ────────

function extractJSON(text) {
  const t = (text || '').trim();
  try { return JSON.parse(t); } catch {}
  const fenced = t.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
  try { return JSON.parse(fenced); } catch {}
  const arrIdx = fenced.indexOf('[');
  const objIdx = fenced.indexOf('{');
  if (objIdx !== -1 && (arrIdx === -1 || objIdx < arrIdx)) {
    try { return JSON.parse(fenced.slice(objIdx, fenced.lastIndexOf('}') + 1)); } catch {}
  }
  if (arrIdx !== -1) {
    try { return JSON.parse(fenced.slice(arrIdx, fenced.lastIndexOf(']') + 1)); } catch {}
  }
  return null;
}

// ── Prompt builder (single-stage fallback) ────────────────────────────────────

function buildPrompt(prompt, hasImage) {
  return `Create a 3D model for: ${prompt}.${hasImage ? ' Model it closely after the reference image provided.' : ''}`;
}

// ── Geometry from LLM parts ───────────────────────────────────────────────────

const SMOOTH_ITERATIONS = { sphere: 3, cone: 2, cylinder: 1, box: 0 };

function formatPartsResult(data) {
  const parts = (data.parts || [])
    .map(part => {
      const type = part.type || 'box';
      const size = Array.isArray(part.size) && part.size.length >= 3
        ? part.size.map(Number)
        : [1, 1, 1];
      let { vertices, indices } = buildPrimitiveMesh(type, size);
      if (!vertices.length || !indices.length) return null;

      const shouldSmooth = part.smooth === true || (part.smooth !== false && SMOOTH_ITERATIONS[type] > 0);
      if (shouldSmooth) {
        vertices = laplacianSmooth(vertices, indices, SMOOTH_ITERATIONS[type] || 1, 0.4);
      }

      return {
        label:       part.label || type,
        vertices,
        indices,
        color:       part.color || '#7C3AED',
        materialType:'physical',
        position:    (part.position || [0, 0, 0]).map(Number),
      };
    })
    .filter(Boolean);
  return { isParts: true, name: data.name || 'Generated Object', parts };
}

function interpretResponse(parsed, log) {
  if (parsed && Array.isArray(parsed.parts) && parsed.parts.length > 0) {
    const result = formatPartsResult(parsed);
    log('success', `Built ${result.parts.length}-part model: ${result.parts.map(p => p.label).join(', ')}`);
    return result;
  }
  if (parsed && (parsed.vertices || parsed.indices)) {
    log('info', 'Response used raw-vertex format — parsing geometry…');
    return { isParts: false, ...formatResult(parsed) };
  }
  throw new Error('Response did not contain parts or vertices.');
}

// ── Anthropic: two-stage (design → build) ────────────────────────────────────

async function generateWithAnthropic(prompt, referenceImage, apiKey, log, model) {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
  const m = model || 'claude-sonnet-4-6';

  // Stage 1 — design
  log('info', `Stage 1/2 — Designing layout (Anthropic / ${m})…`);
  const designContent = [];
  if (referenceImage) {
    const [header, imgData] = referenceImage.split(',');
    const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    designContent.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: imgData } });
  }
  designContent.push({ type: 'text', text: `Design a 3D model of: ${prompt}` });

  const designRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers,
    body: JSON.stringify({ model: m, max_tokens: 1024, system: DESIGN_SYSTEM_PROMPT, messages: [{ role: 'user', content: designContent }] }),
  });
  if (!designRes.ok) throw new Error(`Anthropic stage-1 error: ${designRes.statusText}`);
  const designData = await designRes.json();
  const design = designData.content[0].text;
  log('info', `Layout designed (${design.split('\n').filter(l => l.trim()).length} parts) — building geometry…`);

  // Stage 2 — build JSON
  const buildRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers,
    body: JSON.stringify({
      model: m,
      max_tokens: 4096,
      system: 'You output only valid JSON objects. No markdown, no code fences, no explanation.',
      messages: [{ role: 'user', content: buildFromDesignPrompt(design) }],
    }),
  });
  if (!buildRes.ok) throw new Error(`Anthropic stage-2 error: ${buildRes.statusText}`);
  const buildData = await buildRes.json();
  const parsed = extractJSON(buildData.content[0].text);
  if (!parsed) throw new Error('Anthropic stage-2 returned unparseable JSON');
  return interpretResponse(parsed, log);
}

// ── OpenAI: two-stage ─────────────────────────────────────────────────────────

async function generateWithOpenAI(prompt, referenceImage, apiKey, log, model) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
  // Stage 1 uses vision-capable model when image provided; stage 2 always uses the cheaper model
  const m1 = model || (referenceImage ? 'gpt-4o' : 'gpt-4o-mini');
  const m2 = model || 'gpt-4o-mini';

  // Stage 1 — design
  log('info', `Stage 1/2 — Designing layout (OpenAI / ${m1})…`);
  const designUserContent = [];
  if (referenceImage) designUserContent.push({ type: 'image_url', image_url: { url: referenceImage } });
  designUserContent.push({ type: 'text', text: `Design a 3D model of: ${prompt}` });

  const designRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers,
    body: JSON.stringify({
      model: m1,
      max_tokens: 1024,
      messages: [{ role: 'system', content: DESIGN_SYSTEM_PROMPT }, { role: 'user', content: designUserContent }],
    }),
  });
  if (!designRes.ok) throw new Error(`OpenAI stage-1 error: ${designRes.statusText}`);
  const designData = await designRes.json();
  const design = designData.choices[0].message.content;
  log('info', `Layout designed — building geometry…`);

  // Stage 2 — build JSON
  const buildRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers,
    body: JSON.stringify({
      model: m2,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output only valid JSON objects.' },
        { role: 'user', content: buildFromDesignPrompt(design) },
      ],
    }),
  });
  if (!buildRes.ok) throw new Error(`OpenAI stage-2 error: ${buildRes.statusText}`);
  const buildData = await buildRes.json();
  const parsed = extractJSON(buildData.choices[0].message.content);
  if (!parsed) throw new Error('OpenAI stage-2 returned unparseable JSON');
  return interpretResponse(parsed, log);
}

// ── Gemini: two-stage ─────────────────────────────────────────────────────────

async function generateWithGemini(prompt, referenceImage, apiKey, log, model) {
  const m = model || 'gemini-2.0-flash';
  const call = (mdl, sysText, userParts, jsonMode = false) => {
    const body = {
      system_instruction: { parts: [{ text: sysText }] },
      contents: [{ parts: userParts }],
    };
    if (jsonMode) body.generationConfig = { response_mime_type: 'application/json' };
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  // Stage 1 — design
  log('info', `Stage 1/2 — Designing layout (Gemini / ${m})…`);
  const designParts = [];
  if (referenceImage) {
    const [header, imgData] = referenceImage.split(',');
    designParts.push({ inline_data: { mime_type: header.match(/:(.*?);/)?.[1] || 'image/jpeg', data: imgData } });
  }
  designParts.push({ text: `Design a 3D model of: ${prompt}` });

  const designRes = await call(m, DESIGN_SYSTEM_PROMPT, designParts);
  if (!designRes.ok) throw new Error(`Gemini stage-1 error: ${designRes.statusText}`);
  const designData = await designRes.json();
  const design = designData.candidates[0].content.parts[0].text;
  log('info', 'Layout designed — building geometry…');

  // Stage 2 — build JSON
  const buildRes = await call(m, 'Output only valid JSON. No markdown.', [{ text: buildFromDesignPrompt(design) }], true);
  if (!buildRes.ok) throw new Error(`Gemini stage-2 error: ${buildRes.statusText}`);
  const buildData = await buildRes.json();
  const parsed = extractJSON(buildData.candidates[0].content.parts[0].text);
  if (!parsed) throw new Error('Gemini stage-2 returned unparseable JSON');
  return interpretResponse(parsed, log);
}

// ── Ollama: single-stage with robust JSON extraction ─────────────────────────

const OLLAMA_SYSTEM_PROMPT_PARAMETRIC = `You are a 3D model builder. Return ONLY a JSON object.

CRITICAL coordinate rules:
- Y axis is UP. Objects sit on Y=0.
- Vertically stacked parts (trees, lamps, etc.): ALL have X=0, Z=0. Only Y changes.
- position = center of part.

Format:
{"name":"object name","parts":[{"label":"part","type":"box|sphere|cylinder|cone","smooth":true|false,"position":[x,y,z],"size":[w,h,d],"color":"#hex"}]}

Size: box=[w,h,d], sphere=[diam,diam,diam], cylinder=[diam,height,diam], cone=[base_diam,height,base_diam]
Use 4–8 parts. Realistic colors. No explanation, only JSON.

Example tree: {"name":"Pine Tree","parts":[{"label":"trunk","type":"cylinder","smooth":false,"position":[0,0.5,0],"size":[0.3,1.0,0.3],"color":"#5C3317"},{"label":"lower canopy","type":"cone","smooth":true,"position":[0,1.8,0],"size":[1.4,1.6,1.4],"color":"#2D6B1A"},{"label":"upper canopy","type":"cone","smooth":true,"position":[0,2.8,0],"size":[0.9,1.3,0.9],"color":"#37851F"}]}`;

async function generateWithOllama(prompt, referenceImage, ollamaUrl, modelOverride, log) {
  const modelName = modelOverride || (referenceImage ? 'llava' : 'mistral');
  log('info', `Sending request to Ollama (${modelName})…`);
  log('warn', 'Local models can take 1–3 minutes. Console will update when done.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    const body = {
      model: modelName,
      prompt: buildPrompt(prompt, !!referenceImage),
      system: OLLAMA_SYSTEM_PROMPT_PARAMETRIC,
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
    log('info', 'Ollama response received — parsing…');
    const data = await res.json();
    const parsed = extractJSON(data.response || '');
    if (!parsed) throw new Error('Ollama returned unparseable response');
    return interpretResponse(parsed, log);
  } finally {
    clearTimeout(timeout);
  }
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

  // Resolve per-provider model: explicit override → saved key default → hardcoded default
  const anthropicModel = modelOverride || keys['Anthropic Generate Model'] || null;
  const openAIModel    = modelOverride || keys['OpenAI Generate Model']    || null;
  const geminiModel    = modelOverride || keys['Gemini Generate Model']    || null;

  try {
    let result;
    if      (providerOverride === 'Anthropic' || (!providerOverride && Anthropic))
      result = await generateWithAnthropic(prompt, referenceImage, Anthropic, log, anthropicModel);
    else if (providerOverride === 'OpenAI'    || (!providerOverride && OpenAI))
      result = await generateWithOpenAI(prompt, referenceImage, OpenAI, log, openAIModel);
    else if (providerOverride === 'Gemini'    || (!providerOverride && Gemini))
      result = await generateWithGemini(prompt, referenceImage, Gemini, log, geminiModel);
    else
      result = await generateWithOllama(prompt, referenceImage, ollamaUrl, ollamaGenerateModel, log);

    log('success', result.isParts
      ? `Done — ${result.parts.length} parts assembled`
      : `Done — ${result.vertices.length} vertices`);
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      log('error', 'Ollama timed out after 3 minutes. Try a simpler prompt or a faster model.');
      throw new Error('Ollama timed out after 3 minutes. Try a simpler prompt or a faster model.');
    }
    log('warn', 'Generation failed, using fallback shape: ' + error.message);
    console.error('Generation failed:', error);
    return formatResult({
      vertices: [0,1,0, -1,0,-1, 1,0,-1, 1,0,1, -1,0,1],
      indices:  [0,2,1, 0,3,2, 0,4,3, 0,1,4, 1,2,3, 1,3,4],
      color: '#7C3AED', material: 'standard',
    });
  }
};

// ── Raw vertex fallback (validate + auto-scale) ───────────────────────────────

function formatResult(result) {
  const raw = result.vertices || [];
  let verts;

  if (raw.length > 0 && Array.isArray(raw[0])) {
    verts = raw.map(v => [Number(v[0]) || 0, Number(v[1]) || 0, Number(v[2]) || 0]);
  } else {
    verts = [];
    for (let i = 0; i + 2 < raw.length; i += 3) {
      verts.push([Number(raw[i]) || 0, Number(raw[i + 1]) || 0, Number(raw[i + 2]) || 0]);
    }
  }

  if (verts.length > 0) {
    let maxExtent = 0;
    for (const v of verts) maxExtent = Math.max(maxExtent, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
    if (maxExtent > 2 || maxExtent < 0.15) {
      const s = 1.0 / Math.max(maxExtent, 0.001);
      verts = verts.map(v => [v[0] * s, v[1] * s, v[2] * s]);
    }
  }

  const vCount = verts.length;
  const rawIdx = result.indices || [];
  const cleanIdx = [];
  for (let i = 0; i + 2 < rawIdx.length; i += 3) {
    const a = rawIdx[i], b = rawIdx[i + 1], c = rawIdx[i + 2];
    if (a < 0 || b < 0 || c < 0 || a >= vCount || b >= vCount || c >= vCount) continue;
    if (a === b || b === c || a === c) continue;
    cleanIdx.push(a, b, c);
  }

  return { isParts: false, vertices: verts, indices: cleanIdx, color: result.color || '#7C3AED', materialType: result.material || 'standard' };
}
