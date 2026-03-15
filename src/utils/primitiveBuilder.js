/**
 * Build triangle mesh geometry for a named primitive type.
 * Returns { vertices: [[x,y,z],...], indices: [i,i,i,...] } in local space,
 * centered at the origin, sized by the `size` array [width, height, depth].
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
    const segs = 20; // higher → smoother sphere
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
    const radius = w / 2, segs = 24;
    vertices.push([0, -h / 2, 0], [0, h / 2, 0]); // bottom center, top center
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      const x = Math.cos(theta) * radius, z = Math.sin(theta) * radius;
      vertices.push([x, -h / 2, z], [x, h / 2, z]);
    }
    for (let i = 0; i < segs; i++) {
      const b = 2 + i * 2, t = b + 1, bn = 2 + (i + 1) * 2, tn = bn + 1;
      indices.push(b, t, bn, t, tn, bn); // side
      indices.push(0, bn, b);            // bottom cap
      indices.push(1, t, tn);            // top cap
    }

  } else if (type === 'cone') {
    const radius = w / 2, segs = 24;
    vertices.push([0, h / 2, 0]);  // apex
    vertices.push([0, -h / 2, 0]); // base center
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      vertices.push([Math.cos(theta) * radius, -h / 2, Math.sin(theta) * radius]);
    }
    for (let i = 0; i < segs; i++) {
      indices.push(0, i + 2, i + 3);  // side
      indices.push(1, i + 3, i + 2);  // base cap
    }
  }

  return { vertices, indices };
}
