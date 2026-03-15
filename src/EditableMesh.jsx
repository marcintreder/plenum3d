import React, { useRef, useMemo, useEffect, useState } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';
import { getGridSnap } from './utils/GridManager';
import VertexHandles from './VertexHandles';

const EditableMesh = ({ object }) => {
  const meshRef = useRef();
  const geomRef = useRef();

  const selectedObjectId       = useStore(s => s.selectedObjectId);
  const selectedObjectIds      = useStore(s => s.selectedObjectIds);
  const editMode               = useStore(s => s.editMode);
  const setEditMode            = useStore(s => s.setEditMode);
  const updateObjectTransform  = useStore(s => s.updateObjectTransform);
  const setSelectedObjectId    = useStore(s => s.setSelectedObjectId);
  const toggleSelectedObjectId = useStore(s => s.toggleSelectedObjectId);
  const setSelectedJointIndex  = useStore(s => s.setSelectedJointIndex);

  const [isDragging, setIsDragging] = useState(false);
  const isSelected      = selectedObjectIds.includes(object.id);
  const isPrimary       = selectedObjectId === object.id;
  const isVertexMode    = isPrimary && editMode === 'vertex';

  // Flat buffers for BufferGeometry
  const flatVertices = useMemo(() => {
    if (!object?.vertices?.length) return new Float32Array([]);
    return new Float32Array(object.vertices.flat());
  }, [object.vertices]);

  const flatIndices = useMemo(() => {
    if (!object?.indices?.length) return new Uint32Array([]);
    return new Uint32Array(object.indices);
  }, [object.indices]);

  // Recompute normals when geometry changes
  useEffect(() => {
    if (geomRef.current) geomRef.current.computeVertexNormals();
  }, [object.vertices, object.indices]);


  const Material = useMemo(() => {
    const props = {
      color: object.color,
      metalness: object.metalness ?? 0.5,
      roughness: object.roughness ?? 0.5,
      transparent: true,
      opacity: isVertexMode ? 0.6 : 0.9,
    };
    if (object.materialType === 'wireframe') return <meshStandardMaterial {...props} wireframe />;
    if (object.materialType === 'physical')  return <meshPhysicalMaterial  {...props} />;
    return <meshStandardMaterial {...props} />;
  }, [object.color, object.materialType, object.metalness, object.roughness, isVertexMode]);

  // Outline/highlight for multi-selected (non-primary) objects
  const SelectionOutline = isSelected && !isPrimary ? (
    <lineSegments renderOrder={10}>
      <edgesGeometry args={[]} />
      <lineBasicMaterial color="#7C3AED" depthTest={false} transparent opacity={0.8} />
    </lineSegments>
  ) : null;

  if (!object.visible) return null;

  const handleMeshClick = (e) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleSelectedObjectId(object.id);
    } else {
      setSelectedObjectId(object.id);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setSelectedObjectId(object.id);
    setEditMode('vertex');
  };

  const handleTransformStart = () => setIsDragging(true);
  const handleTransformEnd = () => {
    setIsDragging(false);
    useStore.getState().saveHistory();
  };

  const meshElement = (
    <mesh
      ref={meshRef}
      position={object.position || [0,0,0]}
      rotation={object.rotation || [0,0,0]}
      scale={object.scale    || [1,1,1]}
      onClick={handleMeshClick}
      onDoubleClick={handleDoubleClick}
      onPointerMissed={() => setSelectedJointIndex(null)}
    >
      {flatVertices.length > 0 && flatIndices.length > 0 && (
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" count={flatVertices.length / 3} array={flatVertices} itemSize={3} />
          <bufferAttribute attach="index"               count={flatIndices.length}       array={flatIndices}  itemSize={1} />
        </bufferGeometry>
      )}
      {Material}
    </mesh>
  );

  // --- Vertex edit mode ---
  if (isVertexMode) {
    return (
      <group>
        {/* The mesh itself (slightly transparent so vertices are visible) */}
        {meshElement}

        {/* Draggable vertex dots + edge wireframe (owned by VertexHandles) */}
        <VertexHandles object={object} />
      </group>
    );
  }

  // --- Object mode: PivotControls when selected ---
  if (isSelected) {
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
          const snapped = getGridSnap([position.x, position.y, position.z], 0.5);
          updateObjectTransform(object.id, snapped, [0,0,0], [1,1,1]);
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
