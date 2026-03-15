import React from 'react';
export const AssetBrowser = () => (
  <div className="p-4 border-t border-[#333]">
    <h3 className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-2">Assets</h3>
    <div className="grid grid-cols-2 gap-2">
      {['Gear', 'Bracket', 'Connector'].map(asset => (
        <button key={asset} className="h-16 bg-[#222] rounded flex items-center justify-center text-[10px] text-gray-400 hover:text-white">
          {asset}
        </button>
      ))}
    </div>
  </div>
);
