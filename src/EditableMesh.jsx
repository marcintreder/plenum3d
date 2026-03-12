import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import useStore from './useStore';

const EditableMesh = ({ object }) => {
  const meshRef = useRef();
  const geomRef = useRef();

  const flatVertices = useMemo(() => {
    return new Float32Array(object.vertices.flat());
  }, [object.vertices]);

  const flatIndices = useMemo(() => {
    return new Uint32Array(object.indices);
  }, [object.indices]);

  useEffect(() => {
    if (geomRef.current) {
      geomRef.current.computeVertexNormals();
    }
  }, [object.vertices, object.indices]);

  const Material = useMemo(() => {
    const props = {
      color: object.color,
      metalness: object.metalness,
      roughness: object.roughness,
      transparent: true,
      opacity: 0.9,
    };
    if (object.materialType === 'wireframe') return <meshStandardMaterial {...props} wireframe />;
    if (object.materialType === 'physical') return <meshPhysicalMaterial {...props} />;
    return <meshStandardMaterial {...props} />;
  }, [object.color, object.materialType, object.metalness, object.roughness]);

  if (!object.visible) return null;

  return (
    <mesh ref={meshRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={flatVertices.length / 3}
          array={flatVertices}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          count={flatIndices.length}
          array={flatIndices}
          itemSize={1}
        />
      </bufferGeometry>
      {Material}
    </mesh>
  );
};

const SceneManager = () => {
  const objects = useStore((state) => state.objects);
  return (
    <>
      {objects.map((obj) => (
        <EditableMesh key={obj.id} object={obj} />
      ))}
    </>
  );
};

export default SceneManager;
