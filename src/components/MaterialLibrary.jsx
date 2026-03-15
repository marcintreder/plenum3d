import React from 'react';
import useStore from '../useStore';

export const MaterialLibrary = () => {
  const { selectedObjectId, updateObject } = useStore();
  const presets = [
    { name: 'Chrome', roughness: 0.1, metalness: 1.0 },
    { name: 'Plastic', roughness: 0.3, metalness: 0.0 },
    { name: 'Gold', roughness: 0.2, metalness: 0.9 },
  ];
  return (
    <div className="p-4 border-t border-[#333]">
      <h3 className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-2">Materials</h3>
      <div className="flex gap-2">
        {presets.map(p => (
            <button key={p.name} onClick={() => updateObject(selectedObjectId, { roughness: p.roughness, metalness: p.metalness })} className="bg-[#222] p-2 rounded text-[10px] text-gray-400 hover:text-white">
                {p.name}
            </button>
        ))}
      </div>
    </div>
  );
};
