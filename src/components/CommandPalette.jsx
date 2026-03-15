import React, { useState, useEffect } from 'react';
import useStore from '../useStore';

const CommandPalette = ({ isOpen, onClose }) => {
  const { addPrimitive, setCodeViewOpen } = useStore();
  const [search, setSearch] = useState('');

  const actions = [
    { name: 'Add Cube', action: () => addPrimitive('cube') },
    { name: 'Add Sphere', action: () => addPrimitive('sphere') },
    { name: 'Add Cylinder', action: () => addPrimitive('cylinder') },
    { name: 'View Code', action: () => setCodeViewOpen(true) },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center pt-20" role="dialog" aria-modal="true" aria-label="Command Palette">
      <div className="w-full max-w-lg bg-[#1A1A1A] border border-[#333] rounded-xl overflow-hidden shadow-2xl">
        <input 
          autoFocus
          className="w-full p-4 bg-transparent outline-none text-white border-b border-[#333]"
          placeholder="Search commands..."
          aria-label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="p-2">
          {actions.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map(a => (
            <button 
              key={a.name}
              onClick={() => { a.action(); onClose(false); }}
              className="w-full text-left p-3 text-sm text-gray-400 hover:bg-[#333] rounded-lg"
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
