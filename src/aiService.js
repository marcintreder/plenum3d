// System prompt for cloud models (can handle large outputs)
const SYSTEM_PROMPT = `You are an expert 3D triangle mesh generator. Create a 3D object as a clean triangle mesh.
Return ONLY a valid JSON object with these exact fields:
- "vertices": flat array of numbers [x,y,z, x,y,z, ...]. The object must fit within a 2x2x2 unit cube. Center it at the origin (0,0,0). Y axis is up.
- "indices": flat array of integers — every 3 values form one triangle. CRITICAL: every index must be >= 0 and < (vertices.length / 3). Use counter-clockwise winding order (determines which side is the front face).
- "color": a realistic hex color for this specific object (e.g. "#228B22" for a tree, "#8B4513" for wood, "#C0C0C0" for metal)
- "material": "standard", "physical", or "wireframe"
Rules:
- Aim for 40–150 triangles — enough detail to be recognizable but not overly complex
- No two triangles may share the exact same 3 indices
- No degenerate triangles (all 3 indices must be different)
- No markdown, no explanation — only the raw JSON object`;

// Simplified prompt for local Ollama — fewer vertices = much faster generation
const OLLAMA_SYSTEM_PROMPT = `You are a 3D model generator. Create a simple low-poly 3D object.
Return ONLY valid JSON with exactly these fields:
- "vertices": flat array of numbers [x,y,z, x,y,z, ...] — keep under 60 vertices, fit within a 2-unit cube centered at origin
- "indices": flat array of integers — groups of 3 form triangles. Every index must be >= 0 and < (vertices.length / 3)
- "color": a hex color matching the object (e.g. "#228B22" for trees)
- "material": "standard"
Simple blocky geometry only. No explanation, only JSON.`;

function buildPrompt(prompt, hasImage) {
  return `Create a 3D model for: ${prompt}.${hasImage ? ' Model it closely after the reference image provided.' : ''}`;
}

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
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.statusText}`);
  log('info', 'Response received — parsing geometry…');
  const data = await res.json();
  const parsed = JSON.parse(data.content[0].text);
  log('success', 'Geometry parsed from Anthropic response');
  return parsed;
}

async function generateWithOpenAI(prompt, referenceImage, apiKey, log) {
  const model = referenceImage ? 'gpt-4o' : 'gpt-4o-mini';
  log('info', `Sending request to OpenAI (${model})…`);
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  const userContent = [];
  if (referenceImage) {
    userContent.push({ type: 'image_url', image_url: { url: referenceImage } });
  }
  userContent.push({ type: 'text', text: buildPrompt(prompt, !!referenceImage) });
  messages.push({ role: 'user', content: userContent });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  log('info', 'Response received — parsing geometry…');
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  log('success', 'Geometry parsed from OpenAI response');
  return parsed;
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
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts }],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);
  log('info', 'Response received — parsing geometry…');
  const data = await res.json();
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
  log('success', 'Geometry parsed from Gemini response');
  return parsed;
}

async function generateWithOllama(prompt, referenceImage, ollamaUrl, modelOverride, log) {
  const defaultModel = referenceImage ? 'llava' : 'mistral';
  const modelName = modelOverride || defaultModel;
  log('info', `Sending request to Ollama (${modelName})…`);
  log('warn', 'Local models can take 1–3 minutes. Console will update when done.');

  const controller = new AbortController();
  // 3-minute timeout — local models are slow but this is generous enough
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    const body = {
      model: modelName,
      prompt: buildPrompt(prompt, !!referenceImage),
      system: OLLAMA_SYSTEM_PROMPT,
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
    // data.response is a JSON string when format:'json' is used
    const parsed = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
    log('success', 'Geometry parsed from Ollama response');
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

export const generate3DModel = async (prompt, referenceImage = null, keys = {}, onLog = null) => {
  const log = (type, msg) => onLog?.(type, msg);
  const { Anthropic, OpenAI, Gemini } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';
  const ollamaGenerateModel = keys['Ollama Generate Model'] || null;

  try {
    let result;
    if (Anthropic)   result = await generateWithAnthropic(prompt, referenceImage, Anthropic, log);
    else if (OpenAI) result = await generateWithOpenAI(prompt, referenceImage, OpenAI, log);
    else if (Gemini) result = await generateWithGemini(prompt, referenceImage, Gemini, log);
    else             result = await generateWithOllama(prompt, referenceImage, ollamaUrl, ollamaGenerateModel, log);
    const formatted = formatResult(result);
    log('success', `Done — ${formatted.vertices.length} vertices, ${formatted.indices.length} indices`);
    return formatted;
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

// Handles both flat [x,y,z,x,y,z,...] and nested [[x,y,z],[x,y,z],...] vertex formats.
// Also validates indices and normalises scale so generated objects are always ~2 units wide.
function formatResult(result) {
  const raw = result.vertices || [];
  let verts;

  if (raw.length > 0 && Array.isArray(raw[0])) {
    verts = raw.map(v => [Number(v[0]) || 0, Number(v[1]) || 0, Number(v[2]) || 0]);
  } else {
    verts = [];
    for (let i = 0; i + 2 < raw.length; i += 3) {
      verts.push([Number(raw[i]) || 0, Number(raw[i+1]) || 0, Number(raw[i+2]) || 0]);
    }
  }

  // ── Auto-scale: normalise so the longest axis fits in 2 units ──────────────
  if (verts.length > 0) {
    let maxExtent = 0;
    for (const v of verts) {
      maxExtent = Math.max(maxExtent, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
    }
    if (maxExtent > 2 || maxExtent < 0.15) {
      const s = 1.0 / Math.max(maxExtent, 0.001);
      verts = verts.map(v => [v[0] * s, v[1] * s, v[2] * s]);
    }
  }

  // ── Index validation: drop out-of-bounds and degenerate triangles ──────────
  const vCount = verts.length;
  const rawIdx = result.indices || [];
  const cleanIdx = [];
  for (let i = 0; i + 2 < rawIdx.length; i += 3) {
    const a = rawIdx[i], b = rawIdx[i + 1], c = rawIdx[i + 2];
    if (a < 0 || b < 0 || c < 0 || a >= vCount || b >= vCount || c >= vCount) continue;
    if (a === b || b === c || a === c) continue; // degenerate
    cleanIdx.push(a, b, c);
  }

  return {
    vertices: verts,
    indices: cleanIdx,
    color: result.color || '#7C3AED',
    materialType: result.material || 'standard',
  };
}
