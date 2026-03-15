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

// ── Star-of-vertex: cyclic ordered triangles around vi ────────────────────────
// Each entry is [vi, neighborA, neighborB] where neighborA is the "entry" edge vertex.
// Consecutive entries share: entry[i][2] === entry[i+1][1].

function walkStar(vi, indices) {
  const tris = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i+1], c = indices[i+2];
    if (a === vi) tris.push([vi, b, c]);
    else if (b === vi) tris.push([vi, c, a]);
    else if (c === vi) tris.push([vi, a, b]);
  }
  if (!tris.length) return [];

  const ordered = [tris[0]];
  const pool = tris.slice(1);
  while (pool.length) {
    const nextKey = ordered[ordered.length - 1][2];
    const idx = pool.findIndex(t => t[1] === nextKey);
    if (idx === -1) break; // boundary vertex — stop
    ordered.push(...pool.splice(idx, 1));
  }
  ordered.push(...pool); // append any boundary remainder
  return ordered;
}

// ── Bevel selected vertices ───────────────────────────────────────────────────
// For each selected vertex, creates one new vertex per adjacent edge at distance
// `amount` (0–0.49) from the original. The original vertex is removed and replaced
// by a "cap" polygon. All triangles are updated to use the new bevel vertices.

export function bevelSelectedVertices(vertices, indices, selectedIndices, amount) {
  const sel = new Set(selectedIndices);
  const t = Math.max(0.01, Math.min(0.49, amount));

  const newVerts = vertices.map(v => [...v]);
  // bevelMap: `${vi}_${ni}` → index of new bevel vertex on edge vi→ni
  const bevelMap = new Map();

  for (const vi of sel) {
    const V = vertices[vi];
    const neighbors = new Set();
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i+1], c = indices[i+2];
      if (a === vi) { neighbors.add(b); neighbors.add(c); }
      else if (b === vi) { neighbors.add(a); neighbors.add(c); }
      else if (c === vi) { neighbors.add(a); neighbors.add(b); }
    }
    for (const ni of neighbors) {
      const key = `${vi}_${ni}`;
      if (bevelMap.has(key)) continue;
      const N = vertices[ni];
      bevelMap.set(key, newVerts.length);
      newVerts.push([V[0]+(N[0]-V[0])*t, V[1]+(N[1]-V[1])*t, V[2]+(N[2]-V[2])*t]);
    }
  }

  const newIndices = [];
  const bv = (from, to) => bevelMap.get(`${from}_${to}`);

  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i], indices[i+1], indices[i+2]];
    const as = sel.has(a), bs = sel.has(b), cs = sel.has(c);

    if (!as && !bs && !cs) {
      newIndices.push(a, b, c);
    } else if (as && !bs && !cs) {
      const ab=bv(a,b), ac=bv(a,c);
      newIndices.push(ab,b,c, ab,c,ac);
    } else if (!as && bs && !cs) {
      const ba=bv(b,a), bc=bv(b,c);
      newIndices.push(a,ba,c, ba,bc,c);
    } else if (!as && !bs && cs) {
      const ca=bv(c,a), cb=bv(c,b);
      newIndices.push(a,b,cb, a,cb,ca);
    } else if (as && bs && !cs) {
      const ab=bv(a,b), ac=bv(a,c), ba=bv(b,a), bc=bv(b,c);
      newIndices.push(ac,ab,ba, ac,ba,bc, ac,bc,c);
    } else if (as && !bs && cs) {
      const ab=bv(a,b), ac=bv(a,c), ca=bv(c,a), cb=bv(c,b);
      newIndices.push(ab,b,cb, ab,cb,ca, ab,ca,ac);
    } else if (!as && bs && cs) {
      const ba=bv(b,a), bc=bv(b,c), ca=bv(c,a), cb=bv(c,b);
      newIndices.push(a,ba,bc, a,bc,cb, a,cb,ca);
    } else { // all 3 selected → hexagon fan from ab
      const ab=bv(a,b), ac=bv(a,c), ba=bv(b,a), bc=bv(b,c), ca=bv(c,a), cb=bv(c,b);
      newIndices.push(ab,ba,bc, ab,bc,cb, ab,cb,ca, ab,ca,ac);
    }
  }

  // Add cap polygon for each selected vertex
  for (const vi of sel) {
    const star = walkStar(vi, indices);
    const ring = star.map(tri => bevelMap.get(`${vi}_${tri[1]}`)).filter(v => v !== undefined);
    if (ring.length >= 3) {
      for (let j = 1; j < ring.length - 1; j++) {
        newIndices.push(ring[0], ring[j], ring[j+1]);
      }
    }
  }

  return { vertices: newVerts, indices: newIndices };
}

// ── Subdivide edge: insert midpoint vertex, split adjacent triangles ──────────

export function subdivideEdge(vertices, indices, v1, v2) {
  const V1 = vertices[v1], V2 = vertices[v2];
  const mid = [(V1[0]+V2[0])/2, (V1[1]+V2[1])/2, (V1[2]+V2[2])/2];
  const midIdx = vertices.length;
  const newVerts = [...vertices, mid];

  const newIndices = [];
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i], indices[i+1], indices[i+2]];
    // Detect if this triangle contains directed edge v1→v2 or v2→v1
    const fwd = (a===v1&&b===v2)||(b===v1&&c===v2)||(c===v1&&a===v2);
    const rev = (a===v2&&b===v1)||(b===v2&&c===v1)||(c===v2&&a===v1);
    if (!fwd && !rev) { newIndices.push(a, b, c); continue; }

    // Find the vertex that is neither v1 nor v2
    const other = [a, b, c].find(v => v !== v1 && v !== v2);
    if (fwd) {
      // Directed v1→v2 in this triangle → split preserving winding
      newIndices.push(v1, midIdx, other, midIdx, v2, other);
    } else {
      // Directed v2→v1 in this triangle
      newIndices.push(v2, midIdx, other, midIdx, v1, other);
    }
  }

  return { vertices: newVerts, indices: newIndices, newVertexIndex: midIdx };
}

// ── Dissolve vertex: remove it and re-triangulate the surrounding ring ────────

export function dissolveVertex(vertices, indices, vi) {
  const star = walkStar(vi, indices);
  if (!star.length) return { vertices, indices };

  // Ring of neighbors in cyclic order around vi
  const ring = star.map(tri => tri[1]);

  const newVerts = vertices.filter((_, i) => i !== vi);
  const shift = idx => idx > vi ? idx - 1 : idx;

  // Keep all triangles that don't contain vi; add fan from ring
  const newIndices = [];
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i], indices[i+1], indices[i+2]];
    if (a === vi || b === vi || c === vi) continue;
    newIndices.push(shift(a), shift(b), shift(c));
  }

  // Fan-triangulate the hole
  if (ring.length >= 3) {
    const r0 = shift(ring[0]);
    for (let j = 1; j < ring.length - 1; j++) {
      newIndices.push(r0, shift(ring[j]), shift(ring[j+1]));
    }
  }

  return { vertices: newVerts, indices: newIndices, removedIndex: vi };
}
