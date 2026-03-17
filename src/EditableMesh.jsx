import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from './useStore';
import VertexHandles from './VertexHandles';

const EditableMesh = ({ object }) => {
  const meshRef = useRef();
  const geomRef = useRef();
  const { camera, gl } = useThree();

  const isSelected      = useStore(s => s.selectedObjectIds.includes(object.id));
  const isPrimary       = useStore(s => s.selectedObjectId === object.id);
  const editMode        = useStore(s => s.editMode);
  const selectedGroupId = useStore(s => s.selectedGroupId);
  const setEditMode     = useStore(s => s.setEditMode);
  const updateObject    = useStore(s => s.updateObject);
  const setSelectedObjectId    = useStore(s => s.setSelectedObjectId);
  const toggleSelectedObjectId = useStore(s => s.toggleSelectedObjectId);
  const setSelectedJointIndex  = useStore(s => s.setSelectedJointIndex);
  const setOrbitEnabled        = useStore(s => s.setOrbitEnabled);
  const setSelectedGroupId     = useStore(s => s.setSelectedGroupId);
  const batchUpdatePositions   = useStore(s => s.batchUpdatePositions);

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

  // Add selection outline when selected
  const SelectionOutline = () => {
    if (!isSelected) return null;
    return (
      <mesh
        position={object.position || [0, 0, 0]}
        rotation={object.rotation || [0, 0, 0]}
        scale={(object.scale || [1, 1, 1]).map(s => s * 1.02)}
      >
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" count={flatVertices.length / 3} array={flatVertices} itemSize={3} />
          <bufferAttribute attach="index"               count={flatIndices.length}       array={flatIndices}  itemSize={1} />
        </bufferGeometry>
        <meshBasicMaterial color="#06B6D4" wireframe transparent opacity={0.3} depthWrite={false} />
      </mesh>
    );
  };

  const handlePointerDown = useCallback((e) => {
    if (isVertexMode) return;
    e.stopPropagation();
    useStore.getState().setMeshPointerActive(true);

    if (e.shiftKey) {
      toggleSelectedObjectId(object.id);
      return;
    }

    // Always select clicked object as primary (even if it's already in the multi-select set)
    setSelectedObjectId(object.id);

    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const objPos = new THREE.Vector3(...(object.position || [0, 0, 0]));
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir, objPos);

    const rect = gl.domElement.getBoundingClientRect();
    const toNDC = (cx, cy) => new THREE.Vector2(
      ((cx - rect.left) / rect.width)  *  2 - 1,
      ((cy - rect.top)  / rect.height) * -2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(toNDC(e.clientX, e.clientY), camera);
    const hitStart = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hitStart);

    const posStart = [...(object.position || [0, 0, 0])];
    let hasMoved = false;

    // Always treat grouped objects as a group drag (use object.groupId directly
    // rather than the stale selectedGroupId closure value).
    const isGroupDrag = !!object.groupId;
    const groupStartPositions = isGroupDrag
      ? Object.fromEntries(
          useStore.getState().objects
            .filter(o => o.groupId === object.groupId)
            .map(o => [o.id, [...(o.position || [0, 0, 0])]])
        )
      : null;

    setOrbitEnabled(false);

    const onMove = (me) => {
      if (!hasMoved) {
        useStore.getState().saveHistory();
        hasMoved = true;
      }
      raycaster.setFromCamera(toNDC(me.clientX, me.clientY), camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      const d = hit.clone().sub(hitStart);

      if (groupStartPositions) {
        const updates = {};
        for (const [id, start] of Object.entries(groupStartPositions)) {
          updates[id] = [start[0] + d.x, start[1] + d.y, start[2] + d.z];
        }
        batchUpdatePositions(updates);
      } else {
        updateObject(object.id, { position: [posStart[0]+d.x, posStart[1]+d.y, posStart[2]+d.z] });
      }
    };

    const onUp = () => {
      setOrbitEnabled(true);
      useStore.getState().setMeshPointerActive(false);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, [isVertexMode, object, camera, gl, selectedGroupId, toggleSelectedObjectId, setSelectedObjectId, setSelectedGroupId, setOrbitEnabled, updateObject, batchUpdatePositions]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (isPrimary && editMode === 'object') {
      // Already this object selected in object mode → enter vertex edit
      setEditMode('vertex');
    } else {
      // First double-click: drill into group / select this object
      setSelectedObjectId(object.id);
    }
  }, [isPrimary, editMode, setSelectedObjectId, setEditMode, object.id]);

  if (!object.visible) return null;

  return (
    <group>
      <mesh
        ref={meshRef}
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
      {isSelected && <SelectionOutline />}
      {isVertexMode && <VertexHandles object={object} />}
    </group>
  );
};

export default EditableMesh;
