import React, { useState } from 'react';
import { Layout, Server, Database, BrainCircuit, Sparkles, CheckCircle2 } from 'lucide-react';
import { TechItem } from '../types';
import { translations } from '../translations';

interface TechStackProps {
  language: 'en' | 'vi';
}

export default function TechStack({ language }: TechStackProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Frontend' | 'Backend' | 'Database' | 'Mobile & AI'>('All');
  const t = translations[language];

  const categoriesMap = [
    { id: 'All', label: t.tech.categories.all },
    { id: 'Frontend', label: t.tech.categories.frontend },
    { id: 'Backend', label: t.tech.categories.backend },
    { id: 'Database', label: t.tech.categories.database },
    { id: 'Mobile & AI', label: t.tech.categories.mobileAI }
  ] as const;

  const technologies: TechItem[] = [
    { name: 'React / Next.js', category: 'Frontend', icon: '💻' },
    { name: 'Tailwind CSS', category: 'Frontend', icon: '🎨' },
    { name: 'TypeScript / JS', category: 'Frontend', icon: '⚡' },
    { name: 'Vue.js / Nuxt', category: 'Frontend', icon: '💚' },
    { name: 'HTML5 & CSS3', category: 'Frontend', icon: '🌐' },
    
    { name: 'Node.js / Express', category: 'Backend', icon: '🟢' },
    { name: 'Python / FastAPI', category: 'Backend', icon: '🐍' },
    { name: 'Django / Flask', category: 'Backend', icon: '🔥' },
    { name: 'Java / Spring Boot', category: 'Backend', icon: '☕' },
    { name: 'C# / ASP.NET Core', category: 'Backend', icon: '🎯' },
    { name: 'PHP / Laravel', category: 'Backend', icon: '🐘' },

    { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
    { name: 'MySQL / MariaDB', category: 'Database', icon: '🐬' },
    { name: 'MongoDB', category: 'Database', icon: '🍃' },
    { name: 'Redis Cache', category: 'Database', icon: '🔴' },
    { name: 'Microsoft SQL Server', category: 'Database', icon: '💽' },

    { name: 'Flutter / Dart', category: 'Mobile & AI', icon: '📱' },
    { name: 'React Native', category: 'Mobile & AI', icon: '⚛️' },
    { name: 'OpenAI / Gemini API', category: 'Mobile & AI', icon: '🤖' },
    { name: 'LangChain & Vector DB', category: 'Mobile & AI', icon: '🧠' },
    { name: 'Computer Vision / OpenCV', category: 'Mobile & AI', icon: '👁️' },
    { name: 'TensorFlow / PyTorch', category: 'Mobile & AI', icon: '🔬' }
  ];

  const filteredTechs = activeCategory === 'All' 
    ? technologies 
    : technologies.filter(t => t.category === activeCategory);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Frontend': return <Layout className="w-4 h-4" />;
      case 'Backend': return <Server className="w-4 h-4" />;
      case 'Database': return <Database className="w-4 h-4" />;
      case 'Mobile & AI': return <BrainCircuit className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white via-[#f0f7fb] to-white relative" id="tech-stack">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        
        {/* Title */}
        <div className="text-center space-y-4 mb-14">
          <span className="text-xs font-black tracking-widest text-[#0082c3] uppercase block">
            {t.tech.subtitle}
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#00314a] font-sans">
            {t.tech.title}
          </h3>
          <p className="max-w-2xl mx-auto text-gray-600 font-medium">
            {t.tech.desc}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12" id="tech-filters">
          {categoriesMap.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                activeCategory === cat.id 
                  ? 'bg-[#00314a] text-white shadow-[#00314a]/20 scale-105' 
                  : 'bg-white/80 backdrop-blur-md text-[#004d73] border border-[#004d73]/10 hover:border-[#0082c3] hover:text-[#0082c3]'
              }`}
            >
              {getCategoryIcon(cat.id)}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5" id="tech-items-grid">
          {filteredTechs.map((tech, idx) => (
            <div 
              key={idx}
              className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-[#004d73]/10 text-center flex flex-col items-center justify-center gap-3.5 hover:shadow-xl hover:border-[#0082c3] hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-3xl filter drop-shadow-md select-none">{tech.icon}</span>
              <div>
                <h4 className="text-xs font-extrabold text-[#00314a] font-sans truncate max-w-full">{tech.name}</h4>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mt-1">
                  {tech.category === 'Mobile & AI' ? t.tech.categories.mobileAI : tech.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Floating tech support note */}
        <div className="mt-12 text-center" id="tech-footer-note">
          <div className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0082c3]/5 border border-[#0082c3]/15 text-sm font-bold text-[#004d73]">
            <CheckCircle2 className="w-5 h-5 text-[#0082c3]" />
            {t.tech.footerNote}
          </div>
        </div>

      </div>
    </section>
  );
}

