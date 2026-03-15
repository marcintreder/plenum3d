import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';

const HANDLE_RADIUS = 0.045;
const COLOR_DEFAULT  = '#555555';
const COLOR_HOVER    = '#00e5ff';
const COLOR_SELECTED = '#00e5ff';

// ── Pure helper: screen-space distance from point (px,py) to segment (ax,ay)→(bx,by) ──
function ptSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const AXIS_COLOR = { x: '#ff4444', y: '#44ff44', z: '#4488ff' };
const AXIS_EXT   = 20; // world units, extends ±AXIS_EXT from dragged vertex

const VertexHandles = ({ object }) => {
  const { camera, gl } = useThree();

  const updateVertices           = useStore(s => s.updateVertices);
  const saveHistory              = useStore(s => s.saveHistory);
  const selectedVertexIndices    = useStore(s => s.selectedVertexIndices);
  const setSelectedVertexIndices = useStore(s => s.setSelectedVertexIndices);
  const setOrbitEnabled          = useStore(s => s.setOrbitEnabled);

  const [hoveredIndex,       setHoveredIndex]       = useState(null);
  const [hoveredEdge,        setHoveredEdge]         = useState(null);  // [v1,v2]
  const [marqueeRect,        setMarqueeRect]         = useState(null);
  const [axisConstraint,     setAxisConstraint]      = useState(null);  // 'x'|'y'|'z'|null
  const [draggedVertexIndex, setDraggedVertexIndex]  = useState(null);

  const dragRef        = useRef(null);
  const vertexHitRef   = useRef(false);
  const hoveredIdxRef  = useRef(null);  // mirrors hoveredIndex for non-reactive callbacks
  const hoveredEdgeRef = useRef(null);  // mirrors hoveredEdge for non-reactive callbacks

  // ── World transform ────────────────────────────────────────────────────────
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
    return object.vertices.map(v => new THREE.Vector3(...v).applyMatrix4(worldMatrix));
  }, [object.vertices, worldMatrix]);

  // ── Unique edges derived from triangle indices ──────────────────────────────
  const edges = useMemo(() => {
    if (!object.indices?.length) return [];
    const seen = new Set();
    const result = [];
    for (let i = 0; i < object.indices.length; i += 3) {
      const a = object.indices[i], b = object.indices[i+1], c = object.indices[i+2];
      for (const [v1, v2] of [[a,b],[b,c],[a,c]]) {
        const key = `${Math.min(v1,v2)}_${Math.max(v1,v2)}`;
        if (!seen.has(key)) { seen.add(key); result.push([v1, v2]); }
      }
    }
    return result;
  }, [object.indices]);

  // ── Edge line positions (for dim background wireframe) ─────────────────────
  const allEdgePositions = useMemo(() => {
    if (!edges.length || !worldVertices.length) return new Float32Array(0);
    const arr = new Float32Array(edges.length * 6);
    edges.forEach(([v1, v2], i) => {
      const p1 = worldVertices[v1], p2 = worldVertices[v2];
      if (!p1 || !p2) return;
      arr[i*6]   = p1.x; arr[i*6+1] = p1.y; arr[i*6+2] = p1.z;
      arr[i*6+3] = p2.x; arr[i*6+4] = p2.y; arr[i*6+5] = p2.z;
    });
    return arr;
  }, [edges, worldVertices]);

  // ── Hovered edge highlight positions ──────────────────────────────────────
  const hoveredEdgePositions = useMemo(() => {
    if (!hoveredEdge) return null;
    const [v1, v2] = hoveredEdge;
    const p1 = worldVertices[v1], p2 = worldVertices[v2];
    if (!p1 || !p2) return null;
    return new Float32Array([p1.x,p1.y,p1.z, p2.x,p2.y,p2.z]);
  }, [hoveredEdge, worldVertices]);

  // ── Coordinate helpers ─────────────────────────────────────────────────────
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

  const worldToCanvas = useCallback((wp) => {
    const v = wp.clone().project(camera);
    const r = gl.domElement.getBoundingClientRect();
    return { x: (v.x + 1) / 2 * r.width, y: (1 - v.y) / 2 * r.height };
  }, [camera, gl]);

  // ── Edge hover detection (mousemove) ──────────────────────────────────────
  useEffect(() => {
    const el = gl.domElement;
    const onMouseMove = (e) => {
      if (dragRef.current) return;
      if (hoveredIdxRef.current !== null) {
        // vertex handle is hovered — suppress edge hover
        if (hoveredEdgeRef.current !== null) { hoveredEdgeRef.current = null; setHoveredEdge(null); }
        return;
      }
      const cp = mouseToCanvas(e);
      let nearest = null, nearestDist = 8; // px threshold
      for (const [v1, v2] of edges) {
        const p1 = worldVertices[v1], p2 = worldVertices[v2];
        if (!p1 || !p2) continue;
        const s1 = worldToCanvas(p1), s2 = worldToCanvas(p2);
        const d = ptSegDist(cp.x, cp.y, s1.x, s1.y, s2.x, s2.y);
        if (d < nearestDist) { nearestDist = d; nearest = [v1, v2]; }
      }
      const same = nearest?.[0] === hoveredEdgeRef.current?.[0]
                && nearest?.[1] === hoveredEdgeRef.current?.[1];
      if (!same) {
        hoveredEdgeRef.current = nearest;
        setHoveredEdge(nearest ? [...nearest] : null);
        el.style.cursor = nearest ? 'pointer' : 'default';
      }
    };
    el.addEventListener('mousemove', onMouseMove);
    return () => el.removeEventListener('mousemove', onMouseMove);
  }, [gl, edges, worldVertices, mouseToCanvas, worldToCanvas]);

  // ── Vertex pointer-down: selection + drag ─────────────────────────────────
  const handlePointerDown = useCallback((e, index) => {
    e.stopPropagation();
    vertexHitRef.current = true;

    const isShift = e.shiftKey;
    const current = useStore.getState().selectedVertexIndices;

    if (isShift) {
      const next = current.includes(index)
        ? current.filter(i => i !== index)
        : [...current, index];
      setSelectedVertexIndices(next);
      return;
    }

    const newSelection = current.includes(index) ? current : [index];
    setSelectedVertexIndices(newSelection);
    setDraggedVertexIndex(index);

    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir, worldVertices[index]);
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

      const c = dragRef.current.axisConstraint;
      if (c) {
        const orig = dragRef.current.dragStartPos;
        if (c === 'x') { hit.y = orig.y; hit.z = orig.z; }
        if (c === 'y') { hit.x = orig.x; hit.z = orig.z; }
        if (c === 'z') { hit.x = orig.x; hit.y = orig.y; }
      }

      const delta = hit.clone().sub(dragRef.current.dragStartPos);
      const updates = dragRef.current.newSelection.map((vi, i) => {
        const newWorld = dragRef.current.startWorldPos[i].clone().add(delta);
        const local    = newWorld.applyMatrix4(worldMatrixInv);
        return { index: vi, position: [local.x, local.y, local.z] };
      });
      updateVertices(object.id, updates);
    };

    const onKeyDown = (ke) => {
      if (!dragRef.current) return;
      if (['x','y','z'].includes(ke.key)) {
        dragRef.current.axisConstraint = ke.key;
        setAxisConstraint(ke.key);
      }
    };
    const onKeyUp = () => {
      if (dragRef.current) { dragRef.current.axisConstraint = null; setAxisConstraint(null); }
    };
    const onUp = () => {
      dragRef.current = null;
      setOrbitEnabled(true);
      setAxisConstraint(null);
      setDraggedVertexIndex(null);
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

  // ── Background click: edge select or marquee ──────────────────────────────
  useEffect(() => {
    const el = gl.domElement;
    const onNativeDown = (e) => {
      if (e.button !== 0) return;
      setTimeout(() => {
        if (vertexHitRef.current) { vertexHitRef.current = false; return; }

        // Edge was hovered → click selects both endpoints
        const edge = hoveredEdgeRef.current;
        if (edge) {
          const current = useStore.getState().selectedVertexIndices;
          setSelectedVertexIndices(
            e.shiftKey ? [...new Set([...current, ...edge])] : [...edge]
          );
          return;
        }

        // True background click — start marquee
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
          const dx = rect.x2 - rect.x1, dy = rect.y2 - rect.y1;
          const isDrag = Math.abs(dx) > 4 || Math.abs(dy) > 4;

          if (isDrag) {
            const minX = Math.min(rect.x1, rect.x2), maxX = Math.max(rect.x1, rect.x2);
            const minY = Math.min(rect.y1, rect.y2), maxY = Math.max(rect.y1, rect.y2);
            const captured = worldVertices
              .map((wp, i) => ({ i, s: worldToCanvas(wp) }))
              .filter(({ s }) => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY)
              .map(({ i }) => i);
            const current = useStore.getState().selectedVertexIndices;
            setSelectedVertexIndices(
              ue.shiftKey ? [...new Set([...current, ...captured])] : captured
            );
          } else if (!ue.shiftKey) {
            setSelectedVertexIndices([]);
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

  if (!object.vertices || !object.vertices.length) return null;

  const selectedSet = new Set(selectedVertexIndices);
  const multiSelect = selectedVertexIndices.length > 1;

  // Axis constraint line: passes through the dragged vertex along the constrained axis
  const axisLine = axisConstraint && draggedVertexIndex !== null && worldVertices[draggedVertexIndex]
    ? (() => {
        const c = worldVertices[draggedVertexIndex];
        const dx = axisConstraint === 'x' ? AXIS_EXT : 0;
        const dy = axisConstraint === 'y' ? AXIS_EXT : 0;
        const dz = axisConstraint === 'z' ? AXIS_EXT : 0;
        return {
          positions: new Float32Array([c.x-dx, c.y-dy, c.z-dz, c.x+dx, c.y+dy, c.z+dz]),
          color: AXIS_COLOR[axisConstraint],
        };
      })()
    : null;

  return (
    <group>

      {/* ── Dim edge wireframe (all edges) ── */}
      {allEdgePositions.length > 0 && (
        <lineSegments renderOrder={1}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={allEdgePositions.length / 3}
              array={allEdgePositions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color="#00e5ff" transparent opacity={0.2} depthTest={false} />
        </lineSegments>
      )}

      {/* ── Hovered edge highlight ── */}
      {hoveredEdgePositions && (
        <lineSegments renderOrder={2}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={2}
              array={hoveredEdgePositions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color="#00e5ff" transparent opacity={0.9} depthTest={false} />
        </lineSegments>
      )}

      {/* ── Axis constraint line ── */}
      {axisLine && (
        <lineSegments renderOrder={3}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={2}
              array={axisLine.positions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={axisLine.color} depthTest={false} />
        </lineSegments>
      )}

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
              hoveredIdxRef.current = i;
              setHoveredIndex(i);
              gl.domElement.style.cursor = 'crosshair';
            }}
            onPointerOut={() => {
              hoveredIdxRef.current = null;
              setHoveredIndex(null);
              gl.domElement.style.cursor = hoveredEdgeRef.current ? 'pointer' : 'default';
            }}
          >
            <sphereGeometry args={[HANDLE_RADIUS, 8, 8]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        );
      })}

      {/* ── Marquee selection rectangle ── */}
      {marqueeRect && (
        <Html fullscreen zIndexRange={[100, 0]}>
          <div style={{
            position: 'absolute',
            border: '1px solid #00e5ff',
            background: 'rgba(0,229,255,0.07)',
            left:   Math.min(marqueeRect.x1, marqueeRect.x2),
            top:    Math.min(marqueeRect.y1, marqueeRect.y2),
            width:  Math.abs(marqueeRect.x2 - marqueeRect.x1),
            height: Math.abs(marqueeRect.y2 - marqueeRect.y1),
            pointerEvents: 'none',
          }} />
        </Html>
      )}
    </group>
  );
};

export default VertexHandles;
