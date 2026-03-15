import React from 'react';
import useStore from '../useStore';

const TexturePanel = () => {
  const { selectedObjectId, updateObject, objects } = useStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  if (!selectedObject) return null;

  return (
    <div className="p-4 border-t border-[#333]">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Texture / Visuals</h3>
      <div className="space-y-4">
        <div>
          <label className="text-[9px] text-gray-500 uppercase">Surface Color</label>
          <input type="color" value={selectedObject.color} onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })} className="w-full h-8 cursor-pointer" />
        </div>
        <button className="w-full py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg text-xs font-bold transition">AI Texture Generation</button>
      </div>
    </div>
  );
};

export default TexturePanel;
