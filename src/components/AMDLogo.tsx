import React, { useState } from 'react';

interface AMDLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'image' | 'badge' | 'icon' | 'full';
  showSubtitle?: boolean;
}

export const AMDLogo: React.FC<AMDLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'image',
  showSubtitle = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Size mappings (in pixels / classes)
  const sizeMap: Record<string, { w: number; h: number; tw: string; font: string }> = {
    xs: { w: 20, h: 20, tw: 'w-5 h-5', font: 'text-[9px]' },
    sm: { w: 26, h: 26, tw: 'w-6.5 h-6.5', font: 'text-xs' },
    md: { w: 36, h: 36, tw: 'w-9 h-9', font: 'text-sm' },
    lg: { w: 48, h: 48, tw: 'w-12 h-12', font: 'text-base' },
    xl: { w: 64, h: 64, tw: 'w-16 h-16', font: 'text-lg' },
  };

  const currentSize = typeof size === 'number'
    ? { w: size, h: size, tw: `w-[${size}px] h-[${size}px]`, font: 'text-xs' }
    : sizeMap[size] || sizeMap.md;

  // Primary image source (copied to /public and referenced with no-referrer)
  const imageSrc = '/amd_logo.png';

  // SVG Fallback representation matching the uploaded metallic emerald monogram
  const renderSvgMonogram = () => (
    <svg
      viewBox="0 0 160 110"
      className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(10,50,30,0.4)]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Emerald Satin Gradient */}
        <linearGradient id="amdGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e5838" />
          <stop offset="25%" stopColor="#2e8b57" />
          <stop offset="50%" stopColor="#43a06f" />
          <stop offset="75%" stopColor="#1e5838" />
          <stop offset="100%" stopColor="#0d331f" />
        </linearGradient>

        {/* Highlight sheen filter */}
        <linearGradient id="amdHighlight" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#0d331f" />
          <stop offset="60%" stopColor="#52b788" />
          <stop offset="100%" stopColor="#1e5838" />
        </linearGradient>
      </defs>

      <g fill="url(#amdGreenGrad)" stroke="#0b2918" strokeWidth="0.8">
        {/* 'A' with swoosh tail */}
        <path
          d="M 12 80 C 18 78 26 73 34 71 C 42 69 49 71 52 74 L 38 32 C 37 30 35 28 32 28 L 29 28 L 29 26 L 47 26 L 47 28 L 43 28 C 41 28 40 29 41 32 L 53 66 C 56 62 60 48 62 38 L 57 38 L 57 36 L 70 36 L 70 38 L 66 38 C 64 38 63 39 63 42 L 56 74 C 54 80 50 83 45 83 C 38 83 28 78 18 83 C 14 85 11 87 9 87 L 9 84 C 10 83 11 81 12 80 Z"
        />
        {/* Swash across A */}
        <path
          d="M 8 68 C 15 62 25 61 34 65 C 44 70 51 68 56 61 C 58 64 57 66 54 68 C 47 73 38 72 31 68 C 24 64 16 64 11 67 Z"
          fill="url(#amdHighlight)"
        />

        {/* 'M' interlock */}
        <path
          d="M 52 28 L 68 28 L 68 30 L 64 30 C 62 30 61 31 61 34 L 61 74 C 61 77 62 78 64 78 L 68 78 L 68 80 L 52 80 L 52 78 L 56 78 C 58 78 59 77 59 74 L 59 40 L 78 78 L 82 78 L 102 40 L 102 74 C 102 77 103 78 105 78 L 109 78 L 109 80 L 95 80 L 95 78 L 99 78 C 101 78 102 77 102 74 L 102 34 C 102 31 101 30 99 30 L 95 30 L 95 28 L 110 28 L 110 30 L 107 30 C 105 30 104 31 104 33 L 83 72 L 64 33 C 63 31 62 30 60 30 L 52 30 Z"
        />

        {/* 'D' classical serif */}
        <path
          d="M 98 28 L 126 28 C 144 28 154 39 154 54 C 154 69 144 80 126 80 L 98 80 L 98 78 L 102 78 C 104 78 105 77 105 74 L 105 34 C 105 31 104 30 102 30 L 98 30 Z M 109 32 L 109 76 L 124 76 C 137 76 144 67 144 54 C 144 41 137 32 124 32 Z"
        />
      </g>
    </svg>
  );

  return (
    <div className={`inline-flex items-center space-x-2 shrink-0 ${className}`}>
      <div
        style={{ width: currentSize.w, height: currentSize.h }}
        className="relative flex items-center justify-center shrink-0 overflow-hidden"
      >
        {!imageError ? (
          <img
            src={imageSrc}
            alt="AMD Logo"
            className="w-full h-full object-contain filter contrast-105"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          renderSvgMonogram()
        )}
      </div>

      {showSubtitle && (
        <div className="flex flex-col text-left leading-tight">
          <span className="font-extrabold tracking-wide text-emerald-800 text-xs">
            AMD
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            AI Assistant
          </span>
        </div>
      )}
    </div>
  );
};
