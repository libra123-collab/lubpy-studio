import React from 'react';
import { ArrowRight, ChevronDown, Code, Sparkles, Terminal } from 'lucide-react';
import { translations } from '../translations';
import { User } from '../types';

import { AuthViewMode } from './AuthModal';

interface HeroProps {
  onOpenRequestModal: () => void;
  onOpenAuthModal: (mode?: 'login' | 'signup', view?: AuthViewMode) => void;
  user: User | null;
  language: 'en' | 'vi';
}

export default function Hero({ onOpenRequestModal, onOpenAuthModal, user, language }: HeroProps) {
  const handleScrollToNext = () => {
    const nextSection = document.querySelector('#about');
    if (nextSection) {
      const headerOffset = 90;
      const elementPosition = nextSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleStartProjectClick = () => {
    if (user) {
      onOpenRequestModal();
    } else {
      onOpenAuthModal('signup');
    }
  };

  const t = translations[language];

  return (
    <main className="hero-content relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20" id="hero-main">
      {/* Decorative programming ambient badges */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 animate-fade-in" id="hero-badges">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white tracking-wider uppercase shadow-lg">
          <Terminal className="w-3.5 h-3.5 text-[#82c7f2]" />
          {t.hero.delivery}
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0082c3]/15 backdrop-blur-md border border-[#0082c3]/30 text-xs font-bold text-[#82c7f2] tracking-wider uppercase shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#0082c3]" />
          {t.hero.customCode}
        </div>
      </div>

      {/* Main Branding Title */}
      <div className="title-group flex flex-col items-center mb-8 relative" id="hero-titles">
        <h1 className="title-water tracking-tight uppercase" id="title-water">
          {t.hero.waterMark}
        </h1>
        <h2 className="subtitle-space text-center uppercase" id="subtitle-space">
          {t.hero.subWaterMark}
        </h2>
        
        {/* Soft elegant ambient branding subtitle */}
        <p className="max-w-2xl text-sm md:text-base text-slate-100 font-medium tracking-wider leading-relaxed mt-6 px-6 py-4 rounded-2xl bg-black/45 backdrop-blur-sm border border-white/5 shadow-xl font-sans" id="hero-pitch">
          {t.hero.pitch}
        </p>
      </div>

      {/* Single CTA Action Button */}
      <div className="relative z-20 group" id="hero-cta-section">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-[#0082c3] to-[#82c7f2] rounded-full blur-xl opacity-40 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300" />
        <button 
          onClick={handleStartProjectClick}
          className="relative px-8 py-5 md:px-10 md:py-6 bg-gradient-to-r from-[#00314a] to-[#0082c3] text-white font-black text-sm md:text-base tracking-widest uppercase rounded-full shadow-2xl flex items-center gap-3 hover:from-[#004d73] hover:to-[#00a3f5] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-cyan-900/10 active:translate-y-0 cursor-pointer"
          id="btn-start-project"
        >
          <span>{t.hero.startBtn}</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>

      {/* Elegant visual key features overlay above fold */}
      <div className="hidden md:flex justify-center items-center gap-12 mt-16 text-[#00314a] font-sans font-bold text-xs tracking-wider" id="hero-bullets">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0082c3]" />
          <span>{t.hero.cleanSource}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0082c3]" />
          <span>{t.hero.secureOnTime}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0082c3]" />
          <span>{t.hero.coachingSupport}</span>
        </div>
      </div>

      {/* Chevron down indicator */}
      <button 
        onClick={handleScrollToNext}
        className="chevron-container absolute bottom-8 cursor-pointer hover:scale-110 transition-transform focus:outline-none" 
        id="chevron-down"
        aria-label="Scroll down to details"
      >
        <ChevronDown className="w-6 h-6 text-[#0082c3] animate-bounce" />
      </button>
    </main>
  );
}

