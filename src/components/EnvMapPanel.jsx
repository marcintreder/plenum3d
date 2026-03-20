import React from 'react';
import useStore from '../useStore';

export const EnvMapPanel = () => {
  const { setEnvironment } = useStore();
  const envs = ['city', 'park', 'studio', 'night'];

  return (
    <div className="p-4 bg-[#1A1A1A] rounded-lg border border-white/10">
      <h3 className="text-sm font-semibold text-white mb-2">Environment</h3>
      <div className="flex gap-2">
        {envs.map(env => (
          <button 
            key={env}
            onClick={() => setEnvironment(env)}
            className="px-2 py-1 text-xs bg-[#0F0F0F] text-gray-300 rounded hover:bg-[#7C3AED] hover:text-white"
          >
            {env}
          </button>
        ))}
      </div>
    </div>
  );
};
