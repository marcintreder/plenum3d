import React, { useMemo, useRef } from 'react';
import useStore from './useStore';

const EditableMesh = () => {
  const { vertices, indices } = useStore();

  const flatVertices = useMemo(() => new Float32Array(vertices.flat()), [vertices]);
  const flatIndices = useMemo(() => new Uint16Array(indices), [indices]);

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={vertices.length}
          array={flatVertices}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          count={indices.length}
          array={flatIndices}
          itemSize={1}
        />
      </bufferGeometry>
      <meshStandardMaterial color="#7C3AED" wireframe />
    </mesh>
  );
};

export default EditableMesh;
