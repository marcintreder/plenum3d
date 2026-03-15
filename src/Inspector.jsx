import React from 'react';
import { Layers, Eye, EyeOff, Trash2, Crosshair, Sliders } from 'lucide-react';
import useStore from './useStore';
import TexturePanel from './components/TexturePanel';

const Inspector = () => {
  const { 
    objects, 
    selectedObjectId, 
    setSelectedObjectId, 
    updateObject, 
    deleteObject,
    selectedJointIndex,
    setSelectedJointIndex,
    updateVertex,
    saveHistory
  } = useStore();

  const selectedObject = objects.find(o => o?.id === selectedObjectId);
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
      <div className="p-4 border-b border-[#333] bg-[#151515] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-[#7C3AED]" />
          <span className="text-[10px] uppercase tracking-widest text-white font-black">Object Settings</span>
        </div>
      </div>

      <div className="flex-[0.4] flex flex-col border-b border-[#333] min-h-[150px] max-h-[300px]">
        <div className="px-4 py-2 bg-[#1A1A1A] flex items-center justify-between border-b border-[#333]">
          <span className="text-[9px] uppercase tracking-tighter text-gray-500 font-bold">Scene Graph</span>
          <span className="text-[9px] text-gray-700 font-mono">{objects.length} Layers</span>
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

      <div className="flex-1 p-4 overflow-y-auto space-y-6 select-text">
        {selectedObject ? (
          <>
            <section className="space-y-4">
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
              <TexturePanel />
            </section>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 text-center p-8 opacity-50">
            <Layers size={40} className="mb-4 text-[#7C3AED] opacity-20" />
          </div>
        )}
      </div>
    </div>
  );
};
export default Inspector;
