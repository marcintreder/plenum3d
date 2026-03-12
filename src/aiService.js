export const generate3DModel = async (prompt, ollamaUrl = 'http://localhost:11434') => {
  const model = 'mistral'; // Default model
  
  const systemPrompt = `You are a 3D geometry engine. Return only a JSON object containing "vertices" (flat array of floats [x,y,z]) and "indices" (array of integers for faces) representing the user's prompt. 
The geometry should be centered around the origin. 
"vertices" should be a flat array like [x1, y1, z1, x2, y2, z2, ...]. 
"indices" should be for triangles, like [i1, i2, i3, i4, i5, i6, ...].
Return ONLY the JSON. No other text.`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: `Create a 3D model for: ${prompt}`,
        system: systemPrompt,
        stream: false,
        format: 'json'
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.response);
    return formatResult(result);
    
  } catch (error) {
    console.error('Failed to generate 3D model via Ollama. Using fallback mock.', error);
    
    // FALLBACK MOCK for testing
    let result = {
      vertices: [
        0, 1, 0,    // Top (0)
        -1, 0, -1,  // Bottom back left (1)
        1, 0, -1,   // Bottom back right (2)
        1, 0, 1,    // Bottom front right (3)
        -1, 0, 1    // Bottom front left (4)
      ],
      indices: [
        0, 2, 1, // Back
        0, 3, 2, // Right
        0, 4, 3, // Front
        0, 1, 4, // Left
        1, 2, 3, // Bottom 1
        1, 3, 4  // Bottom 2
      ]
    };

    if (prompt.toLowerCase().includes('plane')) {
      result = {
        vertices: [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1],
        indices: [0, 1, 2, 0, 2, 3]
      };
    }

    return formatResult(result);
  }
};

function formatResult(result) {
  const nestedVertices = [];
  for (let i = 0; i < result.vertices.length; i += 3) {
    nestedVertices.push([
      result.vertices[i],
      result.vertices[i + 1],
      result.vertices[i + 2]
    ]);
  }

  return {
    vertices: nestedVertices,
    indices: result.indices
  };
}
