import json, urllib.parse

categories = [
    {"id": "memes", "label": "Memes", "icon": "🕶️"},
    {"id": "faces", "label": "Faces", "icon": "😂"},
    {"id": "props", "label": "Props", "icon": "👑"},
    {"id": "bubbles", "label": "Bubbles", "icon": "💬"},
    {"id": "badges", "label": "Badges", "icon": "🏷️"},
    {"id": "reactions", "label": "Reactions", "icon": "🔥"}
]

stickers = []

def add_sticker(sid, name, cat, svg):
    stickers.append({
        "id": sid,
        "name": name,
        "category": cat,
        "svg": svg.strip().replace("\n", " ").replace("  ", " ")
    })

# ================= 1. MEMES & LEGENDS =================
add_sticker("thug_shades", "Thug Life Shades", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect x="5" y="10" width="45" height="20" fill="#000" />
  <rect x="70" y="10" width="45" height="20" fill="#000" />
  <rect x="50" y="15" width="20" height="6" fill="#000" />
  <rect x="7" y="12" width="6" height="4" fill="#fff" />
  <rect x="13" y="16" width="6" height="4" fill="#fff" />
  <rect x="72" y="12" width="6" height="4" fill="#fff" />
  <rect x="78" y="16" width="6" height="4" fill="#fff" />
  <rect x="0" y="13" width="8" height="5" fill="#000" />
  <rect x="112" y="13" width="8" height="5" fill="#000" />
</svg>""")

add_sticker("thug_joint", "Thug Life Cigar / Joint", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30">
  <rect x="5" y="10" width="70" height="10" rx="3" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />
  <rect x="60" y="10" width="15" height="10" fill="#f59e0b" />
  <rect x="5" y="10" width="8" height="10" fill="#ef4444" />
  <rect x="2" y="12" width="4" height="6" fill="#78716c" />
  <path d="M 8 7 Q 14 3 20 5 Q 26 2 32 6" stroke="#94a3b8" stroke-width="2" fill="none" stroke-linecap="round" />
</svg>""")

add_sticker("laser_eyes_red", "Laser Eyes (Red)", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 60">
  <defs>
    <radialGradient id="le_red" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#ff0055"/>
      <stop offset="70%" stop-color="#ff0000"/>
      <stop offset="100%" stop-color="#ff0000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <polygon points="35,30 -50,10 -50,50" fill="rgba(255,0,0,0.4)" />
  <polygon points="35,30 -20,22 -20,38" fill="rgba(255,200,200,0.8)" />
  <circle cx="35" cy="30" r="24" fill="url(#le_red)" />
  <circle cx="35" cy="30" r="8" fill="#ffffff" />
  <polygon points="105,30 190,10 190,50" fill="rgba(255,0,0,0.4)" />
  <polygon points="105,30 160,22 160,38" fill="rgba(255,200,200,0.8)" />
  <circle cx="105" cy="30" r="24" fill="url(#le_red)" />
  <circle cx="105" cy="30" r="8" fill="#ffffff" />
</svg>""")

add_sticker("laser_eyes_blue", "Laser Eyes (Cyan / Blue)", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 60">
  <defs>
    <radialGradient id="le_blue" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#00f0ff"/>
      <stop offset="70%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <polygon points="35,30 -40,15 -40,45" fill="rgba(0,240,255,0.4)" />
  <circle cx="35" cy="30" r="24" fill="url(#le_blue)" />
  <circle cx="35" cy="30" r="8" fill="#ffffff" />
  <polygon points="105,30 180,15 180,45" fill="rgba(0,240,255,0.4)" />
  <circle cx="105" cy="30" r="24" fill="url(#le_blue)" />
  <circle cx="105" cy="30" r="8" fill="#ffffff" />
</svg>""")

add_sticker("mlg_hitmarker", "MLG Hitmarker", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
  <line x1="8" y1="8" x2="22" y2="22" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
  <line x1="52" y1="8" x2="38" y2="22" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
  <line x1="8" y1="52" x2="22" y2="38" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
  <line x1="52" y1="52" x2="38" y2="38" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
</svg>""")

add_sticker("illuminati_eye", "Illuminati Eye", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <polygon points="50,6 6,82 94,82" fill="#22c55e" stroke="#15803d" stroke-width="3" stroke-linejoin="round" />
  <polygon points="50,18 18,74 82,74" fill="#86efac" />
  <path d="M 32 50 C 40 38, 60 38, 68 50 C 60 62, 40 62, 32 50 Z" fill="#ffffff" stroke="#000000" stroke-width="2.5" />
  <circle cx="50" cy="50" r="6" fill="#15803d" />
  <circle cx="50" cy="50" r="3" fill="#000000" />
</svg>""")

add_sticker("doge_dog", "Doge (Shiba Inu)", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="15,40 25,10 45,28" fill="#d49b53" stroke="#8a5a20" stroke-width="2" />
  <polygon points="22,34 28,16 40,28" fill="#f5d5aa" />
  <polygon points="85,40 75,10 55,28" fill="#d49b53" stroke="#8a5a20" stroke-width="2" />
  <polygon points="78,34 72,16 60,28" fill="#f5d5aa" />
  <ellipse cx="50" cy="55" rx="40" ry="36" fill="#e5aa62" stroke="#8a5a20" stroke-width="2.5" />
  <ellipse cx="36" cy="44" rx="14" ry="10" fill="#fff5ea" />
  <ellipse cx="64" cy="44" rx="14" ry="10" fill="#fff5ea" />
  <circle cx="34" cy="44" r="5" fill="#111" />
  <circle cx="32" cy="42" r="1.5" fill="#fff" />
  <circle cx="62" cy="44" r="5" fill="#111" />
  <circle cx="60" cy="42" r="1.5" fill="#fff" />
  <ellipse cx="50" cy="66" rx="22" ry="16" fill="#fff8ee" />
  <ellipse cx="50" cy="58" rx="7" ry="5" fill="#111" />
  <path d="M 44 67 Q 50 72 56 67" stroke="#111" stroke-width="2" fill="none" />
</svg>""")

add_sticker("cheems", "Cheems", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="54" rx="38" ry="34" fill="#d9984c" stroke="#78350f" stroke-width="2.5" />
  <polygon points="20,38 28,15 42,30" fill="#d9984c" stroke="#78350f" stroke-width="2" />
  <polygon points="80,38 72,15 58,30" fill="#d9984c" stroke="#78350f" stroke-width="2" />
  <ellipse cx="50" cy="64" rx="20" ry="18" fill="#fef3c7" />
  <circle cx="38" cy="46" r="3" fill="#111" />
  <circle cx="62" cy="46" r="3" fill="#111" />
  <ellipse cx="50" cy="58" rx="5" ry="4" fill="#111" />
  <path d="M 42 68 Q 50 62 58 68" stroke="#78350f" stroke-width="2" fill="none" />
</svg>""")

add_sticker("pepe_smug", "Pepe Smug", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <ellipse cx="50" cy="48" rx="44" ry="34" fill="#699e3d" stroke="#35571b" stroke-width="3" />
  <circle cx="32" cy="28" r="16" fill="#699e3d" stroke="#35571b" stroke-width="3" />
  <circle cx="68" cy="28" r="16" fill="#699e3d" stroke="#35571b" stroke-width="3" />
  <circle cx="32" cy="28" r="12" fill="#ffffff" />
  <circle cx="68" cy="28" r="12" fill="#ffffff" />
  <ellipse cx="34" cy="30" rx="7" ry="5" fill="#784212" />
  <circle cx="35" cy="30" r="3.5" fill="#000" />
  <circle cx="33" cy="28" r="1" fill="#fff" />
  <ellipse cx="70" cy="30" rx="7" ry="5" fill="#784212" />
  <circle cx="71" cy="30" r="3.5" fill="#000" />
  <circle cx="69" cy="28" r="1" fill="#fff" />
  <path d="M 16 56 C 30 72, 70 72, 86 52 C 72 62, 32 62, 16 56 Z" fill="#b03a2e" stroke="#5b140d" stroke-width="2.5" />
</svg>""")

add_sticker("pepe_sad", "Feels Bad Man (Sad Pepe)", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <ellipse cx="50" cy="48" rx="44" ry="34" fill="#699e3d" stroke="#35571b" stroke-width="3" />
  <circle cx="32" cy="28" r="15" fill="#ffffff" stroke="#35571b" stroke-width="2.5" />
  <circle cx="68" cy="28" r="15" fill="#ffffff" stroke="#35571b" stroke-width="2.5" />
  <ellipse cx="32" cy="32" rx="6" ry="7" fill="#784212" />
  <ellipse cx="68" cy="32" rx="6" ry="7" fill="#784212" />
  <path d="M 20 66 Q 50 50 80 66" stroke="#b03a2e" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M 24 38 Q 30 50 28 62" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round" />
</svg>""")

