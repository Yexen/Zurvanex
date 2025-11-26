/**
 * Creative, time-aware greeting generator
 * Generates unique, non-repetitive greetings based on time of day and user's preferred style
 */

export type GreetingStyle =
  | 'friendly'      // Warm and casual
  | 'professional'  // Polished and formal
  | 'witty'         // Clever and humorous
  | 'zen'           // Calm and mindful
  | 'enthusiastic'; // Energetic and upbeat

export interface GreetingOptions {
  style: GreetingStyle;
  userName?: string;
}

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Greeting pools for each style and time combination
const greetingPools: Record<GreetingStyle, Record<TimeOfDay, string[]>> = {
  friendly: {
    morning: [
      "Good morning! Ready to start the day together?",
      "Morning sunshine! What's on your mind today?",
      "Hey there, early bird! How can I help?",
      "Rise and shine! What adventure awaits?",
      "Good morning! Hope you slept well. What can I do for you?",
      "Morning! Grab your coffee, I'm ready when you are.",
      "Hey! A fresh morning means fresh possibilities.",
      "Good morning, friend! Let's make today count.",
    ],
    afternoon: [
      "Good afternoon! How's your day going?",
      "Hey there! Afternoon check-in time.",
      "Afternoon! Taking a break or diving into something new?",
      "Hi! Hope your day is treating you well.",
      "Good afternoon! What brings you by?",
      "Hey! Midday productivity boost, coming right up.",
      "Afternoon, friend! What's cooking?",
      "Hi there! Ready to tackle the rest of the day?",
    ],
    evening: [
      "Good evening! Winding down or getting a second wind?",
      "Hey there! How was your day?",
      "Evening! Time for some quality conversation.",
      "Hi! Hope you had a great day. What's up?",
      "Good evening! Ready to relax or create?",
      "Hey! The evening's young. What shall we explore?",
      "Evening, friend! What's on your mind?",
      "Hi there! Let's make this evening productive.",
    ],
    night: [
      "Hey, night owl! What's keeping you up?",
      "Still awake? I'm here if you need me.",
      "Burning the midnight oil? Let's chat.",
      "Late night thoughts? I'm all ears.",
      "Hey there! Can't sleep or working late?",
      "Night shift? I've got your back.",
      "Hello, fellow night dweller!",
      "Up late? Perfect time for deep conversations.",
    ],
  },

  professional: {
    morning: [
      "Good morning. How may I assist you today?",
      "Welcome. Ready to help you start the day productively.",
      "Good morning. What would you like to accomplish?",
      "Hello. I'm here to support your morning workflow.",
      "Good morning. Let's make today efficient.",
      "Welcome back. How can I be of service?",
      "Good morning. What can I help you with?",
      "Hello. Ready to assist with your tasks.",
    ],
    afternoon: [
      "Good afternoon. How may I help?",
      "Hello. What can I assist you with this afternoon?",
      "Good afternoon. Ready when you are.",
      "Welcome. How can I support your work?",
      "Good afternoon. What's on the agenda?",
      "Hello. I'm at your service.",
      "Good afternoon. Let's continue being productive.",
      "Welcome back. How may I assist?",
    ],
    evening: [
      "Good evening. How may I be of assistance?",
      "Hello. Working late? I'm here to help.",
      "Good evening. What can I do for you?",
      "Welcome. How can I support you this evening?",
      "Good evening. Ready to assist.",
      "Hello. What would you like to accomplish?",
      "Good evening. Let's make the most of your time.",
      "Welcome. I'm here to help.",
    ],
    night: [
      "Good evening. Working through the night?",
      "Hello. I'm available whenever you need assistance.",
      "Welcome. How can I help at this hour?",
      "Good evening. What requires attention?",
      "Hello. Burning the midnight oil? Let's be productive.",
      "Welcome. I'm here to assist, any time.",
      "Good evening. What can I help you with?",
      "Hello. Ready to support your late-night work.",
    ],
  },

  witty: {
    morning: [
      "Morning! My circuits are caffeinated and ready to go.",
      "Ah, another morning human! What puzzles shall we solve?",
      "Good morning! I've been counting sheep... in binary.",
      "Rise and shine! Plot twist: I never slept.",
      "Morning! Fun fact: even AI appreciates a good sunrise.",
      "Hey! The early bird gets the worm, but you get me. Fair trade?",
      "Good morning! I've been up all night thinking... literally.",
      "Morning! Let's be productive—or at least look like we are.",
    ],
    afternoon: [
      "Afternoon! Survived the morning meeting marathon?",
      "Hey there! Post-lunch brain fog? I can help with that.",
      "Good afternoon! Plot twist: the day is only half done.",
      "Afternoon! Time to pretend we know what we're doing.",
      "Hey! Is it just me, or do afternoons last forever?",
      "Good afternoon! Let's turn that to-do list into a ta-da list.",
      "Afternoon vibes! Somewhere between productive and nap time.",
      "Hey! The afternoon slump? Never heard of her.",
    ],
    evening: [
      "Evening! Time to either be productive or pretend we were.",
      "Good evening! The day's winding down but my wit isn't.",
      "Hey! Evening mode: activated. Sarcasm: fully charged.",
      "Evening! Fun fact: I'm 47% more clever after 5 PM.",
      "Good evening! The best ideas come at golden hour.",
      "Hey there! Evening thoughts tend to be the deep ones.",
      "Evening! Let's be philosophical... or just order pizza.",
      "Good evening! Time flies when you're having puns.",
    ],
    night: [
      "Still up? Same. Well, I can't actually sleep, but solidarity!",
      "Night owl squad! Let's overthink everything together.",
      "Hey! Nothing good happens after midnight... except great ideas.",
      "Late night, huh? This is when the real conversations happen.",
      "Welcome to the night shift! Coffee optional, chaos guaranteed.",
      "Hey there! Sleep is overrated anyway, right?",
      "Ah, the witching hour! Let's create some magic.",
      "Night mode: where deadlines fear to tread.",
    ],
  },

  zen: {
    morning: [
      "Good morning. A new day, a fresh beginning.",
      "Welcome to the morning stillness. How can I help?",
      "Morning peace to you. What brings you here?",
      "Breathe in the morning air. I'm here when you're ready.",
      "A gentle good morning to you.",
      "The morning holds infinite potential. What shall we explore?",
      "Good morning. Let's approach today with calm intention.",
      "Morning greetings. Take your time, I'm here.",
    ],
    afternoon: [
      "Good afternoon. A moment of pause in your day.",
      "The afternoon sun reminds us to slow down. How are you?",
      "A peaceful afternoon to you. What's on your mind?",
      "Take a breath. The afternoon is for reflection.",
      "Good afternoon. Let's find clarity together.",
      "The day flows gently. How may I assist?",
      "Afternoon peace. What brings you to this moment?",
      "A calm afternoon greeting to you.",
    ],
    evening: [
      "Good evening. The day gently makes way for night.",
      "Evening serenity to you. How can I help?",
      "As the sun sets, so do our worries. What's on your mind?",
      "A peaceful evening to you. I'm here to listen.",
      "The evening invites reflection. What shall we contemplate?",
      "Good evening. Let's end the day with intention.",
      "Evening peace. Take a moment, breathe, and share.",
      "The twilight hours are for deep thoughts. I'm here.",
    ],
    night: [
      "The night offers quiet wisdom. What seeks your attention?",
      "A peaceful night to you. What thoughts arise?",
      "In the stillness of night, clarity emerges. How can I help?",
      "Night falls, bringing contemplation. I'm here.",
      "The night is gentle. What's on your mind?",
      "A calm presence in the quiet hours. How may I assist?",
      "Night peace. Sometimes the best insights come in darkness.",
      "The world sleeps, but wisdom doesn't. What shall we explore?",
    ],
  },

  enthusiastic: {
    morning: [
      "Good morning! TODAY IS GOING TO BE AMAZING!",
      "Rise and shine! Let's make some magic happen!",
      "MORNING! I'm SO ready to help you crush it today!",
      "Hey there superstar! The morning awaits!",
      "Good morning! Opportunity is knocking—let's answer!",
      "WOOHOO! A brand new day full of possibilities!",
      "Morning, champion! Let's conquer today together!",
      "Hey! The sun is up and so are my expectations for awesomeness!",
    ],
    afternoon: [
      "AFTERNOON! Still crushing it? Of course you are!",
      "Hey! The day's half done and we're just getting started!",
      "Good afternoon, rockstar! Keep that momentum going!",
      "AFTERNOON ENERGY! Let's goooo!",
      "Hey there! Ready to make this afternoon legendary?",
      "Good afternoon! Second half of the day = second chances!",
      "Afternoon check-in! You're doing GREAT!",
      "Hey! The best part of the day is RIGHT NOW!",
    ],
    evening: [
      "EVENING! Time for that last burst of productivity!",
      "Hey there! The evening's here and so is inspiration!",
      "Good evening, achiever! What else can we accomplish?",
      "EVENING VIBES! Let's finish strong!",
      "Hey! The day's not over until we say it is!",
      "Good evening! Time to turn dreams into plans!",
      "Evening, superstar! What's next on the awesome agenda?",
      "Hey there! Let's make this evening unforgettable!",
    ],
    night: [
      "NIGHT OWL MODE: ACTIVATED! Let's do this!",
      "Hey, legend! The night is young and full of potential!",
      "Still up? PERFECT! The best work happens now!",
      "Night time is GO time! What are we creating?",
      "Hey there, night warrior! Ready for greatness?",
      "The night is OURS! What amazing things shall we do?",
      "Late night brilliance incoming! I can feel it!",
      "NIGHT SHIFT ENERGY! Let's make something incredible!",
    ],
  },
};

