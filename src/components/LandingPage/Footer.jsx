import React from 'react';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'API Reference', 'Community', 'Status'],
  },
];

export const Footer = ({ onLaunch }) => (
  <footer className="bg-[#0e0e0e]">
    {/* Pre-footer CTA */}
    <section className="py-24 md:py-32 bg-[#0e0e0e] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#7C3AED]/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-[1440px] mx-auto px-12 flex flex-col items-center text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-none">
          Get started for free today
        </h2>
        <p className="text-[#9CA3AF] text-lg md:text-xl max-w-2xl mb-12 font-medium">
          No credit card required
        </p>
        <button
          onClick={onLaunch}
          className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white font-bold px-10 py-5 rounded-full hover:scale-[1.02] transition-all duration-300 shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_60px_rgba(124,58,237,0.4)] active:scale-95"
        >
          Start Building Free
        </button>
      </div>
    </section>

    {/* Main footer */}
    <div className="bg-[#111111] w-full">
      <div className="max-w-[1440px] mx-auto px-12 py-16 flex flex-col gap-16">
        {/* Link matrix */}
        <div data-testid="footer-columns" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="flex flex-col gap-6">
            <div className="text-2xl font-black text-white">
              Plenum<span className="text-[#7C3AED]">3D</span>
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-xs">
              AI-powered 3D modeling for the next generation of spatial computing.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/marcintreder/plenum3d"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[#9CA3AF] hover:text-[#A78BFA] hover:border-[#7C3AED]/50 transition-all"
              >
                <span className="material-symbols-outlined text-lg">code</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[#9CA3AF] hover:text-[#A78BFA] hover:border-[#7C3AED]/50 transition-all"
              >
                <span className="material-symbols-outlined text-lg">chat_bubble</span>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map(col => (
            <div key={col.title} className="flex flex-col gap-6" data-testid="footer-column">
              <h4 className="text-white font-bold tracking-wide uppercase text-xs">{col.title}</h4>
              <ul className="flex flex-col gap-4">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[#9CA3AF] font-medium hover:text-[#A78BFA] transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#2A2A2A] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-[#6B7280] tracking-wider">
            © 2025 Plenum3D. All rights reserved.
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-[#6B7280] tracking-wider hover:text-[#A78BFA] transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-[#6B7280] tracking-wider hover:text-[#A78BFA] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
