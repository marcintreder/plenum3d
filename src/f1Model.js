export const generateF1 = () => {
  let vertices = [];
  let indices = [];

  function addBox(pos, size) {
    const offset = vertices.length;
    const [x, y, z] = pos;
    const [w, h, d] = size;
    
    const v = [
      [x-w/2, y-h/2, z-d/2], [x+w/2, y-h/2, z-d/2], [x+w/2, y+h/2, z-d/2], [x-w/2, y+h/2, z-d/2],
      [x-w/2, y-h/2, z+d/2], [x+w/2, y-h/2, z+d/2], [x+w/2, y+h/2, z+d/2], [x-w/2, y+h/2, z+d/2]
    ];
    const i = [
      0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5
    ];
    
    vertices.push(...v);
    indices.push(...i.map(idx => idx + offset));
  }

  function addCylinder(pos, r, h, segments = 12) {
    const offset = vertices.length;
    const [px, py, pz] = pos;

    // Vertices
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      vertices.push([px + x, py - h/2, pz + z]); // bottom
      vertices.push([px + x, py + h/2, pz + z]); // top
    }

    // Sides
    for (let i = 0; i < segments; i++) {
      const b1 = offset + i * 2;
      const t1 = b1 + 1;
      const b2 = offset + (i + 1) * 2;
      const t2 = b2 + 1;
      indices.push(b1, t1, b2, t1, t2, b2);
    }
  }

  // Chassis
  addBox([0, 0, 0], [3, 0.4, 0.8]);
  // Front Wing
  addBox([1.5, -0.1, 0], [0.4, 0.1, 2]);
  // Rear Wing
  addBox([-1.4, 0.4, 0], [0.4, 0.6, 1.2]);
  
  // Wheels
  addCylinder([1, -0.1, 0.6], 0.3, 0.4);
  addCylinder([1, -0.1, -0.6], 0.3, 0.4);
  addCylinder([-1, -0.1, 0.6], 0.35, 0.4);
  addCylinder([-1, -0.1, -0.6], 0.35, 0.4);

  return { vertices, indices };
};
