import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const outDir = join(process.cwd(), 'public', 'images');
mkdirSync(outDir, { recursive: true });

const svgFiles = {
  'hero-nutrifit.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="620" viewBox="0 0 800 620" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="800" y2="620" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#DCEBF8"/>
      <stop offset="55%" stop-color="#EAF4FC"/>
      <stop offset="100%" stop-color="#E3F7EB"/>
    </linearGradient>
    <linearGradient id="orbBlueGreen" x1="220" y1="110" x2="580" y2="510" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38D46A"/>
      <stop offset="50%" stop-color="#1582B5"/>
      <stop offset="100%" stop-color="#0B4B84"/>
    </linearGradient>
  </defs>
  <rect width="800" height="620" rx="44" fill="url(#bgGrad)"/>
  <circle cx="400" cy="310" r="220" fill="#FFFFFF" fill-opacity="0.65"/>
  <rect x="235" y="75" width="330" height="470" rx="165" fill="#FFFFFF" fill-opacity="0.85" stroke="#FFFFFF" stroke-width="4"/>
  <circle cx="400" cy="275" r="118" fill="url(#orbBlueGreen)" fill-opacity="0.9"/>
  <circle cx="400" cy="275" r="78" fill="#FFFFFF" fill-opacity="0.22"/>
  <path d="M362 275L390 303L442 251" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="305" y="425" width="190" height="22" rx="11" fill="#0B4B84" fill-opacity="0.85"/>
  <rect x="335" y="460" width="130" height="14" rx="7" fill="#38D46A"/>
</svg>`,

  'artikel-piring-lokal.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <rect width="640" height="400" fill="#E8F2FC"/>
  <circle cx="320" cy="200" r="130" fill="#FFFFFF" stroke="#0B4B84" stroke-width="6"/>
  <path d="M320 70 A130 130 0 0 1 450 200 L320 200 Z" fill="#38D46A"/>
  <path d="M450 200 A130 130 0 0 1 320 330 L320 200 Z" fill="#0B4B84"/>
  <path d="M320 330 A130 130 0 0 1 190 200 L320 200 Z" fill="#FFC83D"/>
  <circle cx="320" cy="200" r="36" fill="#F2F7FC"/>
</svg>`,

  'artikel-ukur-pinggang.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <rect width="640" height="400" fill="#DCEBF8"/>
  <rect x="140" y="155" width="360" height="90" rx="24" fill="#0B4B84"/>
  <rect x="152" y="167" width="336" height="66" rx="16" fill="#38D46A"/>
  <line x1="200" y1="167" x2="200" y2="202" stroke="#0B2545" stroke-width="5"/>
  <line x1="260" y1="167" x2="260" y2="215" stroke="#0B2545" stroke-width="5"/>
  <line x1="320" y1="167" x2="320" y2="202" stroke="#0B2545" stroke-width="5"/>
  <line x1="380" y1="167" x2="380" y2="215" stroke="#0B2545" stroke-width="5"/>
  <line x1="440" y1="167" x2="440" y2="202" stroke="#0B2545" stroke-width="5"/>
</svg>`,

  'artikel-latihan-mandiri.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <rect width="640" height="400" fill="#EEF5FC"/>
  <rect x="170" y="175" width="300" height="50" rx="25" fill="#0B4B84"/>
  <rect x="130" y="120" width="45" height="160" rx="14" fill="#0B2545"/>
  <rect x="465" y="120" width="45" height="160" rx="14" fill="#0B2545"/>
  <circle cx="320" cy="200" r="34" fill="#38D46A"/>
</svg>`,

  'artikel-energi-seimbang.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <rect width="640" height="400" fill="#E3F7EB"/>
  <circle cx="320" cy="200" r="115" fill="#FFFFFF" stroke="#0B4B84" stroke-width="6"/>
  <path d="M335 115L275 210H325L305 285L365 190H315L335 115Z" fill="#38D46A" stroke="#0B4B84" stroke-width="5" stroke-linejoin="round"/>
</svg>`,

  'artikel-jalan-kaki.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <rect width="640" height="400" fill="#EAF4FC"/>
  <path d="M120 290 Q250 180 350 250 T520 150" stroke="#0B4B84" stroke-width="10" stroke-linecap="round" fill="none"/>
  <circle cx="120" cy="290" r="16" fill="#38D46A" stroke="#0B4B84" stroke-width="4"/>
  <circle cx="520" cy="150" r="20" fill="#0B4B84"/>
</svg>`,

  'artikel-tidur-pulih.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <rect width="640" height="400" fill="#DCEBF8"/>
  <circle cx="320" cy="200" r="110" fill="#0B4B84"/>
  <path d="M345 135 A70 70 0 1 0 400 245 A60 60 0 1 1 345 135 Z" fill="#38D46A"/>
</svg>`,
};

for (const [filename, content] of Object.entries(svgFiles)) {
  writeFileSync(join(outDir, filename), content.trim(), 'utf8');
}

console.log('Berhasil memperbarui 7 ilustrasi SVG bertema biru-hijau di public/images/');