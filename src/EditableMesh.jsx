import React, { useMemo, useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import useStore from './useStore';

const EditableMesh = ({ object }) => {
  const meshRef = useRef();
  const geomRef = useRef();
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const editMode = useStore((state) => state.editMode);
  const updateObjectTransform = useStore((state) => state.updateObjectTransform);
  const setSelectedObjectId = useStore((state) => state.setSelectedObjectId);

  const isSelected = selectedObjectId === object.id;

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

  const meshElement = (
    <mesh 
      ref={meshRef}
      position={object.position || [0, 0, 0]}
      rotation={object.rotation || [0, 0, 0]}
      scale={object.scale || [1, 1, 1]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedObjectId(object.id);
      }}
    >
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

  if (isSelected && editMode === 'object') {
    return (
      <TransformControls
        object={meshRef}
        onMouseUp={() => {
          const { position, rotation, scale } = meshRef.current;
          updateObjectTransform(
            object.id,
            [position.x, position.y, position.z],
            [rotation.x, rotation.y, rotation.z],
            [scale.x, scale.y, scale.z]
          );
        }}
      >
        {meshElement}
      </TransformControls>
    );
  }

  return meshElement;
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
