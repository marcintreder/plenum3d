// System prompt for cloud models (can handle large outputs)
const SYSTEM_PROMPT = `You are an expert 3D generative model. Create a detailed 3D object.
Return ONLY a JSON object with:
- "vertices": flat array of floats [x,y,z,x,y,z,...]
- "indices": array of integers for triangle faces
- "color": hex color string (e.g. "#FF0000")
- "material": "standard", "physical", or "wireframe"
Be as detailed as possible. No other text, only JSON.`;

// Simplified prompt for local Ollama — fewer vertices = much faster generation
const OLLAMA_SYSTEM_PROMPT = `You are a 3D model generator. Create a simple low-poly 3D object.
Return ONLY valid JSON with exactly these fields:
- "vertices": flat array of numbers [x,y,z,x,y,z,...] — keep it under 60 vertices, use simple shapes
- "indices": array of integers defining triangles
- "color": a hex color string like "#FF0000"
- "material": "standard"
Simple blocky geometry is fine. Fewer vertices means faster output. No explanation, only JSON.`;

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

// Handles both flat [x,y,z,x,y,z,...] and nested [[x,y,z],[x,y,z],...] vertex formats
function formatResult(result) {
  const raw = result.vertices || [];
  let nestedVertices;

  if (raw.length > 0 && Array.isArray(raw[0])) {
    // Already nested — use as-is (but ensure each entry is exactly [x,y,z])
    nestedVertices = raw.map(v => [Number(v[0]) || 0, Number(v[1]) || 0, Number(v[2]) || 0]);
  } else {
    // Flat float array — group into triples
    nestedVertices = [];
    for (let i = 0; i + 2 < raw.length; i += 3) {
      nestedVertices.push([Number(raw[i]) || 0, Number(raw[i+1]) || 0, Number(raw[i+2]) || 0]);
    }
  }

  return {
    vertices: nestedVertices,
    indices: result.indices || [],
    color: result.color || '#7C3AED',
    materialType: result.material || 'standard',
  };
}
