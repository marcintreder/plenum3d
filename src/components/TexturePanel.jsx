import React from 'react';
import useStore from '../useStore';

const TexturePanel = () => {
  const { selectedObjectId, updateObject, objects } = useStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  if (!selectedObject) return null;

  const handleTextureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateObject(selectedObject.id, { texture: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 border-t border-[#333] space-y-4">
      <h3 className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Texture / Visuals</h3>
      <div>
        <label className="text-[9px] text-gray-500 uppercase block mb-1">Color</label>
        <input type="color" value={selectedObject.color} onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })} className="w-full h-8 cursor-pointer bg-[#0F0F0F] border border-[#333] rounded" />
      </div>
      <div>
        <label className="text-[9px] text-gray-500 uppercase block mb-1">Texture Upload</label>
        <input type="file" accept="image/*" onChange={handleTextureUpload} className="w-full text-[10px] text-gray-400 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-[#333] file:text-white" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
            <label className="text-[9px] text-gray-500 uppercase">Roughness</label>
            <span className="text-[9px] font-mono text-gray-300">{(selectedObject.roughness || 0.5).toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="1" step="0.01" value={selectedObject.roughness || 0.5} onChange={(e) => updateObject(selectedObject.id, { roughness: parseFloat(e.target.value) })} className="w-full h-1 accent-[#7C3AED]" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
            <label className="text-[9px] text-gray-500 uppercase">Metalness</label>
            <span className="text-[9px] font-mono text-gray-300">{(selectedObject.metalness || 0.5).toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="1" step="0.01" value={selectedObject.metalness || 0.5} onChange={(e) => updateObject(selectedObject.id, { metalness: parseFloat(e.target.value) })} className="w-full h-1 accent-[#7C3AED]" />
      </div>
    </div>
  );
};

export default TexturePanel;
