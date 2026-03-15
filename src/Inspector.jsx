import React from 'react';
import { Layers, Trash2, Crosshair, Sliders } from 'lucide-react';
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
      <div className="flex-1 p-4 overflow-y-auto space-y-6 select-text">
        {selectedObject ? (
          <>
            <section className="space-y-4">
               {/* Properties */}
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
