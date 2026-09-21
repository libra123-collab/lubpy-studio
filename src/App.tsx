/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import TechStack from './components/TechStack';
import ProcessPricing from './components/ProcessPricing';
import Portfolio from './components/Portfolio';
import FAQs from './components/FAQs';
import Footer from './components/Footer';
import ProjectModal from './components/ProjectModal';
import AuthModal, { AuthViewMode } from './components/AuthModal';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import FloatingLanguageSelector from './components/FloatingLanguageSelector';
import { User } from './types';
import { getUserSession, saveUserSession, clearUserSession } from './utils/session';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [authInitialView, setAuthInitialView] = useState<AuthViewMode | undefined>(undefined);
  
  // Manage authenticated User state with encrypted session persistence
  const [user, setUser] = useState<User | null>(() => getUserSession());
  
  // High-empathy default: check local storage, default to Vietnamese ('vi') for local users
  const [language, setLanguage] = useState<'en' | 'vi'>(() => {
    const saved = localStorage.getItem('lubpy_lang');
    if (saved === 'en' || saved === 'vi') return saved;
    return 'vi'; 
  });

  // Auto re-open AuthModal if user was in the middle of OTP or Onboarding step on page reload
  useEffect(() => {
    if (!user) {
      const temp = localStorage.getItem('lubpy_client_auth_temp_state');
      if (temp) {
        try {
          const parsed = JSON.parse(temp);
          if (parsed && (parsed.authStep === 'OTP' || parsed.authStep === 'ONBOARDING')) {
            setAuthInitialView('login-client');
            setIsAuthOpen(true);
          }
        } catch (e) {}
      }
    }
  }, [user]);

  // Dynamically update document properties to apply language selection browser-wide
  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'vi') {
      document.title = 'LUBPY STUDIO | Dịch Vụ Thiết Kế Đồ Án CNTT Trọn Gói';
    } else {
      document.title = 'LUBPY STUDIO | Professional IT Projects & Graduation Theses';
    }
  }, [language]);

  const handleLanguageChange = (lang: 'en' | 'vi') => {
    setLanguage(lang);
    localStorage.setItem('lubpy_lang', lang);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login', view?: AuthViewMode) => {
    setAuthInitialMode(mode);
    setAuthInitialView(view);
    setIsAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    saveUserSession(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    clearUserSession();
  };

  return (
    <div className="app-container" id="app">
      {/* Background Video (Water Space Programming Ambient) */}
      <video
        className="video-bg"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload"
        id="bg-video"
        onError={(e) => {
          // Graceful fallback if video fails to stream
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      >
        <source 
          src="https://res.cloudinary.com/jj0om2pu/video/upload/v1784523529/videoani3_fnjlxy.mp4" 
          type="video/mp4" 
          onError={(e) => {
            const parent = (e.currentTarget as HTMLElement).parentElement;
            if (parent) parent.style.display = 'none';
          }}
        />
        Your browser does not support the video tag.
      </video>

      {/* When any User (Client, Admin, or Staff) is logged in, display Client / Workspace Dashboard in Full Screen, hiding Landing Page */}
      {user ? (
        <div className="min-h-screen w-full bg-[#0d0e10] z-50 relative text-white" id="dashboard-fullscreen">
          <WorkspaceDashboard 
            user={user} 
            onLogout={handleLogout} 
            language={language} 
            onOpenRequestModal={handleOpenModal}
            onUpdateUser={(updated) => {
              setUser(updated);
              saveUserSession(updated);
            }}
          />
        </div>
      ) : (
        <>
          {/* Shared Navigation Header for Landing Page */}
          <Header 
            onOpenRequestModal={handleOpenModal} 
            language={language} 
            onLanguageChange={handleLanguageChange} 
            user={user}
            onOpenAuthModal={handleOpenAuth}
            onLogout={handleLogout}
            onUpdateUser={(updated) => {
              setUser(updated);
              saveUserSession(updated);
            }}
          />

          {/* Hero Section */}
          <Hero 
            onOpenRequestModal={handleOpenModal} 
            onOpenAuthModal={handleOpenAuth}
            user={user}
            language={language} 
          />

          {/* Content Sections */}
          <div className="relative z-10 bg-white/70 backdrop-blur-3xl" id="content-container">
            <About language={language} />
            <TechStack language={language} />
            <ProcessPricing onOpenRequestModal={handleOpenModal} language={language} />
            <Portfolio language={language} />
            <FAQs language={language} />
          </div>

          {/* Footer Section */}
          <Footer language={language} />
        </>
      )}


      {/* Interactive Project Request Modal */}
      <ProjectModal isOpen={isModalOpen} onClose={handleCloseModal} language={language} />

      {/* Modern Authenticated Portal Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={handleCloseAuth} 
        onLoginSuccess={handleLoginSuccess} 
        language={language} 
        initialMode={authInitialMode}
        initialView={authInitialView}
      />
    </div>
  );
}

