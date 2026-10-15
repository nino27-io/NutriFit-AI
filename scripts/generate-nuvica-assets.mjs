import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const outDir = join(process.cwd(), 'public', 'images');
mkdirSync(outDir, { recursive: true });

// Definisi Filter & Shader 3D Glass
const COMMON_GLASS_DEFS = `
    <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="145%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#062B52" flood-opacity="0.24"/>
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0B4B84" flood-opacity="0.16"/>
    </filter>
    <filter id="glowSoft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="specularBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5"/>
    </filter>
    <radialGradient id="glassCyanEmerald" cx="32%" cy="24%" r="72%">
      <stop offset="0%" stop-color="#D1FAE5" stop-opacity="0.96"/>
      <stop offset="22%" stop-color="#34D399" stop-opacity="0.88"/>
      <stop offset="52%" stop-color="#0284C7" stop-opacity="0.86"/>
      <stop offset="82%" stop-color="#0B4B84" stop-opacity="0.94"/>
      <stop offset="100%" stop-color="#041E42" stop-opacity="0.98"/>
    </radialGradient>
    <radialGradient id="glassSapphireCyan" cx="68%" cy="26%" r="72%">
      <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.96"/>
      <stop offset="25%" stop-color="#38BDF8" stop-opacity="0.88"/>
      <stop offset="55%" stop-color="#10B981" stop-opacity="0.82"/>
      <stop offset="82%" stop-color="#0B4B84" stop-opacity="0.94"/>
      <stop offset="100%" stop-color="#041E42" stop-opacity="0.98"/>
    </radialGradient>
    <linearGradient id="glassRimWhite" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.75"/>
    </linearGradient>
    <linearGradient id="innerVeinGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#A7F3D0"/>
      <stop offset="50%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
`;