add_sticker("wojak_feels", "Wojak (Feels Guy)", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 25 35 C 25 15, 45 10, 70 12 C 85 14, 90 35, 88 55 C 86 75, 75 88, 50 90 C 35 90, 22 75, 24 55 Z" fill="#f8fafc" stroke="#000000" stroke-width="2.5" />
  <path d="M 40 40 Q 50 44 60 40" stroke="#000" stroke-width="2" fill="none" />
  <ellipse cx="44" cy="48" rx="4" ry="2" fill="#000" />
  <ellipse cx="66" cy="48" rx="4" ry="2" fill="#000" />
  <path d="M 38 72 Q 52 64 68 72" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round" />
</svg>""")

add_sticker("chad_nordic", "Yes Chad", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 30 18 Q 65 10 75 25 Q 85 45 70 65 L 75 88 L 45 80 L 30 65 Z" fill="#fde047" stroke="#854d0e" stroke-width="2.5" />
  <polygon points="50,85 70,68 85,55 80,75 60,92" fill="#ca8a04" />
  <circle cx="58" cy="42" r="3" fill="#000" />
  <line x1="45" y1="36" x2="68" y2="38" stroke="#854d0e" stroke-width="3" />
  <line x1="50" y1="62" x2="68" y2="60" stroke="#000" stroke-width="2.5" />
</svg>""")

add_sticker("gigachad", "Gigachad Jawline", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <polygon points="50,88 15,50 20,35 34,45 50,52 66,45 80,35 85,50" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
  <path d="M 35 40 Q 50 48 65 40" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" />
  <polygon points="50,88 32,54 50,58 68,54" fill="#27272a" />
</svg>""")

add_sticker("soyjak", "Soyjak Pointing Face", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="50" rx="38" ry="42" fill="#fef2f2" stroke="#000" stroke-width="2.5" />
  <rect x="25" y="32" width="20" height="14" rx="3" fill="none" stroke="#000" stroke-width="2.5" />
  <rect x="55" y="32" width="20" height="14" rx="3" fill="none" stroke="#000" stroke-width="2.5" />
  <line x1="45" y1="39" x2="55" y2="39" stroke="#000" stroke-width="2.5" />
  <ellipse cx="50" cy="68" rx="16" ry="18" fill="#991b1b" stroke="#000" stroke-width="2.5" />
  <rect x="42" y="54" width="16" height="5" fill="#fff" />
</svg>""")

add_sticker("surprised_pikachu", "Surprised Pikachu", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <polygon points="18,40 5,8 35,28" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
  <polygon points="5,8 12,18 20,12" fill="#000" />
  <polygon points="82,40 95,8 65,28" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
  <polygon points="95,8 88,18 80,12" fill="#000" />
  <circle cx="50" cy="52" r="36" fill="#facc15" stroke="#ca8a04" stroke-width="2.5" />
  <circle cx="36" cy="46" r="4.5" fill="#000" />
  <circle cx="64" cy="46" r="4.5" fill="#000" />
  <circle cx="24" cy="56" r="7" fill="#ef4444" />
  <circle cx="76" cy="56" r="7" fill="#ef4444" />
  <ellipse cx="50" cy="64" rx="8" ry="12" fill="#78350f" />
</svg>""")

add_sticker("arthur_fist", "Arthur's Fist", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80">
  <path d="M 15 45 L 35 45 L 35 30 Q 55 25 75 35 Q 85 45 80 65 Q 65 80 40 75 L 15 75 Z" fill="#eab308" stroke="#854d0e" stroke-width="3" stroke-linejoin="round" />
  <ellipse cx="62" cy="52" rx="14" ry="12" fill="#facc15" stroke="#854d0e" stroke-width="2.5" />
  <line x1="15" y1="45" x2="35" y2="45" stroke="#854d0e" stroke-width="3" />
  <line x1="15" y1="75" x2="35" y2="75" stroke="#854d0e" stroke-width="3" />
</svg>""")

add_sticker("roll_safe", "Roll Safe (Think About It)", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <circle cx="45" cy="45" r="36" fill="#78350f" stroke="#451a03" stroke-width="2.5" />
  <circle cx="35" cy="42" r="4" fill="#000" />
  <circle cx="55" cy="42" r="4" fill="#000" />
  <path d="M 38 60 Q 48 68 58 60" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" />
  <!-- Finger tapping head -->
  <path d="M 85 55 L 70 38 L 56 36" stroke="#78350f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 85 55 L 70 38 L 56 36" stroke="#451a03" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
</svg>""")

add_sticker("smudge_cat", "Smudge the Cat", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <polygon points="20,40 10,12 38,28" fill="#ffffff" stroke="#94a3b8" stroke-width="2" />
  <polygon points="18,32 14,18 28,26" fill="#fbcfe8" />
  <polygon points="80,40 90,12 62,28" fill="#ffffff" stroke="#94a3b8" stroke-width="2" />
  <polygon points="82,32 86,18 72,26" fill="#fbcfe8" />
  <circle cx="50" cy="54" r="36" fill="#ffffff" stroke="#94a3b8" stroke-width="2.5" />
  <ellipse cx="36" cy="48" rx="6" ry="8" fill="#facc15" stroke="#000" stroke-width="1.5" />
  <ellipse cx="64" cy="48" rx="6" ry="8" fill="#facc15" stroke="#000" stroke-width="1.5" />
  <polygon points="50,56 46,62 54,62" fill="#f43f5e" />
  <path d="M 42 66 Q 50 62 58 66" stroke="#000" stroke-width="2" fill="none" />
</svg>""")

add_sticker("harold_pain", "Hide the Pain Smile", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <circle cx="50" cy="48" r="38" fill="#fbcfe8" stroke="#9d174d" stroke-width="2.5" />
  <circle cx="36" cy="40" r="4" fill="#000" />
  <circle cx="64" cy="40" r="4" fill="#000" />
  <path d="M 28 32 Q 36 28 44 34" stroke="#9d174d" stroke-width="2.5" fill="none" />
  <path d="M 56 34 Q 64 28 72 32" stroke="#9d174d" stroke-width="2.5" fill="none" />
  <!-- Grimace forced smile -->
  <rect x="34" y="60" width="32" height="10" rx="3" fill="#ffffff" stroke="#000000" stroke-width="2" />
  <line x1="42" y1="60" x2="42" y2="70" stroke="#000" stroke-width="1" />
  <line x1="50" y1="60" x2="50" y2="70" stroke="#000" stroke-width="1" />
  <line x1="58" y1="60" x2="58" y2="70" stroke="#000" stroke-width="1" />
</svg>""")


# ================= 2. RAGE & CLASSIC FACES =================
add_sticker("troll_face", "Trollface", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <path d="M 15 45 C 10 20, 40 5, 75 12 C 95 18, 98 45, 90 60 C 80 75, 45 78, 25 70 C 15 65, 12 55, 15 45 Z" fill="#ffffff" stroke="#000000" stroke-width="3.5" stroke-linejoin="round" />
  <path d="M 22 46 C 40 68, 75 66, 88 44 C 70 54, 40 54, 22 46 Z" fill="#000000" />
  <path d="M 32 49 L 34 57 M 42 52 L 44 61 M 52 53 L 53 62 M 62 52 L 62 60 M 72 50 L 70 57" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
  <ellipse cx="38" cy="30" rx="6" ry="4" fill="#000000" transform="rotate(-15 38 30)" />
  <ellipse cx="70" cy="28" rx="8" ry="5" fill="#000000" transform="rotate(10 70 28)" />
  <path d="M 25 24 C 35 18, 48 20, 52 24 M 62 20 C 72 16, 85 22, 88 26" stroke="#000000" stroke-width="2.5" fill="none" stroke-linecap="round" />
</svg>""")

