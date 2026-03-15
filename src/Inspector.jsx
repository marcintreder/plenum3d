import React from 'react';
import { Layers, Eye, EyeOff, Trash2, Crosshair, Sliders } from 'lucide-react';
import useStore from './useStore';
import TexturePanel from './components/TexturePanel';
import { performCSG } from './utils/CSGProcessor';

const Inspector = () => {
  const { objects, selectedObjectId, setSelectedObjectId, updateObject, deleteObject, selectedJointIndex, setSelectedJointIndex, updateVertex, saveHistory, setGeometry } = useStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  const handleCSG = (op) => {
    const sibling = objects.find(o => o.id !== selectedObjectId);
    if (!selectedObject || !sibling) return;
    const result = performCSG(selectedObject, sibling, op);
    setGeometry({ ...selectedObject, geometry: result.geometry, material: result.material });
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
        {selectedObject && (
          <>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button onClick={() => handleCSG('union')} className="bg-[#333] p-2 rounded text-[10px] hover:bg-[#7C3AED]">Union</button>
              <button onClick={() => handleCSG('subtract')} className="bg-[#333] p-2 rounded text-[10px] hover:bg-[#7C3AED]">Subtract</button>
              <button onClick={() => handleCSG('intersect')} className="bg-[#333] p-2 rounded text-[10px] hover:bg-[#7C3AED]">Intersect</button>
            </div>
            <TexturePanel />
          </>
        )}
      </div>
    </div>
  );
};
export default Inspector;
