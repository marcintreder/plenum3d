// Sculpt3D High-Fidelity F1 Model Generator
// Detailed multi-part assembly

export const generateF1 = () => {
  let vertices = [];
  let indices = [];

  function addPart(pos, size, type = 'box', subdivisions = 1) {
    const offset = vertices.length;
    const [x, y, z] = pos;
    const [w, h, d] = size;

    if (type === 'box') {
      const v = [
        [x-w/2, y-h/2, z-d/2], [x+w/2, y-h/2, z-d/2], [x+w/2, y+h/2, z-d/2], [x-w/2, y+h/2, z-d/2],
        [x-w/2, y-h/2, z+d/2], [x+w/2, y-h/2, z+d/2], [x+w/2, y+h/2, z+d/2], [x-w/2, y+h/2, z+d/2]
      ];
      const i = [
        0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5
      ];
      vertices.push(...v);
      indices.push(...i.map(idx => idx + offset));
    } else if (type === 'cylinder') {
      const segments = 16;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const cx = Math.cos(theta) * w;
        const cz = Math.sin(theta) * w;
        vertices.push([x + cx, y - h/2, z + cz]); // bottom
        vertices.push([x + cx, y + h/2, z + cz]); // top
      }
      for (let i = 0; i < segments; i++) {
        const b1 = offset + i * 2;
        const t1 = b1 + 1;
        const b2 = offset + (i + 1) * 2;
        const t2 = b2 + 1;
        indices.push(b1, t1, b2, t1, t2, b2);
        // Caps
        if (i > 0 && i < segments - 1) {
           // Simplified caps
        }
      }
    } else if (type === 'nose') {
      // Tapered nose cone
      const v = [
        [x+w/2, y, z], // Tip (front)
        [x-w/2, y-h/2, z-d/2], [x-w/2, y-h/2, z+d/2], 
        [x-w/2, y+h/2, z+d/2], [x-w/2, y+h/2, z-d/2]
      ];
      const i = [0,2,1, 0,3,2, 0,4,3, 0,1,4, 1,2,3, 1,3,4];
      vertices.push(...v);
      indices.push(...i.map(idx => idx + offset));
    }
  }

  // 1. Main Chassis (Monocoque)
  addPart([0, 0, 0], [1.8, 0.4, 0.6], 'box');
  
  // 2. Nose Cone
  addPart([1.4, -0.05, 0], [1.0, 0.3, 0.4], 'nose');
  
  // 3. Front Wing (Main Plane)
  addPart([1.8, -0.15, 0], [0.2, 0.05, 2.0], 'box');
  // Front Wing Endplates
  addPart([1.8, -0.1, 1.0], [0.3, 0.2, 0.05], 'box');
  addPart([1.8, -0.1, -1.0], [0.3, 0.2, 0.05], 'box');

  // 4. Rear Wing (DRS Assembly)
  addPart([-1.3, 0.4, 0], [0.2, 0.05, 1.2], 'box'); // Upper flap
  addPart([-1.3, 0.3, 0], [0.2, 0.05, 1.2], 'box'); // Lower flap
  addPart([-1.3, 0.3, 0.6], [0.4, 0.5, 0.05], 'box'); // Endplate R
  addPart([-1.3, 0.3, -0.6], [0.4, 0.5, 0.05], 'box'); // Endplate L

  // 5. Sidepods (Cooling inlets)
  addPart([0, 0, 0.4], [1.2, 0.35, 0.25], 'box');
  addPart([0, 0, -0.4], [1.2, 0.35, 0.25], 'box');

  // 6. Halo Protection
  addPart([0.2, 0.3, 0], [0.4, 0.05, 0.4], 'box');

  // 7. Wheels (Detailed Rims/Tires)
  const wheelRadius = 0.35;
  const wheelWidth = 0.45;
  addPart([1.0, -0.1, 0.7], [wheelRadius, wheelWidth, wheelRadius], 'cylinder');
  addPart([1.0, -0.1, -0.7], [wheelRadius, wheelWidth, wheelRadius], 'cylinder');
  addPart([-1.0, -0.1, 0.8], [wheelRadius + 0.05, wheelWidth + 0.1, wheelRadius + 0.05], 'cylinder');
  addPart([-1.0, -0.1, -0.8], [wheelRadius + 0.05, wheelWidth + 0.1, wheelRadius + 0.05], 'cylinder');

  return { vertices, indices };
};
