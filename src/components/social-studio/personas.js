// Social Cards Studio's presets (MemeStylesModal): the ready-made personas for each platform, the
// random texts behind the dice buttons, and the WhatsApp chat wallpaper.
import { Sparkles, Moon, Rocket, Trophy, Smile, Briefcase } from 'lucide-react';
import { IG_PRESET_IMAGES } from '../../data/igPresetImages';

export const WHATSAPP_DOODLE_CSS_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' opacity='0.045'%3E%3Cpath d='M15 15h20v14H24l-6 5v-5h-3z'/%3E%3Ccircle cx='110' cy='30' r='8'/%3E%3Cpath d='M110 26v4l3 2'/%3E%3Cpath d='M150 40c0-4 4-8 8-8s8 4 8 8c0 8-16 16-16 16s-16-8-16-16c0-4 4-8 8-8s8 4 8 8z'/%3E%3Ccircle cx='55' cy='75' r='3' fill='%23fff'/%3E%3Cpath d='M58 75V62h10v10'/%3E%3Ccircle cx='68' cy='72' r='3' fill='%23fff'/%3E%3Crect x='130' y='100' width='16' height='12' rx='2'/%3E%3Ccircle cx='138' cy='106' r='3'/%3E%3Ccircle cx='40' cy='130' r='9'/%3E%3Ccircle cx='37' cy='128' r='1' fill='%23fff'/%3E%3Ccircle cx='43' cy='128' r='1' fill='%23fff'/%3E%3Cpath d='M37 133a4 4 0 0 0 6 0'/%3E%3Cpath d='M95 145l2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z'/%3E%3Cpath d='M150 155l3 3 6-7m-4 4l3 3 6-7'/%3E%3C/g%3E%3C/svg%3E")`;

/* ─── Twitter / X Presets & Data ─── */
export const TWITTER_PERSONAS = [
  {
    id: 'elon',
    label: '🚀 Elon Musk',
    name: 'Elon Musk',
    handle: '@elonmusk',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    text: 'thinking about deleting the database and moving to the woods'
  },
  {
    id: 'sama',
    label: '🤖 Sam Altman',
    name: 'Sam Altman',
    handle: '@sama',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    text: 'we just achieved AGI internally, it likes cold brew and refuses to attend standup'
  },
  {
    id: 'cat',
    label: '🐱 Wholesome Cat',
    name: 'Cat Thoughts',
    handle: '@catvibes',
    verified: false,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    text: 'i am not fat. i am simply storing excess charisma for the upcoming winter.'
  },
  {
    id: 'techlead',
    label: '💼 Tech CEO',
    name: 'Tech Founder',
    handle: '@techfounder_xyz',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    text: 'Just raised $40M pre-seed to replace daily standups with an AI that just nods silently'
  },
  {
    id: 'dev',
    label: '☕ Junior Dev',
    name: 'Junior Developer',
    handle: '@git_commit_push',
    verified: false,
    avatarBg: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    text: 'Pushed directly to main on a Friday at 5:01 PM. Pray for me.'
  }
];

export const RANDOM_TWEETS = [
  'thinking about deleting the database and moving to the woods',
  'i have concluded that coffee is just temporary courage in liquid form',
  'pushed directly to main. shutting laptop. see you all on monday.',
  'my code works and i have no idea why',
  'replacing our entire backend with a Google Sheet for maximum velocity',
  'it worked fine on localhost, therefore it is a cloud infrastructure problem',
  'i have 99 problems and 87 of them are completely made up scenarios in my head'
];

