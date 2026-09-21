import { GoogleGenAI } from '@google/genai';

// Pre-generated high-fidelity domain assets created with AI Studio Image Generation Tool
const CURATED_ASSETS = {
  ai_ml: '/src/assets/images/thumbnail_ai_ml_1789866580065.jpg',
  ecommerce: '/src/assets/images/thumbnail_ecommerce_1789866594605.jpg',
  mobile_app: '/src/assets/images/thumbnail_mobile_app_1789866606466.jpg',
  cloud_security: '/src/assets/images/thumbnail_cloud_security_1789866645653.jpg',
  enterprise_erp: '/src/assets/images/thumbnail_enterprise_erp_1789866658670.jpg',
  default: '/src/assets/images/project_thumbnail_default_1789866567242.jpg',
};

/**
 * Detects domain and selects the best matching high-fidelity placeholder asset
 */
export function getCuratedThumbnailForTitle(title: string, techStack: string = '', projectType: string = ''): string {
  const text = `${title} ${techStack} ${projectType}`.toLowerCase();

  if (text.includes('ai') || text.includes('trí tuệ') || text.includes('machine learning') || 
      text.includes('deep learning') || text.includes('nhận diện') || text.includes('thị giác') || 
      text.includes('nlp') || text.includes('recommend') || text.includes('yolo') || text.includes('chatgpt') || text.includes('llm')) {
    return CURATED_ASSETS.ai_ml;
  }

  if (text.includes('e-commerce') || text.includes('tmđt') || text.includes('bán hàng') || 
      text.includes('shop') || text.includes('fintech') || text.includes('thanh toán') || 
      text.includes('crypto') || text.includes('wallet') || text.includes('store')) {
    return CURATED_ASSETS.ecommerce;
  }

  if (text.includes('mobile') || text.includes('app') || text.includes('flutter') || 
      text.includes('react native') || text.includes('android') || text.includes('ios') || 
      text.includes('di động')) {
    return CURATED_ASSETS.mobile_app;
  }

  if (text.includes('cloud') || text.includes('devops') || text.includes('security') || 
      text.includes('an toàn thông tin') || text.includes('mạng') || text.includes('docker') || 
      text.includes('kubernetes') || text.includes('microservice') || text.includes('bảo mật')) {
    return CURATED_ASSETS.cloud_security;
  }

  if (text.includes('erp') || text.includes('quản lý') || text.includes('doanh nghiệp') || 
      text.includes('hrm') || text.includes('nhân sự') || text.includes('bệnh viện') || 
      text.includes('khách sạn') || text.includes('nhà trường') || text.includes('management')) {
    return CURATED_ASSETS.enterprise_erp;
  }

  return CURATED_ASSETS.default;
}

/**
 * Creates a dynamic SVG placeholder badge based on project title and tech stack
 */
export function generateSvgPlaceholder(title: string, techStack: string = ''): string {
  const safeTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
  const safeTech = techStack.length > 30 ? techStack.substring(0, 27) + '...' : (techStack || 'Fullstack Solution');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0082c3" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#bg)" />
    <rect width="800" height="600" fill="url(#grid)" />
    <circle cx="680" cy="120" r="180" fill="#0082c3" opacity="0.12" filter="blur(60px)"/>
    <circle cx="120" cy="500" r="140" fill="#38bdf8" opacity="0.08" filter="blur(50px)"/>
    
    <!-- Code Box Motif -->
    <rect x="60" y="60" width="680" height="480" rx="16" fill="rgba(15,23,42,0.6)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
    <circle cx="95" cy="95" r="5" fill="#ef4444" />
    <circle cx="115" cy="95" r="5" fill="#f59e0b" />
    <circle cx="135" cy="95" r="5" fill="#10b981" />
    <text x="165" y="99" fill="#64748b" font-family="monospace" font-size="12" font-weight="bold">LUBPY STUDIO // PROJECT ARCHITECTURE</text>
    
    <!-- Chip -->
    <rect x="90" y="160" width="130" height="32" rx="8" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.3)"/>
    <text x="155" y="181" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" letter-spacing="1">VERIFIED SPEC</text>
    
    <!-- Title -->
    <text x="90" y="270" fill="#ffffff" font-family="system-ui, sans-serif" font-size="32" font-weight="800">${escapeXml(safeTitle)}</text>
    
    <!-- Tech Stack line -->
    <text x="90" y="320" fill="#94a3b8" font-family="monospace" font-size="16" font-weight="600">&gt; ${escapeXml(safeTech)}</text>
    
    <!-- Bottom line status -->
    <line x1="90" y1="460" x2="710" y2="460" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="90" y="495" fill="#64748b" font-family="monospace" font-size="13">SYSTEM ID: PRJ-LUBPY-${Math.abs(hashString(title)) % 9000 + 1000}</text>
    <text x="710" y="495" text-anchor="end" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">LUBPY.VN</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export interface GenerateThumbnailOptions {
  title: string;
  projectType?: string;
  techStack?: string[] | string;
}

export interface GenerateThumbnailResult {
  thumbnailUrl: string;
  source: 'gemini-ai' | 'curated-asset' | 'svg-placeholder';
  prompt?: string;
  isAiGenerated: boolean;
}

/**
 * Primary image generator that integrates Gemini AI and curated AI Studio assets
 */
export async function generateProjectThumbnail(options: GenerateThumbnailOptions): Promise<GenerateThumbnailResult> {
  const title = (options.title || '').trim();
  const techStr = Array.isArray(options.techStack) ? options.techStack.join(', ') : (options.techStack || '');
  const projectType = options.projectType || 'Đồ án CNTT';

  const prompt = `A modern sleek 3D software engineering project thumbnail for: "${title}". Category: ${projectType}. Tech: ${techStr || 'Modern Fullstack'}. Clean dark tech aesthetic, futuristic glowing accents, 4:3 aspect ratio, high resolution digital artwork.`;

  // 1. Attempt Gemini Image Generation if API key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '4:3',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return {
            thumbnailUrl: `data:${mimeType};base64,${part.inlineData.data}`,
            source: 'gemini-ai',
            prompt,
            isAiGenerated: true,
          };
        }
      }
    } catch (err: any) {
      console.warn('⚠️ Gemini direct image generation unavailable, falling back to curated AI asset:', err?.message || err);
    }
  }

  // 2. Select curated AI Studio generated thumbnail matching project domain
  const curated = getCuratedThumbnailForTitle(title, techStr, projectType);
  if (curated) {
    return {
      thumbnailUrl: curated,
      source: 'curated-asset',
      prompt,
      isAiGenerated: true,
    };
  }

  // 3. Fallback to SVG placeholder
  return {
    thumbnailUrl: generateSvgPlaceholder(title, techStr),
    source: 'svg-placeholder',
    prompt,
    isAiGenerated: false,
  };
}
