import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import useStore from './useStore';
import VertexHandles from './VertexHandles';

const EditableMesh = ({ object }) => {
  const meshRef = useRef();
  const geomRef = useRef();
  const { camera, gl } = useThree();

  const isSelected      = useStore(s => s.selectedObjectIds.includes(object.id));
  const isPrimary       = useStore(s => s.selectedObjectId === object.id);
  const editMode        = useStore(s => s.editMode);
  const gridSnap        = useStore(s => s.gridSnap || 0); // 0 = no snap
  const setEditMode     = useStore(s => s.setEditMode);
  const updateObject    = useStore(s => s.updateObject);
  const setSelectedObjectId    = useStore(s => s.setSelectedObjectId);
  const toggleSelectedObjectId = useStore(s => s.toggleSelectedObjectId);
  const setSelectedJointIndex  = useStore(s => s.setSelectedJointIndex);
  const setOrbitEnabled        = useStore(s => s.setOrbitEnabled);
  const saveHistory            = useStore(s => s.saveHistory);
  const updateObjectTransform  = useStore(s => s.updateObjectTransform);

  const isVertexMode = isPrimary && editMode === 'vertex';

  const flatVertices = useMemo(() => {
    if (!object?.vertices?.length) return new Float32Array([]);
    return new Float32Array(object.vertices.flat());
  }, [object.vertices]);

  const flatIndices = useMemo(() => {
    if (!object?.indices?.length) return new Uint32Array([]);
    return new Uint32Array(object.indices);
  }, [object.indices]);

  useEffect(() => {
    if (!geomRef.current) return;
    const pos = geomRef.current.attributes.position;
    if (pos) pos.needsUpdate = true;
    geomRef.current.computeVertexNormals();
  }, [object.vertices, object.indices]);

  const Material = useMemo(() => {
    const multiSelectGlow = isSelected && !isPrimary;
    const props = {
      color: object.color,
      metalness: object.metalness ?? 0.5,
      roughness: object.roughness ?? 0.5,
      transparent: isVertexMode || isSelected,
      opacity: isVertexMode ? 0.6 : 1.0,
      emissive: multiSelectGlow ? '#06B6D4' : '#000000',
      emissiveIntensity: multiSelectGlow ? 0.6 : 0,
    };
    if (object.materialType === 'wireframe') return <meshStandardMaterial {...props} wireframe />;
    if (object.materialType === 'physical')  return <meshPhysicalMaterial  {...props} />;
    return <meshStandardMaterial {...props} />;
  }, [object.color, object.materialType, object.metalness, object.roughness, isVertexMode, isSelected, isPrimary]);

  // State-based ref so TransformControls knows when mesh is in scene
  const [meshObj, setMeshObj] = useState(null);

  const handlePointerDown = useCallback((e) => {
    if (isVertexMode) return;
    e.stopPropagation();
    
    if (e.shiftKey) {
      toggleSelectedObjectId(object.id);
      return;
    }
    setSelectedObjectId(object.id);
  }, [isVertexMode, object, toggleSelectedObjectId, setSelectedObjectId]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (isPrimary && editMode === 'object') {
      setEditMode('vertex');
    } else {
      setSelectedObjectId(object.id);
    }
  }, [isPrimary, editMode, setSelectedObjectId, setEditMode, object.id]);

  if (!object.visible) return null;

  return (
    <>
      <mesh
        ref={(el) => { meshRef.current = el; setMeshObj(el); }}
        position={object.position || [0, 0, 0]}
        rotation={object.rotation || [0, 0, 0]}
        scale={object.scale    || [1, 1, 1]}
        onPointerDown={handlePointerDown}
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
      {isPrimary && editMode === 'object' && meshObj && (
        <TransformControls
          object={meshObj}
          mode="translate"
          snap={gridSnap > 0 ? gridSnap : null}
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={() => setOrbitEnabled(true)}
          onObjectChange={(e) => {
            const o = e.target.object;
            updateObjectTransform(object.id,
              [o.position.x, o.position.y, o.position.z],
              [o.rotation.x, o.rotation.y, o.rotation.z],
              [o.scale.x, o.scale.y, o.scale.z]);
          }}
        />
      )}
      {isVertexMode && <VertexHandles object={object} />}
    </>
  );
};

export default EditableMesh;
