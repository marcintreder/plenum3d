import React from 'react';
import { Layers, Eye, EyeOff, Trash2, Crosshair, ChevronRight, Move, Scissors } from 'lucide-react';
import useStore from './useStore';

const Inspector = () => {
  const { 
    objects, 
    selectedObjectId, 
    setSelectedObjectId, 
    updateObject, 
    deleteObject,
    selectedJointIndex,
    updateVertex,
    editMode,
    setEditMode
  } = useStore();

  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const selectedJoint = selectedObject && selectedJointIndex !== null ? selectedObject.vertices[selectedJointIndex] : null;

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

  return (
    <div className="w-80 bg-[#1A1A1A] border-l border-[#333] flex flex-col overflow-hidden">
      {/* Mode Switcher */}
      <div className="flex p-2 bg-[#0F0F0F] border-b border-[#333] gap-1">
        <button 
          onClick={() => setEditMode('object')}
          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-[10px] font-bold transition-all ${
            editMode === 'object' ? 'bg-[#7C3AED] text-white' : 'text-gray-500 hover:bg-[#222]'
          }`}
        >
          <Move size={12} /> OBJECT
        </button>
        <button 
          onClick={() => setEditMode('vertex')}
          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-[10px] font-bold transition-all ${
            editMode === 'vertex' ? 'bg-[#06B6D4] text-white' : 'text-gray-500 hover:bg-[#222]'
          }`}
        >
          <Scissors size={12} /> SCULPT
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-[0.3] flex flex-col border-b border-[#333]">
        <div className="p-3 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#7C3AED]" />
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Layers</span>
          </div>
          <span className="text-[9px] text-gray-600 font-mono">{objects.length} OBJS</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#151515]">
          {objects.map(obj => (
            <div 
              key={obj.id}
              onClick={() => setSelectedObjectId(obj.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                selectedObjectId === obj.id ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/30' : 'hover:bg-[#222] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateObject(obj.id, { visible: !obj.visible });
                  }}
                  className="text-gray-600 hover:text-white"
                >
                  {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <span className={`text-[11px] font-medium ${selectedObjectId === obj.id ? 'text-white' : 'text-gray-500'}`}>
                  {obj.name}
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteObject(obj.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Properties Inspector */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {selectedObject ? (
          <>
            <section className="space-y-4">
               <div className="text-[10px] uppercase tracking-widest text-gray-600 font-bold flex items-center gap-2">
                <ChevronRight size={10} /> Object Settings
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase">Label</label>
                <input 
                  type="text"
                  value={selectedObject.name}
                  onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
                  className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-xs outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>

              {/* Transform Inputs */}
              <div className="space-y-3 pt-2">
                {['position', 'rotation', 'scale'].map((type) => (
                  <div key={type} className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 uppercase">{type}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600">{axis}</span>
                          <input 
                            type="number"
                            step="0.1"
                            value={(selectedObject[type] || (type === 'scale' ? [1,1,1] : [0,0,0]))[i].toFixed(2)}
                            onChange={(e) => handleTransformChange(type, i, e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-[#333] pl-5 pr-2 py-1.5 rounded text-[10px] outline-none focus:border-[#7C3AED]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase">Appearance</label>
                  <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg">
                    <input 
                      type="color" 
                      value={selectedObject.color}
                      onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                      className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"
                    />
                    <span className="text-[9px] font-mono text-gray-400 uppercase">{selectedObject.color}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase">Shader</label>
                  <select 
                    value={selectedObject.materialType}
                    onChange={(e) => updateObject(selectedObject.id, { materialType: e.target.value })}
                    className="w-full bg-[#0F0F0F] border border-[#333] p-1.5 rounded-lg text-[10px] outline-none appearance-none cursor-pointer"
                  >
                    <option value="standard">Standard</option>
                    <option value="physical">Physical</option>
                    <option value="wireframe">Wireframe</option>
                  </select>
                </div>
              </div>
            </section>

            {editMode === 'vertex' && (
              <section className="space-y-4 pt-4 border-t border-[#333]">
                <div className="text-[10px] uppercase tracking-widest text-[#06B6D4] font-bold flex items-center gap-2">
                  <Crosshair size={10} /> Sculpt Precision
                </div>

                {selectedJointIndex !== null ? (
                  <div className="space-y-4">
                    <div className="text-[9px] text-gray-400">Vertex #{selectedJointIndex}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-600">{axis}</span>
                          <input 
                            type="number"
                            step="0.1"
                            value={selectedJoint[i].toFixed(2)}
                            onChange={(e) => handleVertexChange(i, e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-[#333] pl-5 pr-2 py-1.5 rounded text-[10px] outline-none focus:border-[#06B6D4]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#222]/20 border border-dashed border-[#333] rounded-xl text-center">
                    <p className="text-[9px] text-gray-600 italic leading-relaxed">Select a joint in the viewport<br/>to edit vertices</p>
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 text-center p-8">
            <Layers size={32} className="mb-4 opacity-10" />
            <p className="text-xs italic uppercase tracking-wider font-bold">No Selection</p>
            <p className="text-[9px] mt-2 text-gray-800 leading-relaxed">Choose a layer to begin<br/>operating on the model.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
