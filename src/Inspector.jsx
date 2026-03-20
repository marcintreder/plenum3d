import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Layers, Eye, EyeOff, Trash2, Crosshair, Move, Scissors, Sliders,
  Camera, Sparkles, Triangle, ChevronRight, ChevronDown, Users, Link2, Unlink2,
  Image as ImageIcon
} from 'lucide-react';
import useStore from './useStore';
import TexturePanel from './components/TexturePanel';
import { performCSG } from './utils/CSGProcessor';
import { detectFaces } from './utils/MeshAnalysis';

const Inspector = ({ onScreenshot }) => {
  const {
    objects,
    groups,
    selectedObjectId,
    selectedObjectIds,
    selectedGroupId,
    setSelectedObjectId,
    setSelectedGroupId,
    updateObject,
    updateSelectedObjects,
    updateVertices,
    deleteObject,
    selectedJointIndex,
    selectedVertexIndices,
    setSelectedVertexIndices,
    updateVertex,
    editMode,
    setEditMode,
    saveHistory,
    setGeometry,
    applyBevel,
    dissolveVertex,
    scaleUniform,
    scaleGroup,
    removeGroup,
    toggleSelectedObjectId,
    selectSimilar,
    smoothObject,
    smoothSelectedVertices,
    addGroup,
    setObjectGroup,
  } = useStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const handleNameClick = () => {
    if (selectedObject) {
      setRenameValue(selectedObject.name);
      setIsRenaming(true);
    }
  };

  const handleNameSave = () => {
    if (selectedObject) {
      saveHistory();
      updateObject(selectedObject.id, { name: renameValue });
    }
    setIsRenaming(false);
  };


  const [isOrtho, setIsOrtho] = useState(false);
  const [deltaValues, setDeltaValues] = useState({ 0: '', 1: '', 2: '' });
  const [bevelAmount, setBevelAmount] = useState(0.2);
  const [smoothIterations, setSmoothIterations] = useState(2);
  const [smoothFactor, setSmoothFactor] = useState(0.5);
  const [uniformScalePct, setUniformScalePct] = useState('');
  const [groupScalePct, setGroupScalePct] = useState(100);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, items:[{label,action,danger}] }
  const ctxRef = useRef(null);
  // Snapshot taken at drag start — ensures each slider value maps to an absolute result
  const groupSnapRef = useRef(null);

  // Reset slider + clear snapshot when selected group changes
  useEffect(() => {
    setGroupScalePct(100);
    groupSnapRef.current = null;
  }, [selectedGroupId]);

  // Take snapshot of all group vertices + positions at drag start, compute world centroid
  const handleGroupScaleStart = () => {
    if (!currentGroup) return;
    saveHistory();
    const groupObjs = useStore.getState().objects.filter(o => o.groupId === currentGroup.id);
    let cx = 0, cy = 0, cz = 0, n = 0;
    for (const o of groupObjs) {
      const p = o.position || [0, 0, 0];
      for (const v of (o.vertices || [])) { cx += p[0]+v[0]; cy += p[1]+v[1]; cz += p[2]+v[2]; n++; }
    }
    if (n > 0) { cx /= n; cy /= n; cz /= n; }
    groupSnapRef.current = {
      centroid: [cx, cy, cz],
      objects: groupObjs.map(o => ({
        id: o.id,
        position: [...(o.position || [0, 0, 0])],
        vertices: o.vertices.map(v => [...v]),
      })),
    };
    setGroupScalePct(100);
  };

  // Apply absolute scale from snapshot — no incremental drift
  const applyGroupScale = (pct) => {
    const snap = groupSnapRef.current;
    if (!snap) return;
    const f = pct / 100;
    const [cx, cy, cz] = snap.centroid;
    for (const { id, position, vertices } of snap.objects) {
      useStore.getState().updateObject(id, {
        position: [
          cx + (position[0] - cx) * f,
          cy + (position[1] - cy) * f,
          cz + (position[2] - cz) * f,
        ],
        vertices: vertices.map(v => [v[0] * f, v[1] * f, v[2] * f]),
      });
    }
    setGroupScalePct(pct);
  };

  // Close context menu on any outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [ctxMenu]);

  const showCtx = (e, items) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  const multiObjectSelected = selectedObjectIds.length > 1;
  const selectedObject = objects.find(o => o?.id === selectedObjectId);
  const selectedJoint  = selectedObject && selectedJointIndex !== null
    ? selectedObject.vertices?.[selectedJointIndex]
    : null;
  const multiSelected  = selectedVertexIndices.length > 1;

  const currentGroup = selectedGroupId
    ? groups.find(g => g.id === selectedGroupId)
    : selectedObject?.groupId
      ? groups.find(g => g.id === selectedObject.groupId)
      : null;

  const faces = useMemo(() => {
    if (!selectedObject?.vertices?.length || !selectedObject?.indices?.length) return [];
    if (selectedObject.vertices.length > 300) return [];
    return detectFaces(selectedObject.vertices, selectedObject.indices);
  }, [selectedObject?.id, selectedObject?.indices]);

  const handleVertexChange = (axis, value) => {
    if (!selectedObject || selectedJointIndex === null) return;
    const newPos = [...selectedObject.vertices[selectedJointIndex]];
    newPos[axis] = parseFloat(value) || 0;
    updateVertex(selectedObject.id, selectedJointIndex, newPos);
  };

  const handleTransformChange = (type, axis, value) => {
    if (!selectedObject) return;
    const current = [...(selectedObject[type] || (type === 'scale' ? [1,1,1] : [0,0,0]))];
    current[axis] = parseFloat(value) || 0;
    updateObject(selectedObject.id, { [type]: current });
  };

  const handleDeltaMove = (axisIdx, value) => {
    const delta = parseFloat(value);
    if (isNaN(delta) || !selectedObject || selectedVertexIndices.length === 0) return;
    const updates = selectedVertexIndices.map(vi => {
      const newPos = [...selectedObject.vertices[vi]];
      newPos[axisIdx] += delta;
      return { index: vi, position: newPos };
    });
    updateVertices(selectedObject.id, updates);
    saveHistory();
    setDeltaValues(prev => ({ ...prev, [axisIdx]: '' }));
  };

  const handleFaceSelect = (face) => {
    setSelectedVertexIndices(face.vertexIndices);
    if (editMode !== 'vertex') setEditMode('vertex');
  };

  const handleApplyUniformScale = () => {
    const pct = parseFloat(uniformScalePct);
    if (isNaN(pct) || !selectedObject) return;
    saveHistory();
    scaleUniform(selectedObject.id, 1 + pct / 100);
    setUniformScalePct('');
  };

  const handleCSG = (op) => {
    const sibling = objects.find(o => o.id !== selectedObjectId);
    if (!selectedObject || !sibling) return;
    try {
      const result = performCSG(selectedObject, sibling, op);
      setGeometry({ ...selectedObject, geometry: result.geometry, material: result.material });
    } catch (e) {
      console.error('CSG failed:', e);
    }
  };

  const toggleGroupCollapse = (gid) =>
    setCollapsedGroups(prev => ({ ...prev, [gid]: !prev[gid] }));

  // ── Build scene graph: groups then ungrouped ──────────────────────────────
  const sceneItems = useMemo(() => {
    const items = [];
    const groupedIds = new Set();

    for (const g of groups) {
      const members = objects.filter(o => o.groupId === g.id);
      if (!members.length) continue;
      groupedIds.add(g.id);
      items.push({ type: 'group', group: g, members });
      if (!collapsedGroups[g.id]) {
        members.forEach(o => items.push({ type: 'object', obj: o, indented: true }));
      }
    }

    objects.filter(o => !o.groupId).forEach(o => items.push({ type: 'object', obj: o, indented: false }));
    return items;
  }, [objects, groups, collapsedGroups]);

  return (
    <div className="w-80 bg-[#1A1A1A] border-l border-[#333] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#333] bg-[#151515] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-[#7C3AED]" />
          <span className="text-[10px] uppercase tracking-widest text-white font-black">Properties</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onScreenshot}
            className="text-gray-600 hover:text-[#7C3AED] transition-colors"
            title="Take Project Thumbnail"
          >
            <ImageIcon size={12} />
          </button>
          <button
            onClick={() => setIsOrtho(!isOrtho)}
            className={`p-1.5 rounded transition-all ${isOrtho ? 'text-[#06B6D4]' : 'text-gray-600 hover:text-white'}`}
            title="Toggle Orthographic Camera"
          >
            <Camera size={12} />
          </button>
          {setEditMode && (
            <div className="flex bg-[#0F0F0F] rounded-lg p-1 border border-[#333]">
              <button
                onClick={() => setEditMode('object')}
                className={`px-2 py-1 rounded-md transition-all text-[9px] font-bold flex items-center gap-1 ${editMode === 'object' ? 'bg-[#7C3AED] text-white' : 'text-gray-600 hover:text-white'}`}
                title="Object Mode"
              >
                <Move size={10} /> Object
              </button>
              <button
                onClick={() => setEditMode('vertex')}
                className={`px-2 py-1 rounded-md transition-all text-[9px] font-bold flex items-center gap-1 ${editMode === 'vertex' ? 'bg-[#06B6D4] text-white' : 'text-gray-600 hover:text-white'}`}
                title="Vertex Edit — double-click mesh or press J"
              >
                <Scissors size={10} /> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scene Graph with groups */}
      <div className="flex-[0.45] flex flex-col border-b border-[#333] min-h-[160px] max-h-[320px]">
        <div className="px-4 py-2 bg-[#1A1A1A] flex items-center justify-between border-b border-[#333]">
          <span className="text-[9px] uppercase tracking-tighter text-gray-500 font-bold">Scene Graph</span>
          <span className="text-[9px] text-gray-700 font-mono" title="⌘/Ctrl+click to multi-select · right-click for options">{objects.length} obj · {groups.length} grp</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 bg-[#121212]">
          {sceneItems.map((item) => {
            if (item.type === 'group') {
              const { group, members } = item;
              const isGroupSel = selectedGroupId === group.id;
              const isCollapsed = collapsedGroups[group.id];
              return (
                <div
                  key={group.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all group/row ${isGroupSel ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/30' : 'hover:bg-[#1E1E1E] border border-transparent'}`}
                  onClick={() => setSelectedGroupId(group.id)}
                  onContextMenu={(e) => showCtx(e, [
                    { label: 'Ungroup (keep objects)', action: () => { saveHistory(); removeGroup(group.id); } },
                    { label: 'Delete group + contents', danger: true, action: () => {
                      saveHistory();
                      objects.filter(o => o.groupId === group.id).forEach(o => deleteObject(o.id));
                      removeGroup(group.id);
                    }},
                  ])}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleGroupCollapse(group.id); }} className="text-gray-600 hover:text-white flex-shrink-0">
                      {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                    </button>
                    <Users size={9} className={isGroupSel ? 'text-[#7C3AED]' : 'text-gray-600'} />
                    <span className={`text-[10px] font-bold truncate ${isGroupSel ? 'text-[#7C3AED]' : 'text-gray-400'}`}>{group.name}</span>
                    <span className="text-[8px] text-gray-700 font-mono flex-shrink-0">{members.length}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); saveHistory(); objects.filter(o => o.groupId === group.id).forEach(o => deleteObject(o.id)); removeGroup(group.id); }}
                    className="opacity-0 group-hover/row:opacity-100 text-gray-600 hover:text-red-500 transition-opacity flex-shrink-0"
                    title="Delete group and all contents"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              );
            }

            const { obj, indented } = item;
            const isObjSel = selectedObjectId === obj.id;
            const isMultiSel = selectedObjectIds.includes(obj.id);
            return (
              <div
                key={obj.id}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) {
                    toggleSelectedObjectId(obj.id);
                  } else {
                    setSelectedObjectId(obj.id);
                  }
                }}
                onContextMenu={(e) => {
                  const ctxItems = [];
                  if (selectedObjectIds.length > 1 && selectedObjectIds.includes(obj.id)) {
                    ctxItems.push({ label: `Group ${selectedObjectIds.length} selected…`, action: () => {
                      const name = prompt('Group name:');
                      if (!name) return;
                      saveHistory();
                      const gid = addGroup(name);
                      selectedObjectIds.forEach(id => setObjectGroup(id, gid));
                    }});
                  }
                  if (obj.groupId) {
                    ctxItems.push({ label: 'Remove from group', action: () => { saveHistory(); setObjectGroup(obj.id, null); } });
                  }
                  ctxItems.push({ label: 'Delete', danger: true, action: () => deleteObject(obj.id) });
                  showCtx(e, ctxItems);
                }}
                className={`group/row flex items-center justify-between py-1.5 rounded-lg cursor-pointer transition-all ${
                  indented ? 'pl-6 pr-2' : 'px-2'
                } ${isObjSel ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/30' : isMultiSel ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/20' : 'hover:bg-[#222] border border-transparent'}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); saveHistory(); updateObject(obj.id, { visible: !obj.visible }); }}
                    className="text-gray-600 hover:text-white flex-shrink-0"
                  >
                    {obj.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                  </button>
                  <span className={`text-[10px] font-medium truncate ${isObjSel || isMultiSel ? 'text-white' : 'text-gray-500'}`}>
                    {obj.name}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }}
                  className="opacity-0 group-hover/row:opacity-100 text-gray-600 hover:text-red-500 transition-opacity flex-shrink-0"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5 select-text">

        {/* ── Group panel — only when the group itself is selected, not an individual object inside it ── */}
        {selectedGroupId && currentGroup && (
          <section className="space-y-3 pb-4 border-b border-[#333]">
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-[#7C3AED] uppercase font-black tracking-widest flex items-center gap-1">
                <Users size={9} /> {currentGroup.name}
              </div>
              <button
                onClick={() => { saveHistory(); removeGroup(currentGroup.id); }}
                className="flex items-center gap-1 text-[8px] text-gray-600 hover:text-red-400 transition-colors"
                title="Ungroup"
              >
                <Unlink2 size={9} /> Ungroup
              </button>
            </div>
            <p className="text-[8px] text-gray-600">
              {objects.filter(o => o.groupId === currentGroup.id).length} parts
            </p>

            {/* Group scale — live slider anchored to a snapshot so values are absolute */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-gray-500 uppercase font-bold">Scale Group</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="10" max="300" step="1"
                    value={groupScalePct}
                    onFocus={handleGroupScaleStart}
                    onChange={e => applyGroupScale(Math.max(10, Math.min(300, parseInt(e.target.value) || 100)))}
                    className="w-14 bg-[#0F0F0F] border border-[#7C3AED]/30 focus:border-[#7C3AED] p-1 rounded text-[10px] outline-none font-mono text-[#7C3AED] text-center"
                  />
                  <span className="text-[9px] text-gray-600">%</span>
                </div>
              </div>
              <input
                type="range" min="10" max="300" step="1"
                value={groupScalePct}
                onMouseDown={handleGroupScaleStart}
                onChange={e => applyGroupScale(parseInt(e.target.value))}
                className="w-full accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[8px] text-gray-700">
                <span>10%</span><span>100%</span><span>300%</span>
              </div>
            </div>
          </section>
        )}

        {/* ── Multi-object selection controls ──────────────────────────────── */}
        {multiObjectSelected && (
          <section className="space-y-3 pb-4 border-b border-[#333]">
            <div className="text-[9px] text-[#7C3AED] uppercase font-bold tracking-widest">
              {selectedObjectIds.length} Objects Selected
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <div key={axis} className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600">{axis}</span>
                  <input
                    type="number" step="0.1" placeholder="—"
                    className="w-full bg-[#0F0F0F] border border-[#333] pl-5 pr-1 py-1.5 rounded text-[10px] outline-none focus:border-[#7C3AED] font-mono"
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) {
                        selectedObjectIds.forEach(id => {
                          const obj = objects.find(o => o.id === id);
                          if (obj) {
                            const s = [...(obj.scale || [1,1,1])];
                            s[i] = v;
                            updateObject(id, { scale: s });
                          }
                        });
                        saveHistory();
                      }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  />
                </div>
              ))}
            </div>
            <label className="text-[9px] text-gray-500 uppercase font-bold">Color</label>
            <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg">
              <input
                type="color"
                defaultValue="#7C3AED"
                onMouseDown={() => saveHistory()}
                onChange={(e) => { selectedObjectIds.forEach(id => updateObject(id, { color: e.target.value })); }}
                className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"
              />
              <span className="text-[9px] text-gray-500">Apply to all selected</span>
            </div>
          </section>
        )}

        {selectedObject ? (
          <>
            <section className="space-y-4">
              {/* Name + Select Similar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Name</label>
                  <button
                    onClick={() => selectSimilar(selectedObject.id)}
                    className="flex items-center gap-1 text-[8px] text-gray-500 hover:text-[#7C3AED] transition-colors"
                    title="Select all similar objects"
                  >
                    <Users size={9} /> Select Similar
                  </button>
                </div>
                {isRenaming ? (
                  <input
                    autoFocus
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave();
                      if (e.key === 'Escape') setIsRenaming(false);
                    }}
                    className="w-full bg-[#0F0F0F] border border-[#7C3AED] p-2 rounded-lg text-xs outline-none text-white transition-colors"
                  />
                ) : (
                  <div
                    onClick={handleNameClick}
                    className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-xs text-white cursor-pointer hover:border-[#555] transition-colors"
                    title="Click to rename"
                  >
                    {selectedObject.name}
                  </div>
                )}
              </div>

              {/* Group assignment */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedObject.groupId || ''}
                  onChange={(e) => {
                    const gid = e.target.value;
                    saveHistory();
                    if (gid) {
                      setObjectGroup(selectedObject.id, gid);
                    } else {
                      setObjectGroup(selectedObject.id, null);
                    }
                  }}
                  className="flex-1 bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg text-[10px] outline-none appearance-none cursor-pointer text-gray-400 focus:border-[#7C3AED]"
                >
                  <option value="">No group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const name = prompt('New group name:');
                    if (!name) return;
                    const gid = addGroup(name);
                    setObjectGroup(selectedObject.id, gid);
                    saveHistory();
                  }}
                  className="p-1.5 bg-[#0F0F0F] border border-[#333] hover:border-[#7C3AED] rounded text-gray-500 hover:text-white transition-all"
                  title="Create new group"
                >
                  <Link2 size={10} />
                </button>
              </div>

              {/* Uniform scale % */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-500 uppercase font-bold">Scale Uniform %</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="-50 = half · +100 = double"
                    value={uniformScalePct}
                    onChange={e => setUniformScalePct(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleApplyUniformScale(); }}
                    className="flex-1 bg-[#0F0F0F] border border-[#333] focus:border-[#7C3AED] p-1.5 rounded text-[10px] outline-none font-mono text-white"
                  />
                  <button
                    onClick={handleApplyUniformScale}
                    className="bg-[#0F0F0F] border border-[#333] hover:border-[#7C3AED] hover:text-white text-gray-500 px-3 rounded text-[10px] font-bold transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Transform Inputs */}
              <div className="space-y-3 pt-1">
                {['position', 'rotation', 'scale'].map((type) => (
                  <div key={type} className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">{type}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600 font-bold">{axis}</span>
                          <input
                            type="number"
                            step="0.1"
                            value={(selectedObject[type] || (type === 'scale' ? [1,1,1] : [0,0,0]))[i].toFixed(2)}
                            onChange={(e) => handleTransformChange(type, i, e.target.value)}
                            onBlur={() => saveHistory()}
                            className="w-full bg-[#0F0F0F] border border-[#333] pl-5 pr-1 py-1.5 rounded text-[10px] outline-none focus:border-[#7C3AED] font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Color + Material */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold">Color</label>
                  <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg">
                    <input
                      type="color"
                      value={selectedObject.color}
                      onMouseDown={() => saveHistory()}
                      onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                      className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"
                    />
                    <span className="text-[9px] font-mono text-gray-400 uppercase">{selectedObject.color}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold">Material</label>
                  <select
                    value={selectedObject.materialType || 'standard'}
                    onMouseDown={() => saveHistory()}
                    onChange={(e) => updateObject(selectedObject.id, { materialType: e.target.value })}
                    className="w-full bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg text-[10px] outline-none appearance-none cursor-pointer text-gray-300"
                  >
                    <option value="standard">Standard</option>
                    <option value="physical">Physical</option>
                    <option value="wireframe">Wireframe</option>
                  </select>
                </div>
              </div>

              {/* Smooth / Roundness */}
              <div className="pt-1 space-y-3 border-t border-[#333]">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Sparkles size={9} /> Smooth / Roundness
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-gray-600 w-16">Iterations</span>
                    <input
                      type="range" min="1" max="10" step="1"
                      value={smoothIterations}
                      onChange={e => setSmoothIterations(parseInt(e.target.value))}
                      className="flex-1 accent-[#7C3AED]"
                    />
                    <span className="text-[9px] font-mono text-gray-400 w-4 text-right">{smoothIterations}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-gray-600 w-16">Strength</span>
                    <input
                      type="range" min="0.1" max="1.0" step="0.05"
                      value={smoothFactor}
                      onChange={e => setSmoothFactor(parseFloat(e.target.value))}
                      className="flex-1 accent-[#7C3AED]"
                    />
                    <span className="text-[9px] font-mono text-gray-400 w-8 text-right">{smoothFactor.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { saveHistory(); smoothObject(selectedObject.id, smoothIterations, smoothFactor); }}
                    className="flex-1 bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-[10px] text-gray-400 hover:border-[#7C3AED] hover:text-white transition-all"
                  >
                    Smooth All
                  </button>
                  {editMode === 'vertex' && selectedVertexIndices.length > 0 && (
                    <button
                      onClick={() => {
                        saveHistory();
                        smoothSelectedVertices(selectedObject.id, selectedVertexIndices, smoothIterations, smoothFactor);
                      }}
                      className="flex-1 bg-[#0F0F0F] border border-[#06B6D4]/30 p-2 rounded-lg text-[10px] text-[#06B6D4] hover:border-[#06B6D4] transition-all"
                    >
                      Smooth {selectedVertexIndices.length} verts
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Surface List */}
            {faces.length > 0 && faces.length <= 32 && (
              <div className="space-y-2 pt-1 border-t border-[#333]">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Triangle size={9} /> Surfaces ({faces.length})
                </label>
                <p className="text-[8px] text-gray-600 italic">Click to select vertices of a surface</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {faces.map((face, fi) => {
                    const isActive = face.vertexIndices.length === selectedVertexIndices.length
                      && face.vertexIndices.every(vi => selectedVertexIndices.includes(vi));
                    return (
                      <button
                        key={face.id}
                        onClick={() => handleFaceSelect(face)}
                        className={`w-full text-left px-2 py-1.5 rounded text-[9px] transition-all border ${
                          isActive
                            ? 'bg-[#06B6D4]/20 border-[#06B6D4]/40 text-[#06B6D4]'
                            : 'bg-[#0F0F0F] border-[#222] text-gray-400 hover:border-[#444] hover:text-white'
                        }`}
                      >
                        Surface {fi + 1}
                        <span className="ml-2 text-gray-600 font-mono">{face.vertexIndices.length}v</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vertex Edit Controls */}
            {editMode === 'vertex' && (
              <div className="space-y-4 pt-4 border-t border-[#333]">
                <div className="text-[10px] uppercase tracking-widest text-[#06B6D4] font-black flex items-center gap-2">
                  <Crosshair size={12} /> Vertex Edit
                </div>

                {selectedJoint ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] text-gray-400 font-mono bg-[#333]/30 px-2 py-0.5 rounded">
                        {multiSelected ? `${selectedVertexIndices.length} vertices` : `Vertex #${selectedJointIndex}`}
                      </div>
                      <button
                        onClick={() => setSelectedVertexIndices([])}
                        className="text-[9px] text-[#06B6D4] hover:underline"
                      >
                        Deselect
                      </button>
                    </div>

                    {multiSelected ? (
                      <div className="space-y-2">
                        <p className="text-[9px] text-gray-500">Move all {selectedVertexIndices.length} vertices by delta:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {['X', 'Y', 'Z'].map((axis, i) => (
                            <div key={axis} className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-[#06B6D4] font-bold">{axis}</span>
                              <input
                                type="number" step="0.1" placeholder="±0"
                                value={deltaValues[i]}
                                onChange={(e) => setDeltaValues(prev => ({ ...prev, [i]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleDeltaMove(i, deltaValues[i]); }}
                                onBlur={(e) => { if (e.target.value !== '') handleDeltaMove(i, e.target.value); }}
                                className="w-full bg-[#0F0F0F] border border-[#06B6D4]/30 focus:border-[#06B6D4] pl-5 pr-1 py-1.5 rounded text-[10px] outline-none font-mono text-white"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[8px] text-gray-600 italic">Enter or tab away to apply</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {['X', 'Y', 'Z'].map((axis, i) => (
                          <div key={axis} className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600 font-bold">{axis}</span>
                            <input
                              type="number" step="0.01"
                              value={selectedJoint[i].toFixed(3)}
                              onChange={(e) => handleVertexChange(i, e.target.value)}
                              onBlur={() => saveHistory()}
                              className="w-full bg-[#0F0F0F] border border-[#06B6D4]/30 focus:border-[#06B6D4] pl-5 pr-1 py-1.5 rounded text-[10px] outline-none font-mono text-white"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#222]/10 border border-dashed border-[#333] rounded-xl text-center">
                    <p className="text-[9px] text-gray-600 italic leading-relaxed">
                      Click a vertex to select it.<br/>
                      Shift+click to multi-select.<br/>
                      <span className="text-[#06B6D4]/60">Alt+click an edge to add a vertex.</span>
                    </p>
                  </div>
                )}

                {/* Bevel & Dissolve */}
                {selectedVertexIndices.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-[#333]/60">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Bevel corners</label>
                      <p className="text-[8px] text-gray-600 italic">Rounds the selected corner(s) by adding geometry.</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min="0.02" max="0.48" step="0.01"
                          value={bevelAmount}
                          onChange={e => setBevelAmount(parseFloat(e.target.value))}
                          className="flex-1 accent-[#06B6D4]"
                        />
                        <span className="text-[9px] font-mono text-[#06B6D4] w-8 text-right">
                          {bevelAmount.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (!selectedObject || !selectedVertexIndices.length) return;
                          saveHistory();
                          applyBevel(selectedObject.id, selectedVertexIndices, bevelAmount);
                        }}
                        className="w-full bg-[#0F0F0F] border border-[#06B6D4]/30 hover:border-[#06B6D4] p-2 rounded text-[10px] text-[#06B6D4] transition-colors"
                      >
                        Apply Bevel ({selectedVertexIndices.length} vert{selectedVertexIndices.length !== 1 ? 's' : ''})
                      </button>
                    </div>

                    {!multiSelected && selectedJointIndex !== null && (
                      <button
                        onClick={() => { saveHistory(); dissolveVertex(selectedObject.id, selectedJointIndex); }}
                        className="w-full bg-[#0F0F0F] border border-[#333] hover:border-red-500/40 p-2 rounded text-[10px] text-gray-600 hover:text-red-400 transition-colors"
                      >
                        Dissolve vertex
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <TexturePanel />

            {objects.length >= 2 && (
              <div className="pt-4 border-t border-[#333] space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Boolean Ops</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleCSG('union')} className="bg-[#333] p-2 rounded text-[10px] hover:bg-[#7C3AED] transition-colors">Union</button>
                  <button onClick={() => handleCSG('subtract')} className="bg-[#333] p-2 rounded text-[10px] hover:bg-[#7C3AED] transition-colors">Subtract</button>
                  <button onClick={() => handleCSG('intersect')} className="bg-[#333] p-2 rounded text-[10px] hover:bg-[#7C3AED] transition-colors">Intersect</button>
                </div>
              </div>
            )}
          </>
        ) : selectedGroupId && currentGroup ? (
          // Group-only selection (no individual object)
          <div className="text-center py-8 space-y-2">
            <Users size={24} className="mx-auto text-[#7C3AED] opacity-60" />
            <p className="text-[10px] text-gray-400 font-bold">{currentGroup.name}</p>
            <p className="text-[9px] text-gray-600">
              {objects.filter(o => o.groupId === currentGroup.id).length} parts selected
            </p>
            <p className="text-[8px] text-gray-700 italic">Double-click a part to edit it individually</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 text-center p-8 opacity-50">
            <Layers size={40} className="mb-4 text-[#7C3AED] opacity-20" />
            {objects.length > 0 ? (
              <>
                <p className="text-xs italic uppercase tracking-widest font-black">Nothing Selected</p>
                <p className="text-[9px] mt-2 text-gray-500 leading-relaxed max-w-[140px]">
                  Click an object or group on the canvas to inspect it.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs italic uppercase tracking-widest font-black">Canvas Empty</p>
                <p className="text-[9px] mt-2 text-gray-500 leading-relaxed max-w-[140px]">
                  Add a primitive or generate a model to get started.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="fixed z-[9999] bg-[#1A1A1A] border border-[#333] rounded-xl shadow-2xl py-1 min-w-[160px]"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {ctxMenu.items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); setCtxMenu(null); }}
              className={`w-full text-left px-3 py-2 text-[10px] transition-colors ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-[#333]'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inspector;
