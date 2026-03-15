import React, { useEffect, useRef } from 'react';

const TYPE_COLORS = {
  info:    'text-gray-400',
  success: 'text-green-400',
  warn:    'text-yellow-400',
  error:   'text-red-400',
};

const TYPE_PREFIX = {
  info:    '·',
  success: '✓',
  warn:    '⚠',
  error:   '✗',
};

const ConsolePanel = ({ logs, isOpen }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  return (
    <div
      className={`mb-2 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-[168px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div
        className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-y-auto max-h-[168px] p-3 space-y-0.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
      >
        {logs.length === 0 ? (
          <p className="text-[10px] text-gray-600 font-mono italic">No output yet. Start a generation or agent command.</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex gap-2 items-baseline">
              <span className="text-[9px] text-gray-600 font-mono shrink-0 tabular-nums">
                {entry.ts}
              </span>
              <span className={`text-[10px] font-mono shrink-0 ${TYPE_COLORS[entry.type]}`}>
                {TYPE_PREFIX[entry.type]}
              </span>
              <span className={`text-[10px] font-mono leading-5 break-all ${TYPE_COLORS[entry.type]}`}>
                {entry.msg}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ConsolePanel;
