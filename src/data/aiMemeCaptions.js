// AI Meme caption data: vibes, idea cards and the built-in caption library.

export const AI_MEME_CATEGORIES = [
  { id: 'all', label: 'All Random', icon: '🎲' },
  { id: 'tech', label: 'Tech & Code', icon: '💻' },
  { id: 'work', label: 'Work & Boss', icon: '💼' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'life', label: 'Relatable Life', icon: '☕' },
  { id: 'sarcasm', label: 'Sarcastic', icon: '🔥' },
  { id: 'students', label: 'School & College', icon: '📚' }
];

// Ideas the AI Meme page offers to start from, each sent as the prompt with its vibe.
export const AI_MEME_IDEAS = [
  { text: 'Mondays', icon: '😩', category: 'work' },
  { text: 'Exams tomorrow', icon: '📚', category: 'students' },
  { text: 'My code finally works', icon: '💻', category: 'tech' },
  { text: 'Gym day one', icon: '🏋️', category: 'life' },
  { text: 'Group projects', icon: '🤝', category: 'students' },
  { text: 'One more game', icon: '🎮', category: 'gaming' },
  { text: 'Meetings that could be emails', icon: '📅', category: 'work' },
  { text: 'My sleep schedule', icon: '😴', category: 'life' },
];

export const CURATED_CAPTIONS = [
  // Tech & Code
  { category: 'tech', text: 'When the code works on the first try and you spend 2 hours figuring out why' },
  { category: 'tech', text: 'It\'s not a bug, it\'s an undocumented feature that provides suspense' },
  { category: 'tech', text: 'POV: You pushed directly to main on a Friday at 4:58 PM' },
  { category: 'tech', text: 'Junior dev: "It\'s just a quick one-line fix, what could go wrong?"' },
  { category: 'tech', text: 'Senior dev looking at code I wrote 6 months ago vs looking at code I wrote yesterday' },
  { category: 'tech', text: '99 little bugs in the code. 99 little bugs. Take one down, patch it around... 127 little bugs in the code.' },
  { category: 'tech', text: 'Replacing a 200-line function with a library that imports 450MB of dependencies' },
  { category: 'tech', text: 'My code compiles without warnings. Something is horribly wrong.' },

  // Work & Boss
  { category: 'work', text: 'Manager: "This meeting could have been an email"\nThe email: 47 paragraphs with no action items' },
  { category: 'work', text: 'My camera was accidentally on during a meeting and everyone saw my true soul' },
  { category: 'work', text: 'Me typing furiously in Slack so my status stays green' },
  { category: 'work', text: 'Boss: "We are like a family here"\nThe family in question: Succession' },
  { category: 'work', text: 'Saying "per my previous email" is professional for "can you read?"' },
  { category: 'work', text: 'Working from home: 10% actual work, 90% checking if the fridge spawned new food' },
  { category: 'work', text: 'That feeling when you close 42 browser tabs after finishing a task' },

  // Gaming
  { category: 'gaming', text: 'Me: "Just one quick match then I sleep"\nThe clock 4 hours later: 3:42 AM' },
  { category: 'gaming', text: 'Blaming lag when you missed an opponent standing completely motionless' },
  { category: 'gaming', text: 'Buying 50 games on Steam summer sale to play the same game from 2012' },
  { category: 'gaming', text: 'Boss: "Why were you up all night?"\nMe: "The village in Minecraft needed a cobblestone perimeter"' },
  { category: 'gaming', text: 'When the tutorial boss uses 100% of your cognitive capacity' },

  // Relatable Life
  { category: 'life', text: 'Nobody:\nMy brain at 3:14 AM: Remember that awkward handshake from 2017?' },
  { category: 'life', text: 'Me looking at my bank account after saying "treat yourself" 14 times this week' },
  { category: 'life', text: 'Checking the tracking number 4 minutes after placing the order' },
  { category: 'life', text: 'My internal monologue deciding whether to fold the laundry or leave it on the chair forever' },
  { category: 'life', text: 'Saying "no worries" when there are, in fact, tremendous amounts of worries' },
  { category: 'life', text: 'Me reading the recipe step 1: "Prep time: 10 mins"\nMe 45 minutes later still chopping an onion' },
  { category: 'life', text: 'I have 2 moods: 1. Clean the entire house in 40 minutes. 2. Sit in a chair like a gargoyle for 6 hours.' },

  // Sarcastic
  { category: 'sarcasm', text: 'I\'m not arguing, I\'m just explaining why I\'m objectively right' },
  { category: 'sarcasm', text: 'Everything happens for a reason. Sometimes the reason is that you are bad at decisions.' },
  { category: 'sarcasm', text: 'Common sense is like deodorant. The people who need it most never use it.' },
  { category: 'sarcasm', text: 'I survived another meeting that should have been a quick Slack message' },
  { category: 'sarcasm', text: 'My patience has an expiry date, and today is 3 days past it' },

  // School & College
  { category: 'students', text: 'Me studying for 12 minutes: "Time for a well-deserved 3-hour phone break"' },
  { category: 'students', text: 'The exam question: "Calculate the mass of the Sun using a 15cm ruler"' },
  { category: 'students', text: 'Submitting the assignment at 11:59:58 PM for an 11:59:00 PM deadline' },
  { category: 'students', text: 'Professor: "The test will be straightforward"\nThe test: Question 1a requires deciphering ancient hieroglyphs' }
];

// Captions for a meme, from the built-in library (by vibe, shuffled). Async so a backend can
// write them later without changing the callers (they pass the prompt and template name for it).
/** @param {{ prompt?: string, templateName?: string, category?: string, count?: number }} [options] */
export async function generateMemeCaptions({ category = 'all', count = 4 } = {}) {
  let pool = CURATED_CAPTIONS;
  if (category && category !== 'all') {
    pool = pool.filter(c => c.category === category);
  }

  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(c => c.text);
}
