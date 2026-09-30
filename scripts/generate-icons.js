import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4338ca"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Book / Knowledge Icon -->
  <g filter="url(#shadow)">
    <path d="M120 330 C 180 305, 235 320, 256 345 C 277 320, 332 305, 392 330 L 392 170 C 332 145, 277 160, 256 185 C 235 160, 180 145, 120 170 Z" 
          fill="#ffffff" opacity="0.98"/>
    <line x1="256" y1="185" x2="256" y2="345" stroke="#4338ca" stroke-width="8" stroke-linecap="round"/>
    
    <!-- Sparkle / Creative Star -->
    <path d="M256 90 L 268 118 L 296 130 L 268 142 L 256 170 L 244 142 L 216 130 L 244 118 Z" fill="#fbbf24"/>
    <circle cx="340" cy="120" r="8" fill="#fef08a"/>
    <circle cx="172" cy="120" r="8" fill="#fef08a"/>
  </g>

  <!-- Typography -->
  <text x="256" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="54" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="8">
    AGK
  </text>
  <text x="256" y="468" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#a5f3fc" text-anchor="middle" letter-spacing="3">
    GURU KREATIF
  </text>
</svg>`;

// Maskable icon with 15% inner safe zone padding and full-bleed square background
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4338ca"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  
  <rect width="512" height="512" fill="url(#bgGradM)"/>
  
  <!-- Scaled content inside safe zone (approx center 70-80%) -->
  <g transform="translate(51, 45) scale(0.8)">
    <path d="M120 330 C 180 305, 235 320, 256 345 C 277 320, 332 305, 392 330 L 392 170 C 332 145, 277 160, 256 185 C 235 160, 180 145, 120 170 Z" 
          fill="#ffffff" opacity="0.98"/>
    <line x1="256" y1="185" x2="256" y2="345" stroke="#4338ca" stroke-width="8" stroke-linecap="round"/>
    
    <path d="M256 90 L 268 118 L 296 130 L 268 142 L 256 170 L 244 142 L 216 130 L 244 118 Z" fill="#fbbf24"/>
    <circle cx="340" cy="120" r="8" fill="#fef08a"/>
    <circle cx="172" cy="120" r="8" fill="#fef08a"/>

    <text x="256" y="425" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="8">
      AGK
    </text>
    <text x="256" y="465" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#a5f3fc" text-anchor="middle" letter-spacing="3">
      GURU KREATIF
    </text>
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save base SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), iconSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), iconSvg);

  const svgBuffer = Buffer.from(iconSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Generate PNGs
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));

  console.log('Successfully generated all PWA icon assets (192, 512, maskable, apple-touch-icon, favicon)');
}

generate().catch(console.error);
