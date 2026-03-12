// Sculpt3D High-Fidelity F1 Model Generator
// Detailed multi-part assembly - Returns an array of object configurations

export const generateF1 = () => {
  const parts = [];

  function createPart(name, pos, size, type = 'box', color = '#7C3AED') {
    let vertices = [];
    let indices = [];
    const [x, y, z] = pos;
    const [w, h, d] = size;

    if (type === 'box') {
      vertices = [
        [x-w/2, y-h/2, z-d/2], [x+w/2, y-h/2, z-d/2], [x+w/2, y+h/2, z-d/2], [x-w/2, y+h/2, z-d/2],
        [x-w/2, y-h/2, z+d/2], [x+w/2, y-h/2, z+d/2], [x+w/2, y+h/2, z+d/2], [x-w/2, y+h/2, z+d/2]
      ];
      indices = [
        0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5
      ];
    } else if (type === 'cylinder') {
      // Cylinder aligned with Z-axis (for wheels)
      const segments = 16;
      const radius = w; // Use w as radius
      const length = h; // Use h as length (along Z)
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const vx = Math.cos(theta) * radius;
        const vy = Math.sin(theta) * radius;
        vertices.push([x + vx, y + vy, z - length/2]); // front cap
        vertices.push([x + vx, y + vy, z + length/2]); // back cap
      }
      for (let i = 0; i < segments; i++) {
        const b1 = i * 2;
        const t1 = b1 + 1;
        const b2 = (i + 1) * 2;
        const t2 = b2 + 1;
        indices.push(b1, t1, b2, t1, t2, b2);
      }
    } else if (type === 'nose') {
      vertices = [
        [x+w/2, y, z], // Tip (front)
        [x-w/2, y-h/2, z-d/2], [x-w/2, y-h/2, z+d/2], 
        [x-w/2, y+h/2, z+d/2], [x-w/2, y+h/2, z-d/2]
      ];
      indices = [0,2,1, 0,3,2, 0,4,3, 0,1,4, 1,2,3, 1,3,4];
    }

    parts.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      vertices,
      indices,
      color,
      materialType: 'physical',
      metalness: 0.8,
      roughness: 0.2,
      visible: true,
      position: [0, 0, 0], // Store-level transform
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    });
  }

  // 1. Chassis
  createPart('Main Chassis', [0, 0, 0], [1.8, 0.4, 0.6], 'box', '#CC0000');
  
  // 2. Nose
  createPart('Nose Cone', [1.4, -0.05, 0], [1.0, 0.3, 0.4], 'nose', '#CC0000');
  
  // 3. Wings
  createPart('Front Wing', [1.8, -0.15, 0], [0.2, 0.05, 2.0], 'box', '#222');
  createPart('Rear Wing Main', [-1.3, 0.4, 0], [0.2, 0.05, 1.2], 'box', '#CC0000');
  createPart('Rear Wing Flap', [-1.3, 0.3, 0], [0.2, 0.05, 1.2], 'box', '#222');

  // 4. Sidepods
  createPart('Sidepod R', [0, 0, 0.4], [1.2, 0.35, 0.25], 'box', '#CC0000');
  createPart('Sidepod L', [0, 0, -0.4], [1.2, 0.35, 0.25], 'box', '#CC0000');

  // 5. Wheels
  const wheelRadius = 0.35;
  const wheelWidth = 0.4;
  createPart('Wheel FR', [1.0, -0.1, 0.7], [wheelRadius, wheelWidth, wheelRadius], 'cylinder', '#111');
  createPart('Wheel FL', [1.0, -0.1, -0.7], [wheelRadius, wheelWidth, wheelRadius], 'cylinder', '#111');
  createPart('Wheel RR', [-1.0, -0.1, 0.8], [wheelRadius + 0.05, wheelWidth + 0.1, wheelRadius + 0.05], 'cylinder', '#111');
  createPart('Wheel RL', [-1.0, -0.1, -0.8], [wheelRadius + 0.05, wheelWidth + 0.1, wheelRadius + 0.05], 'cylinder', '#111');

  return parts;
};
