import React, { useState } from 'react';
import { ExternalLink, Layers, Terminal, Smartphone, Brain } from 'lucide-react';
import { PortfolioItem } from '../types';
import { translations } from '../translations';

interface PortfolioProps {
  language: 'en' | 'vi';
}

export default function Portfolio({ language }: PortfolioProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Web & SaaS' | 'Mobile Apps' | 'AI & Analytics'>('All');
  const t = translations[language];

  const tabsMap = [
    { id: 'All', label: t.portfolio.tabs.all },
    { id: 'Web & SaaS', label: t.portfolio.tabs.webSaaS },
    { id: 'Mobile Apps', label: t.portfolio.tabs.mobileApps },
    { id: 'AI & Analytics', label: t.portfolio.tabs.aiAnalytics }
  ] as const;

  const projects: PortfolioItem[] = [
    {
      title: t.portfolio.items[0].title,
      category: 'Web & SaaS',
      tech: ['Next.js', 'FastAPI', 'PostgreSQL', 'Gemini API'],
      description: t.portfolio.items[0].description,
      image: '🛍️'
    },
    {
      title: t.portfolio.items[1].title,
      category: 'Web & SaaS',
      tech: ['React.js', 'Express.js', 'WebRTC', 'Socket.io', 'MongoDB'],
      description: t.portfolio.items[1].description,
      image: '🏥'
    },
    {
      title: t.portfolio.items[2].title,
      category: 'AI & Analytics',
      tech: ['Python', 'YOLOv8', 'OpenCV', 'Django', 'React'],
      description: t.portfolio.items[2].description,
      image: '🚦'
    },
    {
      title: t.portfolio.items[3].title,
      category: 'Web & SaaS',
      tech: ['Solidity', 'Next.js', 'Ethers.js', 'Express', 'MySQL'],
      description: t.portfolio.items[3].description,
      image: '📦'
    },
    {
      title: t.portfolio.items[4].title,
      category: 'Mobile Apps',
      tech: ['Flutter', 'Node.js', 'Firebase Auth', 'TensorFlow Lite'],
      description: t.portfolio.items[4].description,
      image: '💪'
    },
    {
      title: t.portfolio.items[5].title,
      category: 'AI & Analytics',
      tech: ['Python', 'Scikit-learn', 'Flask', 'Recharts', 'React'],
      description: t.portfolio.items[5].description,
      image: '📊'
    }
  ];

  const filteredProjects = activeTab === 'All'
    ? projects
    : projects.filter(p => p.category === activeTab);

  const getTabIcon = (tabName: string) => {
    switch (tabName) {
      case 'Web & SaaS': return <Layers className="w-3.5 h-3.5" />;
      case 'Mobile Apps': return <Smartphone className="w-3.5 h-3.5" />;
      case 'AI & Analytics': return <Brain className="w-3.5 h-3.5" />;
      default: return <Terminal className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Web & SaaS': return t.portfolio.tabs.webSaaS;
      case 'Mobile Apps': return t.portfolio.tabs.mobileApps;
      case 'AI & Analytics': return t.portfolio.tabs.aiAnalytics;
      default: return cat;
    }
  };

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="portfolio">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-16">
        <span className="text-xs font-black tracking-widest text-[#0082c3] uppercase block">
          {t.portfolio.subtitle}
        </span>
        <h3 className="text-3xl md:text-4xl font-extrabold text-[#00314a] font-sans">
          {t.portfolio.title}
        </h3>
        <p className="max-w-2xl mx-auto text-gray-600 font-medium">
          {t.portfolio.desc}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2.5 mb-12" id="portfolio-tabs">
        {tabsMap.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-[#0082c3]/10 text-[#0082c3] border border-[#0082c3]/20' 
                : 'bg-white text-gray-500 hover:text-gray-900 border border-transparent'
            }`}
          >
            {getTabIcon(tab.id)}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="portfolio-grid">
        {filteredProjects.map((project, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-3xl border border-[#004d73]/10 overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#0082c3] transition-all duration-300 flex flex-col justify-between group"
          >
            {/* Project visual banner mock */}
            <div className="h-44 bg-gradient-to-br from-[#00314a]/5 to-[#0082c3]/10 relative flex items-center justify-center border-b border-[#004d73]/5">
              <span className="text-5xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300 select-none">
                {project.image}
              </span>
              <span className="absolute top-4 right-4 text-[10px] font-black text-[#004d73] bg-white border border-[#004d73]/10 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {getCategoryLabel(project.category)}
              </span>
            </div>

            {/* Description details */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <h4 className="text-base font-extrabold text-[#00314a] font-sans leading-snug tracking-tight">
                  {project.title}
                </h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Technologies list */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech, tIdx) => (
                    <span 
                      key={tIdx} 
                      className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