add_sticker("cereal_guy", "Cereal Guy", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <circle cx="45" cy="40" r="30" fill="#ffffff" stroke="#000" stroke-width="2.5" />
  <ellipse cx="36" cy="35" rx="3" ry="5" fill="#000" />
  <ellipse cx="54" cy="35" rx="3" ry="5" fill="#000" />
  <path d="M 38 52 Q 45 46 52 52" stroke="#000" stroke-width="2" fill="none" />
  <!-- Spoon & bowl -->
  <ellipse cx="45" cy="78" rx="35" ry="10" fill="#cbd5e1" stroke="#000" stroke-width="2.5" />
  <path d="M 60 55 L 75 40 L 78 44 L 62 60" fill="#94a3b8" stroke="#000" stroke-width="1.5" />
</svg>""")

add_sticker("rage_ffuu", "Rage Guy (FFFUUU)", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <path d="M 20 40 Q 15 15 50 15 Q 85 15 80 40 Q 90 75 50 82 Q 10 75 20 40 Z" fill="#ffffff" stroke="#000" stroke-width="3" />
  <circle cx="35" cy="36" r="8" fill="#000" />
  <circle cx="65" cy="36" r="8" fill="#000" />
  <path d="M 25 26 L 45 32 M 75 26 L 55 32" stroke="#000" stroke-width="3.5" />
  <!-- Wide screaming mouth with teeth -->
  <ellipse cx="50" cy="62" rx="24" ry="14" fill="#000000" />
  <rect x="32" y="52" width="36" height="7" fill="#ffffff" stroke="#000" stroke-width="1.5" />
  <rect x="34" y="65" width="32" height="7" fill="#ffffff" stroke="#000" stroke-width="1.5" />
</svg>""")

add_sticker("yao_ming_laugh", "Yao Ming Laugh (Bitch Please)", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <path d="M 25 35 Q 20 15 55 15 Q 80 20 85 45 Q 85 80 50 85 Q 15 75 25 35 Z" fill="#ffffff" stroke="#000" stroke-width="2.5" />
  <path d="M 30 36 Q 40 42 48 38 M 58 38 Q 66 42 76 36" stroke="#000" stroke-width="2.5" fill="none" />
  <path d="M 28 50 Q 52 75 78 48 Q 52 60 28 50 Z" fill="#000000" />
  <path d="M 34 52 L 40 58 M 48 54 L 52 62 M 60 54 L 62 61 M 70 51 L 70 56" stroke="#fff" stroke-width="2" />
</svg>""")

add_sticker("me_gusta", "Me Gusta", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <circle cx="50" cy="48" r="38" fill="#ffffff" stroke="#000000" stroke-width="3" />
  <circle cx="34" cy="38" r="12" fill="#fff" stroke="#000" stroke-width="2" />
  <circle cx="34" cy="38" r="5" fill="#000" />
  <circle cx="66" cy="38" r="12" fill="#fff" stroke="#000" stroke-width="2" />
  <circle cx="66" cy="38" r="5" fill="#000" />
  <path d="M 26 58 Q 50 78 74 58 Q 50 68 26 58 Z" fill="#000" />
  <ellipse cx="50" cy="50" rx="8" ry="4" fill="none" stroke="#000" stroke-width="2" />
</svg>""")

add_sticker("forever_alone", "Forever Alone", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <path d="M 20 45 C 10 20, 30 10, 55 12 C 85 15, 95 45, 88 70 C 78 92, 35 90, 20 70 Z" fill="#ffffff" stroke="#000" stroke-width="3" />
  <path d="M 25 35 Q 35 48 45 42 M 60 42 Q 70 48 80 35" stroke="#000" stroke-width="2" fill="none" />
  <circle cx="38" cy="45" r="4" fill="#000" />
  <circle cx="68" cy="45" r="4" fill="#000" />
  <path d="M 36 68 Q 52 54 68 68" stroke="#000" stroke-width="2.5" fill="none" />
  <path d="M 28 25 Q 40 18 55 22 M 65 20 Q 75 22 84 30" stroke="#000" stroke-width="2" fill="none" />
</svg>""")

add_sticker("okay_guy", "Okay Guy", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <circle cx="45" cy="45" r="36" fill="#ffffff" stroke="#000" stroke-width="2.5" />
  <line x1="30" y1="36" x2="42" y2="40" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
  <line x1="60" y1="36" x2="48" y2="40" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
  <ellipse cx="36" cy="44" rx="2.5" ry="4" fill="#000" />
  <ellipse cx="54" cy="44" rx="2.5" ry="4" fill="#000" />
  <path d="M 32 64 Q 45 56 58 64" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round" />
</svg>""")

add_sticker("challenge_accepted", "Challenge Accepted", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <circle cx="45" cy="42" r="34" fill="#ffffff" stroke="#000" stroke-width="2.5" />
  <ellipse cx="35" cy="38" rx="4" ry="5" fill="#000" />
  <ellipse cx="55" cy="38" rx="4" ry="5" fill="#000" />
  <line x1="28" y1="30" x2="42" y2="34" stroke="#000" stroke-width="2.5" />
  <line x1="62" y1="30" x2="48" y2="34" stroke="#000" stroke-width="2.5" />
  <!-- Smirk pursed lips -->
  <path d="M 36 56 Q 48 58 56 52" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" />
  <!-- Folded arms -->
  <path d="M 20 78 Q 45 68 70 78" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round" />
</svg>""")

add_sticker("like_a_boss", "Like a Boss", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <circle cx="45" cy="45" r="36" fill="#ffffff" stroke="#000" stroke-width="2.5" />
  <!-- Cool dark shades -->
  <polygon points="24,32 42,32 38,46 26,46" fill="#000" />
  <polygon points="48,32 66,32 64,46 52,46" fill="#000" />
  <line x1="42" y1="36" x2="48" y2="36" stroke="#000" stroke-width="2" />
  <path d="M 32 62 Q 45 70 58 62" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" />
</svg>""")

add_sticker("freddie_success", "Success Fist (Freddie)", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <circle cx="45" cy="40" r="32" fill="#ffffff" stroke="#000" stroke-width="2.5" />
  <path d="M 32 35 Q 45 28 58 35" stroke="#000" stroke-width="2" fill="none" />
  <rect x="38" y="46" width="14" height="6" fill="#000" />
  <path d="M 35 56 Q 45 64 55 56" stroke="#000" stroke-width="3" fill="none" />
  <!-- Clenched fist pumped high -->
  <circle cx="75" cy="25" r="10" fill="#facc15" stroke="#000" stroke-width="2.5" />
  <path d="M 68 32 L 60 55" stroke="#000" stroke-width="4" stroke-linecap="round" />
</svg>""")


# ================= 3. PROPS, HATS & GLASSES =================
add_sticker("scumbag_hat", "Scumbag Steve Hat", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 70">
  <!-- Plaid baseball cap turned sideways -->
  <ellipse cx="55" cy="38" rx="46" ry="24" fill="#a16207" stroke="#451a03" stroke-width="2.5" />
  <path d="M 20 38 Q 55 12 90 38" stroke="#ca8a04" stroke-width="2" fill="none" />
  <line x1="38" y1="20" x2="38" y2="52" stroke="#ca8a04" stroke-width="2" />
  <line x1="72" y1="20" x2="72" y2="52" stroke="#ca8a04" stroke-width="2" />
  <!-- Visor brim sticking out sideways -->
  <path d="M 85 36 Q 112 40 106 50 Q 88 48 76 44 Z" fill="#78350f" stroke="#451a03" stroke-width="2" />
</svg>""")

add_sticker("king_crown", "Gold King Crown", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <defs>
    <linearGradient id="crw_g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff176"/>
      <stop offset="50%" stop-color="#fbc02d"/>
      <stop offset="100%" stop-color="#f57f17"/>
    </linearGradient>
  </defs>
  <polygon points="10,65 15,25 35,45 50,15 65,45 85,25 90,65" fill="url(#crw_g)" stroke="#b26a00" stroke-width="2.5" stroke-linejoin="round" />
  <rect x="10" y="65" width="80" height="10" rx="3" fill="#f57f17" stroke="#b26a00" stroke-width="2" />
  <circle cx="50" cy="15" r="4" fill="#e91e63" stroke="#fff" stroke-width="1" />
  <circle cx="15" cy="25" r="3.5" fill="#00e5ff" stroke="#fff" stroke-width="1" />
  <circle cx="85" cy="25" r="3.5" fill="#00e5ff" stroke="#fff" stroke-width="1" />
  <circle cx="30" cy="70" r="3" fill="#e91e63" />
  <circle cx="50" cy="70" r="3.5" fill="#00e5ff" />
  <circle cx="70" cy="70" r="3" fill="#76ff03" />
</svg>""")

add_sticker("party_hat", "Party Hat", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
  <polygon points="40,15 10,85 70,85" fill="#ec4899" stroke="#be185d" stroke-width="2.5" />
  <polygon points="34,30 24,55 56,55 46,30" fill="#06b6d4" />
  <polygon points="20,65 12,85 68,85 60,65" fill="#eab308" />
  <circle cx="40" cy="14" r="8" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
</svg>""")