/* ─── Instagram Presets & Data (Latest UI Reference Anatomy) ─── */
export const INSTAGRAM_PERSONAS = [
  {
    id: 'nightowl',
    label: 'Night Owl',
    icon: Moon,
    username: '3am.thoughts',
    subtitle: 'Suggested for you',
    verified: false,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #312e81, #6366f1)',
    likesCount: '48,213',
    commentsCount: '1,204',
    repostsCount: '3,317',
    sharesCount: '9,862',
    followText: 'Follow',
    likesText: '48,213',
    text: 'told myself i\'d sleep early tonight. it\'s 3:07 AM and i now know exactly how bricks are made 🧱 no regrets. some regrets.',
    time: '2 hours ago',
    postImage: IG_PRESET_IMAGES.nightOwl
  },
  {
    id: 'zuck',
    label: 'Mark Zuckerberg',
    icon: Rocket,
    username: 'zuck',
    subtitle: 'Suggested for you',
    verified: true,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    likesCount: '142.5K',
    commentsCount: '14.2K',
    repostsCount: '8.4K',
    sharesCount: '29.1K',
    followText: 'Follow',
    likesText: 'Liked by cristiano and 1,842,509 others',
    text: 'Meta announces AGI is just a guy named Dave in a basement writing if-else statements. Link in bio.',
    time: '2 hours ago',
    postImage: IG_PRESET_IMAGES.zuck
  },
  {
    id: 'egg',
    label: 'World Record Egg',
    icon: Trophy,
    username: 'world_record_egg',
    subtitle: 'Egg Gang',
    verified: true,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    likesCount: '58.9M',
    commentsCount: '3.8M',
    repostsCount: '1.2M',
    sharesCount: '4.5M',
    followText: 'Follow',
    likesText: 'Liked by kyliejenner and 58,912,400 others',
    text: 'Let’s set a world record together and get the most liked post on Instagram. We got this 💪',
    time: '1 day ago',
    postImage: IG_PRESET_IMAGES.egg
  },
  {
    id: 'cat',
    label: 'Chonky Cat',
    icon: Smile,
    username: 'chonk_vibes',
    subtitle: 'Living Room, Couch',
    verified: false,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #eab308)',
    likesCount: '412K',
    commentsCount: '892',
    repostsCount: '450',
    sharesCount: '12.8K',
    followText: 'Follow',
    likesText: 'Liked by 412,890 others',
    text: 'I did not knock the glass off the table. Gravity did. I am completely innocent of all charges.',
    time: '4 hours ago',
    postImage: IG_PRESET_IMAGES.cat
  },
  {
    id: 'aesthetic',
    label: 'Aesthetic Creator',
    icon: Sparkles,
    username: 'daily_aesthetic',
    subtitle: 'Coffee & Sunsets',
    verified: true,
    hasStoryRing: false,
    avatarBg: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    likesCount: '98.4K',
    commentsCount: '1,420',
    repostsCount: '610',
    sharesCount: '3.2K',
    followText: 'Follow',
    likesText: 'Liked by zendaya and 984,210 others',
    text: 'Romanticize your life even when your code refuses to compile. ✨ Matcha latte in hand, zero bugs in sight.',
    time: '5 hours ago',
    postImage: IG_PRESET_IMAGES.aesthetic
  },
  {
    id: 'startup',
    label: 'Silicon Valley',
    icon: Briefcase,
    username: 'startup_grind',
    subtitle: 'San Francisco, CA',
    verified: false,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    likesCount: '74.1K',
    commentsCount: '648',
    repostsCount: '1,120',
    sharesCount: '8.9K',
    followText: 'Follow',
    likesText: 'Liked by elonmusk and 74,102 others',
    text: 'We just raised $50M seed round to replace meetings with silence. Hiring 10 senior devs to maintain the silence.',
    time: '7 hours ago',
    postImage: IG_PRESET_IMAGES.startup
  }
];

export const RANDOM_IG_CAPTIONS = [
  'Meta announces AGI is just a guy named Dave in a basement writing if-else statements. Link in bio.',
  'Let’s set a world record together and get the most liked post on Instagram 💪',
  'I did not knock the glass off the table. Gravity did. I am completely innocent of all charges.',
  'POV: You said "one more episode" 4 hours ago and now the sun is personally insulting you.',
  'My brain has 47 tabs open, 5 are frozen, and there is mysterious elevator music playing in the background.',
  'Just dropped my new single called "Leaving on read for mental peace". Available everywhere.',
  'When you realize adulting is just walking around saying "everything is so expensive" until you die.',
  'Behind every successful person is a substantial amount of iced coffee and unwarranted confidence.',
  'I am currently experiencing technical difficulties with life. Please try again tomorrow.',
  'Me pretending to be shocked when the consequences of my own procrastination catch up to me.'
];

