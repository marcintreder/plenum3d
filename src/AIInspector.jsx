import React, { useState } from 'react';
import { Sparkles, Box, RotateCcw, Maximize2, Triangle } from 'lucide-react';
import useStore from './useStore';

const PropRow = ({ label, values }) => (
  <div className="flex items-center gap-2 py-1">
    <span className="w-16 text-xs text-[#94A3B8] shrink-0">{label}</span>
    <div className="flex gap-1 flex-1">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 text-center text-xs font-mono text-[#F8FAFC] bg-[#0F0F0F] rounded px-1 py-0.5"
        >
          {typeof v === 'number' ? v.toFixed(3) : v}
        </span>
      ))}
    </div>
  </div>
);

const AIInspector = ({ onRefine }) => {
  const { objects, selectedObjectId } = useStore();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedObject = objects.find((o) => o.id === selectedObjectId) ?? null;

  const handleRefine = async () => {
    if (!prompt.trim() || !selectedObject) return;
    setIsLoading(true);
    try {
      if (onRefine) {
        await onRefine({ object: selectedObject, prompt: prompt.trim() });
      }
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRefine();
    }
  };

  return (
    <div
      data-testid="ai-inspector"
      className="flex flex-col gap-3 p-3 rounded-lg bg-[#1A1A1A] border border-white/10 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-[#7C3AED]" />
        <span className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-widest">
          AI Inspector
        </span>
      </div>

      {/* Model Properties */}
      {selectedObject ? (
        <div data-testid="model-properties" className="flex flex-col gap-0.5">
          {/* Object name */}
          <div className="flex items-center gap-2 mb-1">
            <Box size={12} className="text-[#94A3B8]" />
            <span
              data-testid="object-name"
              className="text-xs text-[#F8FAFC] font-medium truncate"
            >
              {selectedObject.name}
            </span>
          </div>

          {/* Position */}
          <PropRow
            label="Position"
            values={selectedObject.position ?? [0, 0, 0]}
          />

          {/* Rotation */}
          <PropRow
            label="Rotation"
            values={selectedObject.rotation ?? [0, 0, 0]}
          />

          {/* Scale */}
          <PropRow
            label="Scale"
            values={selectedObject.scale ?? [1, 1, 1]}
          />

          {/* Vertex count */}
          <div className="flex items-center gap-2 pt-1 mt-1 border-t border-white/5">
            <Triangle size={11} className="text-[#94A3B8]" />
            <span className="text-xs text-[#94A3B8]">
              Vertices:{' '}
              <span
                data-testid="vertex-count"
                className="text-[#F8FAFC] font-mono"
              >
                {selectedObject.vertices?.length ?? 0}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <p
          data-testid="no-selection-message"
          className="text-xs text-[#94A3B8] italic"
        >
          Select an object to inspect.
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* AI Prompt */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="ai-refine-input"
          className="text-xs text-[#94A3B8] uppercase tracking-widest"
        >
          Refine with AI
        </label>
        <textarea
          id="ai-refine-input"
          data-testid="ai-prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the changes you want…"
          rows={3}
          disabled={isLoading}
          className="w-full resize-none rounded bg-[#0F0F0F] border border-white/10 text-xs text-[#F8FAFC] placeholder-[#94A3B8] px-2 py-1.5 font-mono focus:outline-none focus:border-[#7C3AED] transition-colors disabled:opacity-50"
        />
        <button
          data-testid="ai-refine-button"
          onClick={handleRefine}
          disabled={!prompt.trim() || !selectedObject || isLoading}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold text-white"
        >
          <Sparkles size={12} />
          {isLoading ? 'Refining…' : 'Refine'}
        </button>
      </div>
    </div>
  );
};

export default AIInspector;
