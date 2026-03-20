import React from 'react';
import { ArrowRight, Bot, Code, Box, Layers, Zap, Palette } from 'lucide-react';

const LandingPage = ({ onLogin }) => {
  const theme = {
    background: "#0A0A0A",
    primary: "#7C3AED",
    text: "#F8FAFC",
  };

  const features = [
    { icon: <Bot size={28} />, title: "AI-Powered Editor", desc: "Collaborate with a context-aware AI agent to refine your 3D objects with natural language." },
    { icon: <Code size={28} />, title: "Live R3F Code Sync", desc: "Bi-directional editor: edit props in code or interact directly with the 3D canvas." },
    { icon: <Box size={28} />, title: "Procedural Engine", desc: "Build modular JavaScript-based 3D structures with precision control." },
    { icon: <Layers size={28} />, title: "High-Fidelity PBR", desc: "Advanced material system with roughness, metalness, normal, and bump mapping." },
    { icon: <Zap size={28} />, title: "Interactive Canvas", desc: "Real-time viewport with advanced lighting and shadow-mapping." },
    { icon: <Palette size={28} />, title: "Design Tokens", desc: "AI-generated UI tokens powered by Google Stitch design intelligence." }
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Hero Section */}
      <nav className="flex items-center justify-between px-12 py-8">
        <span className="text-xl font-bold tracking-tight text-white">Plenum3D</span>
        <button onClick={onLogin} className="text-sm text-gray-400 hover:text-white transition-colors">Login</button>
      </nav>

      <main className="flex flex-col items-center flex-1 px-4 py-20 text-center">
        <div className="max-w-4xl space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight" style={{ color: theme.text }}>
            The AI-first editor for 3D JavaScript.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Plenum3D transforms how you build and refine React Three Fiber scenes. Bridge the gap between visual 3D design and production-ready code.
          </p>
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 mx-auto px-10 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: theme.primary, color: 'white' }}
          >
            Launch Plenum Editor
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Feature Grid - Inspired by Stitch clean, modular layouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24 max-w-6xl w-full">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col items-start gap-4 p-8 rounded-2xl border border-white/5 bg-[#121212] hover:border-white/10 transition-colors">
              <div className="p-3 rounded-lg bg-[#1A1A1A] text-[#7C3AED]">{f.icon}</div>
              <h3 className="text-xl font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-gray-400 text-left leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
