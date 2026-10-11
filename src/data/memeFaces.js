// Curated collection of iconic meme face presets for instant face morphing and swapping
// Provides instant 1-click faces as high-resolution SVG data URLs

const svgToDataUrl = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

export const MEME_FACE_PRESETS = [
  {
    id: 'user_face',
    name: 'Your Photo',
    category: 'Photos',
    tag: 'Uploaded Portrait',
    url: '/user_face.jpg'
  },
  {
    id: 'gigachad',
    name: 'Gigachad',
    category: 'Chad',
    tag: 'Ultra Masculine',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130">
      <!-- Sharp Chiseled Face Outline -->
      <defs>
        <linearGradient id="gc_skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#dfb194"/>
          <stop offset="100%" stop-color="#9f6b4d"/>
        </linearGradient>
        <linearGradient id="gc_jaw" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2d2a29"/>
          <stop offset="100%" stop-color="#141211"/>
        </linearGradient>
      </defs>
      <!-- Hair -->
      <path d="M 25 35 C 20 10, 60 5, 95 20 C 105 25, 102 42, 95 48 C 95 25, 75 16, 50 18 C 30 20, 26 28, 25 35 Z" fill="#2d241e"/>
      <!-- Face & Massive Jaw -->
      <path d="M 28 40 C 25 65, 30 80, 42 98 L 60 115 L 78 98 C 90 80, 95 65, 92 40 C 80 32, 40 32, 28 40 Z" fill="url(#gc_skin)" stroke="#523724" stroke-width="2"/>
      <!-- Beard & Stubble -->
      <path d="M 33 72 C 38 98, 48 112, 60 115 C 72 112, 82 98, 87 72 C 80 84, 68 88, 60 88 C 52 88, 40 84, 33 72 Z" fill="url(#gc_jaw)"/>
      <!-- Cheekbones Definition -->
      <path d="M 35 58 L 48 70 L 38 82" stroke="#523724" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M 85 58 L 72 70 L 82 82" stroke="#523724" stroke-width="2" fill="none" opacity="0.6"/>
      <!-- Eyes & Intense Brows -->
      <path d="M 34 46 L 50 49" stroke="#1f140e" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M 86 46 L 70 49" stroke="#1f140e" stroke-width="4.5" stroke-linecap="round"/>
      <ellipse cx="44" cy="53" rx="5" ry="3" fill="#1f140e"/>
      <ellipse cx="76" cy="53" rx="5" ry="3" fill="#1f140e"/>
      <!-- Chiseled Nose -->
      <path d="M 60 48 L 57 68 L 63 68 Z" fill="#7a4f35"/>
      <ellipse cx="60" cy="70" rx="6" ry="2.5" fill="#523724"/>
      <!-- Confident Smirk / Lips -->
      <path d="M 48 80 Q 60 84 72 80" stroke="#4a2618" stroke-width="3" fill="none" stroke-linecap="round"/>
      <line x1="52" y1="80" x2="68" y2="80" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Chin Cleft -->
      <line x1="60" y1="104" x2="60" y2="110" stroke="#141211" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'wojak',
    name: 'Wojak (Feels Guy)',
    category: 'Classics',
    tag: 'Existential Expression',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130">
      <!-- Bald Head -->
      <path d="M 30 55 C 22 25, 45 10, 68 12 C 92 14, 102 35, 96 65 C 90 92, 75 110, 60 112 C 45 110, 32 92, 30 55 Z" fill="#f5eedb" stroke="#111111" stroke-width="3" stroke-linejoin="round"/>
      <!-- Melancholy Eyes -->
      <ellipse cx="48" cy="54" rx="7" ry="5" fill="#ffffff" stroke="#111111" stroke-width="2.5"/>
      <circle cx="48" cy="54" r="3" fill="#111111"/>
      <ellipse cx="78" cy="54" rx="7" ry="5" fill="#ffffff" stroke="#111111" stroke-width="2.5"/>
      <circle cx="78" cy="54" r="3" fill="#111111"/>
      <!-- Sad Eyebrows -->
      <path d="M 38 46 Q 48 40 56 46" stroke="#111111" stroke-width="3" fill="none"/>
      <path d="M 88 46 Q 78 40 70 46" stroke="#111111" stroke-width="3" fill="none"/>
      <!-- Forehead Wrinkles -->
      <path d="M 45 28 Q 60 25 75 28" stroke="#777777" stroke-width="1.8" fill="none"/>
      <path d="M 42 34 Q 60 31 78 34" stroke="#777777" stroke-width="1.8" fill="none"/>
      <!-- Nose -->
      <path d="M 62 52 L 58 68 Q 64 72 68 68" stroke="#111111" stroke-width="2.5" fill="none"/>
      <!-- Expressive Downward Lips -->
      <path d="M 46 86 Q 62 80 78 86" stroke="#111111" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Stubble dots -->
      <ellipse cx="62" cy="98" rx="14" ry="4" fill="#d8cdb2" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'trollface',
    name: 'Trollface',
    category: 'Classics',
    tag: 'Problem?',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 110">
      <!-- Distinct Asymmetric Head -->
      <path d="M 20 55 C 12 25, 52 8, 95 15 C 120 22, 125 55, 114 74 C 102 92, 58 98, 32 88 C 20 82, 16 68, 20 55 Z" fill="#ffffff" stroke="#000000" stroke-width="4.5" stroke-linejoin="round"/>
      <!-- Wide Iconic Grin -->
      <path d="M 28 56 C 50 84, 94 82, 110 54 C 88 66, 50 66, 28 56 Z" fill="#000000"/>
      <!-- Jagged Teeth -->
      <path d="M 40 60 L 42 70 M 52 64 L 54 75 M 65 65 L 66 76 M 78 64 L 78 74 M 90 61 L 88 70 M 100 58 L 97 66" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Mischief Eyes -->
      <ellipse cx="48" cy="38" rx="8" ry="5" fill="#000000" transform="rotate(-15 48 38)"/>
      <ellipse cx="88" cy="35" rx="10" ry="6" fill="#000000" transform="rotate(10 88 35)"/>
      <!-- Wrinkle Eyebrows -->
      <path d="M 32 30 C 44 22, 60 25, 65 30 M 78 25 C 90 20, 106 28, 110 32" stroke="#000000" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Cheek Creases -->
      <path d="M 22 45 Q 26 60 32 70" stroke="#000000" stroke-width="2.5" fill="none"/>
      <path d="M 112 42 Q 116 56 112 68" stroke="#000000" stroke-width="2.5" fill="none"/>
    </svg>`
  },
  {
    id: 'therock',
    name: 'The Rock (Eyebrow)',
    category: 'Celebrity',
    tag: 'Vine Boom 🤨',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130">
      <!-- Head -->
      <defs>
        <linearGradient id="tr_skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#bd8763"/>
          <stop offset="100%" stop-color="#8a5b3a"/>
        </linearGradient>
      </defs>
      <path d="M 30 45 C 28 20, 52 10, 68 10 C 88 10, 98 25, 96 50 C 94 80, 85 106, 64 112 C 45 106, 32 80, 30 45 Z" fill="url(#tr_skin)" stroke="#4d301c" stroke-width="2.5"/>
      <!-- The Iconic Raised Right Eyebrow -->
      <path d="M 32 48 Q 44 42 54 44" stroke="#1f1108" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M 72 32 Q 86 20 98 28" stroke="#1f1108" stroke-width="6" stroke-linecap="round"/>
      <!-- Eyes (Left squinting, Right wide stare) -->
      <ellipse cx="44" cy="52" rx="6" ry="3.5" fill="#1f1108"/>
      <ellipse cx="86" cy="44" rx="8" ry="7" fill="#ffffff" stroke="#1f1108" stroke-width="2"/>
      <circle cx="86" cy="44" r="4.5" fill="#1f1108"/>
      <circle cx="88" cy="42" r="1.5" fill="#ffffff"/>
      <!-- Forehead Tension Arch -->
      <path d="M 74 22 Q 86 16 96 22" stroke="#523119" stroke-width="2" fill="none"/>
      <!-- Broad Nose -->
      <path d="M 64 46 L 59 66 Q 66 70 71 66" stroke="#3d210e" stroke-width="2.5" fill="none"/>
      <!-- Smirk / Pursed Lip Expression -->
      <path d="M 46 84 Q 60 88 78 80" stroke="#331808" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'harold',
    name: 'Hide The Pain Harold',
    category: 'Classics',
    tag: 'Forced Grin',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130">
      <defs>
        <linearGradient id="hd_skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffdfba"/>
          <stop offset="100%" stop-color="#e0a978"/>
        </linearGradient>
      </defs>
      <!-- Head with grey hair -->
      <path d="M 28 50 C 22 25, 48 12, 65 14 C 88 14, 102 28, 98 56 C 94 85, 82 108, 64 112 C 45 108, 32 85, 28 50 Z" fill="url(#hd_skin)" stroke="#7c5332" stroke-width="2.5"/>
      <!-- White/Grey Wispy Hair -->
      <path d="M 24 50 C 20 20, 50 10, 68 12 C 90 12, 104 22, 102 52 C 96 26, 78 18, 60 18 C 40 18, 28 30, 24 50 Z" fill="#e2e8f0"/>
      <!-- Painful Smiling Eyes (Crinkled) -->
      <path d="M 36 50 Q 46 44 56 50" stroke="#4a2e18" stroke-width="3" fill="none"/>
      <path d="M 72 50 Q 82 44 92 50" stroke="#4a2e18" stroke-width="3" fill="none"/>
      <circle cx="46" cy="51" r="2.5" fill="#1e293b"/>
      <circle cx="82" cy="51" r="2.5" fill="#1e293b"/>
      <!-- Eye Bags / Crow's Feet -->
      <path d="M 32 52 Q 46 58 58 54" stroke="#855734" stroke-width="1.8" fill="none"/>
      <path d="M 70 54 Q 82 58 96 52" stroke="#855734" stroke-width="1.8" fill="none"/>
      <!-- Nose -->
      <path d="M 64 48 L 60 68 Q 66 72 70 68" stroke="#693d1e" stroke-width="2.2" fill="none"/>
      <!-- Forced Smile Grimace Teeth -->
      <rect x="42" y="80" width="42" height="15" rx="5" fill="#ffffff" stroke="#331e0f" stroke-width="2.5"/>
      <line x1="52" y1="80" x2="52" y2="95" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="63" y1="80" x2="63" y2="95" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="74" y1="80" x2="74" y2="95" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- Grey Goatee -->
      <path d="M 52 98 Q 63 106 74 98" stroke="#cbd5e1" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'nic_cage',
    name: 'Nicolas Cage',
    category: 'Celebrity',
    tag: "You Don't Say?",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130">
      <defs>
        <linearGradient id="nc_skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
      </defs>
      <!-- Head with receding black hair -->
      <path d="M 28 55 C 22 25, 52 10, 70 12 C 94 14, 102 32, 98 60 C 92 88, 78 110, 62 114 C 44 110, 32 88, 28 55 Z" fill="#ffedd5" stroke="#111111" stroke-width="2.5"/>
      <!-- Receding Dark Hair -->
      <path d="M 25 50 C 22 18, 55 8, 80 10 C 102 12, 105 35, 102 52 C 94 25, 78 20, 60 22 C 45 24, 32 35, 25 50 Z" fill="#1e1b18"/>
      <!-- Wild Wide Open Eyes -->
      <ellipse cx="44" cy="50" rx="9" ry="8" fill="#ffffff" stroke="#111111" stroke-width="2.5"/>
      <circle cx="44" cy="50" r="4.5" fill="#111111"/>
      <ellipse cx="82" cy="50" rx="9" ry="8" fill="#ffffff" stroke="#111111" stroke-width="2.5"/>
      <circle cx="82" cy="50" r="4.5" fill="#111111"/>
      <!-- Highly Raised Incredulous Eyebrows -->
      <path d="M 32 38 Q 44 26 56 34" stroke="#111111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M 70 34 Q 82 26 94 38" stroke="#111111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <!-- Distinct Pointed Nose -->
      <path d="M 64 45 L 59 70 Q 66 74 71 70" stroke="#111111" stroke-width="2.5" fill="none"/>
      <!-- Wide Manic Open Smile -->
      <path d="M 38 80 Q 63 105 88 80 Z" fill="#ffffff" stroke="#111111" stroke-width="2.5"/>
      <line x1="38" y1="80" x2="88" y2="80" stroke="#111111" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'doge',
    name: 'Doge (Shiba Inu)',
    category: 'Animals',
    tag: 'Much Wow',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <!-- Ears -->
      <polygon points="20,40 32,8 54,28" fill="#d97706" stroke="#92400e" stroke-width="2.5"/>
      <polygon points="26,36 34,18 48,30" fill="#fef3c7"/>
      <polygon points="100,40 88,8 66,28" fill="#d97706" stroke="#92400e" stroke-width="2.5"/>
      <polygon points="94,36 86,18 72,30" fill="#fef3c7"/>
      <!-- Fluffy Head -->
      <ellipse cx="60" cy="62" rx="46" ry="42" fill="#f59e0b" stroke="#92400e" stroke-width="3"/>
      <!-- White Muzzle -->
      <ellipse cx="60" cy="74" rx="26" ry="24" fill="#fef3c7"/>
      <!-- Cute Eyes with Side-Glance -->
      <ellipse cx="44" cy="52" rx="6" ry="8" fill="#000000"/>
      <circle cx="42" cy="50" r="2.5" fill="#ffffff"/>
      <ellipse cx="76" cy="52" rx="6" ry="8" fill="#000000"/>
      <circle cx="74" cy="50" r="2.5" fill="#ffffff"/>
      <!-- Soft Brows -->
      <ellipse cx="42" cy="40" rx="6" ry="3" fill="#ffffff"/>
      <ellipse cx="78" cy="40" rx="6" ry="3" fill="#ffffff"/>
      <!-- Black Button Nose -->
      <ellipse cx="60" cy="68" rx="7" ry="5.5" fill="#1e1b18"/>
      <!-- Tongue / Mouth line -->
      <path d="M 54 75 Q 60 79 66 75" stroke="#1e1b18" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    id: 'crying_jordan',
    name: 'Crying Jordan',
    category: 'Sports',
    tag: 'Tears of Defeat',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130">
      <defs>
        <linearGradient id="cj_skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#804a29"/>
          <stop offset="100%" stop-color="#4d2c18"/>
        </linearGradient>
      </defs>
      <!-- Bald Head -->
      <path d="M 30 50 C 24 24, 48 10, 65 10 C 88 10, 102 24, 98 55 C 92 84, 82 108, 64 112 C 45 108, 32 84, 30 50 Z" fill="url(#cj_skin)" stroke="#2b1509" stroke-width="2.5"/>
      <!-- Red Puffy Teary Eyes -->
      <ellipse cx="44" cy="52" rx="10" ry="7" fill="#dc2626" opacity="0.65"/>
      <ellipse cx="44" cy="52" rx="6" ry="4" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
      <circle cx="44" cy="52" r="3" fill="#111111"/>
      <ellipse cx="80" cy="52" rx="10" ry="7" fill="#dc2626" opacity="0.65"/>
      <ellipse cx="80" cy="52" rx="6" ry="4" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
      <circle cx="80" cy="52" r="3" fill="#111111"/>
      <!-- Massive Glistening Tears -->
      <path d="M 40 58 Q 36 78 42 88 C 45 78, 48 66, 44 58 Z" fill="#38bdf8" opacity="0.85"/>
      <circle cx="41" cy="90" r="3.5" fill="#38bdf8"/>
      <path d="M 84 58 Q 88 78 82 88 C 79 78, 76 66, 80 58 Z" fill="#38bdf8" opacity="0.85"/>
      <circle cx="83" cy="90" r="3.5" fill="#38bdf8"/>
      <!-- Distressed Eyebrows -->
      <path d="M 34 42 Q 44 38 52 46" stroke="#111111" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 90 42 Q 80 38 72 46" stroke="#111111" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- Quivering Lip -->
      <path d="M 46 86 Q 62 80 78 86" stroke="#241106" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'pepe',
    name: 'Pepe The Frog',
    category: 'Classics',
    tag: 'Feels Good / Bad',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="pepe_skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#65a30d"/>
          <stop offset="100%" stop-color="#4d7c0f"/>
        </linearGradient>
      </defs>
      <!-- Head shape -->
      <path d="M 22 55 C 16 35, 34 25, 48 26 C 60 26, 70 30, 80 26 C 96 24, 108 38, 104 62 C 98 88, 80 102, 60 104 C 36 102, 24 85, 22 55 Z" fill="url(#pepe_skin)" stroke="#1a2e05" stroke-width="3"/>
      <!-- Giant Frog Eyes -->
      <circle cx="44" cy="35" r="16" fill="#ffffff" stroke="#1a2e05" stroke-width="3"/>
      <ellipse cx="44" cy="35" rx="5" ry="8" fill="#111111"/>
      <circle cx="42" cy="32" r="2.5" fill="#ffffff"/>
      <circle cx="82" cy="35" r="16" fill="#ffffff" stroke="#1a2e05" stroke-width="3"/>
      <ellipse cx="82" cy="35" rx="5" ry="8" fill="#111111"/>
      <circle cx="80" cy="32" r="2.5" fill="#ffffff"/>
      <!-- Heavy Eyelids -->
      <path d="M 28 32 Q 44 24 60 32" stroke="#1a2e05" stroke-width="3" fill="none"/>
      <path d="M 66 32 Q 82 24 98 32" stroke="#1a2e05" stroke-width="3" fill="none"/>
      <!-- Big Iconic Lips -->
      <path d="M 24 72 C 45 88, 80 88, 102 72" stroke="#ca8a04" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 24 72 C 45 88, 80 88, 102 72" stroke="#1a2e05" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`
  }
];

// Helper to convert preset to usable image data URL
export const getMemeFaceDataUrl = (preset) => {
  if (preset.url) return preset.url;
  if (preset.svg) return svgToDataUrl(preset.svg);
  return '';
};
