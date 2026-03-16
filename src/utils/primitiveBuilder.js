/**
 * Build triangle mesh geometry for a named primitive type.
 * Returns { vertices: [[x,y,z],...], indices: [i,i,i,...] } in local space,
 * centered at the origin, sized by the `size` array [width, height, depth].
 *
 * NOTE: cylinder and cone use exactly `segs` rim vertices with modulo wrap —
 * never segs+1. A duplicate seam vertex causes a visible gap after Laplacian
 * smoothing because the two copies have different neighbour sets and diverge.
 */
export function buildPrimitiveMesh(type, size = [1, 1, 1]) {
  const [w = 1, h = 1, d = 1] = size.map(Number);
  let vertices = [], indices = [];

  if (type === 'box' || type === 'cube') {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    vertices = [
      [-hw,-hh,-hd],[hw,-hh,-hd],[hw,hh,-hd],[-hw,hh,-hd],
      [-hw,-hh, hd],[hw,-hh, hd],[hw,hh, hd],[-hw,hh, hd],
    ];
    indices = [0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5];

  } else if (type === 'sphere') {
    const r = w / 2;
    const segs = 20;
    for (let lat = 0; lat <= segs; lat++) {
      const theta = (lat * Math.PI) / segs;
      for (let lon = 0; lon <= segs; lon++) {
        const phi = (lon * 2 * Math.PI) / segs;
        vertices.push([
          r * Math.sin(theta) * Math.cos(phi),
          r * Math.cos(theta),
          r * Math.sin(theta) * Math.sin(phi),
        ]);
      }
    }
    for (let lat = 0; lat < segs; lat++) {
      for (let lon = 0; lon < segs; lon++) {
        const first = lat * (segs + 1) + lon;
        const second = first + segs + 1;
        indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }

  } else if (type === 'cylinder') {
    // Index layout: 0=bottom-center, 1=top-center, then segs×2 rim pairs
    const radius = w / 2, segs = 24;
    vertices.push([0, -h / 2, 0], [0, h / 2, 0]);
    for (let i = 0; i < segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      const x = Math.cos(theta) * radius, z = Math.sin(theta) * radius;
      vertices.push([x, -h / 2, z], [x, h / 2, z]);
    }
    for (let i = 0; i < segs; i++) {
      const b  = 2 + i * 2,           t  = b + 1;
      const bn = 2 + ((i + 1) % segs) * 2, tn = bn + 1;
      indices.push(b, t, bn,  t, tn, bn); // side quad
      indices.push(0, bn, b);              // bottom cap
      indices.push(1, t,  tn);             // top cap
    }

  } else if (type === 'cone') {
    // Index layout: 0=apex, 1=base-center, then segs rim vertices
    const radius = w / 2, segs = 24;
    vertices.push([0,  h / 2, 0]); // apex
    vertices.push([0, -h / 2, 0]); // base center
    for (let i = 0; i < segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      vertices.push([Math.cos(theta) * radius, -h / 2, Math.sin(theta) * radius]);
    }
    for (let i = 0; i < segs; i++) {
      const curr = i + 2;
      const next = ((i + 1) % segs) + 2;
      indices.push(0, curr, next); // side face
      indices.push(1, next, curr); // base cap
    }

  } else if (type === 'torus') {
    // Donut shape — major radius R from center to tube center, minor radius r for tube
    const R = w / 2, r = Math.min(w, d) / 6;
    const ringSegs = 24, tubeSegs = 16;
    for (let i = 0; i <= ringSegs; i++) {
      const u = (i / ringSegs) * Math.PI * 2;
      for (let j = 0; j <= tubeSegs; j++) {
        const v = (j / tubeSegs) * Math.PI * 2;
        vertices.push([
          (R + r * Math.cos(v)) * Math.cos(u),
          r * Math.sin(v),
          (R + r * Math.cos(v)) * Math.sin(u),
        ]);
      }
    }
    for (let i = 0; i < ringSegs; i++) {
      for (let j = 0; j < tubeSegs; j++) {
        const a = i * (tubeSegs + 1) + j;
        const b = a + tubeSegs + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

  } else if (type === 'plane') {
    // Flat subdivided quad on XZ plane
    const hw = w / 2, hd = d / 2, segs = 6;
    for (let iz = 0; iz <= segs; iz++) {
      for (let ix = 0; ix <= segs; ix++) {
        vertices.push([-hw + (ix / segs) * w, 0, -hd + (iz / segs) * d]);
      }
    }
    for (let iz = 0; iz < segs; iz++) {
      for (let ix = 0; ix < segs; ix++) {
        const a = iz * (segs + 1) + ix;
        const b = a + segs + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

  } else if (type === 'pyramid') {
    // Square-base pyramid
    const hw = w / 2, hd = d / 2;
    vertices = [
      [-hw, -h / 2, -hd], // 0
      [ hw, -h / 2, -hd], // 1
      [ hw, -h / 2,  hd], // 2
      [-hw, -h / 2,  hd], // 3
      [  0,  h / 2,   0], // 4 apex
    ];
    indices = [
      0, 1, 4,  1, 2, 4,  2, 3, 4,  3, 0, 4, // sides
      0, 2, 1,  0, 3, 2,                       // base
    ];

  } else if (type === 'capsule') {
    // Cylinder body + hemispherical caps
    const radius = w / 2;
    const bodyH = Math.max(0, h - w);
    const capSegs = 8, radSegs = 20;
    // Bottom cap (upside-down hemisphere)
    for (let lat = capSegs; lat >= 0; lat--) {
      const theta = (lat / capSegs) * (Math.PI / 2);
      for (let lon = 0; lon <= radSegs; lon++) {
        const phi = (lon / radSegs) * Math.PI * 2;
        vertices.push([
          radius * Math.sin(theta) * Math.cos(phi),
          -bodyH / 2 - radius * Math.cos(theta),
          radius * Math.sin(theta) * Math.sin(phi),
        ]);
      }
    }
    // Top cap
    for (let lat = 0; lat <= capSegs; lat++) {
      const theta = (lat / capSegs) * (Math.PI / 2);
      for (let lon = 0; lon <= radSegs; lon++) {
        const phi = (lon / radSegs) * Math.PI * 2;
        vertices.push([
          radius * Math.sin(theta) * Math.cos(phi),
          bodyH / 2 + radius * Math.cos(theta),
          radius * Math.sin(theta) * Math.sin(phi),
        ]);
      }
    }
    const cols = radSegs + 1;
    const rows = (capSegs + 1) * 2;
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < radSegs; c++) {
        const a = r * cols + c;
        const b = a + cols;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }

  return { vertices, indices };
}
