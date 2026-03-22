import React from 'react';

const STATS = [
  { val: '10,000+', label: 'Creators' },
  { val: '50,000+', label: 'Scenes Built' },
  { val: '4.9/5', label: 'Average Rating' },
  { val: '99.9%', label: 'Uptime' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Lead 3D Artist at Pixar',
    initials: 'SC',
    quote: 'Plenum3D has completely transformed my prototyping workflow. What used to take hours in Blender now takes minutes. The AI understands exactly what I need.',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Game Developer at Indie Studio',
    initials: 'MR',
    quote: 'The natural language editing is a game-changer. I can describe changes conversationally and the model updates instantly. My iteration speed has 10x.',
  },
  {
    name: 'Dr. Emma Park',
    role: 'Computer Vision Researcher',
    initials: 'EP',
    quote: 'For generating training data and 3D assets for ML pipelines, Plenum3D is unmatched. The GLB export integrates perfectly with our toolchain.',
  },
];

const TECH_LOGOS = ['REACT', 'THREE.JS', 'CLAUDE', 'NEON', 'VERCEL'];

const Stars = () => (
  <div className="flex gap-0.5 mb-4">
    {[...Array(5)].map((_, i) => (
      <span key={i} className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
        star
      </span>
    ))}
  </div>
);

export const SocialProof = () => (
  <section className="py-32 bg-[#0A0A0A] border-y border-[#1A1A1A]">
    <div className="max-w-[1440px] mx-auto px-12">
      {/* Header */}
      <div className="mb-20">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
          Trusted by the next generation<br />
          of <span className="text-[#A78BFA] italic">visionaries.</span>
        </h2>
        <p className="text-[#9CA3AF] max-w-2xl text-lg">
          Powering innovative 3D workflows, from indie developers to professional animation studios.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
        {STATS.map(({ val, label }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-4xl md:text-5xl font-black text-[#7C3AED] tracking-tighter">{val}</span>
            <span className="text-[#9CA3AF] font-medium uppercase text-[10px] tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div data-testid="testimonials-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            data-testid="testimonial-card"
            className="bg-[#1A1A1A] rounded-2xl p-8 border-t-4 border-[#7C3AED] shadow-2xl hover:bg-[#201f1f] transition-colors duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[#A78BFA] font-bold text-lg">{t.initials}</span>
              </div>
              <div>
                <h4 className="text-white font-bold">{t.name}</h4>
                <p className="text-[#9CA3AF] text-xs font-medium">{t.role}</p>
              </div>
            </div>
            <Stars />
            <blockquote className="text-white leading-relaxed text-sm italic">
              "{t.quote}"
            </blockquote>
          </div>
        ))}
      </div>

      {/* Tech logos */}
      <div>
        <p className="text-center text-[#9CA3AF] font-bold text-xs uppercase tracking-[0.2em] mb-12">
          Integrated with your favorite tools
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 hover:opacity-60 transition-opacity">
          {TECH_LOGOS.map(brand => (
            <span key={brand} className="text-2xl font-black text-white tracking-widest">{brand}</span>
          ))}
        </div>
      </div>
    </div>
  </section>
);
