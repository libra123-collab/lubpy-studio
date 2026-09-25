import React, { useState } from 'react';
import { X, Send, Calendar, Check, Code, Sparkles, Phone, Mail, User } from 'lucide-react';
import { ProjectRequest } from '../types';
import { translations } from '../translations';
import { api } from '../utils/apiClient';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'vi';
}

type ProjectFormData = Omit<ProjectRequest, 'id' | 'status' | 'progress' | 'createdAt'>;

export default function ProjectModal({ isOpen, onClose, language }: ProjectModalProps) {
  const t = translations[language];

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    email: '',
    phone: '',
    projectType: language === 'vi' ? 'Đồ án tốt nghiệp' : 'Academic Thesis / Capstone',
    description: '',
    deadline: '',
    techStack: []
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-prefill the verified Google name and email of the logged-in user
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      const savedUser = localStorage.getItem('lubpy_user');
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          setFormData(prev => ({
            ...prev,
            name: u.name || '',
            email: u.email || ''
          }));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleTech = (tech: string) => {
    setFormData(prev => {
      const exists = prev.techStack.includes(tech);
      const updated = exists 
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech];
      return { ...prev, techStack: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const generatedId = `PRJ-${Math.floor(2400 + Math.random() * 7500)}`;
      const payload = {
        id: generatedId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        projectType: formData.projectType,
        description: formData.description,
        deadline: formData.deadline || '2026-12-31',
        techStack: formData.techStack.length > 0 ? formData.techStack : ['React', 'Node.js', 'PostgreSQL'],
        status: 'PENDING',
        progress: 10,
        priceVnd: 12000000,
      };

      const res = await api.projects.create(payload);
      const saved = res.data || res;
      
      // Dispatch event to update open dashboards
      window.dispatchEvent(new CustomEvent('lubpy_new_project', { detail: saved }));
      window.dispatchEvent(new Event('storage'));
      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to persist request", err);
      setError(err?.message || (language === 'vi' 
        ? 'Không thể khởi tạo yêu cầu dự án. Vui lòng kiểm tra lại thông tin và thử lại.' 
        : 'Failed to submit project request. Please check your information and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      projectType: language === 'vi' ? 'Đồ án tốt nghiệp' : 'Academic Thesis / Capstone',
      description: '',
      deadline: '',
      techStack: []
    });
    setError(null);
    setSubmitted(false);
    onClose();
  };

  const techOptions = [
    'React / Next.js',
    'Node.js / Express',
    'Python / Django / FastAPI',
    'AI / Machine Learning / LLMs',
    'Mobile (Flutter / React Native)',
    'Java / Spring Boot',
    'C# / ASP.NET',
    'PHP / Laravel',
    'SQL / NoSQL Database'
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" id="project-modal-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#001c2b]/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        id="modal-backdrop"
      />

      {/* Modal Box */}
      <div 
        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 max-h-[90vh] flex flex-col transition-all duration-300 scale-100"
        id="modal-content-box"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#00314a] to-[#004d73] text-white flex items-center justify-between" id="modal-header">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#82c7f2]" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{t.modal.startProject}</h3>
              <p className="text-xs text-[#b8d2e0] mt-0.5">{t.modal.tagline}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
            id="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="modal-body">
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center py-10" id="success-message">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-200">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-2xl font-extrabold text-[#00314a] mb-2 font-sans">{t.modal.successTitle}</h4>
              <p className="text-gray-600 max-w-md mb-8 font-medium">
                {t.modal.successDesc}
              </p>
              <button 
                onClick={handleReset}
                className="bg-[#00314a] hover:bg-[#0082c3] text-white font-bold py-3 px-8 rounded-full transition-all duration-200 shadow-lg cursor-pointer"
                id="success-close-btn"
              >
                {t.modal.returnBtn}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" id="project-form">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-medium animate-fadeIn" id="project-modal-error-banner">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="form-user-details">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#00314a] tracking-wider uppercase block">{t.modal.nameLabel}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Nguyen Van A" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:border-[#0082c3] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#00314a] tracking-wider uppercase block">{t.modal.emailLabel}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. customer@gmail.com" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:border-[#0082c3] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#00314a] tracking-wider uppercase block">{t.modal.phoneLabel}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 0912 345 678" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:border-[#0082c3] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#00314a] tracking-wider uppercase block">{t.modal.deadlineLabel}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input 
                      type="date" 
                      required
                      value={formData.deadline}
                      onChange={e => setFormData({...formData, deadline: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:border-[#0082c3] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Service Type Selection */}
              <div className="space-y-1.5" id="form-service-type">
                <label className="text-xs font-bold text-[#00314a] tracking-wider uppercase block">{t.modal.categoryLabel}</label>
                <select 
                  value={formData.projectType}
                  onChange={e => setFormData({...formData, projectType: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:bg-white focus:border-[#0082c3] focus:outline-none transition-colors"
                >
                  {t.modal.categories.map((cat, cIdx) => (
                    <option key={cIdx} value={cat.val}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Tech Stack Checklist */}
              <div className="space-y-2" id="form-tech-stack">
                <label className="text-xs font-bold text-[#00314a] tracking-wider uppercase block flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-[#0082c3]" /> {t.modal.techLabel}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {techOptions.map(tech => {
                    const isSelected = formData.techStack.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => handleToggleTech(tech)}
                        className={`py-2 px-3.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-[#e5f6ff] border-[#0082c3] text-[#0082c3]' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <span className="truncate">{tech}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#0082c3] ml-1.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope Description */}
              <div className="space-y-1.5" id="form-description">
                <label className="text-xs font-bold text-[#00314a] tracking-wider uppercase block">{t.modal.scopeLabel}</label>
                <textarea 
                  required
                  rows={4}
                  placeholder={t.modal.scopePlaceholder}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:border-[#0082c3] focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* AI Thumbnail Notice */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-800">
                <Sparkles className="w-4 h-4 text-[#0082c3] shrink-0" />
                <span>{language === 'vi' ? '✨ Hệ thống AI sẽ tự động thiết kế ảnh thumbnail đồ án chuyên nghiệp dựa theo tiêu đề & công nghệ của bạn khi tiếp nhận.' : '✨ Our AI engine will automatically craft a bespoke project thumbnail based on your title & stack.'}</span>
              </div>

              {/* Submit Button */}
              <div className="pt-2" id="form-submit-section">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#00314a] to-[#0082c3] hover:from-[#004d73] hover:to-[#00a3f5] text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-75 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  id="submit-request-btn"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.modal.submitting}
                    </>
                  ) : (
                    <>
                      <Send className="w-4.5 h-4.5" />
                      {t.modal.submitBtn}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

