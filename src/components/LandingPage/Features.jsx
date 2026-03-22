import React from 'react';

const FEATURES = [
  {
    icon: 'auto_awesome',
    title: 'AI Generation',
    desc: 'Describe any 3D object in natural language. Claude interprets your prompt and generates precise geometry instantly — no manual vertex manipulation required.',
  },
  {
    icon: 'chat',
    title: 'Natural Language Edits',
    desc: 'Move, scale, rotate, recolor with plain English commands. No menus, no sliders — just describe what you want and the scene updates immediately.',
  },
  {
    icon: 'deployed_code',
    title: 'Primitive Sculpting',
    desc: 'Start from boxes, spheres, cylinders, or lathe shapes. Combine and modify primitives to build complex models with a non-destructive workflow.',
  },
  {
    icon: 'layers',
    title: 'Multi-Scene Tabs',
    desc: 'Work across multiple scenes simultaneously with Figma-inspired tabs. Switch context instantly without losing your progress on any open scene.',
  },
  {
    icon: 'download',
    title: 'GLB Export',
    desc: 'Export any scene as production-ready GLB files. Drop your models directly into Three.js, Unity, Blender, or any 3D pipeline without conversion.',
  },
  {
    icon: 'cloud_done',
    title: 'Cloud Sync',
    desc: 'All your scenes are saved automatically to the cloud. Access your work from any device, anytime — your 3D world follows you everywhere.',
  },
];

export const Features = () => (
  <section id="features" className="py-32 bg-[#0e0e0e]">
    <div className="max-w-[1440px] mx-auto px-12">
      {/* Header */}
      <div className="mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#7C3AED] shadow-[0_0_8px_#7C3AED]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A78BFA]">Now in Beta</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-6 max-w-3xl">
          Everything you need to create in 3D
        </h2>
        <p className="text-xl text-[#9CA3AF] max-w-2xl leading-relaxed">
          Powerful tools for creators, artists, and developers. Build complex scenes with intuitive natural language and high-precision sculpting tools.
        </p>
      </div>

      {/* Feature grid */}
      <div data-testid="features-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            data-testid="feature-card"
            className="group bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#7C3AED]/40 p-8 rounded-2xl flex flex-col items-start gap-6 transition-all duration-300 hover:bg-[#201f1f] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7C3AED]/10"
          >
            <div className="w-12 h-12 bg-[#7C3AED]/20 rounded-xl flex items-center justify-center border border-[#7C3AED]/30">
              <span className="material-symbols-outlined text-[#A78BFA] text-xl">{f.icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-[#9CA3AF] leading-relaxed text-sm">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Visual anchor */}
      <div className="mt-24 grid md:grid-cols-2 items-center gap-16">
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#151515] border border-[#2A2A2A]">
          {/* Grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(90deg, #7C3AED 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
          {/* Floating glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#7C3AED]/25 blur-3xl rounded-full" />
          {/* Viewport overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#1A1A1A]/90 backdrop-blur border border-[#333] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest">Viewport Console</div>
              <div className="text-[10px] text-[#9CA3AF] font-mono">X: 124.5  Y: 0.0  Z: -42.1</div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-white mb-6 leading-tight">
            Engineered for the next generation of 3D creators
          </h3>
          <p className="text-[#9CA3AF] mb-8 leading-relaxed">
            Plenum3D isn't just another modeling tool. It's an environment built to collapse the distance between thought and creation. By removing the friction of complex menus, we let you focus on what matters: the form.
          </p>
          <div className="flex flex-col gap-4">
            {[
              'Sub-millisecond latency for real-time manipulation',
              'Cross-platform sync via Neon PostgreSQL',
              'Four AI providers: Claude, GPT, Gemini, and local Ollama',
            ].map(point => (
              <div key={point} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#7C3AED] mt-0.5 text-lg">check_circle</span>
                <p className="text-sm text-white">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