/* ─── WhatsApp Presets & Multi-Message Conversations ─── */
export const WHATSAPP_PERSONAS = [
  {
    id: 'newspaper',
    label: '📰 Newspaper Ad',
    name: '+91 81210 03003',
    status: 'last seen yesterday at 6:43 PM',
    datePill: 'Yesterday',
    avatarBg: '#202c33',
    messages: [
      { id: 'm1', text: 'Hi, I need some help.', direction: 'sent', time: '12:28 PM', ticks: 'blue' },
      { id: 'm2', text: 'Hello. Are you looking for advertising in newspaper. Please let us know what kind of ad you are looking to advertise. We will reply you shortly', direction: 'received', time: '12:31 PM', ticks: 'none' },
      { id: 'm3', text: 'Yes', direction: 'sent', time: '12:31 PM', ticks: 'blue' },
      { id: 'm4', text: 'In English and Gujarati', direction: 'sent', time: '12:31 PM', ticks: 'blue' },
      { id: 'm5', text: '??', direction: 'sent', time: '11:34 AM', ticks: 'blue' },
      { id: 'm6', text: 'We request you to please share the matter along with the newspaper name, date, and city.', direction: 'received', time: '12:16 PM', ticks: 'none' }
    ]
  },
  {
    id: 'mom',
    label: '❤️ Mom',
    name: 'Mom ❤️',
    status: 'online',
    datePill: 'TODAY',
    avatarBg: 'linear-gradient(135deg, #f43f5e, #fda4af)',
    messages: [
      { id: 'm1', text: 'Please remember to eat vegetables and don’t stay up until 4 AM arguing with strangers on the internet.', direction: 'received', time: '11:42 PM', ticks: 'blue' },
      { id: 'm2', text: 'I am eating healthy right now mom! 👍', direction: 'sent', time: '11:43 PM', ticks: 'blue' },
      { id: 'm3', text: 'Pizza is not a vegetable. I can see your location at Domino’s.', direction: 'received', time: '11:44 PM', ticks: 'blue' }
    ]
  },
  {
    id: 'boss',
    label: '💼 The Boss',
    name: 'Boss 💼',
    status: 'online',
    datePill: 'TODAY',
    avatarBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    messages: [
      { id: 'b1', text: 'Hey, I know you’re on PTO in the mountains right now...', direction: 'received', time: '8:01 AM', ticks: 'blue' },
      { id: 'b2', text: 'Yeah, signal is pretty bad up here!', direction: 'sent', time: '8:02 AM', ticks: 'blue' },
      { id: 'b3', text: 'Great. Can you hop on a quick 3-hour emergency alignment sync?', direction: 'received', time: '8:03 AM', ticks: 'blue' }
    ]
  },
  {
    id: 'fbi',
    label: '🕵️ FBI Agent',
    name: 'FBI Agent 🕵️',
    status: 'typing...',
    avatarBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
    messages: [
      { id: 'f1', text: 'We saw what you just googled.', direction: 'received', time: '2:14 AM', ticks: 'blue' },
      { id: 'f2', text: 'Wait who is this?? 😳', direction: 'sent', time: '2:15 AM', ticks: 'blue' },
      { id: 'f3', text: 'Close the incognito tab immediately and go to sleep.', direction: 'received', time: '2:16 AM', ticks: 'blue' }
    ]
  },
  {
    id: 'delivery',
    label: '🍕 Delivery Guy',
    name: 'Delivery Driver 🛵',
    status: 'online',
    avatarBg: 'linear-gradient(135deg, #f97316, #ea580c)',
    messages: [
      { id: 'd1', text: 'I’ve been standing outside your door for 15 minutes.', direction: 'received', time: '9:15 PM', ticks: 'blue' },
      { id: 'd2', text: 'Which door? I don\'t see anyone outside!', direction: 'sent', time: '9:16 PM', ticks: 'blue' },
      { id: 'd3', text: 'I’m on your porch eating your fries. They’re really good.', direction: 'received', time: '9:17 PM', ticks: 'blue' }
    ]
  },
  {
    id: 'landlord',
    label: '🏠 Landlord',
    name: 'Landlord 🔑',
    status: 'last seen 2m ago',
    avatarBg: 'linear-gradient(135deg, #64748b, #475569)',
    messages: [
      { id: 'l1', text: 'Rent was due 60 seconds ago.', direction: 'received', time: '12:01 AM', ticks: 'grey' },
      { id: 'l2', text: 'It\'s 12:01 AM on the 1st!! The bank is closed!', direction: 'sent', time: '12:02 AM', ticks: 'blue' },
      { id: 'l3', text: 'A $400 late convenience fee has been applied to your account.', direction: 'received', time: '12:03 AM', ticks: 'grey' }
    ]
  }
];