add_sticker("viking_horns", "Viking Horns", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70">
  <path d="M 32 45 C 20 40, 5 30, 8 10 C 14 18, 22 28, 36 34 Z" fill="#f8fafc" stroke="#64748b" stroke-width="2.5" />
  <path d="M 88 45 C 100 40, 115 30, 112 10 C 106 18, 98 28, 84 34 Z" fill="#f8fafc" stroke="#64748b" stroke-width="2.5" />
  <path d="M 28 42 C 45 32, 75 32, 92 42 L 88 56 C 72 46, 48 46, 32 56 Z" fill="#94a3b8" stroke="#475569" stroke-width="2.5" />
</svg>""")

add_sticker("gold_chain", "Gold Chain ($)", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <defs>
    <linearGradient id="gc_d" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff59d"/>
      <stop offset="50%" stop-color="#fbc02d"/>
      <stop offset="100%" stop-color="#f57f17"/>
    </linearGradient>
  </defs>
  <path d="M 12 10 C 20 55, 80 55, 88 10" fill="none" stroke="url(#gc_d)" stroke-width="7" stroke-dasharray="7 2" stroke-linecap="round" />
  <circle cx="50" cy="52" r="18" fill="url(#gc_d)" stroke="#b26a00" stroke-width="2.5" />
  <text x="50" y="60" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="20" font-weight="900" text-anchor="middle">$</text>
</svg>""")

add_sticker("top_hat_monocle", "Top Hat & Monocle", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <!-- Top hat -->
  <rect x="30" y="10" width="40" height="42" fill="#09090b" stroke="#27272a" stroke-width="2" />
  <rect x="30" y="44" width="40" height="8" fill="#dc2626" />
  <ellipse cx="50" cy="52" rx="38" ry="8" fill="#09090b" stroke="#27272a" stroke-width="2" />
  <!-- Monocle -->
  <circle cx="62" cy="72" r="12" fill="rgba(56,189,248,0.2)" stroke="#eab308" stroke-width="2.5" />
  <line x1="72" y1="78" x2="84" y2="88" stroke="#eab308" stroke-width="1.5" />
</svg>""")

add_sticker("fedora_hat", "Fedora Hat (M'lady)", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 60">
  <path d="M 32 36 Q 30 15 50 14 Q 75 12 78 36" fill="#18181b" stroke="#000" stroke-width="2" />
  <rect x="32" y="32" width="46" height="5" fill="#3f3f46" />
  <ellipse cx="55" cy="40" rx="48" ry="12" fill="#27272a" stroke="#000" stroke-width="2" />
</svg>""")

add_sticker("mustache_handlebar", "Gentleman Mustache", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">
  <path d="M 50 18 C 45 10, 30 8, 18 15 C 5 22, 2 32, 5 32 C 10 32, 22 28, 35 23 C 45 20, 48 24, 50 26 C 52 24, 55 20, 65 23 C 78 28, 90 32, 95 32 C 98 32, 95 22, 82 15 C 70 8, 55 10, 50 18 Z" fill="#1e1e1e" stroke="#000000" stroke-width="2" />
</svg>""")

add_sticker("clown_wig_nose", "Clown Wig & Nose", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <!-- Curly afro wig -->
  <circle cx="25" cy="30" r="16" fill="#06b6d4" />
  <circle cx="45" cy="20" r="16" fill="#06b6d4" />
  <circle cx="65" cy="20" r="16" fill="#06b6d4" />
  <circle cx="80" cy="32" r="16" fill="#06b6d4" />
  <!-- Red glossy nose -->
  <circle cx="50" cy="55" r="15" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
  <circle cx="46" cy="50" r="4" fill="#ffffff" />
</svg>""")

add_sticker("devil_horns", "Devil Horns", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
  <path d="M 30 52 C 28 35, 15 15, 10 8 C 18 16, 26 30, 40 46 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2.5" />
  <path d="M 70 52 C 72 35, 85 15, 90 8 C 82 16, 74 30, 60 46 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2.5" />
</svg>""")

add_sticker("angel_halo", "Angel Halo", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
  <defs>
    <radialGradient id="hl_g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="60%" stop-color="#fbc02d"/>
      <stop offset="100%" stop-color="#f57f17"/>
    </radialGradient>
  </defs>
  <ellipse cx="50" cy="25" rx="42" ry="15" fill="none" stroke="url(#hl_g)" stroke-width="7" />
  <ellipse cx="50" cy="25" rx="42" ry="15" fill="none" stroke="#ffffff" stroke-width="2" />
</svg>""")

add_sticker("santa_hat", "Santa Hat", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <path d="M 25 55 Q 35 15 70 20 Q 85 24 82 45" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
  <rect x="18" y="55" width="68" height="16" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
  <circle cx="84" cy="48" r="9" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
</svg>""")

add_sticker("tinfoil_hat", "Tin Foil Hat (Conspiracy)", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 70">
  <polygon points="45,8 15,55 75,55" fill="#cbd5e1" stroke="#475569" stroke-width="2.5" />
  <polygon points="45,8 30,55 60,55" fill="#e2e8f0" />
  <line x1="45" y1="8" x2="45" y2="2" stroke="#475569" stroke-width="2" stroke-linecap="round" />
</svg>""")


# ================= 4. BUBBLES =================
add_sticker("speech_bubble_left", "Speech Bubble (Left)", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 90">
  <path d="M 12 12 C 12 6, 22 2, 55 2 C 88 2, 98 6, 98 12 L 98 55 C 98 62, 88 66, 55 66 L 34 66 L 16 84 L 22 66 L 12 66 C 6 66, 12 62, 12 55 Z" fill="#ffffff" stroke="#000000" stroke-width="3.5" stroke-linejoin="round" />
</svg>""")

add_sticker("speech_bubble_right", "Speech Bubble (Right)", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 90">
  <path d="M 98 12 C 98 6, 88 2, 55 2 C 22 2, 12 6, 12 12 L 12 55 C 12 62, 22 66, 55 66 L 76 66 L 94 84 L 88 66 L 98 66 C 104 66, 98 62, 98 55 Z" fill="#ffffff" stroke="#000000" stroke-width="3.5" stroke-linejoin="round" />
</svg>""")

add_sticker("thought_cloud", "Thought Cloud", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 95">
  <path d="M 28 50 C 16 48, 14 30, 28 22 C 32 10, 52 10, 62 16 C 72 8, 92 14, 94 28 C 105 34, 103 56, 90 58 C 88 70, 68 72, 56 66 C 45 72, 28 68, 28 50 Z" fill="#ffffff" stroke="#000000" stroke-width="3.5" />
  <circle cx="22" cy="74" r="6" fill="#ffffff" stroke="#000000" stroke-width="3" />
  <circle cx="12" cy="86" r="3.5" fill="#ffffff" stroke="#000000" stroke-width="2.5" />
</svg>""")

add_sticker("shout_bubble", "Shout / Scream Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
  <polygon points="60,6 74,22 98,14 90,34 112,42 92,54 102,74 80,68 64,84 50,70 30,80 34,58 8,50 28,38 18,22 42,28" fill="#fffbeb" stroke="#f59e0b" stroke-width="4" stroke-linejoin="round" />
  <polygon points="60,14 70,26 90,20 84,36 100,42 84,52 92,66 74,62 62,74 52,64 38,70 42,54 22,48 38,40 30,28 48,32" fill="#ffffff" stroke="#ea580c" stroke-width="2" />
</svg>""")

add_sticker("whisper_bubble", "Whisper Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 85">
  <path d="M 15 15 C 15 8, 25 4, 55 4 C 85 4, 95 8, 95 15 L 95 50 C 95 58, 85 62, 55 62 L 32 62 L 18 78 L 22 62 L 15 62 C 8 62, 15 58, 15 50 Z" fill="#ffffff" stroke="#475569" stroke-width="3" stroke-dasharray="6 4" stroke-linejoin="round" />
</svg>""")

add_sticker("imessage_blue", "iMessage Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 75">
  <defs>
    <linearGradient id="im_bl" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
  </defs>
  <path d="M 22 6 C 10 6, 4 12, 4 22 L 4 44 C 4 54, 10 60, 22 60 L 82 60 C 94 60, 100 54, 100 44 L 100 22 C 100 12, 94 6, 82 6 Z" fill="url(#im_bl)" />
  <path d="M 94 50 C 100 56, 106 66, 106 66 C 106 66, 100 64, 96 60 Z" fill="url(#im_bl)" />
</svg>""")

add_sticker("chat_bubble_green", "WhatsApp Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 75">
  <defs>
    <linearGradient id="wa_gr" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
  </defs>
  <path d="M 22 6 C 10 6, 4 12, 4 22 L 4 44 C 4 54, 10 60, 22 60 L 82 60 C 94 60, 100 54, 100 44 L 100 22 C 100 12, 94 6, 82 6 Z" fill="url(#wa_gr)" />
  <path d="M 12 50 C 6 56, 0 66, 0 66 C 0 66, 6 64, 10 60 Z" fill="url(#wa_gr)" />
</svg>""")

add_sticker("chat_bubble_dark", "Dark Chat", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 80">
  <path d="M 16 12 C 16 6, 26 4, 55 4 C 84 4, 94 6, 94 12 L 94 48 C 94 54, 84 56, 55 56 L 36 56 L 20 72 L 24 56 L 16 56 C 10 56, 16 54, 16 48 Z" fill="#1e293b" stroke="#00f0ff" stroke-width="2.5" stroke-linejoin="round" />
</svg>""")