const svgFiles = {
  // ==========================================================================
  // 1. HERO TENGAH: 3D Translucent Glass Fitness Athlete (Dynamic Flex Pose)
  // ==========================================================================
  'nuvica-hero-person.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="640" viewBox="0 0 520 640" fill="none">
  <defs>
    ${COMMON_GLASS_DEFS}
    <linearGradient id="archBackdrop" x1="260" y1="0" x2="260" y2="640" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8AB9E8"/>
      <stop offset="48%" stop-color="#C2DDF8"/>
      <stop offset="100%" stop-color="#EAF4FC"/>
    </linearGradient>
    <radialGradient id="athleteAura" cx="50%" cy="42%" r="48%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="#6EE7B7" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="torsoGlass" cx="38%" cy="22%" r="75%">
      <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.95"/>
      <stop offset="24%" stop-color="#34D399" stop-opacity="0.88"/>
      <stop offset="54%" stop-color="#0284C7" stop-opacity="0.9"/>
      <stop offset="84%" stop-color="#0B4B84" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="#041E42" stop-opacity="0.99"/>
    </radialGradient>
    <radialGradient id="coreEnergy" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="38%" stop-color="#34D399"/>
      <stop offset="75%" stop-color="#0284C7" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#0B4B84" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Latar Langit Kubah & Pendaran Cahaya Energi Belakang -->
  <rect width="520" height="640" fill="url(#archBackdrop)"/>
  <circle cx="265" cy="275" r="230" fill="url(#athleteAura)"/>
  <circle cx="265" cy="295" r="145" fill="#10B981" fill-opacity="0.16" filter="url(#specularBlur)"/>

  <!-- Orbit Cincin Biometrik Belakang (Bagian Belakang Tubuh) -->
  <path d="M72 415 A195 46 0 0 1 458 415" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2.5" stroke-dasharray="10 8" fill="none"/>
  <path d="M88 265 A180 42 0 0 1 442 265" stroke="#34D399" stroke-opacity="0.4" stroke-width="2" fill="none" transform="rotate(-8 265 265)"/>

  <g filter="url(#shadow3d)">
    <!-- ======================================================================
         DUMBBELL KACA 3D (Digenggam di Tangan Kiri Atas - Pose Kebugaran)
    ======================================================================= -->
    <g transform="rotate(-14 108 118)">
      <!-- Batang Pegangan Dumbbell -->
      <rect x="64" y="110" width="92" height="16" rx="8" fill="#E0F2FE" stroke="#0B4B84" stroke-width="2.5"/>
      <!-- Pelat Beban Kiri Dumbbell (3D Glass) -->
      <rect x="42" y="76" width="28" height="84" rx="14" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="3"/>
      <rect x="24" y="88" width="18" height="60" rx="9" fill="url(#glassSapphireCyan)" stroke="#FFFFFF" stroke-width="2.5"/>
      <!-- Pelat Beban Kanan Dumbbell (3D Glass) -->
      <rect x="150" y="76" width="28" height="84" rx="14" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="3"/>
      <rect x="178" y="88" width="18" height="60" rx="9" fill="url(#glassSapphireCyan)" stroke="#FFFFFF" stroke-width="2.5"/>
      <!-- Kilau Kaca Dumbbell -->
      <path d="M52 90 L52 135 M160 90 L160 135" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="4" stroke-linecap="round"/>
    </g>

    <!-- ======================================================================
         LENGAN KIRI ATLETIS (Bicep Flex Mengangkat Dumbbell)
    ======================================================================= -->
    <!-- Lengan Bawah Kiri (Forearm) -->
    <path d="M92 128 C72 162 66 218 82 256 C98 282 132 276 138 242 C142 206 122 152 114 126 Z" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <!-- Otot Bicep & Bahu Kiri (Sculpted Glass Bicep + Deltoid) -->
    <path d="M84 252 C88 292 132 316 178 302 C204 294 212 248 188 228 C162 208 118 214 84 252 Z" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <circle cx="182" cy="264" r="42" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="3"/>

    <!-- ======================================================================
         LENGAN KANAN ATLETIS (Pose Kebugaran Dinamis Bertolak Pinggang/Core)
    ======================================================================= -->
    <!-- Bahu & Lengan Atas Kanan -->
    <path d="M346 238 C382 232 422 268 438 322 C448 358 424 382 396 368 C368 354 352 308 338 278 Z" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <!-- Lengan Bawah Kanan Menuju Pinggang (Athletic Stance) -->
    <path d="M432 338 C446 376 418 432 368 456 C344 468 328 446 342 424 C358 398 392 366 404 334 Z" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <circle cx="352" cy="266" r="40" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="3"/>

    <!-- ======================================================================
         LEHER & OTOT TRAPEZIUS KACA 3D
    ======================================================================= -->
    <path d="M214 195 L236 148 L294 148 L316 195 L348 238 L182 238 Z" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="3"/>
    <!-- Cincin Ukur Leher (US Navy Neck Circumference Ring) -->
    <ellipse cx="265" cy="184" rx="42" ry="12" stroke="#A7F3D0" stroke-width="4" fill="none"/>

    <!-- ======================================================================
         KEPALA ATLETIS KACA 3D (Futuristic Faceted Glass Head Sculpture)
    ======================================================================= -->
    <path d="M216 104 C216 58 236 34 265 34 C294 34 314 58 314 104 C314 146 292 178 265 178 C238 178 216 146 216 104 Z" fill="url(#torsoGlass)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <!-- Visor / Kontur Cahaya Wajah Kaca Futuristik -->
    <path d="M228 96 Q265 112 302 96" stroke="#A7F3D0" stroke-opacity="0.85" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <path d="M265 52 L265 132" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Inti Kognitif Bercahaya di Kepala -->
    <circle cx="265" cy="82" r="22" fill="url(#coreEnergy)" filter="url(#glowSoft)"/>
    <!-- Kilau Specular Kepala Kaca -->
    <path d="M228 88 C232 58 248 44 268 44" stroke="#FFFFFF" stroke-opacity="0.92" stroke-width="6" stroke-linecap="round" fill="none"/>

    <!-- ======================================================================
         TORSO ATLETIS V-TAPER, DADA & CORE PERUT KACA 3D
    ======================================================================= -->
    <!-- Bodi Utama Torso Kaca (Bahu Lebar -> Pinggang Ramping -> Pinggul Atletis) -->
    <path d="M172 234 C215 218 315 218 358 234 C368 292 342 365 326 422 C338 475 352 548 356 640 L174 640 C178 548 192 475 204 422 C188 365 162 292 172 234 Z" fill="url(#torsoGlass)" stroke="url(#glassRimWhite)" stroke-width="4"/>

    <!-- Lempengan Kaca Otot Dada (3D Sculpted Pectorals) -->
    <path d="M182 244 C208 238 248 244 262 268 C262 304 248 324 212 326 C184 328 176 288 182 244 Z" fill="url(#glassCyanEmerald)" fill-opacity="0.72" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="2.5"/>
    <path d="M348 244 C322 238 282 244 268 268 C268 304 282 324 318 326 C346 328 354 288 348 244 Z" fill="url(#glassSapphireCyan)" fill-opacity="0.72" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="2.5"/>

    <!-- Segmen Otot Perut / Core Kaca 3D (Athletic Core Definition) -->
    <g stroke="#A7F3D0" stroke-opacity="0.55" stroke-width="2" fill="#FFFFFF" fill-opacity="0.12">
      <rect x="218" y="336" width="40" height="32" rx="10"/>
      <rect x="272" y="336" width="40" height="32" rx="10"/>
      <rect x="222" y="376" width="36" height="32" rx="10"/>
      <rect x="272" y="376" width="36" height="32" rx="10"/>
      <rect x="226" y="416" width="32" height="30" rx="9"/>
      <rect x="272" y="416" width="32" height="30" rx="9"/>
    </g>

    <!-- ======================================================================
         JARINGAN PEMBULUH ENERGI & INTI METABOLISME (Serasi dengan Paru 3D)
    ======================================================================= -->
    <g filter="url(#glowSoft)" opacity="0.95">
      <!-- Inti Jantung & Metabolisme Bercahaya -->
      <circle cx="265" cy="292" r="46" fill="url(#coreEnergy)"/>
      <circle cx="265" cy="292" r="16" fill="#FFFFFF"/>

      <!-- Jalur Energi ke Lengan Kiri (Yang Mengangkat Dumbbell) -->
      <path d="M265 292 C228 282 188 268 145 256 C115 248 98 205 104 148" stroke="url(#innerVeinGlow)" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M165 262 L135 285 M122 232 L88 225" stroke="#A7F3D0" stroke-width="4" stroke-linecap="round"/>

      <!-- Jalur Energi ke Lengan Kanan -->
      <path d="M265 292 C305 282 348 272 385 298 C412 318 412 365 372 418" stroke="url(#innerVeinGlow)" stroke-width="6.5" stroke-linecap="round" fill="none"/>

      <!-- Jalur Energi Vertikal Tulang Belakang & Core Metabolik -->
      <path d="M265 178 L265 495" stroke="#A7F3D0" stroke-width="6" stroke-linecap="round"/>
      <path d="M265 335 L212 365 M265 335 L318 365" stroke="#6EE7B7" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M265 385 L208 415 M265 385 L322 415" stroke="#38BDF8" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M265 445 C235 485 215 545 208 615" stroke="url(#innerVeinGlow)" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M265 445 C295 485 315 545 322 615" stroke="url(#innerVeinGlow)" stroke-width="6" stroke-linecap="round" fill="none"/>

      <!-- Simpul-Simpul Sensor Biometrik Bercahaya -->
      <circle cx="182" cy="264" r="7" fill="#FFFFFF"/>
      <circle cx="352" cy="266" r="7" fill="#FFFFFF"/>
      <circle cx="104" cy="188" r="6" fill="#A7F3D0"/>
      <circle cx="265" cy="418" r="8" fill="#FEF08A"/>
    </g>

    <!-- ======================================================================
         CINCIN PEMINDAI PINGGANG & PINGGUL 3D (Visualisasi WHR & BMI)
    ======================================================================= -->
    <!-- Cincin Lingkar Pinggang (Waist Ring) -->
    <path d="M194 418 Q265 446 336 418" stroke="#34D399" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#glowSoft)"/>
    <path d="M194 418 Q265 446 336 418" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="12 6" stroke-linecap="round" fill="none"/>

    <!-- Cincin Lingkar Pinggul (Hip Ring) -->
    <path d="M174 496 Q265 532 356 496" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#glowSoft)"/>
    <path d="M174 496 Q265 532 356 496" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Orbit Hologram Depan Mengelilingi Pinggang -->
    <path d="M72 415 A195 46 0 0 0 458 415" stroke="url(#glassRimWhite)" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="135" cy="448" r="8" fill="#34D399" stroke="#FFFFFF" stroke-width="2.5"/>
    <circle cx="395" cy="448" r="8" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2.5"/>

    <!-- ======================================================================
         PANTULAN CAHAYA KACA MELENGKUNG (3D Specular Highlights)
    ======================================================================= -->
    <path d="M182 254 C178 308 192 365 206 412" stroke="#FFFFFF" stroke-opacity="0.88" stroke-width="7" stroke-linecap="round" fill="none" filter="url(#specularBlur)"/>
    <path d="M182 254 C178 308 192 365 206 412" stroke="#FFFFFF" stroke-opacity="0.95" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M348 254 C352 308 338 365 324 412" stroke="#7DD3FC" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M84 152 C74 185 74 222 86 248" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M192 252 Q225 242 252 256" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M338 252 Q305 242 278 256" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`,

  // ==========================================================================
  // 2. HERO KANAN: Organ Paru & Jantung Metabolisme 3D Translucent Glass
  // ==========================================================================
  'nuvica-hero-organ.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="580" viewBox="0 0 540 580" fill="none">
  <defs>
    ${COMMON_GLASS_DEFS}
    <radialGradient id="lobeGlassL" cx="38%" cy="28%" r="72%">
      <stop offset="0%" stop-color="#D1FAE5" stop-opacity="0.95"/>
      <stop offset="28%" stop-color="#10B981" stop-opacity="0.85"/>
      <stop offset="58%" stop-color="#0284C7" stop-opacity="0.88"/>
      <stop offset="85%" stop-color="#0B4B84" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#041E42" stop-opacity="0.98"/>
    </radialGradient>
    <radialGradient id="lobeGlassR" cx="62%" cy="28%" r="72%">
      <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.95"/>
      <stop offset="28%" stop-color="#34D399" stop-opacity="0.85"/>
      <stop offset="58%" stop-color="#0369A1" stop-opacity="0.88"/>
      <stop offset="85%" stop-color="#0B4B84" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#041E42" stop-opacity="0.98"/>
    </radialGradient>
    <linearGradient id="tracheaGlass" x1="244" y1="35" x2="296" y2="235" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="45%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <radialGradient id="heartCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="40%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#0284C7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="270" cy="320" r="220" fill="#38BDF8" fill-opacity="0.16" filter="url(#specularBlur)"/>
  <circle cx="270" cy="280" r="150" fill="#34D399" fill-opacity="0.18" filter="url(#specularBlur)"/>
  <g filter="url(#shadow3d)">
    <rect x="247" y="36" width="46" height="190" rx="23" fill="url(#tracheaGlass)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <rect x="251" y="58" width="38" height="10" rx="5" fill="#E0F2FE" fill-opacity="0.55"/>
    <rect x="251" y="78" width="38" height="10" rx="5" fill="#E0F2FE" fill-opacity="0.55"/>
    <rect x="251" y="98" width="38" height="10" rx="5" fill="#E0F2FE" fill-opacity="0.55"/>
    <rect x="251" y="118" width="38" height="10" rx="5" fill="#A7F3D0" fill-opacity="0.55"/>
    <rect x="251" y="138" width="38" height="10" rx="5" fill="#A7F3D0" fill-opacity="0.55"/>
    <rect x="251" y="158" width="38" height="10" rx="5" fill="#A7F3D0" fill-opacity="0.55"/>
    <path d="M252 152 C178 135 92 208 72 342 C54 462 118 528 198 512 C242 504 256 456 256 368 C256 290 258 182 252 152 Z" fill="url(#lobeGlassL)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <path d="M288 152 C362 135 448 208 468 342 C486 462 422 528 342 512 C298 504 284 456 284 368 C284 290 282 182 288 152 Z" fill="url(#lobeGlassR)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <g filter="url(#glowSoft)" opacity="0.92">
      <path d="M266 185 C235 205 202 238 178 278" stroke="url(#innerVeinGlow)" stroke-width="9" stroke-linecap="round"/>
      <path d="M215 225 C182 212 148 218 122 242" stroke="#A7F3D0" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M152 225 L125 198 M142 232 L106 232" stroke="#6EE7B7" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M192 255 C158 268 132 298 114 340" stroke="url(#innerVeinGlow)" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M145 292 L105 288 M132 315 L94 328 M122 332 L98 368" stroke="#7DD3FC" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M178 278 C172 335 162 395 142 452" stroke="url(#innerVeinGlow)" stroke-width="6" stroke-linecap="round"/>
      <path d="M168 345 L208 385 M162 378 L198 432 M152 412 L118 448 M145 438 L168 482" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
      <path d="M198 312 C218 352 225 402 218 455" stroke="#6EE7B7" stroke-width="4.5" stroke-linecap="round"/>
    </g>
    <g filter="url(#glowSoft)" opacity="0.92">
      <path d="M274 185 C305 205 338 238 362 278" stroke="url(#innerVeinGlow)" stroke-width="9" stroke-linecap="round"/>
      <path d="M325 225 C358 212 392 218 418 242" stroke="#A7F3D0" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M388 225 L415 198 M398 232 L434 232" stroke="#6EE7B7" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M348 255 C382 268 408 298 426 340" stroke="url(#innerVeinGlow)" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M395 292 L435 288 M408 315 L446 328 M418 332 L442 368" stroke="#7DD3FC" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M362 278 C368 335 378 395 398 452" stroke="url(#innerVeinGlow)" stroke-width="6" stroke-linecap="round"/>
      <path d="M372 345 L332 385 M378 378 L342 432 M388 412 L422 448 M395 438 L372 482" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
      <path d="M342 312 C322 352 315 402 322 455" stroke="#6EE7B7" stroke-width="4.5" stroke-linecap="round"/>
    </g>
    <circle cx="270" cy="295" r="52" fill="url(#heartCore)"/>
    <path d="M92 315 Q175 295 248 345" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="3" fill="none"/>
    <path d="M448 315 Q365 295 292 345" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="3" fill="none"/>
    <path d="M302 375 Q375 365 458 405" stroke="#7DD3FC" stroke-opacity="0.4" stroke-width="2.5" fill="none"/>
    <path d="M104 285 C118 212 168 168 228 164" stroke="#FFFFFF" stroke-opacity="0.88" stroke-width="10" stroke-linecap="round" fill="none" filter="url(#specularBlur)"/>
    <path d="M104 285 C118 212 168 168 228 164" stroke="#FFFFFF" stroke-opacity="0.95" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M436 285 C422 212 372 168 312 164" stroke="#FFFFFF" stroke-opacity="0.82" stroke-width="9" stroke-linecap="round" fill="none" filter="url(#specularBlur)"/>
    <path d="M88 395 C88 455 128 498 188 498" stroke="#7DD3FC" stroke-opacity="0.65" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M452 395 C452 455 412 498 352 498" stroke="#7DD3FC" stroke-opacity="0.65" stroke-width="6" stroke-linecap="round" fill="none"/>
  </g>
</svg>`,

  // ==========================================================================
  // 3. IKON 3D KECIL DI BARIS JUDUL HERO
  // ==========================================================================
  'nuvica-inline-title.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <g filter="url(#shadow3d)">
    <path d="M24 28 C14 55 22 86 52 88 C78 90 92 68 84 44" stroke="url(#glassCyanEmerald)" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M24 28 C14 55 22 86 52 88 C78 90 92 68 84 44" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="82" cy="40" r="20" fill="url(#glassSapphireCyan)" stroke="#FFFFFF" stroke-width="3.5"/>
    <circle cx="82" cy="40" r="9" fill="#A7F3D0"/>
    <circle cx="76" cy="34" r="4" fill="#FFFFFF" fill-opacity="0.9"/>
    <circle cx="24" cy="26" r="8" fill="#34D399" stroke="#FFFFFF" stroke-width="2.5"/>
    <circle cx="44" cy="22" r="8" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2.5"/>
  </g>
</svg>`,

  // ==========================================================================
  // 4. KARTU LAYANAN 1: Analisis Tubuh 3D Glass
  // ==========================================================================
  'nuvica-service-body.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="260" viewBox="0 0 280 260" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <circle cx="135" cy="130" r="95" fill="#34D399" fill-opacity="0.15" filter="url(#specularBlur)"/>
  <g filter="url(#shadow3d)">
    <path d="M130 32 C76 30 38 72 40 132 C42 192 80 228 130 224 C133 175 133 85 130 32 Z" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <path d="M140 32 C194 30 232 72 230 132 C228 192 190 228 140 224 C137 175 137 85 140 32 Z" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <g filter="url(#glowSoft)" opacity="0.9">
      <path d="M124 58 C95 55 72 75 75 102 C78 122 108 118 122 135 C92 140 65 158 76 186 C86 208 112 205 124 198" stroke="#A7F3D0" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M146 58 C175 55 198 75 195 102 C192 122 162 118 148 135 C178 140 205 158 194 186 C184 208 158 205 146 198" stroke="#A7F3D0" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M62 118 Q95 108 125 122 M208 118 Q175 108 145 122" stroke="#7DD3FC" stroke-width="4" stroke-linecap="round"/>
      <path d="M64 155 Q95 168 125 158 M206 155 Q175 168 145 158" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="96" cy="78" r="5.5" fill="#FFFFFF"/>
      <circle cx="174" cy="78" r="5.5" fill="#FFFFFF"/>
      <circle cx="82" cy="132" r="5.5" fill="#6EE7B7"/>
      <circle cx="188" cy="132" r="5.5" fill="#6EE7B7"/>
      <circle cx="102" cy="182" r="5.5" fill="#7DD3FC"/>
      <circle cx="168" cy="182" r="5.5" fill="#7DD3FC"/>
    </g>
    <ellipse cx="135" cy="132" rx="112" ry="34" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="4" stroke-dasharray="14 8" fill="none" transform="rotate(-10 135 132)"/>
    <ellipse cx="135" cy="132" rx="112" ry="34" stroke="#34D399" stroke-width="2.5" fill="none" transform="rotate(-10 135 132)"/>
    <path d="M58 95 C65 62 94 44 122 44" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M212 95 C205 62 176 44 148 44" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`,

  // ==========================================================================
  // 5. KARTU LAYANAN 2: Rencana Kalori & Menu 3D Glass
  // ==========================================================================
  'nuvica-service-meal.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="260" viewBox="0 0 280 260" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <circle cx="140" cy="135" r="95" fill="#10B981" fill-opacity="0.15" filter="url(#specularBlur)"/>
  <g filter="url(#shadow3d)">
    <path d="M126 38 L126 88 M142 44 L142 88" stroke="url(#glassSapphireCyan)" stroke-width="14" stroke-linecap="round"/>
    <path d="M126 38 L126 88" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="3" stroke-linecap="round"/>
    <path d="M34 156 C28 92 78 62 146 68 C158 115 144 168 106 198 C66 226 38 196 34 156 Z" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <path d="M138 72 C192 72 246 92 238 138 C232 178 176 208 118 192 C138 158 144 115 138 72 Z" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="3.5"/>
    <ellipse cx="146" cy="196" rx="28" ry="16" transform="rotate(-18 146 196)" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5"/>
    <g filter="url(#glowSoft)" opacity="0.9">
      <path d="M135 95 C105 108 75 132 58 164" stroke="#A7F3D0" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M96 118 L72 105 M82 136 L54 134" stroke="#6EE7B7" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M138 98 C168 108 198 122 218 142" stroke="#7DD3FC" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <path d="M176 114 L204 102 M182 128 L162 158" stroke="#A7F3D0" stroke-width="3.5" stroke-linecap="round"/>
    </g>
    <path d="M52 128 C62 88 98 76 135 78" stroke="#FFFFFF" stroke-opacity="0.92" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M152 84 C188 84 222 98 224 124" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`,

  // ==========================================================================
  // 6. KARTU LAYANAN 3: Rekomendasi Latihan 3D Glass
  // ==========================================================================
  'nuvica-service-workout.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="260" viewBox="0 0 280 260" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <circle cx="140" cy="130" r="95" fill="#0284C7" fill-opacity="0.16" filter="url(#specularBlur)"/>
  <g filter="url(#shadow3d)">
    <path d="M44 72 L98 112 M42 132 L102 132 M56 196 L104 148" stroke="url(#glassCyanEmerald)" stroke-width="16" stroke-linecap="round"/>
    <path d="M44 72 L98 112 M42 132 L102 132 M56 196 L104 148" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round"/>
    <path d="M118 68 C112 36 164 26 202 58 C240 90 242 166 204 202 C168 236 114 222 118 182 C122 154 144 148 144 128 C144 108 122 98 118 68 Z" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <g filter="url(#glowSoft)">
      <path d="M135 128 L154 128 L164 98 L178 162 L190 118 L208 118" stroke="#A7F3D0" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="175" cy="78" r="14" fill="#34D399" fill-opacity="0.45"/>
      <circle cx="175" cy="178" r="16" fill="#38BDF8" fill-opacity="0.45"/>
    </g>
    <path d="M142 52 C172 44 208 68 216 116" stroke="#FFFFFF" stroke-opacity="0.92" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M214 148 C206 184 176 208 142 204" stroke="#7DD3FC" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`,

  // ==========================================================================
  // 7. KARTU LAYANAN 4: Laporan Instan 3D Glass
  // ==========================================================================
  'nuvica-service-report.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="260" viewBox="0 0 280 260" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <g filter="url(#shadow3d)">
    <rect x="46" y="34" width="148" height="182" rx="34" transform="rotate(-6 46 34)" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <rect x="74" y="54" width="136" height="156" rx="28" fill="url(#glassSapphireCyan)" fill-opacity="0.82" stroke="#FFFFFF" stroke-width="3"/>
    <g filter="url(#glowSoft)">
      <circle cx="142" cy="108" r="32" stroke="#A7F3D0" stroke-width="7" fill="none"/>
      <path d="M128 108 L138 118 L158 96" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M96 172 L122 152 L144 164 L172 136 L190 146" stroke="#6EE7B7" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <path d="M88 68 L175 68" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="6" stroke-linecap="round"/>
  </g>
</svg>`,

  // ==========================================================================
  // 8. BAGIAN TENTANG KAMI (KIRI): Gedung Kaca Modern NutriFit Center
  // ==========================================================================
  'nuvica-about-showcase.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480" fill="none">
  <defs>
    <linearGradient id="skyDay" x1="0" y1="0" x2="720" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#68A8E8"/>
      <stop offset="45%" stop-color="#A8D0F8"/>
      <stop offset="100%" stop-color="#E6F2FC"/>
    </linearGradient>
    <linearGradient id="curtainWallLeft" x1="60" y1="110" x2="280" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B4B84"/>
      <stop offset="45%" stop-color="#1E88C8"/>
      <stop offset="100%" stop-color="#082F56"/>
    </linearGradient>
    <linearGradient id="curtainWallRight" x1="280" y1="110" x2="520" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0B4B84"/>
    </linearGradient>
    <linearGradient id="concreteWhite" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#DCEBF8"/>
    </linearGradient>
  </defs>
  <rect width="720" height="480" rx="36" fill="url(#skyDay)"/>
  <ellipse cx="145" cy="95" rx="95" ry="32" fill="#FFFFFF" fill-opacity="0.65"/>
  <ellipse cx="215" cy="108" rx="75" ry="26" fill="#FFFFFF" fill-opacity="0.75"/>
  <ellipse cx="520" cy="78" rx="110" ry="34" fill="#FFFFFF" fill-opacity="0.55"/>
  <polygon points="35,480 35,215 275,92 275,480" fill="url(#curtainWallLeft)"/>
  <polygon points="275,92 535,205 535,480 275,480" fill="url(#curtainWallRight)"/>
  <polygon points="65,245 185,182 145,480 45,480" fill="#7DD3FC" fill-opacity="0.22"/>
  <polygon points="315,155 425,205 385,480 295,480" fill="#A7F3D0" fill-opacity="0.18"/>
  <g stroke="#BAE6FD" stroke-opacity="0.45" stroke-width="2">
    <line x1="95" y1="185" x2="95" y2="480"/>
    <line x1="155" y1="154" x2="155" y2="480"/>
    <line x1="215" y1="122" x2="215" y2="480"/>
    <line x1="335" y1="118" x2="335" y2="480"/>
    <line x1="395" y1="145" x2="395" y2="480"/>
    <line x1="455" y1="172" x2="455" y2="480"/>
  </g>
  <polygon points="25,212 275,84 545,202 545,222 275,108 25,232" fill="url(#concreteWhite)"/>
  <polygon points="25,302 275,202 545,298 545,318 275,226 25,322" fill="url(#concreteWhite)"/>
  <polygon points="25,392 275,318 545,392 545,412 275,342 25,412" fill="url(#concreteWhite)"/>
  <rect x="266" y="88" width="18" height="392" fill="#FFFFFF"/>
  <g transform="translate(155, 224) skewY(-21)">
    <rect x="0" y="0" width="115" height="34" rx="6" fill="#0B4B84" stroke="#FFFFFF" stroke-width="2"/>
    <text x="57" y="23" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="800" letter-spacing="1.5">NUTRIFIT</text>
  </g>
  <g transform="translate(292, 165) skewY(20)">
    <rect x="0" y="0" width="145" height="42" rx="10" fill="#FFFFFF" stroke="#0B4B84" stroke-width="2.5"/>
    <circle cx="24" cy="21" r="10" fill="#38D46A"/>
    <text x="86" y="27" text-anchor="middle" fill="#0B2545" font-family="sans-serif" font-size="17" font-weight="800">NutriFit AI</text>
  </g>
  <circle cx="55" cy="465" r="45" fill="#10B981" fill-opacity="0.85"/>
  <circle cx="115" cy="475" r="38" fill="#059669" fill-opacity="0.9"/>
  <circle cx="495" cy="468" r="52" fill="#10B981" fill-opacity="0.8"/>
</svg>`,

  // ==========================================================================
  // 9–14. ENAM GAMBAR ARTIKEL SUMBER BELAJAR (3D Glassmorphism Edition)
  // ==========================================================================
  'artikel-piring-lokal.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <rect width="640" height="400" fill="#E6F2FC"/>
  <circle cx="320" cy="200" r="165" fill="#38BDF8" fill-opacity="0.15" filter="url(#specularBlur)"/>
  <g filter="url(#shadow3d)">
    <circle cx="320" cy="200" r="135" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="5"/>
    <path d="M320 82 A118 118 0 0 1 438 200 L320 200 Z" fill="url(#glassCyanEmerald)" stroke="#FFFFFF" stroke-width="3"/>
    <path d="M438 200 A118 118 0 0 1 320 318 L320 200 Z" fill="#0B4B84" fill-opacity="0.85" stroke="#FFFFFF" stroke-width="3"/>
    <path d="M320 318 A118 118 0 0 1 202 200 L320 200 Z" fill="#34D399" fill-opacity="0.85" stroke="#FFFFFF" stroke-width="3"/>
    <circle cx="320" cy="200" r="42" fill="#FFFFFF" fill-opacity="0.92"/>
    <circle cx="320" cy="200" r="22" fill="#FFC83D"/>
    <path d="M225 135 Q265 95 315 95" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none"/>
  </g>
</svg>`,

  'artikel-ukur-pinggang.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <rect width="640" height="400" fill="#DCEBF8"/>
  <g filter="url(#shadow3d)">
    <ellipse cx="320" cy="210" rx="185" ry="75" stroke="url(#glassSapphireCyan)" stroke-width="34" fill="none"/>
    <ellipse cx="320" cy="192" rx="185" ry="75" stroke="url(#glassCyanEmerald)" stroke-width="28" fill="none"/>
    <ellipse cx="320" cy="192" rx="185" ry="75" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="4" stroke-dasharray="16 12" fill="none"/>
    <circle cx="320" cy="192" r="56" fill="url(#glassSapphireCyan)" stroke="#FFFFFF" stroke-width="4"/>
    <text x="320" y="202" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="28" font-weight="800">WHR</text>
  </g>
</svg>`,

  'artikel-latihan-mandiri.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <rect width="640" height="400" fill="#EAF4FC"/>
  <g filter="url(#shadow3d)">
    <rect x="195" y="176" width="250" height="48" rx="24" fill="url(#glassSapphireCyan)" stroke="#FFFFFF" stroke-width="3"/>
    <rect x="135" y="105" width="68" height="190" rx="34" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <rect x="437" y="105" width="68" height="190" rx="34" fill="url(#glassCyanEmerald)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <path d="M158 135 L158 210 M460 135 L460 210" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round"/>
  </g>
</svg>`,

  'artikel-energi-seimbang.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <rect width="640" height="400" fill="#E3F7EB"/>
  <g filter="url(#shadow3d)">
    <circle cx="320" cy="200" r="128" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="5"/>
    <path d="M338 98 L262 208 H322 L298 302 L378 188 H318 L338 98 Z" fill="url(#glassCyanEmerald)" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>
    <path d="M232 142 C252 108 285 92 320 92" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round" fill="none"/>
  </g>
</svg>`,

  'artikel-jalan-kaki.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <rect width="640" height="400" fill="#E8F2FC"/>
  <g filter="url(#shadow3d)">
    <path d="M110 285 C195 145 285 305 375 175 C435 95 495 215 535 135" stroke="url(#glassCyanEmerald)" stroke-width="22" stroke-linecap="round" fill="none"/>
    <path d="M110 285 C195 145 285 305 375 175 C435 95 495 215 535 135" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="110" cy="285" r="24" fill="url(#glassSapphireCyan)" stroke="#FFFFFF" stroke-width="4"/>
    <circle cx="375" cy="175" r="22" fill="url(#glassCyanEmerald)" stroke="#FFFFFF" stroke-width="4"/>
    <circle cx="535" cy="135" r="28" fill="url(#glassSapphireCyan)" stroke="#FFFFFF" stroke-width="4"/>
  </g>
</svg>`,

  'artikel-tidur-pulih.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" fill="none">
  <defs>${COMMON_GLASS_DEFS}</defs>
  <rect width="640" height="400" fill="#DCEBF8"/>
  <g filter="url(#shadow3d)">
    <circle cx="320" cy="200" r="125" fill="url(#glassSapphireCyan)" stroke="url(#glassRimWhite)" stroke-width="4"/>
    <path d="M352 118 A82 82 0 1 0 416 252 A68 68 0 1 1 352 118 Z" fill="url(#glassCyanEmerald)" stroke="#FFFFFF" stroke-width="3.5"/>
    <circle cx="255" cy="145" r="8" fill="#A7F3D0"/>
    <circle cx="395" cy="148" r="6" fill="#FFFFFF"/>
  </g>
</svg>`,
};

for (const [filename, content] of Object.entries(svgFiles)) {
  writeFileSync(join(outDir, filename), content.trim(), 'utf8');
}

console.log('Berhasil memperbarui nuvica-hero-person.svg dengan 3D Glass Fitness Athlete Pose!');