export const generate3DModel = async (prompt, referenceImage = null, ollamaUrl = 'http://localhost:11434') => {
  const model = 'mistral'; // Default model
  
  const systemPrompt = `You are an expert 3D generative model creating detailed, beautiful 3D objects with complex sub-elements.
Generate a JSON object:
- "vertices": flat array of floats [x,y,z] representing the object.
- "indices": array of integers for faces (triangles).
- "color": hex color string (e.g. "#FF0000").
- "material": string, one of "standard", "physical", or "wireframe".

The object should be intricate, realistic, and composed of detailed components. 
Return ONLY the JSON. No other text.`;

  try {
    const body = {
      model,
      prompt: `Create a 3D model for: ${prompt}. ${referenceImage ? 'Reference image data provided.' : ''}`,
      system: systemPrompt,
      stream: false,
      format: 'json'
    };

    if (referenceImage) {
        body.images = [referenceImage];
    }

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
      ],
      color: "#7C3AED",
      material: "standard"
    };
    
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
    indices: result.indices,
    color: result.color,
    materialType: result.material
  };
}
