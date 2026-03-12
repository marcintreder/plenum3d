import React from 'react';
import useStore from './useStore';

const Inspector = () => {
  const { vertices, selectedJointIndex, updateVertex } = useStore();
  
  if (selectedJointIndex === null) {
    return (
      <div className="w-64 bg-[#1A1A1A] border-l border-[#333] p-4 flex flex-col gap-4 text-gray-500 text-sm italic">
        Select a joint to view properties
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
    <div className="w-64 bg-[#1A1A1A] border-l border-[#333] p-4 flex flex-col gap-6">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold">Inspector</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400">Joint ID: {selectedJointIndex}</span>
            {['X', 'Y', 'Z'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">{label}</span>
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
    </div>
  );
};

export default Inspector;
