import React from 'react';
import { Layers, Bot, Compass, History } from 'lucide-react';

export const Features = ({ design }) => (
  <section className="py-20 px-8 max-w-6xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        { icon: <Layers />, title: "Layer Architecture", desc: "Complex nested scene management." },
        { icon: <Bot />, title: "Generative AI", desc: "Semantic shape refinement." },
        { icon: <Compass />, title: "Real-time Panning", desc: "Professional canvas control." },
        { icon: <History />, title: "Non-destructive", desc: "History and state restoration." }
      ].map((f, i) => (
        <div key={i} className="p-6 bg-[#1A1A1A] rounded-xl border border-[#333]">
          <div className="text-purple-500 mb-4">{f.icon}</div>
          <h3 className="font-bold text-white mb-2">{f.title}</h3>
          <p className="text-gray-400 text-sm">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);
