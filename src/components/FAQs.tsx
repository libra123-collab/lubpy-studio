import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, Phone, MessageSquare } from 'lucide-react';
import { FAQItem } from '../types';
import { translations } from '../translations';

interface FAQsProps {
  language: 'en' | 'vi';
}

export default function FAQs({ language }: FAQsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = translations[language];

  const faqs: FAQItem[] = [
    {
      question: t.faqs.list[0].question,
      answer: t.faqs.list[0].answer
    },
    {
      question: t.faqs.list[1].question,
      answer: t.faqs.list[1].answer
    },
    {
      question: t.faqs.list[2].question,
      answer: t.faqs.list[2].answer
    },
    {
      question: t.faqs.list[3].question,
      answer: t.faqs.list[3].answer
    },
    {
      question: t.faqs.list[4].question,
      answer: t.faqs.list[4].answer
    }
  ];

  const handleToggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white to-[#f0f7fb]" id="faqs">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-black tracking-widest text-[#0082c3] uppercase block">
            {t.faqs.subtitle}
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#00314a] font-sans">
            {t.faqs.title}
          </h3>
          <p className="text-gray-600 font-medium max-w-xl mx-auto">
            {t.faqs.desc}
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-4 mb-16" id="faq-accordion-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-[#004d73]/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => handleToggle(idx)}
                  className="w-full px-6 py-5 md:px-8 md:py-6 text-left flex items-center justify-between gap-4 font-sans font-extrabold text-sm md:text-base text-[#00314a] cursor-pointer"
                  aria-expanded={isOpen}
                  id={`faq-btn-${idx}`}
                >
                  <span className="leading-snug">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-[#0082c3] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Expandable answer panel */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[300px] border-t border-gray-100 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                  id={`faq-panel-${idx}`}
                >
                  <p className="px-6 py-5 md:px-8 md:py-6 text-xs md:text-sm text-gray-600 font-medium leading-relaxed bg-[#fbfdfe]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support contacts */}
        <div className="bg-[#00314a] text-white p-8 rounded-3xl text-center space-y-6 relative overflow-hidden shadow-xl" id="faq-cta-box">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0082c3]/20 rounded-full blur-2xl" />
          <div className="space-y-2">
            <h4 className="text-lg md:text-xl font-bold font-sans">{t.faqs.moreQuestion}</h4>
            <p className="text-xs md:text-sm text-[#b8d2e0] font-medium max-w-lg mx-auto">{t.faqs.moreDesc}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a href="mailto:support@lubpy.com" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-full text-xs font-bold transition-colors">
              <Mail className="w-4 h-4 text-[#82c7f2]" />
              support@lubpy.com
            </a>
            <a href="tel:180032328686" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-full text-xs font-bold transition-colors">
              <Phone className="w-4 h-4 text-[#82c7f2]" />
              1800-3232-8686
            </a>
            <a href="#" className="flex items-center gap-2 bg-[#0082c3] hover:bg-[#00a3f5] px-5 py-3 rounded-full text-xs font-bold transition-all shadow-lg">
              <MessageSquare className="w-4 h-4" />
              {t.faqs.consultBtn}
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

