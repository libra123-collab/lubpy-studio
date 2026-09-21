import React from 'react';
import { HelpCircle, Check, ArrowRight, ClipboardList, Code, PlayCircle, GraduationCap, ShieldAlert } from 'lucide-react';
import { ProcessStage, PricingTier } from '../types';
import { translations } from '../translations';

interface ProcessPricingProps {
  onOpenRequestModal: () => void;
  language: 'en' | 'vi';
}

export default function ProcessPricing({ onOpenRequestModal, language }: ProcessPricingProps) {
  const t = translations[language];

  const steps: ProcessStage[] = [
    {
      step: "01",
      title: t.process.steps[0].title,
      desc: t.process.steps[0].desc,
      icon: "clipboard"
    },
    {
      step: "02",
      title: t.process.steps[1].title,
      desc: t.process.steps[1].desc,
      icon: "code"
    },
    {
      step: "03",
      title: t.process.steps[2].title,
      desc: t.process.steps[2].desc,
      icon: "play"
    },
    {
      step: "04",
      title: t.process.steps[3].title,
      desc: t.process.steps[3].desc,
      icon: "graduation"
    }
  ];

  const pricingTiers: PricingTier[] = [
    {
      name: t.process.tiers[0].name,
      price: t.process.tiers[0].price,
      subtitle: t.process.tiers[0].subtitle,
      features: t.process.tiers[0].features
    },
    {
      name: t.process.tiers[1].name,
      price: t.process.tiers[1].price,
      subtitle: t.process.tiers[1].subtitle,
      isPopular: true,
      features: t.process.tiers[1].features
    },
    {
      name: t.process.tiers[2].name,
      price: t.process.tiers[2].price,
      subtitle: t.process.tiers[2].subtitle,
      features: t.process.tiers[2].features
    }
  ];

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'clipboard': return <ClipboardList className="w-5 h-5 text-white" />;
      case 'code': return <Code className="w-5 h-5 text-white" />;
      case 'play': return <PlayCircle className="w-5 h-5 text-white" />;
      default: return <GraduationCap className="w-5 h-5 text-white" />;
    }
  };

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="process-pricing">
      {/* 1. Workflow Process */}
      <div className="mb-24">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-black tracking-widest text-[#0082c3] uppercase block">
            {t.process.subtitle}
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#00314a] font-sans">
            {t.process.title}
          </h3>
          <p className="max-w-2xl mx-auto text-gray-600 font-medium">
            {t.process.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" id="process-steps-grid">
          {steps.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white p-8 rounded-3xl border border-[#004d73]/10 shadow-lg hover:shadow-xl hover:border-[#0082c3] transition-all relative group"
            >
              {/* Connector line on desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[90%] w-1/4 h-[2px] bg-gradient-to-r from-[#0082c3] to-transparent z-10" />
              )}
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00314a] to-[#0082c3] flex items-center justify-center shadow-md">
                  {getStepIcon(item.icon)}
                </div>
                <span className="text-3xl font-black text-gray-200 group-hover:text-[#0082c3]/20 transition-colors font-sans">{item.step}</span>
              </div>
              <h4 className="text-lg font-bold text-[#00314a] mb-2 font-sans">{item.title}</h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Pricing Tiers */}
      <div>
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-black tracking-widest text-[#0082c3] uppercase block">
            {t.process.pricingTitle}
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#00314a] font-sans">
            {t.process.pricingMainTitle}
          </h3>
          <p className="max-w-2xl mx-auto text-gray-600 font-medium">
            {t.process.pricingDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch" id="pricing-tiers-grid">
          {pricingTiers.map((tier, idx) => (
            <div 
              key={idx}
              className={`bg-white rounded-3xl border p-8 flex flex-col justify-between transition-all relative ${
                tier.isPopular 
                  ? 'border-[#0082c3] shadow-2xl scale-102 lg:translate-y-[-8px]' 
                  : 'border-[#004d73]/10 shadow-lg hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {/* Popular Tag */}
              {tier.isPopular && (
                <span className="absolute top-0 right-8 -translate-y-1/2 bg-[#0082c3] text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-lg">
                  {language === 'vi' ? 'Phổ biến nhất' : 'Most Popular'}
                </span>
              )}

              <div className="space-y-5">
                <div>
                  <h4 className="text-lg font-extrabold text-[#00314a] font-sans tracking-tight">{tier.name}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-1">{tier.subtitle}</p>
                </div>
                
                <div className="py-2">
                  <span className="text-4xl font-black text-[#00314a] tracking-tight">{tier.price}</span>
                </div>

                <hr className="border-gray-100" />

                <ul className="space-y-3.5">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs font-bold text-gray-700 leading-normal">
                      <span className="bg-emerald-50 text-emerald-500 rounded-full p-0.5 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={onOpenRequestModal}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                    tier.isPopular 
                      ? 'bg-gradient-to-r from-[#00314a] to-[#0082c3] hover:from-[#004d73] hover:to-[#00a3f5] text-white shadow-xl hover:shadow-2xl' 
                      : 'bg-[#f0f7fb] hover:bg-[#e5f6ff] text-[#004d73]'
                  }`}
                >
                  <span>{t.process.pricingBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Commitment note */}
        <div className="mt-12 bg-rose-50/50 border border-rose-200/60 p-5 rounded-3xl flex flex-col sm:flex-row items-center gap-4 max-w-4xl mx-auto text-center sm:text-left" id="pricing-note">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-sm font-black text-rose-900 font-sans">{t.process.commitmentTitle}</h5>
            <p className="text-xs text-rose-700/85 font-medium mt-0.5">
              {t.process.commitmentDesc}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