add_sticker("electric_bubble", "Radio / Electric Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 85">
  <rect x="8" y="8" width="94" height="50" rx="10" fill="#ffffff" stroke="#000000" stroke-width="3" />
  <polygon points="30,58 20,78 36,68 32,84 48,58" fill="#facc15" stroke="#000000" stroke-width="2.5" />
</svg>""")

add_sticker("heart_bubble", "Heart Speech Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 85">
  <path d="M 14 12 C 14 6, 24 4, 50 4 C 76 4, 86 6, 86 12 L 86 48 C 86 54, 76 56, 50 56 L 34 56 L 20 70 L 24 56 L 14 56 C 8 56, 14 54, 14 48 Z" fill="#fff1f2" stroke="#f43f5e" stroke-width="3" stroke-linejoin="round" />
  <path d="M 50 42 C 40 32, 34 24, 40 18 C 45 13, 50 17, 50 17 C 50 17, 55 13, 60 18 C 66 24, 60 32, 50 42 Z" fill="#e11d48" />
</svg>""")

add_sticker("dots_bubble", "Typing (...) Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 75">
  <path d="M 14 12 C 14 6, 24 4, 50 4 C 76 4, 86 6, 86 12 L 86 46 C 86 52, 76 54, 50 54 L 32 54 L 18 68 L 22 54 L 14 54 C 8 54, 14 52, 14 46 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round" />
  <circle cx="34" cy="29" r="4.5" fill="#64748b" />
  <circle cx="50" cy="29" r="4.5" fill="#64748b" />
  <circle cx="66" cy="29" r="4.5" fill="#64748b" />
</svg>""")

add_sticker("anger_bubble", "Rage / Anger Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 85">
  <polygon points="12,12 30,6 55,10 78,4 98,14 90,32 104,44 88,54 96,68 76,62 60,78 48,60 28,68 32,50 8,42 22,30" fill="#09090b" stroke="#ef4444" stroke-width="3.5" stroke-linejoin="round" />
</svg>""")

add_sticker("double_bubble", "Double Dialogue Bubble", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 85">
  <ellipse cx="75" cy="30" rx="38" ry="24" fill="#f1f5f9" stroke="#334155" stroke-width="3" />
  <polygon points="90,46 104,64 82,50" fill="#f1f5f9" stroke="#334155" stroke-width="3" />
  <ellipse cx="42" cy="42" rx="36" ry="24" fill="#ffffff" stroke="#000000" stroke-width="3" />
  <polygon points="30,60 18,78 40,64" fill="#ffffff" stroke="#000000" stroke-width="3" />
</svg>""")

add_sticker("comic_caption_box", "Narrator Box", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
  <rect x="4" y="4" width="112" height="52" fill="#fef08a" stroke="#000000" stroke-width="3.5" />
  <rect x="8" y="8" width="104" height="44" fill="none" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="4 3" />
</svg>""")

add_sticker("idea_bubble", "Idea Bubble (Lightbulb)", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <path d="M 14 12 C 14 6, 24 4, 50 4 C 76 4, 86 6, 86 12 L 86 48 C 86 54, 76 56, 50 56 L 34 56 L 20 70 L 24 56 L 14 56 C 8 56, 14 54, 14 48 Z" fill="#ffffff" stroke="#000000" stroke-width="3" stroke-linejoin="round" />
  <path d="M 44 26 C 44 20, 56 20, 56 26 C 56 30, 53 32, 53 35 L 47 35 C 47 32, 44 30, 44 26 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
  <rect x="47" y="35" width="6" height="4" rx="1" fill="#94a3b8" />
  <line x1="50" y1="13" x2="50" y2="16" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
  <line x1="39" y1="17" x2="41" y2="20" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
  <line x1="61" y1="17" x2="59" y2="20" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
</svg>""")


# ================= 5. BADGES, STAMPS & LABELS =================
add_sticker("verified_badge", "Verified Badge", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70">
  <path d="M 35 4 L 42 12 L 53 10 L 56 21 L 66 26 L 64 37 L 70 46 L 63 54 L 63 65 L 52 66 L 46 74 L 35 70 L 24 74 L 18 66 L 7 65 L 7 54 L 0 46 L 6 37 L 4 26 L 14 21 L 17 10 L 28 12 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
  <polyline points="22,36 32,46 48,24" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
</svg>""")

add_sticker("wasted_stamp", "Wasted Stamp (GTA)", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 45">
  <g transform="rotate(-6 70 22)">
    <rect x="4" y="4" width="132" height="36" rx="4" fill="rgba(200, 20, 20, 0.9)" stroke="#ffffff" stroke-width="3" />
    <text x="70" y="30" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="24" font-weight="bold" letter-spacing="4" text-anchor="middle" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">WASTED</text>
  </g>
</svg>""")

add_sticker("busted_stamp", "Busted Stamp", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 45">
  <g transform="rotate(4 70 22)">
    <rect x="4" y="4" width="132" height="36" rx="4" fill="rgba(30, 64, 175, 0.9)" stroke="#ffffff" stroke-width="3" />
    <text x="70" y="30" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="24" font-weight="bold" letter-spacing="4" text-anchor="middle">BUSTED</text>
  </g>
</svg>""")

add_sticker("respect_plus", "Mission Passed (Respect +)", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50">
  <rect x="3" y="3" width="154" height="44" rx="4" fill="#0f172a" stroke="#22c55e" stroke-width="2.5" />
  <text x="80" y="24" fill="#22c55e" font-family="Impact, Arial Black, sans-serif" font-size="16" font-weight="bold" letter-spacing="2" text-anchor="middle">MISSION PASSED!</text>
  <text x="80" y="40" fill="#86efac" font-family="Impact, sans-serif" font-size="13" font-weight="bold" letter-spacing="1" text-anchor="middle">RESPECT +</text>
</svg>""")

add_sticker("parental_advisory", "Parental Advisory", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70">
  <rect x="3" y="3" width="114" height="64" rx="2" fill="#ffffff" stroke="#000000" stroke-width="3" />
  <rect x="6" y="6" width="108" height="24" fill="#000000" />
  <text x="60" y="23" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="14" font-weight="bold" letter-spacing="2" text-anchor="middle">PARENTAL</text>
  <text x="60" y="46" fill="#000000" font-family="Impact, Arial Black, sans-serif" font-size="18" font-weight="900" letter-spacing="3" text-anchor="middle">ADVISORY</text>
  <text x="60" y="61" fill="#000000" font-family="sans-serif" font-size="8" font-weight="bold" letter-spacing="1" text-anchor="middle">EXPLICIT CONTENT</text>
</svg>""")

add_sticker("breaking_news", "Breaking News TV Banner", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 40">
  <rect x="2" y="4" width="146" height="32" rx="4" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
  <rect x="6" y="8" width="40" height="24" rx="2" fill="#ffffff" />
  <text x="26" y="25" fill="#dc2626" font-family="Impact, Arial Black, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">LIVE</text>
  <text x="96" y="26" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="15" font-weight="900" letter-spacing="1" text-anchor="middle">BREAKING NEWS</text>
</svg>""")

add_sticker("censored_bar", "Censored Bar", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 36">
  <rect x="2" y="2" width="136" height="32" rx="4" fill="#000000" stroke="#ffffff" stroke-width="2" />
  <text x="70" y="24" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="20" font-weight="900" letter-spacing="3" text-anchor="middle">CENSORED</text>
</svg>""")

add_sticker("approved_stamp", "Approved Stamp", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g transform="rotate(-12 50 50)">
    <circle cx="50" cy="50" r="44" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="6 3" />
    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" stroke-width="2.5" />
    <text x="50" y="44" fill="#10b981" font-family="Impact, Arial Black, sans-serif" font-size="13" font-weight="900" letter-spacing="1" text-anchor="middle">OFFICIAL</text>
    <text x="50" y="60" fill="#10b981" font-family="Impact, Arial Black, sans-serif" font-size="15" font-weight="900" letter-spacing="2" text-anchor="middle">APPROVED</text>
    <text x="50" y="74" fill="#10b981" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">★ ★ ★</text>
  </g>
</svg>""")

add_sticker("rejected_stamp", "Rejected Red Stamp", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g transform="rotate(14 50 50)">
    <circle cx="50" cy="50" r="44" fill="none" stroke="#ef4444" stroke-width="4" stroke-dasharray="6 3" />
    <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" stroke-width="2.5" />
    <text x="50" y="58" fill="#ef4444" font-family="Impact, Arial Black, sans-serif" font-size="18" font-weight="900" letter-spacing="2" text-anchor="middle">REJECTED</text>
  </g>
</svg>""")

