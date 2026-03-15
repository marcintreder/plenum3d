// ── Laplacian smoothing ─────────────────────────────────────────────────────

function buildAdjacency(vertices, indices) {
  const adj = vertices.map(() => []);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i+1], c = indices[i+2];
    for (const [v1, v2] of [[a,b],[b,c],[a,c]]) {
      if (!adj[v1].includes(v2)) adj[v1].push(v2);
      if (!adj[v2].includes(v1)) adj[v2].push(v1);
    }
  }
  return adj;
}

export function laplacianSmooth(vertices, indices, iterations = 1, factor = 0.5) {
  const adj = buildAdjacency(vertices, indices);
  let verts = vertices.map(v => [...v]);

  for (let iter = 0; iter < iterations; iter++) {
    const next = verts.map((v, i) => {
      const neighbors = adj[i];
      if (!neighbors.length) return v;
      const avg = [0, 0, 0];
      for (const n of neighbors) {
        avg[0] += verts[n][0];
        avg[1] += verts[n][1];
        avg[2] += verts[n][2];
      }
      avg[0] /= neighbors.length;
      avg[1] /= neighbors.length;
      avg[2] /= neighbors.length;
      return [
        v[0] * (1 - factor) + avg[0] * factor,
        v[1] * (1 - factor) + avg[1] * factor,
        v[2] * (1 - factor) + avg[2] * factor,
      ];
    });
    verts = next;
  }
  return verts;
}

// ── Face detection via flood-fill on adjacent coplanar triangles ─────────────

function getTriangleAdjacency(indices) {
  const edgeToTri = new Map();
  const triCount = indices.length / 3;
  for (let t = 0; t < triCount; t++) {
    const a = indices[t*3], b = indices[t*3+1], c = indices[t*3+2];
    for (const [v1, v2] of [[a,b],[b,c],[a,c]]) {
      const key = `${Math.min(v1,v2)}_${Math.max(v1,v2)}`;
      if (!edgeToTri.has(key)) edgeToTri.set(key, []);
      edgeToTri.get(key).push(t);
    }
  }
  const adj = Array.from({ length: triCount }, () => []);
  for (const tris of edgeToTri.values()) {
    if (tris.length === 2) {
      adj[tris[0]].push(tris[1]);
      adj[tris[1]].push(tris[0]);
    }
  }
  return adj;
}

export function detectFaces(vertices, indices, threshold = 0.95) {
  if (!vertices?.length || !indices?.length) return [];
  const triCount = indices.length / 3;

  // Compute per-triangle normals
  const triNormals = [];
  for (let t = 0; t < triCount; t++) {
    const a = vertices[indices[t*3]];
    const b = vertices[indices[t*3+1]];
    const c = vertices[indices[t*3+2]];
    if (!a || !b || !c) { triNormals.push([0,1,0]); continue; }
    const ab = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
    const ac = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
    const nx = ab[1]*ac[2] - ab[2]*ac[1];
    const ny = ab[2]*ac[0] - ab[0]*ac[2];
    const nz = ab[0]*ac[1] - ab[1]*ac[0];
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
    triNormals.push([nx/len, ny/len, nz/len]);
  }

  const triAdj = getTriangleAdjacency(indices);
  const assigned = new Array(triCount).fill(-1);
  const faces = [];

  for (let start = 0; start < triCount; start++) {
    if (assigned[start] !== -1) continue;
    const faceId = faces.length;
    const triangleIndices = [];
    const queue = [start];
    assigned[start] = faceId;
    const n0 = triNormals[start];

    while (queue.length > 0) {
      const t = queue.shift();
      triangleIndices.push(t);
      for (const nb of triAdj[t]) {
        if (assigned[nb] !== -1) continue;
        const dot = n0[0]*triNormals[nb][0] + n0[1]*triNormals[nb][1] + n0[2]*triNormals[nb][2];
        if (dot > threshold) {
          assigned[nb] = faceId;
          queue.push(nb);
        }
      }
    }

    const verts = new Set();
    for (const t of triangleIndices) {
      verts.add(indices[t*3]);
      verts.add(indices[t*3+1]);
      verts.add(indices[t*3+2]);
    }
    faces.push({ id: faceId, triangleIndices, normal: n0, vertexIndices: [...verts] });
  }

  return faces;
}
