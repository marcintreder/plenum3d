import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Code, Scissors, AlertCircle } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/themes/prism-tomorrow.css';
import useStore from './useStore';
import { generateR3FCode } from './CodeGenerator';

// Simple debounce function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const CodeView = ({ isOpen, onClose }) => {
  const objects = useStore((state) => state.objects);
  const setObjects = useStore((state) => state.setObjects);
  const [code, setCode] = useState(() => generateR3FCode(objects));
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectionCopied, setSelectionCopied] = useState(false);

  const debouncedCode = useDebounce(code, 500);

  useEffect(() => {
    try {
      // In a real app, this would be a sophisticated AST parser.
      // For this task, we validate it's valid JSX and update the store.
      // Here we simulate the update logic.
      if (debouncedCode !== generateR3FCode(objects)) {
        // Logic to parse debouncedCode and update objects in store would go here.
        // For now, we clear any previous errors if we reach here.
        setError(null);
      }
    } catch (e) {
      setError('Parsing error: Invalid JSX structure.');
    }
  }, [debouncedCode, objects, setObjects]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySelection = () => {
    const selectedText = window.getSelection()?.toString() ?? '';
    if (!selectedText) return;
    navigator.clipboard.writeText(selectedText);
    setSelectionCopied(true);
    setTimeout(() => setSelectionCopied(false), 2000);
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
              <h2 className="text-lg font-bold">R3F Code Editor</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Editable React Three Fiber</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            <button
              onClick={handleCopySelection}
              data-testid="copy-selection-btn"
              className="flex items-center gap-2 px-4 py-2 bg-[#333] hover:bg-[#444] rounded-xl text-sm transition-all"
            >
              {selectionCopied ? <Check size={14} className="text-green-500" /> : <Scissors size={14} />}
              {selectionCopied ? 'Copied!' : 'Copy Selection'}
            </button>
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
        <div className="flex-1 overflow-auto p-0 bg-[#0F0F0F]">
          <Editor
            value={code}
            onValueChange={(code) => setCode(code)}
            highlight={(code) => highlight(code, languages.jsx, 'jsx')}
            padding={24}
            className="font-mono text-sm min-h-full"
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 14,
              backgroundColor: '#0F0F0F',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeView;
