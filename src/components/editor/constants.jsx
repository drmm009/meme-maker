import React from 'react';

export const TEXT_EFFECTS = [
  {
    id: 'flat',
    name: 'Flat',
    title: 'Flat (Classic standard text)',
    curve: 0,
    renderLabel: () => (
      <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px' }}>
        Flat
      </span>
    )
  },
  {
    id: 'arch',
    name: 'Arch',
    title: 'Arch (Curved upward text)',
    curve: 40,
    renderLabel: () => (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#ffffff' }}>
        <span style={{ display: 'inline-block', transform: 'translateY(1.5px)' }}>A</span>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>r</span>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>c</span>
        <span style={{ display: 'inline-block', transform: 'translateY(1.5px)' }}>h</span>
      </span>
    )
  },
  {
    id: 'smile',
    name: 'Smile',
    title: 'Smile (Curved downward text)',
    curve: -40,
    renderLabel: () => (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#ffffff' }}>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>S</span>
        <span style={{ display: 'inline-block', transform: 'translateY(0px)' }}>m</span>
        <span style={{ display: 'inline-block', transform: 'translateY(1.8px)' }}>i</span>
        <span style={{ display: 'inline-block', transform: 'translateY(0px)' }}>l</span>
        <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>e</span>
      </span>
    )
  },
  {
    id: 'shadow',
    name: 'Shadow',
    title: 'Shadow (Bold meme drop shadow)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '2px 2px 0px #000000, 3px 3px 2px rgba(0,0,0,0.85)',
        letterSpacing: '0.3px'
      }}>
        Shadow
      </span>
    )
  },
  {
    id: 'glow',
    name: 'Glow',
    title: 'Glow (Neon cyan electric aura)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '0 0 4px #00f0ff, 0 0 10px #00f0ff, 0 0 16px #00f0ff',
        letterSpacing: '0.3px'
      }}>
        Glow
      </span>
    )
  },
  {
    id: 'glitch',
    name: 'Glitch',
    title: 'Glitch (Chromatic aberration red/cyan split)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '-1.5px 0 #ff0055, 1.5px 0 #00ffff',
        letterSpacing: '0.5px'
      }}>
        Glitch
      </span>
    )
  },
  {
    id: '3d',
    name: '3D',
    title: '3D (Extruded pop layered shadow)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 800,
        color: '#ffffff',
        textShadow: '1px 1px 0 #ea580c, 2px 2px 0 #c2410c, 3px 3px 0 #000000',
        letterSpacing: '0.5px'
      }}>
        3D
      </span>
    )
  },
  {
    id: 'hollow',
    name: 'Hollow',
    title: 'Hollow (Transparent outline text)',
    curve: 0,
    renderLabel: () => (
      <span style={{
        fontWeight: 900,
        color: 'transparent',
        WebkitTextStroke: '1px #ffffff',
        letterSpacing: '0.5px'
      }}>
        Hollow
      </span>
    )
  }
];

export const secondaryVariants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] }
  }
};
