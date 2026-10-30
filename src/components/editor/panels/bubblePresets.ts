// The chat and speech bubble styles (Text > Bubble). useBubbleActions applies one to a caption by id.
export interface BubblePreset {
  id: string;
  name: string;
  category: string;
  bubbleBg: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: string;
  sampleText: string;
  description: string;
}

export const BUBBLE_PRESETS: BubblePreset[] = [
  {
    id: 'imessage-send',
    name: 'iPhone Sent',
    category: 'iMessage',
    bubbleBg: '#007aff',
    textColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '18px 18px 4px 18px',
    sampleText: 'Hello from iPhone! 📤',
    description: 'Classic iOS blue sent bubble'
  },
  {
    id: 'imessage-receive',
    name: 'iPhone Received',
    category: 'iMessage',
    bubbleBg: '#e9e9eb',
    textColor: '#000000',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '18px 18px 18px 4px',
    sampleText: 'Hey there! What’s up? 📥',
    description: 'iOS recipient light gray bubble'
  },
  {
    id: 'whatsapp-send',
    name: 'WhatsApp Sent',
    category: 'WhatsApp',
    bubbleBg: '#005c4b',
    textColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '14px 4px 14px 14px',
    sampleText: 'Sent via WhatsApp 💬',
    description: 'WhatsApp emerald green bubble'
  },
  {
    id: 'whatsapp-receive',
    name: 'WhatsApp Received',
    category: 'WhatsApp',
    bubbleBg: '#202c33',
    textColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '4px 14px 14px 14px',
    sampleText: 'Got it, let’s do it! 💬',
    description: 'WhatsApp dark mode bubble'
  },
  {
    id: 'speech-left',
    name: 'Comic Speech (Left)',
    category: 'Comic',
    bubbleBg: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '16px',
    sampleText: 'Wait, what?! ◂',
    description: 'Comic speech pointer left'
  },
  {
    id: 'speech-right',
    name: 'Comic Speech (Right)',
    category: 'Comic',
    bubbleBg: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '16px',
    sampleText: 'Let’s go! ▸',
    description: 'Comic speech pointer right'
  },
  {
    id: 'thought',
    name: 'Thought Bubble',
    category: 'Comic',
    bubbleBg: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '24px',
    sampleText: 'Thinking... 💭',
    description: 'Cloud thought bubble'
  },
  {
    id: 'shout',
    name: 'Shout / Action',
    category: 'Action',
    bubbleBg: '#ffe600',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '12px',
    sampleText: 'OMG NOOO! 💥',
    description: 'High-energy comic action shout'
  }
];

export const BUBBLE_CATEGORIES = ['All', 'iMessage', 'WhatsApp', 'Comic', 'Action'];
