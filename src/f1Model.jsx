// Sculpt3D High-Fidelity F1 Model Generator
// Detailed multi-part assembly - Returns an array of object configurations

export const generateF1 = () => {
  const parts = [];

  function createPart(name, pos, size, type = 'box', color = '#7C3AED', rotation = [0, 0, 0]) {
    let vertices = [];
    let indices = [];
    const [x, y, z] = pos;
    const [w, h, d] = size;

    if (type === 'box') {
      vertices = [
        [-w/2, -h/2, -d/2], [w/2, -h/2, -d/2], [w/2, h/2, -d/2], [-w/2, h/2, -d/2],
        [-w/2, -h/2, d/2], [w/2, -h/2, d/2], [w/2, h/2, d/2], [-w/2, h/2, d/2]
      ];
      indices = [
        0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5
      ];
    } else if (type === 'cylinder') {
      const segments = 16; // Reduced segments for mobile device optimization
      const radius = w;
      const length = h;
      
      for (let i = 0; i < segments; i++) {
        const theta1 = (i / segments) * Math.PI * 2;
        const theta2 = ((i + 1) / segments) * Math.PI * 2;
        
        const vBase = vertices.length;
        vertices.push(
          [Math.cos(theta1) * radius, -length/2, Math.sin(theta1) * radius],
          [Math.cos(theta1) * radius, length/2, Math.sin(theta1) * radius],
          [Math.cos(theta2) * radius, -length/2, Math.sin(theta2) * radius],
          [Math.cos(theta2) * radius, length/2, Math.sin(theta2) * radius]
        );
        
        // Side faces
        indices.push(vBase, vBase + 1, vBase + 2, vBase + 1, vBase + 3, vBase + 2);
      }
        
      // Caps
      const centerBottom = vertices.length;
      vertices.push([0, -length/2, 0]);
      const centerTop = vertices.length;
      vertices.push([0, length/2, 0]);
      
      for (let i = 0; i < segments; i++) {
        const iBase = i * 4;
        // Bottom cap
        indices.push(centerBottom, iBase + 2, iBase);
        // Top cap
        indices.push(centerTop, iBase + 1, iBase + 3);
      }
    } else if (type === 'nose') {
      vertices = [
        [w/2, 0, 0], 
        [-w/2, -h/2, -d/2], [-w/2, -h/2, d/2], 
        [-w/2, h/2, d/2], [-w/2, h/2, -d/2]
      ];
      indices = [0,2,1, 0,3,2, 0,4,3, 0,1,4, 1,2,3, 1,3,4];
    }

    // Safety check for empty geometry
    if (vertices.length === 0 || indices.length === 0) return;


    const rotatedVertices = vertices.map(v => {
      let [vx, vy, vz] = v;
      if (rotation[0] !== 0) { 
        const ty = vy, tz = vz;
        vy = ty * Math.cos(rotation[0]) - tz * Math.sin(rotation[0]);
        vz = ty * Math.sin(rotation[0]) + tz * Math.cos(rotation[0]);
      }
      if (rotation[1] !== 0) { 
        const tx = vx, tz = vz;
        vx = tx * Math.cos(rotation[1]) + tz * Math.sin(rotation[1]);
        vz = -tx * Math.sin(rotation[1]) + tz * Math.cos(rotation[1]);
      }
      if (rotation[2] !== 0) { 
        const tx = vx, ty = vy;
        vx = tx * Math.cos(rotation[2]) - ty * Math.sin(rotation[2]);
        vy = tx * Math.sin(rotation[2]) + ty * Math.cos(rotation[2]);
      }
      return [vx + pos[0], vy + pos[1], vz + pos[2]];
    });

    parts.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      vertices: rotatedVertices,
      indices,
      color,
      materialType: 'physical',
      metalness: 0.8,
      roughness: 0.2,
      visible: true,
      position: [0, 0, 0], 
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    });
  }

  const RED = '#E02424';
  const BLACK = '#111111';
  const SILVER = '#9CA3AF';

  // --- ASSEMBLY ---
  
  createPart('Chassis Base', [0, -0.05, 0], [2.0, 0.2, 0.7], 'box', RED);
  createPart('Chassis Upper', [-0.2, 0.15, 0], [1.4, 0.25, 0.5], 'box', RED);
  createPart('Nose Cone', [1.5, 0, 0], [1.2, 0.25, 0.35], 'nose', RED);
  createPart('Cockpit Opening', [0.3, 0.25, 0], [0.6, 0.1, 0.4], 'box', BLACK);
  createPart('Sidepod R', [0.2, 0.05, 0.45], [1.2, 0.3, 0.3], 'box', RED);
  createPart('Sidepod L', [0.2, 0.05, -0.45], [1.2, 0.3, 0.3], 'box', RED);
  createPart('Sidepod Intake R', [0.7, 0.1, 0.45], [0.1, 0.2, 0.25], 'box', BLACK);
  createPart('Sidepod Intake L', [0.7, 0.1, -0.45], [0.1, 0.2, 0.25], 'box', BLACK);
  createPart('Front Wing Main', [1.8, -0.12, 0], [0.2, 0.04, 2.2], 'box', BLACK);
  createPart('Front Wing End R', [1.8, -0.05, 1.1], [0.3, 0.2, 0.04], 'box', RED);
  createPart('Front Wing End L', [1.8, -0.05, -1.1], [0.3, 0.2, 0.04], 'box', RED);
  createPart('Rear Wing Lower', [-1.4, 0.3, 0], [0.2, 0.04, 1.2], 'box', BLACK);
  createPart('Rear Wing Upper', [-1.4, 0.45, 0], [0.15, 0.04, 1.2], 'box', RED);
  createPart('Rear Wing End R', [-1.4, 0.35, 0.6], [0.4, 0.5, 0.04], 'box', RED);
  createPart('Rear Wing End L', [-1.4, 0.35, -0.6], [0.4, 0.5, 0.04], 'box', RED);
  createPart('Halo Ring', [0.5, 0.35, 0], [0.4, 0.05, 0.4], 'box', BLACK);
  createPart('Engine Cover', [-0.7, 0.3, 0], [1.0, 0.4, 0.2], 'box', RED);
  createPart('Steering Wheel', [0.3, 0.35, 0], [0.1, 0.1, 0.1], 'box', BLACK);
  createPart('Driver Seat', [0.1, 0.2, 0], [0.4, 0.1, 0.3], 'box', BLACK);
  createPart('Cockpit Headrest', [0.1, 0.35, 0], [0.2, 0.1, 0.2], 'box', BLACK);
  createPart('Diffuser Center', [-1.6, -0.05, 0], [0.4, 0.1, 0.8], 'box', BLACK);
  createPart('Diffuser Fin R', [-1.6, 0.05, 0.3], [0.1, 0.2, 0.05], 'box', BLACK);
  createPart('Diffuser Fin L', [-1.6, 0.05, -0.3], [0.1, 0.2, 0.05], 'box', BLACK);
  createPart('Main Chassis', [0, 0, 0], [2.0, 0.5, 1.0], 'box', RED);


  const wheelRadius = 0.65; // Further increased for visual impact
  const wheelWidth = 0.75;  
  const W_ROT = [Math.PI / 2, 0, 0]; 

  function createDetailedWheel(name, pos) {
    // Tire - Pitch Black
    createPart(name + ' Tire', pos, [wheelRadius, wheelWidth, wheelRadius], 'cylinder', '#050505', W_ROT);
    // Rim - High Contrast Silver, more detailed shape
    createPart(name + ' Rim', pos, [wheelRadius * 0.75, wheelWidth + 0.15, wheelRadius * 0.75], 'cylinder', '#E5E7EB', W_ROT);
  }
  
  createDetailedWheel('Wheel FR', [1.2, 0.2, 1.0]); 
  createDetailedWheel('Wheel FL', [1.2, 0.2, -1.0]);
  createDetailedWheel('Wheel RR', [-1.1, 0.2, 1.1]);
  createDetailedWheel('Wheel RL', [-1.1, 0.2, -1.1]);



  createPart('Suspension Front Arm R', [1.1, -0.05, 0.4], [0.05, 0.05, 0.5], 'box', SILVER);
  createPart('Suspension Front Arm L', [1.1, -0.05, -0.4], [0.05, 0.05, 0.5], 'box', SILVER);
  createPart('Suspension Rear Arm R', [-1.0, -0.05, 0.45], [0.05, 0.05, 0.5], 'box', SILVER);
  createPart('Suspension Rear Arm L', [-1.0, -0.05, -0.45], [0.05, 0.05, 0.5], 'box', SILVER);

  return parts;
};
