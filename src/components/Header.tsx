import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, UserCheck, Shield, ChevronDown, Building2, User as UserIcon, Crown } from 'lucide-react';
import { translations } from '../translations';
import { User, UserRole } from '../types';
import { AuthViewMode, GoogleIcon } from './AuthModal';

interface HeaderProps {
  onOpenRequestModal: () => void;
  language: 'en' | 'vi';
  onLanguageChange: (lang: 'en' | 'vi') => void;
  user: User | null;
  onOpenAuthModal: (mode?: 'login' | 'signup', view?: AuthViewMode) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: User) => void;
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

export default function Header({ onOpenRequestModal, language, onLanguageChange, user, onOpenAuthModal, onLogout, onUpdateUser }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = (e: React.MouseEvent, selectorId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (selectorId === '#home') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }

    const element = document.querySelector(selectorId);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const t = translations[language];

  const getRoleLabel = (role: UserRole | string) => {
    switch (role) {
      case 'client': return language === 'vi' ? 'Khách' : 'Client';
      case 'tech': return language === 'vi' ? 'Kỹ thuật' : 'Tech';
      case 'cs': return language === 'vi' ? 'Hỗ trợ' : 'CS';
      case 'hr': return language === 'vi' ? 'Nhân sự' : 'HR';
      case 'accounting': return language === 'vi' ? 'Kế toán' : 'Accounting';
      case 'admin': return 'Admin';
      default: return role || (language === 'vi' ? 'Thành viên' : 'Member');
    }
  };

  const getRoleStyle = (role: UserRole | string) => {
    switch (role) {
      case 'client': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'tech': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'cs': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'hr': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'accounting': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'admin': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const navItems = [
    { label: t.nav.home, href: '#home', key: 'home' },
    { label: t.nav.about, href: '#about', key: 'about' },
    { label: t.nav.techStack, href: '#tech-stack', key: 'tech-stack' },
    { label: t.nav.processPricing, href: '#process-pricing', key: 'process-pricing' },
    { label: t.nav.portfolio, href: '#portfolio', key: 'portfolio' },
    { label: t.nav.faqs, href: '#faqs', key: 'faqs' },
  ];

  return (
    <>
      <header 
        className={`header ${scrolled ? 'header-scrolled bg-[#0f172a]/75 backdrop-blur-md shadow-xl border-b border-white/10' : 'bg-[#0f172a]/55 border-b border-white/5'}`} 
        id="header"
      >
        {/* Brand Logo & Name */}
        <a 
          href="#" 
          className="logo-link flex items-center gap-3.5 group" 
          onClick={(e) => handleScrollToSection(e, '#home')} 
          aria-label="LUBPY STUDIO Brand Logo" 
          id="logo-brand"
        >
          <div className="relative flex items-center justify-center w-11 h-11 bg-gradient-to-tr from-[#00314a] to-[#0082c3] rounded-xl shadow-lg shadow-[#004d73]/20 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-7 h-7 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="16 8" />
              <path d="M 50 12 C 71 12, 88 29, 88 50 C 88 71, 71 88, 50 88 C 44 88, 32 84, 25 76 C 30 81, 40 84, 48 83 C 67 81, 81 66, 81 48 C 81 29, 66 15, 48 15 C 38 15, 28 20, 22 28 C 28 18, 38 12, 50 12 Z" fill="currentColor" />
              <path d="M 23 77 L 85 15 L 61 41 C 55 45, 52 47, 48 52 Z" fill="currentColor" />
              <path d="M 23 77 C 32 68, 42 58, 48 52 C 40 45, 27 38, 27 38 C 27 38, 39 46, 45 51 C 47 53, 51 59, 56 67 C 53 62, 49 55, 49 52 C 49 48, 54 44, 58 40 C 62 36, 72 30, 72 30 C 72 30, 62 34, 55 38 Z" fill="currentColor" />
            </svg>
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#82c7f2] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
          <span className="text-xl md:text-2xl font-black font-sans tracking-tight text-white select-none uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" id="brand-text">
            LUBPY <span className="text-[#38bdf8]">STUDIO</span>
          </span>
        </a>

        {/* Desktop Navigation (Only visible on screens > 1150px) */}
        <div className="desktop-nav-container" id="desktop-nav-container">
          <nav className="nav-links" id="nav-links">
            {navItems.map((item) => (
              <a 
                key={item.key}
                href={item.href} 
                className="nav-link" 
                onClick={(e) => handleScrollToSection(e, item.href)} 
                id={`desktop-nav-${item.key}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 ml-6" id="desktop-actions">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-900/60 border border-white/10 rounded-full pl-2 pr-4 py-1.5 backdrop-blur-md shadow-lg" id="desktop-auth-profile">
                <img 
                  src={user.photoUrl} 
                  alt={user.name} 
                  className="w-7 h-7 rounded-full border border-sky-400/40 object-cover bg-slate-950" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white max-w-[85px] truncate leading-tight">{user.name}</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border mt-0.5 text-center leading-none ${getRoleStyle(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <button 
                  onClick={onLogout}
                  className="ml-2 text-[9px] font-black tracking-wider uppercase text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                  id="desktop-logout-btn"
                >
                  {language === 'vi' ? 'Thoát' : 'Exit'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2" id="desktop-auth-group">
                {/* SIGN UP Button - Triggers Modal */}
                <button 
                  className="px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white font-sans font-extrabold uppercase text-xs tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer" 
                  onClick={() => onOpenAuthModal('signup', 'signup-client')}
                  id="desktop-btn-signup"
                >
                  <UserIcon className="w-3.5 h-3.5 text-sky-200" />
                  <span>{t.nav.signUp}</span>
                </button>

                {/* LOG IN Button - Triggers Modal */}
                <button 
                  className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-gray-100 border border-white/10 font-sans font-extrabold uppercase text-xs tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer" 
                  onClick={() => onOpenAuthModal('login', 'login-client')}
                  id="desktop-btn-login"
                >
                  <span>{t.nav.logIn}</span>
                </button>
              </div>
            )}

            {/* Language Switcher Capsule */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-white/10 rounded-full p-1.5 shadow-lg backdrop-blur-md" id="desktop-lang-switcher">
              <button 
                onClick={() => onLanguageChange('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 cursor-pointer ${
                  language === 'en' 
                    ? 'bg-gradient-to-r from-[#00314a] to-[#0082c3] text-white shadow-md scale-105' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="English"
                id="desktop-lang-en"
              >
                <USFlag />
                <span className="ml-1">EN</span>
              </button>
              
              <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse mx-0.5" />

              <button 
                onClick={() => onLanguageChange('vi')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 cursor-pointer ${
                  language === 'vi' 
                    ? 'bg-gradient-to-r from-[#00314a] to-[#0082c3] text-white shadow-md scale-105' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Tiếng Việt"
                id="desktop-lang-vi"
              >
                <VNFlag />
                <span className="ml-1">VI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hamburger toggle button (Z-index 1001 so it sits above the mobile drawer when active) */}
        <button 
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          id="menu-toggle"
          style={{ zIndex: 1001 }}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </header>

      {/* Mobile Navigation Drawer (Rendered OUTSIDE <header> to avoid browser blur filter rendering bugs) */}
      <div 
        className={`mobile-nav-container ${mobileMenuOpen ? 'open' : ''}`} 
        id="mobile-drawer"
      >
        <div className="flex flex-col h-full justify-between w-full" id="mobile-drawer-content">
          <nav className="mobile-nav-links" id="mobile-nav-links">
            {navItems.map((item) => (
              <a 
                key={item.key}
                href={item.href} 
                className="mobile-nav-link" 
                onClick={(e) => handleScrollToSection(e, item.href)} 
                id={`mobile-nav-${item.key}`}
              >
                <span>{item.label}</span>
                <span className="text-[#38bdf8] text-xs font-light">→</span>
              </a>
            ))}
          </nav>

          <div className="mobile-actions-capsule" id="mobile-actions">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-900/60 border border-white/10 rounded-xl p-3 w-full backdrop-blur-md shadow-lg mb-2" id="mobile-auth-profile">
                <img 
                  src={user.photoUrl} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full border border-sky-400/40 object-cover bg-slate-950" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{user.name}</span>
                  <span className="text-[10px] font-mono text-gray-400 truncate">{user.email}</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border mt-1 text-center w-fit ${getRoleStyle(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                  id="mobile-logout-btn"
                >
                  {language === 'vi' ? 'Thoát' : 'Exit'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full" id="mobile-auth-group">
                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-0.5">Tùy Chọn Đăng Nhập / Đăng Ký</div>
                <div className="flex flex-col gap-2">
                  <button 
                    className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-900 font-sans font-extrabold text-[11px] rounded-xl text-center cursor-pointer flex items-center justify-center gap-2 shadow-md border border-slate-200" 
                    onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('signup', 'signup-client'); }} 
                    id="mobile-btn-signup-google"
                  >
                    <GoogleIcon />
                    <span>🚀 Đăng Ký Nhanh Bằng Google (@gmail.com)</span>
                  </button>

                  <button 
                    className="py-2 px-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-sans font-bold text-[10px] rounded-xl text-center cursor-pointer flex items-center justify-center gap-2 shadow-md" 
                    onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('signup', 'signup-client'); }} 
                    id="mobile-btn-signup-client"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>📝 Form Đăng Ký Khách Hàng (3 Bước)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="py-2 px-2 bg-sky-900/60 hover:bg-sky-900 border border-sky-500/30 text-white font-sans font-bold text-[10px] rounded-xl text-center cursor-pointer flex flex-col items-center justify-center gap-0.5" 
                      onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('login', 'login-client'); }} 
                      id="mobile-btn-login-client"
                    >
                      <span>🔑 Đăng Nhập</span>
                      <span className="text-[9px] text-sky-300 opacity-90">Khách Hàng / Học Viên</span>
                    </button>

                    <button 
                      className="py-2 px-2 bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-500/30 text-white font-sans font-bold text-[10px] rounded-xl text-center cursor-pointer flex flex-col items-center justify-center gap-0.5" 
                      onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('login', 'login-internal'); }} 
                      id="mobile-btn-login-internal"
                    >
                      <span>🔑 Đăng Nhập</span>
                      <span className="text-[9px] text-indigo-300 opacity-90">Cán Bộ Nghiệp Vụ</span>
                    </button>
                  </div>

                  <button 
                    className="py-2 px-3 bg-amber-950/50 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-sans font-bold text-[10px] rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5" 
                    onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('login', 'login-admin'); }} 
                    id="mobile-btn-login-admin"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>🔑 Đăng Nhập Super Admin Tối Cao</span>
                  </button>
                </div>
              </div>
            )}

            {/* Language Switcher Capsule in mobile menu */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-white/10 rounded-xl p-2 w-full" id="mobile-lang-switcher">
              <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase ml-2">Language / Ngôn ngữ</span>
              <div className="flex items-center gap-1.5" id="mobile-lang-btns">
                <button 
                  onClick={() => onLanguageChange('en')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all duration-300 cursor-pointer ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-[#00314a] to-[#0082c3] text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  id="mobile-lang-en"
                >
                  <USFlag />
                  <span>EN</span>
                </button>
                <button 
                  onClick={() => onLanguageChange('vi')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all duration-300 cursor-pointer ${
                    language === 'vi' 
                      ? 'bg-gradient-to-r from-[#00314a] to-[#0082c3] text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  id="mobile-lang-vi"
                >
                  <VNFlag />
                  <span>VI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          id="mobile-drawer-backdrop"
        />
      )}
    </>
  );
}