add_sticker("top_secret", "Top Secret", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 45">
  <g transform="rotate(-8 65 22)">
    <rect x="4" y="4" width="122" height="36" rx="4" fill="none" stroke="#ef4444" stroke-width="3.5" stroke-dasharray="10 3" />
    <text x="65" y="28" fill="#ef4444" font-family="Impact, Arial Black, sans-serif" font-size="18" font-weight="900" letter-spacing="2" text-anchor="middle">TOP SECRET</text>
  </g>
</svg>""")

add_sticker("big_w", "Big W (Win)", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70">
  <rect x="5" y="5" width="60" height="60" rx="14" fill="#10b981" stroke="#047857" stroke-width="3" />
  <text x="35" y="52" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="44" font-weight="900" text-anchor="middle">W</text>
</svg>""")

add_sticker("huge_l", "Huge L (Loss)", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70">
  <rect x="5" y="5" width="60" height="60" rx="14" fill="#ef4444" stroke="#b91c1c" stroke-width="3" />
  <text x="35" y="52" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="44" font-weight="900" text-anchor="middle">L</text>
</svg>""")

add_sticker("no_cap", "NO CAP Stamp", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 45">
  <rect x="4" y="4" width="112" height="37" rx="6" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3" />
  <text x="60" y="29" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="900" letter-spacing="3" text-anchor="middle">NO CAP</text>
</svg>""")

add_sticker("caution_hazard", "Caution Hazard", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect x="2" y="2" width="116" height="36" rx="4" fill="#facc15" stroke="#000000" stroke-width="3" />
  <polygon points="2,2 14,2 2,20" fill="#000" />
  <polygon points="106,38 118,38 118,20" fill="#000" />
  <text x="60" y="26" fill="#000000" font-family="Impact, Arial Black, sans-serif" font-size="20" font-weight="900" letter-spacing="2" text-anchor="middle">CAUTION</text>
</svg>""")

add_sticker("legit_100", "100% Legit Seal", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <circle cx="45" cy="45" r="38" fill="#f59e0b" stroke="#b45309" stroke-width="3.5" />
  <circle cx="45" cy="45" r="32" fill="#d97706" stroke="#fde68a" stroke-width="1.5" stroke-dasharray="3 2" />
  <text x="45" y="40" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="18" font-weight="900" text-anchor="middle">100%</text>
  <text x="45" y="58" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="16" font-weight="900" letter-spacing="1" text-anchor="middle">LEGIT</text>
</svg>""")

add_sticker("sale_50_off", "50% OFF", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="36" fill="#e11d48" stroke="#be123c" stroke-width="3" />
  <text x="40" y="36" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="22" font-weight="900" text-anchor="middle">50%</text>
  <text x="40" y="56" fill="#fef08a" font-family="Impact, Arial Black, sans-serif" font-size="16" font-weight="900" letter-spacing="1" text-anchor="middle">OFF</text>
</svg>""")

add_sticker("vip_pass", "VIP Pass", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60">
  <rect x="3" y="3" width="84" height="54" rx="8" fill="#09090b" stroke="#eab308" stroke-width="2.5" />
  <rect x="7" y="7" width="76" height="46" rx="5" fill="none" stroke="#ca8a04" stroke-width="1" stroke-dasharray="3 2" />
  <text x="45" y="38" fill="#facc15" font-family="Impact, Arial Black, sans-serif" font-size="28" font-weight="900" letter-spacing="4" text-anchor="middle">VIP</text>
</svg>""")


# ================= 6. REACTIONS, ARROWS & FX =================
add_sticker("stonks_up", "Stonks Up", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <polyline points="8,70 30,58 45,62 65,36 82,42 90,14" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  <polygon points="90,14 74,18 84,28" fill="#22c55e" />
  <text x="50" y="30" fill="#16a34a" font-family="Impact, Arial Black, sans-serif" font-size="15" font-weight="bold" letter-spacing="1">STONKS</text>
</svg>""")

add_sticker("not_stonks", "Not Stonks Down", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <polyline points="8,16 30,28 45,24 65,50 82,44 90,72" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  <polygon points="90,72 74,68 84,58" fill="#ef4444" />
  <text x="25" y="65" fill="#dc2626" font-family="Impact, Arial Black, sans-serif" font-size="13" font-weight="bold">NOT STONKS</text>
</svg>""")

add_sticker("fire_flame", "Fire Flame (Lit)", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 90">
  <path d="M 35 5 C 45 25, 65 35, 65 58 C 65 76, 52 86, 35 86 C 18 86, 5 76, 5 58 C 5 40, 20 30, 25 18 C 22 28, 30 32, 35 5 Z" fill="#ea580c" />
  <path d="M 35 25 C 42 38, 55 46, 55 62 C 55 74, 46 80, 35 80 C 24 80, 15 74, 15 62 C 15 48, 26 40, 30 32 C 28 40, 34 42, 35 25 Z" fill="#f97316" />
  <path d="M 35 45 C 40 52, 48 58, 48 68 C 48 76, 42 78, 35 78 C 28 78, 22 76, 22 68 C 22 58, 30 52, 32 48 Q 35 54 35 45 Z" fill="#fde047" />
</svg>""")

add_sticker("boom_comic", "BOOM! Explosion", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 80">
  <polygon points="55,5 68,22 92,12 88,32 108,40 88,52 95,72 72,66 60,82 45,68 25,78 30,55 5,45 26,35 15,15 40,25" fill="#facc15" stroke="#ea580c" stroke-width="3.5" stroke-linejoin="round" />
  <polygon points="55,14 65,26 84,18 80,34 96,40 80,50 86,64 68,60 58,72 46,62 30,68 34,52 14,44 32,36 22,22 42,28" fill="#f97316" />
  <text x="55" y="50" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="24" font-weight="900" letter-spacing="1" text-anchor="middle" stroke="#000000" stroke-width="3" paint-order="stroke fill">BOOM!</text>
</svg>""")

add_sticker("pow_comic", "POW! Punch", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <polygon points="50,4 62,20 84,12 80,32 98,42 78,54 86,74 65,66 50,80 38,64 16,72 24,52 2,42 22,30 14,14 36,22" fill="#06b6d4" stroke="#0891b2" stroke-width="3" stroke-linejoin="round" />
  <text x="50" y="50" fill="#facc15" font-family="Impact, Arial Black, sans-serif" font-size="26" font-weight="900" letter-spacing="1" text-anchor="middle" stroke="#000000" stroke-width="3.5" paint-order="stroke fill">POW!</text>
</svg>""")

add_sticker("wow_burst", "WOW! Starburst", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70">
  <ellipse cx="50" cy="35" rx="46" ry="28" fill="#f43f5e" stroke="#000" stroke-width="3.5" />
  <ellipse cx="50" cy="35" rx="40" ry="22" fill="#fb7185" />
  <text x="50" y="44" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="26" font-weight="900" letter-spacing="2" text-anchor="middle" stroke="#000000" stroke-width="3" paint-order="stroke fill">WOW!</text>
</svg>""")

add_sticker("dollar_stack", "Cash / Dollar Stack", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60">
  <rect x="5" y="24" width="75" height="30" rx="3" fill="#15803d" stroke="#166534" stroke-width="2" />
  <rect x="8" y="16" width="75" height="30" rx="3" fill="#16a34a" stroke="#15803d" stroke-width="2" />
  <rect x="11" y="8" width="75" height="30" rx="3" fill="#22c55e" stroke="#16a34a" stroke-width="2" />
  <circle cx="48" cy="23" r="8" fill="#15803d" />
  <text x="48" y="28" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">$</text>
  <rect x="38" y="7" width="20" height="33" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" />
</svg>""")

add_sticker("hundred_points", "100 Points", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60">
  <text x="40" y="42" fill="#ef4444" font-family="Impact, Arial Black, sans-serif" font-size="44" font-weight="900" letter-spacing="-2" text-anchor="middle">100</text>
  <line x1="8" y1="52" x2="72" y2="52" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
  <line x1="12" y1="58" x2="68" y2="58" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" />
</svg>""")

