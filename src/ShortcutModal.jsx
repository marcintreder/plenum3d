import React from 'react';
import useStore from './useStore';

const ShortcutModal = () => {
  const { isShortcutModalOpen, toggleShortcutModal } = useStore();
  if (!isShortcutModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={toggleShortcutModal}>
      <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333] w-96 text-white" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 border-b border-[#333] pb-2">Keyboard Shortcuts</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between"><span>Duplicate</span> <span className="text-[#7C3AED]">Cmd/Ctrl + D</span></li>
          <li className="flex justify-between"><span>Delete</span> <span className="text-[#7C3AED]">Backspace / Delete</span></li>
          <li className="flex justify-between"><span>Undo</span> <span className="text-[#7C3AED]">Cmd/Ctrl + Z</span></li>
          <li className="flex justify-between"><span>Redo</span> <span className="text-[#7C3AED]">Cmd/Ctrl + Shift + Z</span></li>
          <li className="flex justify-between"><span>Select All</span> <span className="text-[#7C3AED]">Cmd/Ctrl + A</span></li>
        </ul>
        <button onClick={toggleShortcutModal} className="mt-6 w-full bg-[#7C3AED] py-2 rounded text-xs hover:bg-[#6D28D9] transition-colors">Close</button>
      </div>
    </div>
  );
};

export default ShortcutModal;
