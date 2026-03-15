import React, { useState, useMemo } from 'react';
import { Layers, Eye, EyeOff, Trash2, Crosshair, Move, Scissors, Sliders, Camera, Sparkles, Triangle } from 'lucide-react';
import useStore from './useStore';
import TexturePanel from './components/TexturePanel';
import { performCSG } from './utils/CSGProcessor';
import { laplacianSmooth, detectFaces } from './utils/MeshAnalysis';

const Inspector = () => {
  const {
    objects,
    selectedObjectId,
    selectedObjectIds,
    setSelectedObjectId,
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
    setGeometry
  } = useStore();

  const multiObjectSelected = selectedObjectIds.length > 1;

  const [isOrtho, setIsOrtho] = useState(false);
  const [deltaValues, setDeltaValues] = useState({ 0: '', 1: '', 2: '' });

  const selectedObject = objects.find(o => o?.id === selectedObjectId);
  const selectedJoint  = selectedObject && selectedJointIndex !== null
    ? selectedObject.vertices?.[selectedJointIndex]
    : null;
  const multiSelected  = selectedVertexIndices.length > 1;

  // Detect faces for surface selection — depends on topology (indices) not vertex positions
  // so this won't re-run on every vertex drag frame
  const faces = useMemo(() => {
    if (!selectedObject?.vertices?.length || !selectedObject?.indices?.length) return [];
    if (selectedObject.vertices.length > 300) return []; // skip for dense meshes
    return detectFaces(selectedObject.vertices, selectedObject.indices);
  }, [selectedObject?.id, selectedObject?.indices]); // intentionally omits vertices

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

  const handleSmooth = () => {
    if (!selectedObject) return;
    saveHistory();
    const smoothed = laplacianSmooth(selectedObject.vertices, selectedObject.indices, 1, 0.5);
    const updates = smoothed.map((pos, i) => ({ index: i, position: pos }));
    updateVertices(selectedObject.id, updates);
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

  const handleFaceSelect = (face) => {
    setSelectedVertexIndices(face.vertexIndices);
    if (editMode !== 'vertex') setEditMode('vertex');
  };

  return (
    <div className="w-80 bg-[#1A1A1A] border-l border-[#333] flex flex-col overflow-hidden">
      {/* Tool Header */}
      <div className="p-4 border-b border-[#333] bg-[#151515] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-[#7C3AED]" />
          <span className="text-[10px] uppercase tracking-widest text-white font-black">Properties</span>
        </div>
        <div className="flex items-center gap-2">
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
                title="Object Mode — move/scale objects (V)"
              >
                <Move size={10} /> Object
              </button>
              <button
                onClick={() => setEditMode('vertex')}
                className={`px-2 py-1 rounded-md transition-all text-[9px] font-bold flex items-center gap-1 ${editMode === 'vertex' ? 'bg-[#06B6D4] text-white' : 'text-gray-600 hover:text-white'}`}
                title="Vertex Edit — drag individual points (J or double-click)"
              >
                <Scissors size={10} /> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scene Graph / Layer List */}
      <div className="flex-[0.4] flex flex-col border-b border-[#333] min-h-[150px] max-h-[300px]">
        <div className="px-4 py-2 bg-[#1A1A1A] flex items-center justify-between border-b border-[#333]">
          <span className="text-[9px] uppercase tracking-tighter text-gray-500 font-bold">Scene Graph</span>
          <span className="text-[9px] text-gray-700 font-mono">{objects.length} Objects</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#121212]">
          {objects.map(obj => (
            <div
              key={obj.id}
              onClick={() => setSelectedObjectId(obj.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                selectedObjectId === obj.id ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/30' : 'hover:bg-[#222] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateObject(obj.id, { visible: !obj.visible });
                  }}
                  className="text-gray-600 hover:text-white flex-shrink-0"
                >
                  {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <span className={`text-[11px] font-medium truncate ${selectedObjectId === obj.id ? 'text-white' : 'text-gray-500'}`}>
                  {obj.name}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteObject(obj.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-opacity flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Properties Inspector */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6 select-text">
        {/* Multi-object selection controls */}
        {multiObjectSelected && (
          <section className="space-y-3 pb-4 border-b border-[#333]">
            <div className="text-[9px] text-[#7C3AED] uppercase font-bold tracking-widest">
              {selectedObjectIds.length} Objects Selected
            </div>
            <p className="text-[8px] text-gray-600 italic">Changes apply to all selected objects</p>

            {/* Shared scale */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-500 uppercase font-bold">Scale (uniform)</label>
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
                          const updates = {};
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
            </div>

            {/* Shared color */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-500 uppercase font-bold">Color</label>
              <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg">
                <input
                  type="color"
                  defaultValue="#7C3AED"
                  onChange={(e) => {
                    selectedObjectIds.forEach(id => updateObject(id, { color: e.target.value }));
                  }}
                  onBlur={() => saveHistory()}
                  className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"
                />
                <span className="text-[9px] text-gray-500">Apply to all</span>
              </div>
            </div>

            {/* Smooth all */}
            <button
              onClick={() => {
                saveHistory();
                selectedObjectIds.forEach(id => {
                  const obj = objects.find(o => o.id === id);
                  if (!obj?.vertices?.length || !obj?.indices?.length) return;
                  const smoothed = laplacianSmooth(obj.vertices, obj.indices, 1, 0.5);
                  const updates = smoothed.map((pos, i) => ({ index: i, position: pos }));
                  updateVertices(id, updates);
                });
              }}
              className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-[10px] text-gray-400 hover:border-[#7C3AED] hover:text-white transition-all"
            >
              Smooth all selected
            </button>
          </section>
        )}

        {selectedObject ? (
          <>
            <section className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Name</label>
                <input
                  type="text"
                  value={selectedObject.name}
                  onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
                  onBlur={() => saveHistory()}
                  className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-xs outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>

              {/* Transform Inputs */}
              <div className="space-y-3 pt-2">
                {['position', 'rotation', 'scale'].map((type) => (
                  <div key={type} className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">{type}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600">{axis}</span>
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

              {/* Color and Material */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold">Color</label>
                  <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg">
                    <input
                      type="color"
                      value={selectedObject.color}
                      onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                      onBlur={() => saveHistory()}
                      className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"
                    />
                    <span className="text-[9px] font-mono text-gray-400 uppercase">{selectedObject.color}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold">Material</label>
                  <select
                    value={selectedObject.materialType || 'standard'}
                    onChange={(e) => updateObject(selectedObject.id, { materialType: e.target.value })}
                    onBlur={() => saveHistory()}
                    className="w-full bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg text-[10px] outline-none appearance-none cursor-pointer text-gray-300"
                  >
                    <option value="standard">Standard</option>
                    <option value="physical">Physical</option>
                    <option value="wireframe">Wireframe</option>
                  </select>
                </div>
              </div>

              {/* Smooth / Roundness */}
              <div className="pt-2 space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Sparkles size={9} /> Roundness
                </label>
                <button
                  onClick={handleSmooth}
                  className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-[10px] text-gray-400 hover:border-[#7C3AED] hover:text-white transition-all text-left"
                >
                  Smooth vertices (Laplacian pass)
                </button>
              </div>
            </section>

            {/* Surface List */}
            {faces.length > 0 && faces.length <= 32 && (
              <div className="space-y-2 pt-2 border-t border-[#333]">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Triangle size={9} /> Surfaces ({faces.length})
                </label>
                <p className="text-[8px] text-gray-600 italic">Click a surface to select its vertices</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {faces.map((face, fi) => {
                    const isActive = face.vertexIndices.every(vi => selectedVertexIndices.includes(vi))
                      && face.vertexIndices.length === selectedVertexIndices.length;
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

            {/* Vertex Edit Controls — only visible in vertex mode */}
            {editMode === 'vertex' && (
              <div className="space-y-4 pt-4 border-t border-[#333]">
                <div className="text-[10px] uppercase tracking-widest text-[#06B6D4] font-black flex items-center gap-2">
                  <Crosshair size={12} /> Vertex Edit
                </div>

                {selectedJoint ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] text-gray-400 font-mono bg-[#333]/30 px-2 py-0.5 rounded">
                        {multiSelected
                          ? `${selectedVertexIndices.length} vertices`
                          : `Vertex #${selectedJointIndex}`}
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
                        <p className="text-[9px] text-gray-500">
                          Move all {selectedVertexIndices.length} vertices by delta:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['X', 'Y', 'Z'].map((axis, i) => (
                            <div key={axis} className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-[#06B6D4] font-bold">{axis}</span>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="±0"
                                value={deltaValues[i]}
                                onChange={(e) => setDeltaValues(prev => ({ ...prev, [i]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleDeltaMove(i, deltaValues[i]); }}
                                onBlur={(e) => { if (e.target.value !== '') handleDeltaMove(i, e.target.value); }}
                                className="w-full bg-[#0F0F0F] border border-[#06B6D4]/30 focus:border-[#06B6D4] pl-5 pr-1 py-1.5 rounded text-[10px] outline-none font-mono text-white"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[8px] text-gray-600 italic">Press Enter or tab away to apply</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {['X', 'Y', 'Z'].map((axis, i) => (
                          <div key={axis} className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600 font-bold">{axis}</span>
                            <input
                              type="number"
                              step="0.01"
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
                      Click a vertex handle to select it.<br/>
                      Shift+click to multi-select.<br/>
                      Drag to reposition.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Texture / Visual Properties */}
            <TexturePanel />

            {/* CSG Boolean Operations — only show when 2+ objects exist */}
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
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 text-center p-8 opacity-50">
            <Layers size={40} className="mb-4 text-[#7C3AED] opacity-20" />
            <p className="text-xs italic uppercase tracking-widest font-black">Canvas Empty</p>
            <p className="text-[9px] mt-2 text-gray-500 leading-relaxed max-w-[140px]">
              Add a primitive or select an existing object to inspect properties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
