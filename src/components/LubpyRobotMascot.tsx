import React from 'react';

interface LubpyRobotMascotProps {
  className?: string;
  size?: number | string;
  animated?: boolean;
  showGlow?: boolean;
}

export default function LubpyRobotMascot({
  className = '',
  size = 48,
  animated = true,
  showGlow = true
}: LubpyRobotMascotProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient Thruster Glow */}
      {showGlow && (
        <div 
          className={`absolute -bottom-1 w-3/4 h-2 bg-cyan-400/40 blur-md rounded-full pointer-events-none ${animated ? 'lubpy-mascot-glow' : ''}`}
        />
      )}

      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-md ${animated ? 'lubpy-mascot-float' : ''}`}
      >
        <defs>
          {/* Helmet Gradient */}
          <linearGradient id="lubpy-helmet" x1="40" y1="20" x2="120" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Screen Visor Gradient */}
          <linearGradient id="lubpy-visor" x1="80" y1="32" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#1C2541" />
          </linearGradient>

          {/* Torso Gradient */}
          <linearGradient id="lubpy-torso" x1="80" y1="88" x2="80" y2="132" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Arm Gradient */}
          <linearGradient id="lubpy-arm-l" x1="40" y1="94" x2="32" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="lubpy-arm-r" x1="120" y1="94" x2="128" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Eye Cyan Glow Filter */}
          <filter id="lubpy-eye-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Thruster Hover Base */}
        <ellipse cx="80" cy="136" rx="20" ry="7" fill="#0F172A" />
        <ellipse cx="80" cy="134" rx="14" ry="4" fill="#38BDF8" opacity="0.8" filter="url(#lubpy-eye-glow)" />

        {/* Torso / Body */}
        <path
          d="M58 92 C58 86, 102 86, 102 92 C106 104, 104 126, 96 132 C90 136, 70 136, 64 132 C56 126, 54 104, 58 92 Z"
          fill="url(#lubpy-torso)"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />

        {/* Torso Seam Line */}
        <path d="M62 108 Q80 114 98 108" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        
        {/* Torso Chest Light Indicator */}
        <circle cx="80" cy="120" r="2.5" fill="#38BDF8" opacity="0.9" />

        {/* Arms */}
        {/* Left Arm */}
        <g>
          {/* Shoulder joint */}
          <circle cx="52" cy="98" r="5" fill="#1E293B" />
          {/* Arm segment */}
          <path
            d="M51 98 Q40 112 36 126 Q34 130 38 132 Q42 133 44 128 Q48 116 54 102 Z"
            fill="url(#lubpy-arm-l)"
            stroke="#94A3B8"
            strokeWidth="1"
          />
          {/* Claw / Hand */}
          <ellipse cx="36" cy="129" rx="3.5" ry="3" fill="#0F172A" />
        </g>

        {/* Right Arm */}
        <g>
          {/* Shoulder joint */}
          <circle cx="108" cy="98" r="5" fill="#1E293B" />
          {/* Arm segment */}
          <path
            d="M109 98 Q120 112 124 126 Q126 130 122 132 Q118 133 116 128 Q112 116 106 102 Z"
            fill="url(#lubpy-arm-r)"
            stroke="#94A3B8"
            strokeWidth="1"
          />
          {/* Claw / Hand */}
          <ellipse cx="124" cy="129" rx="3.5" ry="3" fill="#0F172A" />
        </g>

        {/* Neck Connection */}
        <rect x="70" y="80" width="20" height="9" rx="3" fill="#0F172A" />

        {/* Left Ear Piece */}
        <g>
          <rect x="23" y="44" width="10" height="26" rx="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
          <ellipse cx="28" cy="57" rx="3" ry="7" fill="#0F172A" />
        </g>

        {/* Right Ear Piece */}
        <g>
          <rect x="127" y="44" width="10" height="26" rx="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
          <ellipse cx="132" cy="57" rx="3" ry="7" fill="#0F172A" />
        </g>

        {/* Head Outer Helmet */}
        <rect
          x="30"
          y="22"
          width="100"
          height="66"
          rx="22"
          fill="url(#lubpy-helmet)"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />

        {/* Helmet Top Specular Arc */}
        <path
          d="M48 26 Q80 23 112 26"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
          fill="none"
        />

        {/* Screen Visor Frame & Glass */}
        <rect
          x="42"
          y="30"
          width="76"
          height="50"
          rx="15"
          fill="url(#lubpy-visor)"
          stroke="#0F172A"
          strokeWidth="2"
        />

        {/* Visor Corner Specular Reflection */}
        <path
          d="M46 38 C46 34 50 34 56 34 C64 34 72 37 72 41 C72 43 70 44 65 44 C53 44 46 45 46 38 Z"
          fill="#FFFFFF"
          opacity="0.12"
        />

        {/* Glowing Cyan Eyes */}
        <g filter="url(#lubpy-eye-glow)">
          {/* Left Eye */}
          <rect
            x="60"
            y="43"
            width="10"
            height="24"
            rx="5"
            fill="#22D3EE"
            className={animated ? 'lubpy-mascot-blink' : ''}
          />
          {/* Left Eye Highlight Core */}
          <rect
            x="62"
            y="46"
            width="5"
            height="14"
            rx="2.5"
            fill="#E0F2FE"
            className={animated ? 'lubpy-mascot-blink' : ''}
          />

          {/* Right Eye */}
          <rect
            x="90"
            y="43"
            width="10"
            height="24"
            rx="5"
            fill="#22D3EE"
            className={animated ? 'lubpy-mascot-blink' : ''}
          />
          {/* Right Eye Highlight Core */}
          <rect
            x="92"
            y="46"
            width="5"
            height="14"
            rx="2.5"
            fill="#E0F2FE"
            className={animated ? 'lubpy-mascot-blink' : ''}
          />
        </g>
      </svg>
    </div>
  );
}
