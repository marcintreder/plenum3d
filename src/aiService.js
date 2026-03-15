import { buildPrimitiveMesh } from './utils/primitiveBuilder';

// ── System prompts ────────────────────────────────────────────────────────────

// Cloud models: describe object as composed primitives — much more reliable than raw vertices
const SYSTEM_PROMPT_PARAMETRIC = `You are a 3D scene composer. When asked to create an object, describe it as a JSON structure of geometric primitives. You do NOT generate vertex coordinates — instead choose primitive shapes, sizes, and positions that together approximate the object.

Return ONLY a valid JSON object:
{
  "name": "descriptive object name",
  "parts": [
    {
      "label": "part name (e.g. trunk, wheel, roof)",
      "type": "box" | "sphere" | "cylinder" | "cone",
      "position": [x, y, z],
      "size": [width, height, depth],
      "color": "#RRGGBB"
    }
  ]
}

Rules:
- Use 2–8 parts. Each part is one primitive.
- box: rectangular block. size = [width, height, depth].
- sphere: ball. size = [diameter, diameter, diameter].
- cylinder: upright tube. size = [diameter, height, diameter].
- cone: upright cone, point at top. size = [base_diameter, height, base_diameter].
- position: center of part. Y axis is up. Keep the whole object within a 4×4×4 unit box centered at origin.
- color: realistic hex color per part (e.g. "#228B22" for leaves, "#5C3317" for bark).
- No markdown, no explanation — only the raw JSON object.

Examples:
- Tree → {"name":"Pine Tree","parts":[{"label":"trunk","type":"cylinder","position":[0,0.5,0],"size":[0.3,1,0.3],"color":"#5C3317"},{"label":"lower canopy","type":"cone","position":[0,1.8,0],"size":[1.4,1.6,1.4],"color":"#2D6B1A"},{"label":"upper canopy","type":"cone","position":[0,2.8,0],"size":[1.0,1.4,1.0],"color":"#37851F"}]}
- House → {"name":"House","parts":[{"label":"walls","type":"box","position":[0,0.6,0],"size":[2,1.2,2],"color":"#D2B48C"},{"label":"roof","type":"cone","position":[0,1.7,0],"size":[2.6,1.0,2.6],"color":"#8B2020"},{"label":"door","type":"box","position":[0,0.1,1.01],"size":[0.4,0.8,0.05],"color":"#5C3317"}]}`;

// Ollama: simplified parametric (shorter = faster for local models)
const OLLAMA_SYSTEM_PROMPT_PARAMETRIC = `You are a 3D model builder. Return ONLY a JSON object with primitive parts.

Format:
{"name":"object name","parts":[{"label":"part","type":"box"|"sphere"|"cylinder"|"cone","position":[x,y,z],"size":[w,h,d],"color":"#hex"}]}

Use 2–5 parts. Keep within 4 units of origin. Y is up.
- box=[width,height,depth], sphere=[diam,diam,diam], cylinder=[diam,height,diam], cone=[base_diam,height,base_diam]
- Realistic colors. No explanation, only JSON.`;

// Fallback raw-vertex prompts (used if model ignores parametric format)
const SYSTEM_PROMPT_RAW = `You are an expert 3D triangle mesh generator. Create a 3D object as a clean triangle mesh.
Return ONLY a valid JSON object:
- "vertices": flat array [x,y,z, x,y,z, ...]. Fit within a 2×2×2 unit cube at origin. Y up.
- "indices": flat array — every 3 ints form one triangle. Every index must be >= 0 and < (vertices.length/3). Counter-clockwise winding.
- "color": realistic hex color for this object
- "material": "standard", "physical", or "wireframe"
40–150 triangles. No degenerate triangles. Only the JSON object.`;

const OLLAMA_SYSTEM_PROMPT_RAW = `You are a 3D model generator. Return ONLY valid JSON:
- "vertices": flat [x,y,z,...] array, under 60 vertices, fit in 2-unit cube
- "indices": flat int array, groups of 3 = triangles, every index < vertices.length/3
- "color": hex color
- "material": "standard"
No explanation, only JSON.`;

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(prompt, hasImage) {
  return `Create a 3D model for: ${prompt}.${hasImage ? ' Model it closely after the reference image provided.' : ''}`;
}

// ── Geometry from LLM parts ───────────────────────────────────────────────────

function formatPartsResult(data) {
  const parts = (data.parts || [])
    .map(part => {
      const type = part.type || 'box';
      const size = Array.isArray(part.size) && part.size.length >= 3
        ? part.size.map(Number)
        : [1, 1, 1];
      const { vertices, indices } = buildPrimitiveMesh(type, size);
      if (!vertices.length || !indices.length) return null;
      return {
        label:    part.label || type,
        vertices,
        indices,
        color:    part.color || '#7C3AED',
        materialType: 'standard',
        position: (part.position || [0, 0, 0]).map(Number),
      };
    })
    .filter(Boolean);
  return { isParts: true, name: data.name || 'Generated Object', parts };
}

