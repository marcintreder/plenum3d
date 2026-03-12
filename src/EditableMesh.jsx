import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import useStore from './useStore';

const EditableMesh = () => {
  const { vertices, indices } = useStore();
  const geometryRef = useRef();

  const flatVertices = useMemo(() => new Float32Array(vertices.flat()), [vertices]);

  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.attributes.position.array.set(flatVertices);
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    }
  }, [flatVertices]);

  return (
    <mesh>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={vertices.length}
          array={flatVertices}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          count={indices.length}
          array={new Uint16Array(indices)}
          itemSize={1}
        />
      </bufferGeometry>
      <meshStandardMaterial color="#7C3AED" wireframe />
    </mesh>
  );
};

export default EditableMesh;
