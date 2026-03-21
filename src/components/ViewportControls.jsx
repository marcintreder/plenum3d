import React from 'react';
import useStore from '../useStore';

export const ViewportControls = ({ setView }) => (
  <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
    <div className="bg-[#222]/80 backdrop-blur p-2 rounded-lg flex flex-col gap-1">
      <button onClick={() => setView('top')} className="bg-[#333] p-1.5 text-[9px] text-white hover:bg-[#7C3AED]">TOP</button>
      <button onClick={() => setView('front')} className="bg-[#333] p-1.5 text-[9px] text-white hover:bg-[#7C3AED]">FRONT</button>
      <button onClick={() => setView('right')} className="bg-[#333] p-1.5 text-[9px] text-white hover:bg-[#7C3AED]">RIGHT</button>
      <button onClick={() => setView('iso')} className="bg-[#333] p-1.5 text-[9px] text-white hover:bg-[#7C3AED]">ISO</button>
    </div>
    <div className="mt-2 bg-[#222]/80 backdrop-blur p-2 rounded-lg text-[9px] text-gray-400">
      <span className="block font-bold text-white mb-1">Navigation</span>
      <div>• Orbit: Mouse drag</div>
      <div>• Pan: Space + Drag</div>
    </div>
  </div>
);
