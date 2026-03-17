import React, { useState } from 'react';

const CodeCopyPanel = ({ codeContent }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
      <button 
        onClick={handleCopy}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {copied ? 'Copied!' : 'Copy Code'}
      </button>
    </div>
  );
};

export default CodeCopyPanel;
