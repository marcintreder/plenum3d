import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from './useStore';

/**
 * VertexHandles — Figma-style vertex editing
 *
 * Renders a draggable dot at every vertex of the selected object when in
 * vertex edit mode.  Dragging a dot moves the vertex along the camera-facing
 * plane (identical feel to dragging a node in Figma — the cursor stays under
 * the dot, movement is never locked to a world axis unless the user holds
 * X/Y/Z).
 */
const HANDLE_RADIUS = 0.045;
const COLOR_DEFAULT = '#888888';
const COLOR_HOVER   = '#00e5ff';
const COLOR_SELECTED = '#ffffff';

const VertexHandles = ({ object }) => {
  const { camera, gl } = useThree();
  const updateVertex   = useStore(s => s.updateVertex);
  const saveHistory    = useStore(s => s.saveHistory);
  const setSelectedJointIndex = useStore(s => s.setSelectedJointIndex);
  const selectedJointIndex    = useStore(s => s.selectedJointIndex);
  const setOrbitEnabled = useStore(s => s.setOrbitEnabled);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const dragRef = useRef(null); // { index, plane, axisConstraint }

  // Build the world-space vertex positions (object has its own position/rotation/scale)
  const worldMatrix = useMemo(() => {
    const m = new THREE.Matrix4();
    const pos = object.position || [0,0,0];
    const rot = object.rotation || [0,0,0];
    const sc  = object.scale    || [1,1,1];
    m.compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
      new THREE.Vector3(...sc)
    );
    return m;
  }, [object.position, object.rotation, object.scale]);

  const worldMatrixInverse = useMemo(() => worldMatrix.clone().invert(), [worldMatrix]);

  const worldVertices = useMemo(() => {
    if (!object.vertices) return [];
    return object.vertices.map(v => {
      const wp = new THREE.Vector3(...v).applyMatrix4(worldMatrix);
      return [wp.x, wp.y, wp.z];
    });
  }, [object.vertices, worldMatrix]);

  // Convert a mouse event to a normalised device coordinate [-1, 1]
  const mouseToNDC = useCallback((e) => {
    const rect = gl.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  *  2 - 1,
      ((e.clientY - rect.top)  / rect.height) * -2 + 1
    );
  }, [gl]);

  const handlePointerDown = useCallback((e, index) => {
    e.stopPropagation();

    // Build a plane facing the camera passing through this vertex
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(
      cameraDir,
      new THREE.Vector3(...worldVertices[index])
    );

    dragRef.current = { index, plane, axisConstraint: null };
    setSelectedJointIndex(index);
    setOrbitEnabled(false);

    const raycaster = new THREE.Raycaster();

    const onMove = (me) => {
      if (!dragRef.current) return;
      const ndc = mouseToNDC(me);
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(dragRef.current.plane, hit)) return;

      // Apply axis constraint if held
      const constraint = dragRef.current.axisConstraint;
      if (constraint) {
        const original = new THREE.Vector3(...worldVertices[dragRef.current.index]);
        if (constraint === 'x') { hit.y = original.y; hit.z = original.z; }
        if (constraint === 'y') { hit.x = original.x; hit.z = original.z; }
        if (constraint === 'z') { hit.x = original.x; hit.y = original.y; }
      }

      // Transform back to object local space
      const local = hit.applyMatrix4(worldMatrixInverse);
      updateVertex(object.id, dragRef.current.index, [local.x, local.y, local.z]);
    };

    const onUp = () => {
      dragRef.current = null;
      setOrbitEnabled(true);
      saveHistory();
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    const onKeyDown = (ke) => {
      if (!dragRef.current) return;
      if (ke.key === 'x') dragRef.current.axisConstraint = 'x';
      if (ke.key === 'y') dragRef.current.axisConstraint = 'y';
      if (ke.key === 'z') dragRef.current.axisConstraint = 'z';
    };
    const onKeyUp = () => {
      if (dragRef.current) dragRef.current.axisConstraint = null;
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    // clean up key listeners when drag ends (onUp fires first)
    const originalOnUp = onUp;
    document.removeEventListener('pointerup', onUp);
    document.addEventListener('pointerup', () => {
      originalOnUp();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    }, { once: true });
  }, [camera, worldVertices, worldMatrixInverse, object.id, mouseToNDC,
      updateVertex, saveHistory, setSelectedJointIndex, setOrbitEnabled]);

  if (!object.vertices || object.vertices.length === 0) return null;

  return (
    <group>
      {worldVertices.map((wp, i) => {
        const isSelected = selectedJointIndex === i;
        const isHovered  = hoveredIndex === i;
        const color  = isSelected ? COLOR_SELECTED : isHovered ? COLOR_HOVER : COLOR_DEFAULT;
        const scale  = isSelected ? 1.6 : isHovered ? 1.3 : 1.0;

        return (
          <mesh
            key={i}
            position={wp}
            scale={scale}
            onPointerDown={(e) => handlePointerDown(e, i)}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredIndex(i); gl.domElement.style.cursor = 'crosshair'; }}
            onPointerOut={() => { setHoveredIndex(null); gl.domElement.style.cursor = 'default'; }}
            renderOrder={999}
          >
            <sphereGeometry args={[HANDLE_RADIUS, 8, 8]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        );
      })}
    </group>
  );
};

export default VertexHandles;
