import React from 'react';
import useStore from './useStore';

const Inspector = () => {
  const { 
    vertices, 
    selectedJointIndex, 
    updateVertex,
    color,
    materialType,
    metalness,
    roughness,
    setColor,
    setMaterialType,
    setMetalness,
    setRoughness
  } = useStore();
  
  const renderMaterialSection = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Material</h2>
      
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-gray-400 uppercase">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded border border-[#333] bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-xs w-full focus:border-[#7C3AED] outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-gray-400 uppercase">Type</label>
        <select
          value={materialType}
          onChange={(e) => setMaterialType(e.target.value)}
          className="bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-xs w-full focus:border-[#7C3AED] outline-none"
        >
          <option value="standard">Standard</option>
          <option value="physical">Physical</option>
          <option value="wireframe">Wireframe</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-[10px] text-gray-400 uppercase">Metalness</label>
          <span className="text-[10px] text-gray-500">{metalness.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={metalness}
          onChange={(e) => setMetalness(parseFloat(e.target.value))}
          className="w-full accent-[#7C3AED]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-[10px] text-gray-400 uppercase">Roughness</label>
          <span className="text-[10px] text-gray-500">{roughness.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={roughness}
          onChange={(e) => setRoughness(parseFloat(e.target.value))}
          className="w-full accent-[#7C3AED]"
        />
      </div>
    </div>
  );

  if (selectedJointIndex === null) {
    return (
      <div className="w-64 bg-[#1A1A1A] border-l border-[#333] p-4 flex flex-col gap-8">
        {renderMaterialSection()}
        <div className="text-gray-500 text-[10px] italic border-t border-[#333] pt-4">
          Select a joint to edit vertices
        </div>
      </div>
    );
  }

  const vertex = vertices[selectedJointIndex];

  const handleChange = (axis, value) => {
    const newVertex = [...vertex];
    newVertex[axis] = parseFloat(value) || 0;
    updateVertex(selectedJointIndex, newVertex);
  };

  return (
    <div className="w-64 bg-[#1A1A1A] border-l border-[#333] p-4 flex flex-col gap-8 overflow-y-auto">
      <div>
        <h2 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 font-bold">Joint Transform</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gray-400">Joint ID: {selectedJointIndex}</span>
            {['X', 'Y', 'Z'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-4">{label}</span>
                <input
                  type="number"
                  step="0.1"
                  value={vertex[i].toFixed(2)}
                  onChange={(e) => handleChange(i, e.target.value)}
                  className="bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-xs w-full focus:border-[#7C3AED] outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#333] pt-8">
        {renderMaterialSection()}
      </div>
    </div>
  );
};

export default Inspector;
