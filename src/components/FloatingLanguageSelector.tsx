import React from 'react';

interface FloatingLanguageSelectorProps {
  language: 'en' | 'vi';
  onLanguageChange: (lang: 'en' | 'vi') => void;
}

// Pixel-perfect vector flag for US
const USFlag = () => (
  <svg className="w-4 h-4 rounded-full object-cover shadow-sm" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path fill="#bd3d44" d="M0 0h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0z"/>
    <path fill="#eee" d="M0 39.4h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0z"/>
    <path fill="#192f5d" d="M0 0h204.8v275.8H0z"/>
    <g fill="#fff">
      <polygon points="23,38 29,56 46,56 32,66 37,84 23,73 9,84 14,66 0,56 17,56"/>
      <polygon points="69,38 75,56 92,56 78,66 83,84 69,73 55,84 60,66 46,56 63,56"/>
      <polygon points="115,38 121,56 138,56 124,66 129,84 115,73 101,84 106,66 92,56 109,56"/>
      <polygon points="161,38 167,56 184,56 170,66 175,84 161,73 147,84 152,66 138,56 155,56"/>
      <polygon points="46,84 52,102 69,102 55,112 60,130 46,119 32,130 37,112 23,102 40,102"/>
      <polygon points="92,84 98,102 115,102 101,112 106,130 92,119 78,130 83,112 69,102 86,102"/>
      <polygon points="138,84 144,102 161,102 147,112 152,130 138,119 124,130 129,112 115,102 132,102"/>
    </g>
  </svg>
);

// Pixel-perfect vector flag for Vietnam
const VNFlag = () => (
  <svg className="w-4 h-4 rounded-full object-cover shadow-sm" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#da251d"/>
    <polygon points="256,110 293,222 411,222 316,291 352,402 256,333 160,402 196,291 101,222 219,222" fill="#ffff00"/>
  </svg>
);

export default function FloatingLanguageSelector({ language, onLanguageChange }: FloatingLanguageSelectorProps) {
  return (
    <div 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[150] flex items-center gap-1.5 bg-[#0f172a]/95 border border-white/20 rounded-full p-1.5 shadow-2xl backdrop-blur-md hover:scale-105 hover:border-white/30 transition-all duration-300"
      id="floating-lang-switcher"
    >
      <div className="absolute bottom-full right-4 mb-2 bg-[#0f172a] text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md border border-white/10" id="floating-lang-tooltip">
        {language === 'vi' ? 'Dịch cả trang' : 'Translate entire page'}
      </div>

      <button 
        onClick={() => onLanguageChange('en')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 cursor-pointer ${
          language === 'en' 
            ? 'bg-gradient-to-r from-[#00314a] to-[#0082c3] text-white shadow-md scale-105' 
            : 'text-gray-400 hover:text-white'
        }`}
        title="English"
        id="floating-lang-en"
      >
        <USFlag />
        <span>EN</span>
      </button>
      
      {/* Pulsing visual separator */}
      <div className="w-1 h-1 rounded-full bg-[#38bdf8] animate-pulse mx-0.5" />

      <button 
        onClick={() => onLanguageChange('vi')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 cursor-pointer ${
          language === 'vi' 
            ? 'bg-gradient-to-r from-[#00314a] to-[#0082c3] text-white shadow-md scale-105' 
            : 'text-gray-400 hover:text-white'
        }`}
        title="Tiếng Việt"
        id="floating-lang-vi"
      >
        <VNFlag />
        <span>VI</span>
      </button>
    </div>
  );
}
