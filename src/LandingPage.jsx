import React from 'react';
import { Hero } from './components/LandingPage/Hero';
import { Features } from './components/LandingPage/Features';

export default function LandingPage({ onLaunch }) {
  const handleLaunch = onLaunch || (() => { window.location.href = '/editor'; });
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Hero onLaunch={handleLaunch} />
      <Features />
    </div>
  );
}
