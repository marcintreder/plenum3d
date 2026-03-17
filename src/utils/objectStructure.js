/**
 * Extract a structured summary of a 3D object for use in AI refinement prompts.
 * Returns metadata (bounding box, vertex/face counts, materials) rather than raw
 * vertex data, which would be too large to embed directly in a prompt.
 *
 * @param {Object} object - A store object with vertices, indices, position, etc.
 * @returns {Object} Structured summary suitable for serializing into an AI prompt.
 */
export function extractObjectStructure(object) {
  const vertices = object.vertices || [];
  const indices = object.indices || [];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const [x, y, z] of vertices) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  const hasVerts = vertices.length > 0;
  const boundingBox = hasVerts
    ? {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
        size: [
          parseFloat((maxX - minX).toFixed(4)),
          parseFloat((maxY - minY).toFixed(4)),
          parseFloat((maxZ - minZ).toFixed(4)),
        ],
      }
    : { min: [0, 0, 0], max: [0, 0, 0], size: [0, 0, 0] };

  return {
    name: object.name || 'Object',
    vertexCount: vertices.length,
    faceCount: Math.floor(indices.length / 3),
    boundingBox,
    position: object.position ?? [0, 0, 0],
    rotation: object.rotation ?? [0, 0, 0],
    scale: object.scale ?? [1, 1, 1],
    color: object.color ?? '#888888',
    metalness: object.metalness ?? 0.3,
    roughness: object.roughness ?? 0.7,
    materialType: object.materialType ?? 'standard',
  };
}
