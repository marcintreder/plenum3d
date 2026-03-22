import React from 'react';
import { PlenumDesignSystem } from './designSystem';
import { Hero } from './components/LandingPage/Hero';
import { Features } from './components/LandingPage/Features';
import { SocialProof } from './components/LandingPage/SocialProof';
import { Footer } from './components/LandingPage/Footer';

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: PlenumDesignSystem.theme.background, color: PlenumDesignSystem.theme.text, fontFamily: PlenumDesignSystem.theme.font }} className="min-h-screen">
      <nav className="flex justify-between items-center p-8 max-w-6xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter">Plenum3D</div>
        <button className="text-sm font-bold bg-[#1A1A1A] px-6 py-2 rounded-full border border-[#333]">Sign in</button>
      </nav>
      <Hero design={PlenumDesignSystem.components.hero} onLaunch={() => window.location.href = '/editor'} />
      <Features design={PlenumDesignSystem.components.features} />
      <SocialProof />
      <Footer />
    </div>
  );
}