add_sticker("skull_dead", "Skull (I'm Dead)", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="38" fill="#0f172a" stroke="#334155" stroke-width="2.5" />
  <line x1="18" y1="18" x2="62" y2="62" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round" />
  <line x1="62" y1="18" x2="18" y2="62" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round" />
  <ellipse cx="40" cy="34" rx="16" ry="14" fill="#f8fafc" />
  <rect x="32" y="42" width="16" height="10" rx="2" fill="#f8fafc" />
  <circle cx="34" cy="34" r="4" fill="#0f172a" />
  <circle cx="46" cy="34" r="4" fill="#0f172a" />
  <polygon points="40,38 38,43 42,43" fill="#0f172a" />
</svg>""")

add_sticker("target_crosshair", "Target Crosshair", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="32" fill="none" stroke="#ef4444" stroke-width="3" />
  <circle cx="40" cy="40" r="20" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 3" />
  <circle cx="40" cy="40" r="6" fill="#ef4444" />
  <line x1="40" y1="2" x2="40" y2="24" stroke="#ef4444" stroke-width="3" />
  <line x1="40" y1="56" x2="40" y2="78" stroke="#ef4444" stroke-width="3" />
  <line x1="2" y1="40" x2="24" y2="40" stroke="#ef4444" stroke-width="3" />
  <line x1="56" y1="40" x2="78" y2="40" stroke="#ef4444" stroke-width="3" />
</svg>""")

add_sticker("neon_arrow", "Pointing Arrow (THIS GUY)", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 50">
  <polygon points="10,18 55,18 55,6 85,25 55,44 55,32 10,32" fill="#00f0ff" stroke="#0284c7" stroke-width="2.5" />
</svg>""")

add_sticker("question_mark_3d", "3D Question Mark", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80">
  <text x="30" y="65" fill="#ef4444" font-family="Impact, Arial Black, sans-serif" font-size="70" font-weight="900" text-anchor="middle" stroke="#7f1d1d" stroke-width="4" paint-order="stroke fill">?</text>
</svg>""")

add_sticker("exclamation_mark_3d", "3D Exclamation Point", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 80">
  <text x="25" y="65" fill="#facc15" font-family="Impact, Arial Black, sans-serif" font-size="70" font-weight="900" text-anchor="middle" stroke="#713f12" stroke-width="4" paint-order="stroke fill">!</text>
</svg>""")

add_sticker("anger_vein", "Anime Anger Vein", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
  <path d="M 12 18 Q 30 24 30 12 Q 30 24 48 18 Q 42 30 48 42 Q 30 36 30 48 Q 30 36 12 42 Q 18 30 12 18 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5" />
</svg>""")

add_sticker("sweat_drop", "Anime Sweat Drop", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80">
  <path d="M 30 8 C 30 8, 10 40, 10 54 C 10 68, 20 76, 30 76 C 40 76, 50 68, 50 54 C 50 40, 30 8, 30 8 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="3" />
  <ellipse cx="24" cy="54" rx="4" ry="10" fill="#ffffff" transform="rotate(-20 24 54)" />
</svg>""")

add_sticker("pixel_heart", "8-Bit Pixel Heart", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 60">
  <rect x="15" y="5" width="15" height="10" fill="#ef4444" />
  <rect x="40" y="5" width="15" height="10" fill="#ef4444" />
  <rect x="5" y="15" width="60" height="15" fill="#ef4444" />
  <rect x="10" y="30" width="50" height="10" fill="#ef4444" />
  <rect x="20" y="40" width="30" height="10" fill="#ef4444" />
  <rect x="30" y="50" width="10" height="10" fill="#ef4444" />
  <rect x="15" y="10" width="5" height="5" fill="#ffffff" />
</svg>""")

add_sticker("broken_heart", "Broken Heart", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path d="M 40 72 C 12 50, 4 32, 12 18 C 18 6, 32 8, 40 20 L 36 30 L 44 40 L 36 50 Z" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
  <path d="M 40 72 C 68 50, 76 32, 68 18 C 62 6, 48 8, 40 20 L 36 30 L 44 40 L 36 50 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
</svg>""")

add_sticker("radiation_hazard", "Radiation Sign", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="38" fill="#facc15" stroke="#000000" stroke-width="3" />
  <circle cx="40" cy="40" r="7" fill="#000000" />
  <path d="M 40 40 L 30 18 A 25 25 0 0 1 50 18 Z" fill="#000000" />
  <path d="M 40 40 L 59 51 A 25 25 0 0 1 42 65 Z" fill="#000000" />
  <path d="M 40 40 L 21 51 A 25 25 0 0 0 38 65 Z" fill="#000000" />
</svg>""")

add_sticker("bonk_bat", "Bonk Baseball Bat", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g transform="rotate(40 50 50)">
    <rect x="44" y="10" width="12" height="50" rx="6" fill="#d97706" stroke="#78350f" stroke-width="2" />
    <rect x="46" y="55" width="8" height="30" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2" />
    <circle cx="50" cy="88" r="6" fill="#d97706" stroke="#78350f" stroke-width="2" />
    <path d="M 46 62 L 54 66 M 46 70 L 54 74 M 46 78 L 54 82" stroke="#ffffff" stroke-width="2" />
  </g>
  <text x="60" y="25" font-family="Impact, sans-serif" font-size="20" fill="#ef4444" stroke="#000" stroke-width="0.8">BONK!</text>
</svg>""")

add_sticker("clown_wig_nose", "Clown Wig & Red Nose", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- rainbow afro wig -->
  <circle cx="28" cy="35" r="18" fill="#ef4444" />
  <circle cx="50" cy="22" r="18" fill="#3b82f6" />
  <circle cx="72" cy="35" r="18" fill="#22c55e" />
  <circle cx="38" cy="26" r="16" fill="#eab308" />
  <circle cx="62" cy="26" r="16" fill="#a855f7" />
  <!-- red nose -->
  <circle cx="50" cy="65" r="14" fill="#dc2626" stroke="#7f1d1d" stroke-width="2" />
  <circle cx="46" cy="61" r="4" fill="#ffffff" />
</svg>""")

add_sticker("illuminati_eye", "Illuminati Eye", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
  <polygon points="50,8 92,82 8,82" fill="#fef08a" stroke="#ca8a04" stroke-width="4" stroke-linejoin="round" />
  <!-- Eye -->
  <path d="M 28 50 Q 50 32 72 50 Q 50 68 28 50 Z" fill="#ffffff" stroke="#854d0e" stroke-width="2.5" />
  <circle cx="50" cy="50" r="8" fill="#15803d" />
  <circle cx="50" cy="50" r="4" fill="#000000" />
  <circle cx="48" cy="48" r="1.5" fill="#ffffff" />
  <!-- Rays -->
  <line x1="50" y1="2" x2="50" y2="6" stroke="#ca8a04" stroke-width="3" stroke-linecap="round" />
  <line x1="25" y1="15" x2="30" y2="20" stroke="#ca8a04" stroke-width="3" stroke-linecap="round" />
  <line x1="75" y1="15" x2="70" y2="20" stroke="#ca8a04" stroke-width="3" stroke-linecap="round" />
</svg>""")

add_sticker("pop_cat", "Pop Cat (Open Mouth)", "faces", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="58" rx="42" ry="38" fill="#f8fafc" stroke="#1e293b" stroke-width="3" />
  <!-- Ears -->
  <polygon points="18,36 10,12 36,24" fill="#f8fafc" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
  <polygon points="18,34 14,16 32,24" fill="#fbcfe8" />
  <polygon points="82,36 90,12 64,24" fill="#f8fafc" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
  <polygon points="82,34 86,16 68,24" fill="#fbcfe8" />
  <!-- Eyes -->
  <circle cx="34" cy="44" r="5" fill="#0f172a" />
  <circle cx="66" cy="44" r="5" fill="#0f172a" />
  <!-- Open round mouth -->
  <ellipse cx="50" cy="68" rx="20" ry="22" fill="#881337" stroke="#1e293b" stroke-width="3" />
  <ellipse cx="50" cy="80" rx="12" ry="8" fill="#f43f5e" />
</svg>""")

add_sticker("press_f", "Press F to Pay Respects", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 46">
  <rect x="3" y="3" width="134" height="40" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2" />
  <!-- Keycap F -->
  <rect x="8" y="7" width="32" height="32" rx="5" fill="#334155" stroke="#94a3b8" stroke-width="1.5" />
  <text x="18" y="30" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#f8fafc">F</text>
  <text x="46" y="22" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11" fill="#f8fafc">PRESS F</text>
  <text x="46" y="35" font-family="'Segoe UI', Roboto, sans-serif" font-size="8" fill="#94a3b8">TO PAY RESPECTS</text>
</svg>""")

add_sticker("rip_gravestone", "R.I.P. Tombstone", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 100">
  <path d="M 15 95 L 15 40 A 30 30 0 0 1 75 40 L 75 95 Z" fill="#64748b" stroke="#334155" stroke-width="3" />
  <line x1="5" y1="95" x2="85" y2="95" stroke="#334155" stroke-width="4" stroke-linecap="round" />
  <!-- Cross -->
  <rect x="42" y="24" width="6" height="20" fill="#334155" />
  <rect x="36" y="29" width="18" height="6" fill="#334155" />
  <!-- Text -->
  <text x="45" y="66" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="bold" font-size="18" fill="#1e293b" letter-spacing="2">R.I.P.</text>
</svg>""")