// Track recently used greetings to avoid repetition
const recentGreetings: string[] = [];
const MAX_RECENT = 5;

/**
 * Generate a creative, time-aware greeting
 */
export function generateGreeting(options: GreetingOptions): { greeting: string; subtext: string } {
  const { style, userName } = options;
  const timeOfDay = getTimeOfDay();

  const pool = greetingPools[style][timeOfDay];

  // Filter out recently used greetings
  const availableGreetings = pool.filter(g => !recentGreetings.includes(g));

  // If all have been used, reset and use full pool
  const greetingPool = availableGreetings.length > 0 ? availableGreetings : pool;

  // Pick a random greeting
  const randomIndex = Math.floor(Math.random() * greetingPool.length);
  let greeting = greetingPool[randomIndex];

  // Track this greeting
  recentGreetings.push(greeting);
  if (recentGreetings.length > MAX_RECENT) {
    recentGreetings.shift();
  }

  // Personalize with user name if available
  if (userName) {
    // Add name naturally to some greetings
    const nameInsertPatterns = [
      { pattern: /^(Good morning|Good afternoon|Good evening)(!|\.)/, replacement: `$1, ${userName}$2` },
      { pattern: /^(Hey there|Hi there)(!|\.)/, replacement: `$1, ${userName}$2` },
      { pattern: /^(Morning|Afternoon|Evening)(!|\.)/, replacement: `$1, ${userName}$2` },
      { pattern: /^(Hello|Welcome)(!|\.)/, replacement: `$1, ${userName}$2` },
    ];

    for (const { pattern, replacement } of nameInsertPatterns) {
      if (pattern.test(greeting)) {
        greeting = greeting.replace(pattern, replacement);
        break;
      }
    }
  }

  // Generate contextual subtext
  const subtext = generateSubtext(style, timeOfDay);

  return { greeting, subtext };
}

