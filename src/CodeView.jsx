import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';
import useStore from './useStore';
import { generateR3FCode } from './CodeGenerator';

const CodeView = ({ isOpen, onClose }) => {
  const objects = useStore((state) => state.objects);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const code = generateR3FCode(objects);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
      <div className="bg-[#1A1A1A] border border-[#333] w-full max-w-4xl h-full flex flex-col rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
              <Code size={18} className="text-[#7C3AED]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">R3F Code Export</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">React Three Fiber • JSX</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-[#333] hover:bg-[#444] rounded-xl text-sm transition-all"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#333] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-[#0F0F0F]">
          <pre className="text-sm font-mono text-gray-400 selection:bg-[#7C3AED]/30">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeView;
