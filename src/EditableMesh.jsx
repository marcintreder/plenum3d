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
    if (geomRef.current) geomRef.current.computeVertexNormals();
  }, [object.vertices, object.indices]);

  const Material = useMemo(() => {
    const multiSelectGlow = isSelected && !isPrimary;
    const props = {
      color: object.color,
      metalness: object.metalness ?? 0.5,
      roughness: object.roughness ?? 0.5,
      transparent: true,
      opacity: isVertexMode ? 0.6 : 0.9,
      emissive: multiSelectGlow ? '#7C3AED' : '#000000',
      emissiveIntensity: multiSelectGlow ? 0.4 : 0,
    };
    if (object.materialType === 'wireframe') return <meshStandardMaterial {...props} wireframe />;
    if (object.materialType === 'physical')  return <meshPhysicalMaterial  {...props} />;
    return <meshStandardMaterial {...props} />;
  }, [object.color, object.materialType, object.metalness, object.roughness, isVertexMode, isSelected, isPrimary]);

  const handlePointerDown = useCallback((e) => {
    if (isVertexMode) return;
    e.stopPropagation();

    if (e.shiftKey) {
      toggleSelectedObjectId(object.id);
      return;
    }

    // Group-first click: first click on a grouped object selects the whole group
    if (object.groupId && selectedGroupId !== object.groupId) {
      setSelectedGroupId(object.groupId);
      return; // don't start drag on first group click
    }

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

    // For group drag: use the pre-call selectedGroupId (React selector value from current
    // render closure) — NOT useStore.getState().selectedGroupId, which has already been
    // cleared by the synchronous setSelectedObjectId() call above.
    const isGroupDrag = object.groupId && selectedGroupId === object.groupId;
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
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, [isVertexMode, object, camera, gl, selectedGroupId, toggleSelectedObjectId, setSelectedObjectId, setSelectedGroupId, setOrbitEnabled, updateObject, batchUpdatePositions]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setSelectedObjectId(object.id);
    setEditMode('vertex');
  }, [setSelectedObjectId, setEditMode, object.id]);

  if (!object.visible) return null;

  const meshElement = (
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
  );

  if (isVertexMode) {
    return (
      <group>
        {meshElement}
        <VertexHandles object={object} />
      </group>
    );
  }

  return meshElement;
};

export default EditableMesh;