// Detect whether the parsed response is parametric or raw-vertex and route accordingly
function interpretResponse(parsed, log) {
  if (parsed && Array.isArray(parsed.parts) && parsed.parts.length > 0) {
    const result = formatPartsResult(parsed);
    log('success', `Built ${result.parts.length}-part model: ${result.parts.map(p => p.label).join(', ')}`);
    return result;
  }
  // Fallback: model returned raw vertices
  if (parsed && (parsed.vertices || parsed.indices)) {
    log('info', 'Response used raw-vertex format — parsing geometry…');
    return { isParts: false, ...formatResult(parsed) };
  }
  throw new Error('Response did not contain parts or vertices.');
}

// ── Provider functions ────────────────────────────────────────────────────────

async function generateWithAnthropic(prompt, referenceImage, apiKey, log) {
  log('info', 'Sending request to Anthropic (claude-opus-4-6)…');
  const content = [];
  if (referenceImage) {
    const [header, data] = referenceImage.split(',');
    const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } });
  }
  content.push({ type: 'text', text: buildPrompt(prompt, !!referenceImage) });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT_PARAMETRIC,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.statusText}`);
  log('info', 'Response received — parsing…');
  const data = await res.json();
  return interpretResponse(JSON.parse(data.content[0].text), log);
}

async function generateWithOpenAI(prompt, referenceImage, apiKey, log) {
  const model = referenceImage ? 'gpt-4o' : 'gpt-4o-mini';
  log('info', `Sending request to OpenAI (${model})…`);
  const messages = [{ role: 'system', content: SYSTEM_PROMPT_PARAMETRIC }];
  const userContent = [];
  if (referenceImage) userContent.push({ type: 'image_url', image_url: { url: referenceImage } });
  userContent.push({ type: 'text', text: buildPrompt(prompt, !!referenceImage) });
  messages.push({ role: 'user', content: userContent });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  log('info', 'Response received — parsing…');
  const data = await res.json();
  return interpretResponse(JSON.parse(data.choices[0].message.content), log);
}

async function generateWithGemini(prompt, referenceImage, apiKey, log) {
  log('info', 'Sending request to Gemini (gemini-1.5-flash)…');
  const parts = [];
  if (referenceImage) {
    const [header, data] = referenceImage.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    parts.push({ inline_data: { mime_type: mimeType, data } });
  }
  parts.push({ text: buildPrompt(prompt, !!referenceImage) });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT_PARAMETRIC }] },
        contents: [{ parts }],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);
  log('info', 'Response received — parsing…');
  const data = await res.json();
  return interpretResponse(JSON.parse(data.candidates[0].content.parts[0].text), log);
}

async function generateWithOllama(prompt, referenceImage, ollamaUrl, modelOverride, log) {
  const defaultModel = referenceImage ? 'llava' : 'mistral';
  const modelName = modelOverride || defaultModel;
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
      format: 'json',
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
    const parsed = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
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
) => {
  const log = (type, msg) => onLog?.(type, msg);
  const { Anthropic, OpenAI, Gemini } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';
  const ollamaGenerateModel = keys['Ollama Generate Model'] || null;

  try {
    let result;
    if      (providerOverride === 'Anthropic' || (!providerOverride && Anthropic))
      result = await generateWithAnthropic(prompt, referenceImage, Anthropic, log);
    else if (providerOverride === 'OpenAI'    || (!providerOverride && OpenAI))
      result = await generateWithOpenAI(prompt, referenceImage, OpenAI, log);
    else if (providerOverride === 'Gemini'    || (!providerOverride && Gemini))
      result = await generateWithGemini(prompt, referenceImage, Gemini, log);
    else
      result = await generateWithOllama(prompt, referenceImage, ollamaUrl, ollamaGenerateModel, log);

    if (result.isParts) {
      log('success', `Done — ${result.parts.length} parts assembled`);
    } else {
      log('success', `Done — ${result.vertices.length} vertices, ${result.indices.length} indices`);
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      log('error', 'Ollama timed out after 3 minutes. Try a simpler prompt or a faster model.');
      throw new Error('Ollama timed out after 3 minutes. Try a simpler prompt or a faster model.');
    }
    log('warn', 'Generation failed, using fallback shape: ' + error.message);
    console.error('Generation failed, using fallback:', error);
    return formatResult({
      vertices: [0,1,0, -1,0,-1, 1,0,-1, 1,0,1, -1,0,1],
      indices:  [0,2,1, 0,3,2, 0,4,3, 0,1,4, 1,2,3, 1,3,4],
      color: '#7C3AED',
      material: 'standard',
    });
  }
};

// ── Geometry helpers ──────────────────────────────────────────────────────────

// Raw vertex fallback: validate indices, auto-scale to fit 2-unit cube
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

  // Auto-scale: normalise so the longest axis fits in 2 units
  if (verts.length > 0) {
    let maxExtent = 0;
    for (const v of verts) maxExtent = Math.max(maxExtent, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
    if (maxExtent > 2 || maxExtent < 0.15) {
      const s = 1.0 / Math.max(maxExtent, 0.001);
      verts = verts.map(v => [v[0] * s, v[1] * s, v[2] * s]);
    }
  }

  // Validate indices: drop out-of-bounds and degenerate triangles
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
