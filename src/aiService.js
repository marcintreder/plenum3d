const SYSTEM_PROMPT = `You are an expert 3D generative model. Create a detailed 3D object.
Return ONLY a JSON object with:
- "vertices": flat array of floats [x,y,z,x,y,z,...]
- "indices": array of integers for triangle faces
- "color": hex color string (e.g. "#FF0000")
- "material": "standard", "physical", or "wireframe"
Be as detailed as possible. No other text, only JSON.`;

function buildPrompt(prompt, hasImage) {
  return `Create a 3D model for: ${prompt}.${hasImage ? ' Model it closely after the reference image provided.' : ''}`;
}

async function generateWithAnthropic(prompt, referenceImage, apiKey) {
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
  const data = await res.json();
  return JSON.parse(data.content[0].text);
}

async function generateWithOpenAI(prompt, referenceImage, apiKey) {
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
      model: referenceImage ? 'gpt-4o' : 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function generateWithGemini(prompt, referenceImage, apiKey) {
  const parts = [];
  if (referenceImage) {
    const [header, data] = referenceImage.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    parts.push({ inline_data: { mime_type: mimeType, data } });
  }
  parts.push({ text: buildPrompt(prompt, !!referenceImage) });

  const model = referenceImage ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function generateWithOllama(prompt, referenceImage, ollamaUrl) {
  const body = {
    model: referenceImage ? 'llava' : 'mistral',
    prompt: buildPrompt(prompt, !!referenceImage),
    system: SYSTEM_PROMPT,
    stream: false,
    format: 'json',
  };
  if (referenceImage) body.images = [referenceImage.split(',')[1] || referenceImage];

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
  const data = await res.json();
  return JSON.parse(data.response);
}

export const generate3DModel = async (prompt, referenceImage = null, keys = {}) => {
  const { Anthropic, OpenAI, Gemini } = keys;
  const ollamaUrl = keys['Ollama URL'] || 'http://localhost:11434';

  try {
    let result;
    if (Anthropic)   result = await generateWithAnthropic(prompt, referenceImage, Anthropic);
    else if (OpenAI) result = await generateWithOpenAI(prompt, referenceImage, OpenAI);
    else if (Gemini) result = await generateWithGemini(prompt, referenceImage, Gemini);
    else             result = await generateWithOllama(prompt, referenceImage, ollamaUrl);
    return formatResult(result);
  } catch (error) {
    console.error('Generation failed, using fallback:', error);
    return formatResult({
      vertices: [0,1,0, -1,0,-1, 1,0,-1, 1,0,1, -1,0,1],
      indices:  [0,2,1, 0,3,2, 0,4,3, 0,1,4, 1,2,3, 1,3,4],
      color: '#7C3AED',
      material: 'standard',
    });
  }
};

function formatResult(result) {
  const nestedVertices = [];
  const flat = result.vertices;
  for (let i = 0; i < flat.length; i += 3) {
    nestedVertices.push([flat[i], flat[i+1], flat[i+2]]);
  }
  return {
    vertices: nestedVertices,
    indices: result.indices,
    color: result.color,
    materialType: result.material,
  };
}
