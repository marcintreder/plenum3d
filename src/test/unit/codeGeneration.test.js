import { generateR3FCode } from '../../CodeGenerator';

describe('code generation', () => {
  it('should generate valid R3F code for a basic cube', () => {
    const mockObjects = [{
      visible: true,
      name: 'test-cube',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
      indices: [0, 1, 2],
      color: '#ff0000',
      metalness: 0.5,
      roughness: 0.5,
      materialType: 'solid'
    }];
    
    const code = generateR3FCode(mockObjects);
    
    expect(code).toContain('<mesh');
    expect(code).toContain('name="test-cube"');
    expect(code).toContain('position={[0, 0, 0]}');
    expect(code).toContain('<bufferGeometry>');
    expect(code).toContain('color="#ff0000"');
    expect(code).toContain('</mesh>');
  });

  it('should not generate code for invisible objects', () => {
    const mockObjects = [{
      visible: false,
      name: 'hidden-cube',
      vertices: [],
      indices: []
    }];
    
    const code = generateR3FCode(mockObjects);
    
    expect(code).not.toContain('hidden-cube');
  });
});
