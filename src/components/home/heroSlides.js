import { Upload, Sparkles, Video, Smile, Wand2, Share2, Scissors } from 'lucide-react';
import { MEME_TEMPLATES } from '../../data/templates';

/* --- Carousel slides: each card sits on a sharp meme photo from our templates (picture: a template
   id) with its character at the right (focus: the photo's object-position; mirror: flipped when the
   character is on the left), and a dark fade on the left behind the heading, tagline and buttons. --- */
export const slidePicture = (id) => MEME_TEMPLATES.find((t) => t.id === id)?.imageUrl || '';
export const STUDIO_HERO_SLIDES = [
  {
    id: 'customlayout',
    action: 'custom',
    title: "Start Creating ✨",
    badgeText: '🚀 100% FREE APP',
    badgeClass: 'badge-emerald',
    badgeDotClass: 'dot-emerald',
    titleMain: 'Unleash Your',
    titleGradient: 'Viral Meme Ideas',
    titleGradClass: 'grad-sunset',
    tagline: 'Unleash your viral meme ideas using our studio editor.',
    glowTheme: 'glow-theme-studio',
    glowColor: 'rgba(255, 94, 54, 0.45)',
    icon: Sparkles,
    picture: '252600902', // Always Has Been: the astronauts at the right
    focus: '100% 50%',
    primaryVariant: 'pill-sunset studio-pill-long'
  },
  {
    id: 'videotrim',
    action: 'video',
    title: 'Create Viral Video',
    badgeText: '🎬 TIMELINE & AUDIO SYNC',
    badgeClass: 'badge-cyan',
    badgeDotClass: 'dot-cyan',
    titleMain: 'Create Viral',
    titleGradient: 'Meme Videos',
    titleGradClass: 'grad-electric',
    tagline: 'Trim video clips, sync audio & curved captions',
    glowTheme: 'glow-theme-ai',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    icon: Video,
    picture: '110163934', // I Bet He's Thinking About Other Women: him at the right
    focus: '100% 40%',
    primaryVariant: 'pill-cyan',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'stickers',
    action: 'stickers',
    title: 'Generate Stickers',
    badgeText: '🔥 100% FREE AI CUTOUT',
    badgeClass: 'badge-mint',
    badgeDotClass: 'dot-mint',
    titleMain: 'Remove Background',
    titleGradient: 'Make Stickers',
    titleGradClass: 'grad-mint-cyan',
    tagline: 'Extract clean cutout stickers in 1 tap for any photo.',
    glowTheme: 'glow-theme-cutout',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    icon: Scissors,
    picture: '100777631', // Is This A Pigeon, mirrored so he is at the right
    focus: '0% 25%',
    mirror: true,
    primaryVariant: 'pill-mint',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'faceswap',
    action: 'faceswap',
    title: 'Face Swap',
    badgeText: '🎭 100% FREE FACE SWAP',
    badgeClass: 'badge-amber',
    badgeDotClass: 'dot-amber',
    titleMain: 'Swap Your Face',
    titleGradient: 'Into Any Meme',
    titleGradClass: 'grad-amber-fuchsia',
    tagline: 'Swap your face into viral memes instantly without hassle.',
    glowTheme: 'glow-theme-face',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    icon: Smile,
    picture: 'roll-safe', // Roll Safe, mirrored so his face is at the right
    focus: '0% 30%',
    mirror: true,
    primaryVariant: 'pill-amber',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'socialcards',
    action: 'social',
    title: 'Social Cards',
    badgeText: '💬 SOCIAL CARDS',
    badgeClass: 'badge-fuchsia',
    badgeDotClass: 'dot-fuchsia',
    titleMain: 'Create Realistic',
    titleGradient: 'Social Cards',
    titleGradClass: 'grad-fuchsia-violet',
    tagline: 'Craft Twitter, WhatsApp & Instagram cards',
    glowTheme: 'glow-theme-face',
    glowColor: 'rgba(217, 70, 239, 0.45)',
    icon: Share2,
    picture: '112126428', // Distracted Boyfriend: the couple at the right
    focus: '100% 30%',
    primaryVariant: 'pill-fuchsia',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'aipunchlines',
    action: 'ai',
    title: 'AI Punchlines',
    badgeText: '⚡ 100% FREE AI MEMES',
    badgeClass: 'badge-cyan',
    badgeDotClass: 'dot-cyan',
    titleMain: 'Prompt-To-Meme',
    titleGradient: 'AI Punchlines',
    titleGradClass: 'grad-electric',
    tagline: 'Turn prompts into viral captions & punchlines',
    glowTheme: 'glow-theme-ai',
    glowColor: 'rgba(129, 140, 248, 0.45)',
    icon: Wand2,
    picture: '91538330', // X, X Everywhere, mirrored so Woody is at the right
    focus: '0% 30%',
    mirror: true,
    primaryVariant: 'studio-pill-ai',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  }
];
