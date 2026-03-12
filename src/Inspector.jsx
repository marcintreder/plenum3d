import React from 'react';
import { Layers, Eye, EyeOff, Trash2 } from 'lucide-react';
import useStore from './useStore';

const Inspector = () => {
  const { 
    objects, 
    selectedObjectId, 
    setSelectedObjectId, 
    updateObject, 
    deleteObject,
    selectedJointIndex 
  } = useStore();

  const selectedObject = objects.find(o => o.id === selectedObjectId);

  return (
    <div className="w-80 bg-[#1A1A1A] border-l border-[#333] flex flex-col overflow-hidden">
      {/* Layer List */}
      <div className="flex-1 flex flex-col border-b border-[#333]">
        <div className="p-4 border-b border-[#333] flex items-center gap-2">
          <Layers size={16} className="text-gray-400" />
          <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Layers</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {objects.map(obj => (
            <div 
              key={obj.id}
              onClick={() => setSelectedObjectId(obj.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                selectedObjectId === obj.id ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/30' : 'hover:bg-[#222] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateObject(obj.id, { visible: !obj.visible });
                  }}
                  className="text-gray-500 hover:text-white"
                >
                  {obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span className={`text-sm ${selectedObjectId === obj.id ? 'text-white' : 'text-gray-400'}`}>
                  {obj.name}
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteObject(obj.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Properties Inspector */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Properties</div>
        
        {selectedObject ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs text-gray-500">Object Name</label>
              <input 
                type="text"
                value={selectedObject.name}
                onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-sm outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs text-gray-500">Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={selectedObject.color}
                  onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                  className="w-8 h-8 bg-transparent border-none cursor-pointer"
                />
                <span className="text-sm font-mono text-gray-400 uppercase">{selectedObject.color}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-gray-500">Material Type</label>
              <select 
                value={selectedObject.materialType}
                onChange={(e) => updateObject(selectedObject.id, { materialType: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              >
                <option value="standard">Standard</option>
                <option value="physical">Physical</option>
                <option value="wireframe">Wireframe</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#333]">
              <div className="text-xs text-[#06B6D4] font-medium mb-1">
                {selectedJointIndex !== null ? `Joint #${selectedJointIndex} Selected` : 'Select a joint to edit vertices'}
              </div>
              <p className="text-[10px] text-gray-500">Use the handles in the viewport to transform geometry.</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
            Select a layer to inspect
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
