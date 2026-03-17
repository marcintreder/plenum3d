import React from 'react';

const ProjectThumbnails = ({ projects, activeProjectId, onSelect, onRename, onDelete, renamingProjectId, renameProjectValue, onRenameChange, onRenameBlur, onRenameKeyDown }) => {
  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center justify-between mb-1 px-2">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Projects</div>
      </div>
      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {projects.map(proj => (
          <div
            key={proj.id}
            onClick={() => onSelect(proj.id)}
            onDoubleClick={() => onRename(proj.id, proj.name)}
            className={`group/proj flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all text-[10px] ${
              proj.id === activeProjectId ? 'bg-[#7C3AED]/20 text-white' : 'text-gray-500 hover:bg-[#333] hover:text-gray-300'
            }`}
          >
            {proj.thumbnail && <img src={proj.thumbnail} alt="thumb" className="w-8 h-8 rounded object-cover mr-2" />}
            {renamingProjectId === proj.id ? (
              <input
                autoFocus
                value={renameProjectValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onBlur={onRenameBlur}
                onKeyDown={onRenameKeyDown}
                className="bg-[#333] border border-[#7C3AED]/60 rounded px-1 py-0.5 text-[10px] outline-none text-white w-full"
              />
            ) : (
              <span className="truncate flex-1 text-xs font-medium">{proj.name}</span>
            )}
            {projects.length > 1 && !renamingProjectId && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(proj.id); }}
                className="opacity-0 group-hover/proj:opacity-100 text-gray-600 hover:text-red-400 ml-1 transition-opacity"
              >×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectThumbnails;
