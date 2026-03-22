import React from 'react';

export const Hero = ({ onLaunch }) => (
  <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0e0e0e]">
    {/* Fixed nav */}
    <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex justify-between items-center px-12 py-5 max-w-[1440px] mx-auto">
        <div className="text-xl font-black tracking-tighter text-white">
          Plenum<span className="text-[#7C3AED]">3D</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Gallery', 'Pricing', 'Docs'].map(link => (
            <a key={link} className="text-[#9CA3AF] hover:text-white transition-colors font-medium text-sm" href={`#${link.toLowerCase()}`}>{link}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[#9CA3AF] hover:text-white transition-colors text-sm font-medium px-4 py-2">
            Sign in
          </button>
          <button
            onClick={onLaunch}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-6 py-2.5 rounded-full transition-all text-sm shadow-lg shadow-[#7C3AED]/25 active:scale-95"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </nav>

    {/* Ambient glow */}
    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#7C3AED]/15 blur-[120px] rounded-full pointer-events-none" />
    <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#A78BFA]/8 blur-[160px] rounded-full pointer-events-none" />

    {/* Hero content */}
    <main className="max-w-[1440px] mx-auto px-12 pt-40 pb-24 w-full flex-1 relative z-10">
      <div className="grid lg:grid-cols-12 gap-16 items-center">
        {/* Left: text */}
        <div className="lg:col-span-6 flex flex-col items-start gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] rounded-full border border-[#333]">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] shadow-[0_0_8px_#7C3AED]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A78BFA]">Powered by Claude AI</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.92] text-white">
            AI-Powered<br />
            3D Modeling<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]">For Everyone</span>
          </h1>

          <p className="text-xl text-[#9CA3AF] leading-relaxed max-w-lg">
            Describe any 3D object in plain English. Claude interprets your prompt and generates precise geometry instantly — no menus, no sliders.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={onLaunch}
              className="px-8 py-4 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white font-bold rounded-full shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] hover:shadow-[0_0_50px_-5px_rgba(124,58,237,0.6)] transition-all hover:scale-[1.02] active:scale-95"
            >
              Start Building Free
            </button>
            <a
              href="https://github.com/marcintreder/plenum3d/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-transparent border border-[#333] hover:border-[#7C3AED]/50 text-white font-bold rounded-full transition-all hover:bg-[#1A1A1A] active:scale-95"
            >
              View on GitHub
            </a>
          </div>

          <p className="text-xs text-[#6B7280]">No credit card required · Works in your browser</p>

          {/* Stats row */}
          <div className="pt-8 grid grid-cols-3 gap-8 w-full border-t border-white/5">
            {[
              { val: '10K+', label: 'Creators' },
              { val: '50K+', label: 'Scenes Built' },
              { val: '4.9/5', label: 'Rating' },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="text-2xl font-black text-white">{val}</div>
                <div className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D viewport mockup */}
        <div className="lg:col-span-6 relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-[#7C3AED]/15 to-transparent blur-2xl opacity-50 rounded-3xl" />
          <div className="relative bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden shadow-2xl">
            {/* Viewport header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2A2A2A] bg-[#151515]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-[11px] text-[#6B7280] font-mono">plenum3d — Scene Editor</span>
            </div>

            {/* Viewport body */}
            <div className="relative aspect-video bg-[#0F0F0F] flex items-center justify-center overflow-hidden">
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(90deg, #7C3AED 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }} />
              {/* Glowing orbs */}
              <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-[#7C3AED]/30 blur-3xl rounded-full" />
              <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-[#A78BFA]/20 blur-2xl rounded-full" />

              {/* UI overlays */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-[#1A1A1A]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[#333]">
                  <span className="text-[#A78BFA] text-xs font-mono">▸ GEOMETRY: MESH</span>
                </div>
                <div className="flex items-center gap-2 bg-[#1A1A1A]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[#333]">
                  <span className="text-[#9CA3AF] text-[10px] font-mono">POLYCOUNT: 2.4M</span>
                </div>
              </div>

              {/* AI prompt overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#1A1A1A]/90 backdrop-blur border border-[#7C3AED]/30 rounded-xl p-4">
                <div className="text-[11px] text-[#6B7280] mb-2 uppercase tracking-widest font-semibold">AI Prompt</div>
                <div className="text-sm text-white font-medium">Generate a futuristic spacecraft with glowing engines…</div>
                <div className="mt-2 h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-full" />
                </div>
              </div>

              {/* Corner decoration */}
              <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#7C3AED]/30 rounded-tr-xl" />
              <div className="absolute bottom-16 left-4 text-[10px] text-[#7C3AED]/60 font-mono">X: 0.0  Y: 1.2  Z: -3.5</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    {/* Scroll hint */}
    <div className="text-center pb-8 relative z-10">
      <span className="text-[10px] text-[#6B7280] uppercase tracking-widest font-semibold">Scroll to explore</span>
    </div>
  </section>
);
