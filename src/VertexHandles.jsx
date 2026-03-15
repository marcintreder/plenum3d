import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';

const HANDLE_RADIUS = 0.045;
const COLOR_DEFAULT  = '#666666';
const COLOR_HOVER    = '#00e5ff';
const COLOR_SELECTED = '#00e5ff';

const VertexHandles = ({ object }) => {
  const { camera, gl } = useThree();

  const updateVertices          = useStore(s => s.updateVertices);
  const saveHistory             = useStore(s => s.saveHistory);
  const selectedVertexIndices   = useStore(s => s.selectedVertexIndices);
  const setSelectedVertexIndices = useStore(s => s.setSelectedVertexIndices);
  const setOrbitEnabled         = useStore(s => s.setOrbitEnabled);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [marqueeRect, setMarqueeRect]   = useState(null); // {x1,y1,x2,y2} canvas-px

  const dragRef       = useRef(null);
  const vertexHitRef  = useRef(false); // set by vertex pointerdown; checked by bg handler

  // ─── World-space transform ────────────────────────────────────────────────
  const worldMatrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(...(object.position || [0,0,0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(object.rotation || [0,0,0]))),
      new THREE.Vector3(...(object.scale    || [1,1,1]))
    );
    return m;
  }, [object.position, object.rotation, object.scale]);

  const worldMatrixInv = useMemo(() => worldMatrix.clone().invert(), [worldMatrix]);

  const worldVertices = useMemo(() => {
    if (!object.vertices) return [];
    return object.vertices.map(v =>
      new THREE.Vector3(...v).applyMatrix4(worldMatrix)
    );
  }, [object.vertices, worldMatrix]);

  // ─── Coordinate helpers ───────────────────────────────────────────────────
  const mouseToNDC = useCallback((e) => {
    const r = gl.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width)  *  2 - 1,
      ((e.clientY - r.top)  / r.height) * -2 + 1
    );
  }, [gl]);

  const mouseToCanvas = useCallback((e) => {
    const r = gl.domElement.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, [gl]);

  // Project a THREE.Vector3 world pos → canvas pixel coords
  const worldToCanvas = useCallback((wp) => {
    const v = wp.clone().project(camera);
    const r = gl.domElement.getBoundingClientRect();
    return { x: (v.x + 1) / 2 * r.width, y: (1 - v.y) / 2 * r.height };
  }, [camera, gl]);

  // ─── Vertex pointer-down: selection + drag ────────────────────────────────
  const handlePointerDown = useCallback((e, index) => {
    e.stopPropagation();
    vertexHitRef.current = true;

    const isShift = e.shiftKey;
    const current = useStore.getState().selectedVertexIndices;

    if (isShift) {
      // Shift+click: toggle this vertex
      const next = current.includes(index)
        ? current.filter(i => i !== index)
        : [...current, index];
      setSelectedVertexIndices(next);
      return; // no drag on shift+click — just toggle
    }

    // Plain click: keep group if vertex already selected; otherwise select only this one
    const newSelection = current.includes(index) ? current : [index];
    setSelectedVertexIndices(newSelection);

    // Build camera-facing plane through the clicked vertex
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      cameraDir, worldVertices[index]
    );

    // Snapshot start positions of every vertex in the active selection
    const startWorldPos = newSelection.map(i => worldVertices[i].clone());
    const dragStartPos  = worldVertices[index].clone();

    dragRef.current = { index, plane, axisConstraint: null, newSelection, startWorldPos, dragStartPos };
    setOrbitEnabled(false);

    const raycaster = new THREE.Raycaster();

    const onMove = (me) => {
      if (!dragRef.current) return;
      const ndc = mouseToNDC(me);
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(dragRef.current.plane, hit)) return;

      // Axis constraint (X/Y/Z held)
      const c = dragRef.current.axisConstraint;
      if (c) {
        const orig = dragRef.current.dragStartPos;
        if (c === 'x') { hit.y = orig.y; hit.z = orig.z; }
        if (c === 'y') { hit.x = orig.x; hit.z = orig.z; }
        if (c === 'z') { hit.x = orig.x; hit.y = orig.y; }
      }

      const delta = hit.clone().sub(dragRef.current.dragStartPos);

      // Move all selected vertices by the same world-space delta
      const updates = dragRef.current.newSelection.map((vi, i) => {
        const newWorld = dragRef.current.startWorldPos[i].clone().add(delta);
        const local    = newWorld.applyMatrix4(worldMatrixInv);
        return { index: vi, position: [local.x, local.y, local.z] };
      });
      updateVertices(object.id, updates);
    };

    const onKeyDown = (ke) => {
      if (!dragRef.current) return;
      if (['x','y','z'].includes(ke.key)) dragRef.current.axisConstraint = ke.key;
    };
    const onKeyUp = () => {
      if (dragRef.current) dragRef.current.axisConstraint = null;
    };

    const onUp = () => {
      dragRef.current = null;
      setOrbitEnabled(true);
      saveHistory();
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
      document.removeEventListener('keydown',     onKeyDown);
      document.removeEventListener('keyup',       onKeyUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
    document.addEventListener('keydown',     onKeyDown);
    document.addEventListener('keyup',       onKeyUp);
  }, [camera, worldVertices, worldMatrixInv, object.id, mouseToNDC,
      updateVertices, saveHistory, setSelectedVertexIndices, setOrbitEnabled]);

  // ─── Marquee selection: background click on canvas ───────────────────────
  useEffect(() => {
    const el = gl.domElement;

    const onNativeDown = (e) => {
      if (e.button !== 0) return;

      // setTimeout(0) runs after R3F has synchronously processed this event.
      // If a vertex was hit, vertexHitRef.current will be true by then.
      setTimeout(() => {
        if (vertexHitRef.current) { vertexHitRef.current = false; return; }

        // Background click — start marquee
        const start = mouseToCanvas(e);
        let rect = { x1: start.x, y1: start.y, x2: start.x, y2: start.y };
        setMarqueeRect({ ...rect });
        setOrbitEnabled(false);

        const onMove = (me) => {
          const p = mouseToCanvas(me);
          rect = { ...rect, x2: p.x, y2: p.y };
          setMarqueeRect({ ...rect });
        };

        const onUp = (ue) => {
          const dx = rect.x2 - rect.x1;
          const dy = rect.y2 - rect.y1;
          const isDrag = Math.abs(dx) > 4 || Math.abs(dy) > 4;

          if (isDrag) {
            // Find vertices whose screen projections fall inside the rectangle
            const minX = Math.min(rect.x1, rect.x2);
            const maxX = Math.max(rect.x1, rect.x2);
            const minY = Math.min(rect.y1, rect.y2);
            const maxY = Math.max(rect.y1, rect.y2);

            const captured = worldVertices
              .map((wp, i) => ({ i, s: worldToCanvas(wp) }))
              .filter(({ s }) => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY)
              .map(({ i }) => i);

            const current = useStore.getState().selectedVertexIndices;
            if (ue.shiftKey) {
              setSelectedVertexIndices([...new Set([...current, ...captured])]);
            } else {
              setSelectedVertexIndices(captured);
            }
          } else {
            // Plain click on background (no drag) → clear selection
            if (!ue.shiftKey) setSelectedVertexIndices([]);
          }

          setMarqueeRect(null);
          setOrbitEnabled(true);
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup',   onUp);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup',   onUp);
      }, 0);
    };

    el.addEventListener('pointerdown', onNativeDown);
    return () => el.removeEventListener('pointerdown', onNativeDown);
  }, [gl, mouseToCanvas, worldToCanvas, worldVertices, setSelectedVertexIndices, setOrbitEnabled]);

  if (!object.vertices || object.vertices.length === 0) return null;

  const selectedSet  = new Set(selectedVertexIndices);
  const multiSelect  = selectedVertexIndices.length > 1;

  return (
    <group>
      {/* ── Vertex handle dots ── */}
      {worldVertices.map((wp, i) => {
        const isSel     = selectedSet.has(i);
        const isHovered = hoveredIndex === i;
        const color = isSel
          ? (multiSelect ? '#ffffff' : COLOR_SELECTED)
          : isHovered ? COLOR_HOVER : COLOR_DEFAULT;
        const scale = isSel ? 1.6 : isHovered ? 1.3 : 1.0;

        return (
          <mesh
            key={i}
            position={[wp.x, wp.y, wp.z]}
            scale={scale}
            renderOrder={999}
            onPointerDown={(e) => handlePointerDown(e, i)}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredIndex(i);
              gl.domElement.style.cursor = 'crosshair';
            }}
            onPointerOut={() => {
              setHoveredIndex(null);
              gl.domElement.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[HANDLE_RADIUS, 8, 8]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        );
      })}

      {/* ── Marquee rectangle overlay ── */}
      {marqueeRect && (
        <Html fullscreen zIndexRange={[100, 0]}>
          <div
            style={{
              position: 'absolute',
              border: '1px solid #00e5ff',
              background: 'rgba(0,229,255,0.07)',
              left:   Math.min(marqueeRect.x1, marqueeRect.x2),
              top:    Math.min(marqueeRect.y1, marqueeRect.y2),
              width:  Math.abs(marqueeRect.x2 - marqueeRect.x1),
              height: Math.abs(marqueeRect.y2 - marqueeRect.y1),
              pointerEvents: 'none',
            }}
          />
        </Html>
      )}
    </group>
  );
};

export default VertexHandles;
