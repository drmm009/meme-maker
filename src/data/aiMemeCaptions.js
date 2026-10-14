// AI Meme Caption Generator Data & Gemini API Integration

export const AI_MEME_CATEGORIES = [
  { id: 'all', label: 'All Random', icon: '🎲' },
  { id: 'tech', label: 'Tech & Code', icon: '💻' },
  { id: 'work', label: 'Work & Boss', icon: '💼' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'life', label: 'Relatable Life', icon: '☕' },
  { id: 'sarcasm', label: 'Sarcastic', icon: '🔥' },
  { id: 'students', label: 'School & College', icon: '📚' }
];

export const TEMPLATE_SPECIFIC_CAPTIONS = {
  'drake': [
    { top: 'Writing documentation', bottom: 'Writing code that only God and I understand' },
    { top: 'Fixing the root cause of the bug', bottom: 'Wrapping the entire function in try { ... } catch (e) {}' },
    { top: 'Going to bed at 10 PM', bottom: 'Watching a 45-minute documentary on Byzantine architecture at 3 AM' },
    { top: 'Saving money for the future', bottom: 'Buying something I don\'t need because it was 15% off' },
    { top: 'Reading the error message', bottom: 'Rerunning the code 10 times hoping it fixes itself' }
  ],
  'distracted_boyfriend': [
    { top: 'My unfinished side projects', bottom: 'A brand new framework released 2 hours ago' },
    { top: '8 hours of healthy sleep', bottom: 'One more episode / match at 1:30 AM' },
    { top: 'My current budget', bottom: 'Adding $80 of items to cart for free shipping' }
  ],
  'two_buttons': [
    { top: 'Sleep at a reasonable hour', bottom: 'Overthink every life choice made since 2014' },
    { top: 'Fix the bug properly', bottom: 'Comment out the failing test and push to main' },
    { top: 'Eat healthy homemade food', bottom: 'Order takeout because cooking requires washing dishes' }
  ],
  'buff_doge': [
    { top: 'Programmers in 1969:\nLanding Apollo 11 on the Moon with 4KB of RAM', bottom: 'Programmers in 2026:\nMy chat app requires 16GB RAM and Chromium to say hello' },
    { top: 'Me planning my life on Sunday night', bottom: 'Me waking up on Monday morning' }
  ]
};

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

/**
 * Generate captions using Google Gemini API (if user provides key)
 * or fallback seamlessly to curated witty captions.
 */
export async function generateMemeCaptionsWithGemini({ apiKey, prompt, templateName, category = 'all', count = 4 }) {
  if (apiKey && apiKey.trim()) {
    try {
      const systemInstruction = `You are an elite internet meme creator and viral humorist.
Generate ${count} extremely funny, punchy, modern meme captions based on the user request.
Respond ONLY with a JSON array of strings, with NO markdown backticks, NO extra commentary.
Example output format:
["First funny caption here", "Second funny caption here", "Third caption here"]`;

      const userContent = `Meme Template: ${templateName || 'Modern Image Meme'}
Category / Theme: ${category}
User's Idea / Context: ${prompt || 'Make a hilarious, relatable, viral meme'}`;

      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 12000);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        signal: ctl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${userContent}` }]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const arrayMatch = rawText.match(/\[[\s\S]*\]/);
        const jsonToParse = arrayMatch ? arrayMatch[0] : rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonToParse);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => String(typeof item === 'object' ? (item.text || item.caption || JSON.stringify(item)) : item).trim());
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to curated library:', err);
    }
  }

  // Fallback: Smart curated library selection
  let pool = CURATED_CAPTIONS;
  if (category && category !== 'all') {
    pool = pool.filter(c => c.category === category);
  }

  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(c => c.text);
}
