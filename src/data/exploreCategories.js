// Explore's categories: the chips across the top, in order, with their icon and colour.
import { Briefcase, Clapperboard, Drama, Flame, Heart, Layers, LayoutGrid, Share2, Smile, Sparkles, Star } from 'lucide-react';

export const EXPLORE_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layers, color: '#ff5e36', description: 'Browse all templates categorically' },
  { id: 'trending', label: 'Trending', icon: Flame, color: '#ff3b60', description: 'Most viral memes right now' },
  { id: 'social', label: 'Social Cards', icon: Share2, color: '#38bdf8', description: 'Twitter, WhatsApp & Instagram cards' },
  { id: 'videos', label: 'Video Memes', icon: Clapperboard, color: '#06b6d4', description: 'Motion clips & video templates' },
  { id: 'reaction', label: 'Reactions', icon: Smile, color: '#a855f7', description: 'Expressive moods & face reactions' },
  { id: 'work', label: 'Work & Office', icon: Briefcase, color: '#f59e0b', description: 'Corporate & 9-to-5 relatable humor' },
  { id: 'relatable', label: 'Relationships', icon: Heart, color: '#ec4899', description: 'Everyday life, dating & friendship' },
  { id: 'classic', label: 'Classics', icon: Drama, color: '#eab308', description: 'Timeless legendary meme formats' },
  { id: 'comparison', label: 'Comparison & VS', icon: LayoutGrid, color: '#6366f1', description: 'Side-by-side comparisons & choices' },
  { id: 'desi', label: 'Bollywood Culture', icon: Sparkles, color: '#10b981', description: 'Iconic cinema & pop culture memes' },
  { id: 'popular', label: 'Popular', icon: Star, color: '#f97316', description: 'All-time favorite community templates' },
  { id: 'favorites', label: 'My Favorites', icon: Star, color: '#fbbf24', description: 'Templates you have starred' }
];
