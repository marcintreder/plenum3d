import React from 'react';
export const ViewportControls = ({ setView }) => (
  <div className="grid grid-cols-3 gap-1 p-2">
    <button onClick={() => setView('top')} className="text-[9px] bg-[#222] p-1 hover:bg-[#7C3AED]">TOP</button>
    <button onClick={() => setView('side')} className="text-[9px] bg-[#222] p-1 hover:bg-[#7C3AED]">SIDE</button>
    <button onClick={() => setView('front')} className="text-[9px] bg-[#222] p-1 hover:bg-[#7C3AED]">FRONT</button>
  </div>
);