add_sticker("fbi_open_up", "FBI OPEN UP!", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48">
  <rect x="3" y="3" width="144" height="42" rx="6" fill="#0f172a" stroke="#eab308" stroke-width="2.5" />
  <text x="24" y="31" font-family="Impact, sans-serif" font-size="24" fill="#eab308" letter-spacing="2">FBI</text>
  <line x1="68" y1="8" x2="68" y2="40" stroke="#475569" stroke-width="1.5" />
  <text x="76" y="23" font-family="Impact, sans-serif" font-size="14" fill="#ffffff" letter-spacing="1">OPEN</text>
  <text x="76" y="37" font-family="Impact, sans-serif" font-size="14" fill="#ef4444" letter-spacing="1">UP!</text>
</svg>""")

add_sticker("sigma_grindset", "SIGMA MALE #1", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 44">
  <rect x="2" y="2" width="136" height="40" rx="8" fill="#18181b" stroke="#e4e4e7" stroke-width="2" />
  <text x="12" y="29" font-family="'Times New Roman', serif" font-weight="900" font-size="24" fill="#ffffff">Σ</text>
  <text x="36" y="21" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="11" fill="#ffffff" letter-spacing="1.5">SIGMA RULE</text>
  <text x="36" y="34" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="9" fill="#a1a1aa">GRINDSET #1</text>
</svg>""")

add_sticker("among_us_crew", "Among Us Crewmate", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 100">
  <!-- Backpack -->
  <rect x="14" y="36" width="14" height="40" rx="7" fill="#dc2626" stroke="#000000" stroke-width="3" />
  <!-- Body -->
  <path d="M 28 45 C 28 15, 66 15, 66 45 L 66 82 A 7 7 0 0 1 52 82 L 52 75 L 42 75 L 42 82 A 7 7 0 0 1 28 82 Z" fill="#ef4444" stroke="#000000" stroke-width="3.5" stroke-linejoin="round" />
  <!-- Visor -->
  <ellipse cx="54" cy="38" rx="16" ry="11" fill="#38bdf8" stroke="#000000" stroke-width="3" />
  <ellipse cx="52" cy="35" rx="10" ry="5" fill="#bae6fd" />
</svg>""")

add_sticker("drake_like_hand", "Drake Point Hand", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80">
  <!-- pointing hand finger -->
  <rect x="15" y="34" width="40" height="24" rx="8" fill="#d97706" stroke="#78350f" stroke-width="2" />
  <rect x="45" y="34" width="38" height="10" rx="5" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
  <circle cx="28" cy="46" r="16" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
  <line x1="28" y1="36" x2="38" y2="36" stroke="#78350f" stroke-width="2" stroke-linecap="round" />
  <text x="6" y="24" font-family="Impact, sans-serif" font-size="18" fill="#22c55e">👉 YES</text>
</svg>""")

add_sticker("drake_dislike_hand", "Drake Stop / Nah Hand", "reactions", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80">
  <!-- stop / ward off hand -->
  <rect x="25" y="15" width="40" height="50" rx="12" fill="#f59e0b" stroke="#78350f" stroke-width="2.5" />
  <line x1="37" y1="20" x2="37" y2="45" stroke="#78350f" stroke-width="2" />
  <line x1="49" y1="20" x2="49" y2="45" stroke="#78350f" stroke-width="2" />
  <line x1="60" y1="26" x2="60" y2="48" stroke="#78350f" stroke-width="2" />
  <text x="12" y="74" font-family="Impact, sans-serif" font-size="16" fill="#ef4444">✋ NAH</text>
</svg>""")

add_sticker("kermit_tea_mug", "Kermit Tea Mug", "props", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80">
  <!-- Ceramic mug -->
  <rect x="18" y="25" width="45" height="42" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
  <path d="M 63 32 C 78 32, 78 55, 63 55" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
  <!-- Steam -->
  <path d="M 28 18 Q 32 10 28 4" stroke="#94a3b8" stroke-width="2" fill="none" stroke-linecap="round" />
  <path d="M 40 18 Q 44 8 40 2" stroke="#94a3b8" stroke-width="2" fill="none" stroke-linecap="round" />
  <!-- Lipton tag -->
  <line x1="48" y1="25" x2="52" y2="38" stroke="#ca8a04" stroke-width="1.5" />
  <rect x="49" y="38" width="10" height="12" rx="2" fill="#eab308" />
</svg>""")

add_sticker("pixel_deal_with_it", "DEAL WITH IT Text", "memes", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40">
  <rect x="0" y="0" width="200" height="40" fill="#000000" rx="4" />
  <text x="100" y="28" text-anchor="middle" font-family="'Courier New', monospace, sans-serif" font-weight="900" font-size="20" fill="#ffffff" letter-spacing="3">DEAL WITH IT</text>
</svg>""")

add_sticker("bruh_sound_effect", "BRUH Button", "badges", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 45">
  <rect x="3" y="3" width="114" height="39" rx="8" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
  <circle cx="22" cy="22" r="11" fill="#ffffff" opacity="0.2" />
  <text x="60" y="29" text-anchor="middle" font-family="Impact, sans-serif" font-size="22" fill="#ffffff" letter-spacing="2">BRUH</text>
</svg>""")

add_sticker("clown_world_circus", "HONK HONK!", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 65">
  <rect x="5" y="5" width="120" height="45" rx="14" fill="#fef08a" stroke="#ca8a04" stroke-width="3" />
  <polygon points="35,50 25,62 48,50" fill="#fef08a" stroke="#ca8a04" stroke-width="3" />
  <line x1="33" y1="49" x2="49" y2="49" stroke="#fef08a" stroke-width="4" />
  <text x="65" y="34" text-anchor="middle" font-family="Impact, sans-serif" font-size="18" fill="#dc2626" letter-spacing="1">HONK HONK! 🤡</text>
</svg>""")

add_sticker("speech_yes_chad", "Yes.", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 50">
  <rect x="4" y="4" width="82" height="36" rx="10" fill="#18181b" stroke="#71717a" stroke-width="2" />
  <polygon points="25,40 18,48 35,40" fill="#18181b" stroke="#71717a" stroke-width="2" />
  <line x1="23" y1="39" x2="36" y2="39" stroke="#18181b" stroke-width="3" />
  <text x="45" y="27" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="bold" font-size="18" fill="#ffffff">Yes.</text>
</svg>""")

add_sticker("speech_wait_what", "Wait, what?", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 55">
  <ellipse cx="60" cy="24" rx="55" ry="20" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" />
  <circle cx="30" cy="46" r="4" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
  <circle cx="20" cy="52" r="2.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
  <text x="60" y="29" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="14" fill="#0f172a">Wait, what?</text>
</svg>""")

add_sticker("speech_skill_issue", "Skill Issue", "bubbles", """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 52">
  <rect x="4" y="4" width="112" height="36" rx="8" fill="#ffffff" stroke="#ef4444" stroke-width="2.5" />
  <polygon points="30,40 22,50 42,40" fill="#ffffff" stroke="#ef4444" stroke-width="2.5" />
  <line x1="28" y1="39" x2="44" y2="39" stroke="#ffffff" stroke-width="4" />
  <text x="60" y="27" text-anchor="middle" font-family="Impact, sans-serif" font-size="16" fill="#ef4444" letter-spacing="0.5">SKILL ISSUE</text>
</svg>""")



# Write file
output = f"""// Top 100+ most used meme stickers, rage comics, badges and speech bubbles
// Curated for high-utility meme creation across 6 categories

const svgToDataUrl = (svg) => `data:image/svg+xml;utf8,${{encodeURIComponent(svg.trim())}}`;

export const GRAPHIC_STICKER_CATEGORIES = {json.dumps(categories, indent=2)};

export const GRAPHIC_STICKERS = [
"""

for s in stickers:
    output += f"""  {{
    id: {json.dumps(s['id'])},
    name: {json.dumps(s['name'])},
    category: {json.dumps(s['category'])},
    svg: `{s['svg']}`
  }},
"""

output += """];

GRAPHIC_STICKERS.forEach(item => {
  item.url = svgToDataUrl(item.svg);
});
"""

with open("src/data/memeStickers.js", "w", encoding="utf-8") as f:
    f.write(output)

print(f"Generated {len(stickers)} stickers across {len(categories)} categories")
