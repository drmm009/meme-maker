export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-trending-drake',
    type: 'trending',
    title: '🔥 Trending Template',
    message: '"Drake Hotline Bling" is dominating today\'s trending board. Remix it with your punchline!',
    timestamp: '15m ago',
    read: false,
    action: {
      type: 'template',
      templateId: '181913649',
      label: 'Remix Template'
    }
  },
  {
    id: 'notif-curved-studio',
    type: 'feature',
    title: '✨ Curved Text & Arcs',
    message: 'New studio typography engine: curve, warp, and circle text along custom radiuses!',
    timestamp: '2h ago',
    read: false,
    action: {
      type: 'custom-builder',
      label: 'Open Studio'
    }
  },
  {
    id: 'notif-ai-generator',
    type: 'ai',
    title: '🤖 AI Caption Generator',
    message: 'Need witty meme ideas? Use the AI Caption generator for instant viral comedy scripts.',
    timestamp: '5h ago',
    read: false,
    action: {
      type: 'ai-prompt',
      label: 'Try AI Captions'
    }
  },
  {
    id: 'notif-offline-first',
    type: 'tip',
    title: '🛡️ Local & Private Storage',
    message: 'Your memes and high-res exports are preserved directly in your browser. No watermark, 100% free forever.',
    timestamp: '1d ago',
    read: false,
    action: {
      type: 'gallery',
      label: 'My Studio'
    }
  }
];
