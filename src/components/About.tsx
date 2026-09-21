import React from 'react';
import { ShieldCheck, BookOpen, Users, Award, Code2 } from 'lucide-react';
import { translations } from '../translations';

interface AboutProps {
  language: 'en' | 'vi';
}

export default function About({ language }: AboutProps) {
  const t = translations[language];

  const coreValues = [
    {
      icon: <Code2 className="w-6 h-6 text-[#0082c3]" />,
      title: t.about.values[0].title,
      desc: t.about.values[0].desc
    },
    {
      icon: <BookOpen className="w-6 h-6 text-[#0082c3]" />,
      title: t.about.values[1].title,
      desc: t.about.values[1].desc
    },
    {
      icon: <Award className="w-6 h-6 text-[#0082c3]" />,
      title: t.about.values[2].title,
      desc: t.about.values[2].desc
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#0082c3]" />,
      title: t.about.values[3].title,
      desc: t.about.values[3].desc
    }
  ];

  const stats = [
    { value: t.about.stats[0].value, label: t.about.stats[0].label },
    { value: t.about.stats[1].value, label: t.about.stats[1].label },
    { value: t.about.stats[2].value, label: t.about.stats[2].label },
    { value: t.about.stats[3].value, label: t.about.stats[3].label }
  ];

  return (
    <section className="relative py-24 px-6 max-w-7xl mx-auto" id="about">
      {/* Background visual element */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#82c7f2]/10 rounded-full blur-3xl -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left side info */}
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs font-black tracking-widest text-[#0082c3] uppercase block">
            {t.about.subTitle}
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#00314a] font-sans leading-tight">
            {t.about.title}
          </h3>
          <p className="text-gray-700 font-medium leading-relaxed">
            {t.about.desc1}
          </p>
          <p className="text-gray-600 font-medium">
            {t.about.desc2}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/65 backdrop-blur-md p-5 rounded-2xl border border-[#004d73]/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-black text-[#0082c3]">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side core values cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {coreValues.map((value, idx) => (
            <div 
              key={idx}
              className="bg-white/80 backdrop-blur-lg p-7 rounded-3xl border border-[#004d73]/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="bg-[#0082c3]/10 p-3 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                {value.icon}
              </div>
              <h4 className="text-lg font-bold text-[#00314a] mb-2 font-sans">{value.title}</h4>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