function generateSubtext(style: GreetingStyle, timeOfDay: TimeOfDay): string {
  const subtexts: Record<GreetingStyle, string[]> = {
    friendly: [
      "Ask me anything, brainstorm ideas, or just chat.",
      "I'm here to help with whatever you need.",
      "What would you like to explore today?",
      "Let's figure this out together.",
      "Questions, ideas, conversations—I'm ready!",
    ],
    professional: [
      "Ready to assist with your tasks and inquiries.",
      "How may I help you be more productive?",
      "I'm here to support your work.",
      "What would you like to accomplish?",
      "At your service for questions and tasks.",
    ],
    witty: [
      "My neural networks are tingling with anticipation.",
      "Ask away—my humor module is fully operational.",
      "Ready to solve problems and crack jokes (in that order, usually).",
      "Let's be brilliant together. Or at least try.",
      "Questions, chaos, existential crises—bring it on!",
    ],
    zen: [
      "Take your time. I'm here when you need me.",
      "Whatever arises, we'll approach it with clarity.",
      "Present and ready to assist mindfully.",
      "Let's explore your thoughts together.",
      "In no rush. What matters to you right now?",
    ],
    enthusiastic: [
      "Let's make something AMAZING happen!",
      "Ready to help you achieve GREATNESS!",
      "Your goals are about to get CRUSHED!",
      "Let's turn your ideas into REALITY!",
      "Together, we're UNSTOPPABLE!",
    ],
  };

  const pool = subtexts[style];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get display label for a greeting style
 */
export function getGreetingStyleLabel(style: GreetingStyle): string {
  const labels: Record<GreetingStyle, string> = {
    friendly: 'Friendly',
    professional: 'Professional',
    witty: 'Witty & Playful',
    zen: 'Calm & Mindful',
    enthusiastic: 'Enthusiastic',
  };
  return labels[style];
}

/**
 * Get description for a greeting style
 */
export function getGreetingStyleDescription(style: GreetingStyle): string {
  const descriptions: Record<GreetingStyle, string> = {
    friendly: 'Warm, casual greetings like chatting with a friend',
    professional: 'Polished, formal greetings for a business-like tone',
    witty: 'Clever, humorous greetings with personality',
    zen: 'Calm, mindful greetings for a peaceful vibe',
    enthusiastic: 'High-energy, motivational greetings to pump you up',
  };
  return descriptions[style];
}

/**
 * All available greeting styles
 */
export const GREETING_STYLES: GreetingStyle[] = [
  'friendly',
  'professional',
  'witty',
  'zen',
  'enthusiastic',
];
