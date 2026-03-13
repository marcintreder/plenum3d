import React, { useRef, useMemo, useEffect, useState } from 'react';
import { PivotControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';

const EditableMesh = ({ object }) => {
  const meshRef = useRef();
  const geomRef = useRef();
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const editMode = useStore((state) => state.editMode);
  const updateObjectTransform = useStore((state) => state.updateObjectTransform);
  const setSelectedObjectId = useStore((state) => state.setSelectedObjectId);
  const setSelectedJointIndex = useStore((state) => state.setSelectedJointIndex);

  const [isDragging, setIsDragging] = useState(false);

  const isSelected = selectedObjectId === object.id;

  const flatVertices = useMemo(() => {
    if (!object?.vertices || object.vertices.length === 0) return new Float32Array([]);
    try {
      return new Float32Array(object.vertices.flat());
    } catch (e) {
      console.error("Flat vertices error", e);
      return new Float32Array([]);
    }
  }, [object?.vertices]);

  const flatIndices = useMemo(() => {
    if (!object?.indices || object.indices.length === 0) return new Uint32Array([]);
    try {
      return new Uint32Array(object.indices);
    } catch (e) {
      console.error("Flat indices error", e);
      return new Uint32Array([]);
    }
  }, [object?.indices]);


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

  const handleDoubleClick = () => {
    setSelectedObjectId(object.id);
    setSelectedJointIndex(null);
  };

  const handleTransformStart = () => setIsDragging(true);
  const handleTransformEnd = () => {
    setIsDragging(false);
    // Save history once the user finishes moving the object
    useStore.getState().saveHistory();
  };

  const meshElement = (
    <mesh
      ref={meshRef}
      position={object.position || [0, 0, 0]}
      rotation={object.rotation || [0, 0, 0]}
      scale={object.scale || [1, 1, 1]}
      onDoubleClick={handleDoubleClick}
      onPointerMissed={() => setSelectedJointIndex(null)}
    >
      {flatVertices.length > 0 && flatIndices.length > 0 ? (
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
      ) : null}
      {Material}
    </mesh>
  );


  if (isSelected && editMode === 'object') {
    return (
      <PivotControls
        object={meshRef}
        onDragStart={handleTransformStart}
        onDragEnd={handleTransformEnd}
        onDrag={(matrix) => {
          const position = new THREE.Vector3();
          const q = new THREE.Quaternion();
          const s = new THREE.Vector3();
          matrix.decompose(position, q, s);
          updateObjectTransform(object.id, [position.x, position.y, position.z], [0,0,0], [1,1,1]);
        }}
        depthTest={false}
        scale={0.75}
        lineWidth={4}
        fixed
        displayValues={false}
        autoScale={false}
      >
        {meshElement}
      </PivotControls>
    );
  }

  return meshElement;
};

export default EditableMesh;
