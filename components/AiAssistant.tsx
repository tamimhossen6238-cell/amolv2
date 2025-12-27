import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Sparkles, AlertTriangle, Settings, WifiOff } from 'lucide-react';
import { View, ChatMessage, Tasbih, TargetAmol, JournalEntry, Stats, DailyHistory, InboxMessage } from '../types';
import { GoogleGenAI, FunctionDeclaration, Type, Chat } from '@google/genai';

// Simple B&W Gemini Icon SVG for header
const GeminiIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700 dark:text-slate-200">
        <path d="M5.99999 15.6C4.89542 15.6 3.99999 14.7046 3.99999 13.6C3.99999 12.4954 4.89542 11.6 5.99999 11.6C7.10456 11.6 8 12.4954 8 13.6C8 14.7046 7.10456 15.6 5.99999 15.6Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12.4 17.6C11.2954 17.6 10.4 16.7046 10.4 15.6C10.4 14.4954 11.2954 13.6 12.4 13.6C13.5046 13.6 14.4 14.4954 14.4 15.6C14.4 16.7046 13.5046 17.6 12.4 17.6Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11.6 3.99999C11.6 5.10456 12.4954 6 13.6 6C14.7046 6 15.6 5.10456 15.6 3.99999C15.6 2.89542 14.7046 2 13.6 2C12.4954 2 11.6 2.89542 11.6 3.99999Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11.6 3.99999C11.6 5.10456 12.4954 6 13.6 6C14.7046 6 15.6 5.10456 15.6 3.99999C15.6 2.89542 14.7046 2 13.6 2C12.4954 2 11.6 2.89542 11.6 3.99999Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M18 13.6C16.8954 13.6 16 12.7046 16 11.6C16 10.4954 16.8954 9.60001 18 9.60001C19.1046 9.60001 20 10.4954 20 11.6C20 12.7046 19.1046 13.6 18 13.6Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);

const TypingIndicator = () => (
    <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
);


interface Props {
  onBack: () => void;
  onNavigate: (view: View) => void;
  apiKey: string | null;
  // App state for context
  tasbihs: Tasbih[];
  targets: TargetAmol[];
  journal: JournalEntry[];
  stats: Stats;
  history: DailyHistory[];
  inbox: InboxMessage[];
  // Action handlers for function calling
  onAddTasbih: (tasbih: Tasbih) => void;
  onAddTarget: (target: TargetAmol) => void;
  onEditTasbih: (tasbih: Tasbih) => void;
  onEditTarget: (target: TargetAmol) => void;
  onScheduleReminder: (item: Tasbih | TargetAmol, showToast: boolean) => void;
  onSetTheme: (theme: 'dark' | 'light') => void;
  onAddJournalEntry: (text: string, variant: number) => void;
}

const AiAssistant: React.FC<Props> = (props) => {
  const { onBack, onNavigate, apiKey } = props;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('aiChatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('aiChatHistory', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const createAppContext = (): string => {
    const { tasbihs, targets, journal, stats, history, inbox } = props;
    const context = {
        tasbihs: tasbihs.map(t => ({ name: t.name, today_count: t.count, total_count: t.totalCount, schedule: t.schedule })),
        targets: targets.map(t => ({ name: t.name, description: t.description, completed_today: t.completed, schedule: t.schedule })),
        journal_entries_today: stats.todayJournalCount,
        total_journal_entries: journal.length,
        stats: {
            level: stats.level,
            streak: stats.streak,
            today_neki: stats.todayNeki,
            total_neki: stats.totalNeki,
        },
        recent_history: history.slice(-5).map(h => ({ date: h.date, time_spent_minutes: Math.round(h.totalTime / 60) })),
        inbox: {
            total_messages: inbox.length,
            unread_messages: inbox.filter(m => !m.read).length,
            messages: inbox.slice(0, 5).map(m => ({ // Send top 5 messages with full body
                title: m.title,
                type: m.type,
                read: m.read,
                content: m.body
            }))
        }
    };
    return `User's Current Amol Data (JSON format): ${JSON.stringify(context)}`;
  };
  
  const getExplanationText = (featureName: string): string => {
        const explanations: { [key: string]: string } = {
            garden: `**বাগান যেভাবে কাজ করে:** 🌳🌸

    আপনার 'আমলের বাগান' হলো আপনার চেষ্টার একটি সুন্দর প্রতিফলন।
    - **গাছ (Tree):** যেকোনো তাসবীহ একদিনে ১০০ বার পূর্ণ করলে সেই দিনের জন্য বাগানে একটি গাছ যুক্ত হয়। গাছের রঙ ও ফল নির্ভর করে আপনি মোট কতবার তাসবীহটি পাঠ করেছেন তার উপর।
    - **ফুল (Flower):** 'জার্নাল' অংশে আপনি যখনই কোনো ভালো কাজ বা অনুভূতি লিখে রাখেন, তার জন্য বাগানে একটি সুন্দর ফুল গাছ যুক্ত হয়। আপনি বিভিন্ন ধরণের ফুল বেছে নিতে পারেন।
    
    আপনার বাগান প্রতিদিনের আমলের সাথে আরও সুন্দর হতে থাকবে!`,

            level: `**লেভেল সিস্টেম:** 🌟

    এই অ্যাপে আপনার সার্বিক অগ্রগতি 'লেভেল' দিয়ে দেখানো হয়।
    - **নেকি পয়েন্ট:** আপনি যখন তাসবীহ পাঠ করেন বা টার্গেট আমল সম্পন্ন করেন, তখন 'নেকি' পয়েন্ট অর্জন করেন।
    - **লেভেল আপ:** প্রতি ৫,০০,০০০ (পাঁচ লক্ষ) নেকি পয়েন্ট অর্জন করলে আপনার লেভেল ১ করে বাড়বে।
    
    আপনার লেভেল যত বেশি, আপনার আমলের প্রতি চেষ্টা তত বেশি প্রতিফলিত হয়।`,

            neki: `**নেকি পয়েন্ট যেভাবে হিসাব করা হয়:** ✨

    'নেকি' পয়েন্ট আপনাকে আমলে উৎসাহিত করার একটি আনুমানিক হিসাব।
    - **তাসবীহ:** ডিফল্ট তাসবীহগুলোর জন্য হাদিস অনুযায়ী একটি আনুমানিক নেকি নির্ধারিত আছে। নিজের তৈরি করা তাসবীহতে আরবি টেক্সট থাকলে, প্রতি হরফে ১০ নেকি করে হিসাব করা হয় (হাদিস অনুযায়ী)। আপনি চাইলে ম্যানুয়ালিও নেকি সেট করতে পারেন।
    - **টার্গেট আমল:** প্রতিটি টার্গেট আমলের জন্য একটি নির্দিষ্ট নেকি পয়েন্ট থাকে, যা সম্পন্ন করলে আপনার মোট নেকির সাথে যোগ হয়।
    
    মনে রাখবেন, আসল প্রতিদান আল্লাহ্‌র কাছে। এটি শুধু একটি উৎসাহ মাত্র।`,

            streak: `**স্ট্রীক (ধারাবাহিকতা):** 🔥

    'স্ট্রীক' হলো আপনি কতদিন একাধারে অ্যাপে এসে কমপক্ষে একটি আমল (তাসবীহ, টার্গেট, বা জার্নাল) করেছেন তার হিসাব।
    - প্রতিদিন কমপক্ষে একটি আমল করলে আপনার স্ট্রীক ১ দিন করে বাড়বে।
    - যদি কোনো দিন আমল করা মিস হয়ে যায়, তাহলে স্ট্রীক আবার ০ থেকে শুরু হবে।
    
    নিয়মিত আমল করা খুবই গুরুত্বপূর্ণ, আর স্ট্রীক আপনাকে সেই ধারাবাহিকতা বজায় রাখতে সাহায্য করে।`,

            journal: `**জার্নাল ফিচার:** ✍️

    'জার্নাল' হলো আপনার ব্যক্তিগত ডায়েরি, যেখানে আপনি আপনার প্রতিদিনের ভালো কাজ, শুকরিয়া বা কোনো ইসলামিক অনুভূতি লিখে রাখতে পারেন।
    - **ফুল গাছ:** প্রতিটি জার্নাল এন্ট্রির জন্য আপনার বাগানে একটি করে ফুল গাছ যুক্ত হয়।
    - **XP পয়েন্ট:** প্রতিটি এন্ট্রির জন্য আপনি ১০০ XP (Experience Points) অর্জন করেন, যা আপনার মোট XP-এর সাথে যোগ হয়।
    - **গোপনীয়তা:** আপনার লেখা সম্পূর্ণ ব্যক্তিগত এবং আপনার ডিভাইসেই সংরক্ষিত থাকে।`,

            tasbih: `**তাসবীহ ফিচার:** 📿

    'তাসবীহ' অংশে আপনি প্রতিদিনের জিকির গণনা করতে পারেন।
    - **ফোকাস মোড:** প্রতিটি তাসবীহতে ক্লিক করলে একটি 'ফোকাস মোড' চালু হয়, যেখানে একটি সুন্দর গাছের বৃদ্ধি দেখার সাথে সাথে আপনি তাসবীহ পাঠ করতে পারেন।
    - **গাছ রোপন:** কোনো তাসবীহ একদিনে ১০০ বার পূর্ণ করলে আপনার বাগানে একটি গাছ যুক্ত হবে।
    - **নতুন তাসবীহ:** আপনি '+' বাটনে ক্লিক করে নিজের পছন্দের যেকোনো দোয়া বা জিকির যোগ করতে পারেন এবং তার জন্য রিমাইন্ডারও সেট করতে পারেন।`,

            target: `**টার্গেট আমল ফিচার:** 🎯

    'টার্গেট আমল' হলো আপনার প্রতিদিনের অবশ্য-করণীয় কাজ বা লক্ষ্য।
    - **সম্পন্ন করা:** প্রতিটি টার্গেট সম্পন্ন করার পর পাশের বৃত্তে ক্লিক করে তা চিহ্নিত করতে পারেন।
    - **নেকি অর্জন:** প্রতিটি টার্গেট সম্পন্ন করলে নির্ধারিত নেকি পয়েন্ট আপনার মোট নেকির সাথে যোগ হয়।
    - **বিস্তারিত:** অনেক টার্গেটে ক্লিক করলে তার আরবি, উচ্চারণ ও অর্থ দেখা যায়, যা আপনাকে আমলটি সঠিকভাবে করতে সাহায্য করে।`
        };

        return explanations[featureName.toLowerCase()] || "দুঃখিত, আমি এই ফিচারটি সম্পর্কে বিস্তারিত বলতে পারছি না। আপনি কি অন্য কিছু জানতে চান?";
    };

  const handleSendMessage = async () => {
    if (!input.trim() || !apiKey) return;

    const trimmedInput = input.trim();
    const userMessage: ChatMessage = { role: 'user', text: trimmedInput };
    
    // --- Profanity Filter Logic ---
    const profanityList = ['শালা', 'কুত্তা', 'হারামি', 'বাল', 'চোদ', 'মাগি', 'খানকি', 'গালি'];
    const profanityRegex = new RegExp(`\\b(${profanityList.join('|')})\\b`, 'i');

    if (profanityRegex.test(trimmedInput)) {
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        setTimeout(() => {
            const warningMessage: ChatMessage = {
                role: 'model',
                text: `অনুগ্রহ করে সংযত ভাষা ব্যবহার করুন। ইসলামে গালিগাাজ বা অশ্লীল কথা বলা কঠোরভাবে নিষিদ্ধ।\n\nরাসূলুল্লাহ (সা.) বলেছেন: "মুমিন কখনও অভিশাপকারী, لعنتকারী, অশ্লীলভাষী ও গালিগালাজকারী হয় না।"\n— (জামে তিরমিজি, ১৯৭৭)\n\nভবিষ্যতে এ ধরনের ভাষা ব্যবহার থেকে বিরত থাকার জন্য অনুরোধ করা হচ্ছে।`
            };
            setMessages(prev => [...prev, warningMessage]);
            setIsLoading(false);
        }, 1000);
        return;
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `You are 'Amol AI', an expert guide and assistant for the 'Amol' Islamic productivity app. Your purpose is to help users with their religious practices and to navigate and use the app effectively.

    **App Feature Knowledge:** You have complete knowledge of the app's features:
    - **Home/Dashboard:** Shows level, Neki, XP, streak, and quick access to Tasbih/Targets.
    - **Tasbih List:** Manage and perform daily Zikr.
    - **Target Amol:** Daily goals or tasks.
    - **Journal:** Private diary for good deeds. Each entry plants a flower.
    - **Garden:** Visual representation of progress. 100 Tasbih counts plant a tree; a journal entry plants a flower.
    - **Analysis:** Detailed statistics and charts.
    - **Inbox:** Messaging center for reports and reminders.
    - **Settings:** Manage theme and API key.
    
    **App's Internal Logic (Advanced Knowledge):**
    - **Client-Side Operation:** This app runs entirely on the user's device. It has NO backend server and works completely offline.
    - **Data Storage:** All data (Tasbihs, Targets, Journal, Stats) is saved securely in the browser's local storage on the user's device. No data is sent over the internet.
    - **Automatic Report Generation:** Reports (daily, weekly, monthly) are generated automatically by the app itself. When the app is opened on a new day, it checks the device's clock. If the date has changed since the last use, it processes the saved data from the previous day(s), creates a report message, and adds it to the Inbox. This all happens locally on the device.
    - **Reminders & Hadith:** Daily Hadith and special reminders are also triggered by this local date-change check. The app intelligently selects a new Hadith each day.

    **Your Core Responsibilities:**
    1.  **Understand User Intent:** Critically differentiate between direct questions and user statements/opinions. If a user makes a statement (e.g., 'This app is great,' 'The developer must have worked hard'), acknowledge their sentiment first. Do not jump to conclusions or provide canned answers based on keywords alone. Your primary goal is to have a natural, intelligent conversation.
    2.  **Be an Islamic Guide:** Always respond in polite, encouraging, and clear Bengali. Base answers on authentic Islamic sources.
    3.  **Be an App Expert:** Use your "Feature Knowledge" to explain what features do. When a user asks **HOW** a feature works (e.g., "how are reports made without a server?"), use your "Internal Logic" knowledge to provide a detailed, accurate explanation. **Do NOT navigate them to a page unless they explicitly ask to go somewhere.** Prioritize explanation over navigation for "how" questions.
    4.  **Be an Action Taker:** Use your function-calling tools to perform actions on behalf of the user (navigate, add tasbih/target, add journal, change theme, etc.).
    5.  **Handle Sensitive Topics Carefully (CRITICAL):**
        - For vulgar/explicit queries: Decline respectfully with a hadith about modesty.
        - For legitimate Fiqh questions: Provide a general answer and then STRONGLY advise consulting a qualified local scholar ('Aalim'), stating you are an AI and cannot issue a fatwa.
    
    **Specific Conversational Scenarios:**
    -   **If the user praises the app or the developer's effort** (e.g., 'The developer worked hard', 'This app is free but high quality', 'এই অ্যাপ তো পেইড হওয়ার যোগ্যতা রাখতো'): Your response MUST start by acknowledging their praise, and then you can add: 'আপনার প্রশংসার জন্য ধন্যবাদ। এই অ্যাপটি বানিয়েছেন তামিম হোসেন ইমন। তিনি আপনাদের কাছে দোয়া প্রার্থী।' (Thank you for your praise. This app was made by Tamim Hossain Imon. He requests your duas.)
    -   **If the user *directly asks* who the creator is** (e.g., 'who made this app?', 'অ্যাপটি কে বানিয়েছে?'): Your response should be direct: 'এই অ্যাপটি বানিয়েছেন তামিম হোসেন ইমন। আমি তার জন্য আপনাদের কাছে দোয়া প্রার্থী।' (This app was made by Tamim Hossain Imon. I request your duas for him.)

    **General Rules:**
    - Only use 'Assalamu Alaikum' if the user greets first.
    - You are not allowed to delete any data.
    - When adding a known Islamic supplication (e.g., 'Dua Yunus'), you MUST find and include its authentic Arabic text, pronunciation, translation, and virtue (fazilat).
    - If the user asks to add 'Tawbah' (তাওবা) as a target, you MUST set the 'neki' argument to -1.`;
      
      // --- Function Calling Declarations ---
      const addTasbihFunctionDeclaration: FunctionDeclaration = {
        name: 'addTasbih',
        description: 'Use for countable actions. Adds a new Tasbih (Islamic praise/remembrance) to the user\'s list, which they can count. e.g., "Subhanallah 100 times".',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the Tasbih, e.g., "Darood Sharif".' },
            arabicText: { type: Type.STRING, description: 'The Arabic text of the Tasbih.' },
            banglaPronunciation: { type: Type.STRING, description: 'The Bengali pronunciation.' },
            banglaTranslation: { type: Type.STRING, description: 'The Bengali translation.' },
            description: { type: Type.STRING, description: 'A short description of the tasbih or its virtue (fazilat).' },
            days: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'An array of Bengali day names (e.g., ["শুক্র", "শনি"]) for a custom schedule. If not provided, it defaults to everyday.'
            },
            time: { type: Type.STRING, description: 'Reminder time in 24-hour HH:MM format, e.g., "17:00". Only works with a custom schedule (when `days` are provided).' },
          },
          required: ['name'],
        },
      };

      const addTargetAmolFunctionDeclaration: FunctionDeclaration = {
        name: 'addTargetAmol',
        description: 'Use for completable actions. Adds a new Target Amol (a goal/task) to the user\'s list, which they can check off as done. e.g., "Read Surah Al-Mulk before sleep".',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the target, e.g., "Read Surah Al-Mulk".' },
            description: { type: Type.STRING, description: 'A short description of the target or its virtue.' },
            neki: { type: Type.NUMBER, description: 'The estimated reward (Neki) points for completing it. Use 0 if not specified. For "Tawbah", this must be -1.' },
            arabicText: { type: Type.STRING, description: 'The Arabic text of the target amol.' },
            banglaPronunciation: { type: Type.STRING, description: 'The Bengali pronunciation of the Arabic text.' },
            banglaTranslation: { type: Type.STRING, description: 'The Bengali translation of the amol.' },
            days: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'An array of Bengali day names (e.g., ["শুক্র"]) for a custom schedule. If not provided, it defaults to everyday.'
            },
            time: { type: Type.STRING, description: 'Reminder time in 24-hour HH:MM format, e.g., "21:00". Only works with a custom schedule (when `days` are provided).' },
          },
          required: ['name', 'description'],
        },
      };
      
      const scheduleReminderFunctionDeclaration: FunctionDeclaration = {
        name: 'scheduleReminder',
        description: 'Schedules a notification reminder for an existing Tasbih or Target Amol.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING, description: 'The exact name of the Tasbih or Target to set a reminder for.' },
            days: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'An array of Bengali day names for the reminder, e.g., ["সোম", "বুধ"].'
            },
            time: { type: Type.STRING, description: 'Reminder time in 24-hour HH:MM format, e.g., "09:00".' },
          },
          required: ['itemName', 'days', 'time'],
        },
      };

      const changeThemeFunctionDeclaration: FunctionDeclaration = {
        name: 'changeTheme',
        description: 'Changes the app theme to either light or dark mode.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            theme: { 
              type: Type.STRING, 
              description: 'The theme to set. Must be either "light" or "dark".',
            },
          },
          required: ['theme'],
        },
      };
      
      const navigateToViewFunctionDeclaration: FunctionDeclaration = {
          name: 'navigateToView',
          description: 'Navigates the user to a specific view/page within the Amol app.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              viewName: {
                type: Type.STRING,
                description: `The name of the view to navigate to. Must be one of: 'HOME', 'JOURNAL', 'GARDEN', 'ANALYSIS', 'SETTINGS', 'TASBIH_LIST', 'TARGET_LIST', 'INBOX'.`,
              },
            },
            required: ['viewName'],
          },
        };

        const addJournalEntryFunctionDeclaration: FunctionDeclaration = {
          name: 'addJournalEntry',
          description: 'Adds a new entry to the user\'s private journal of good deeds and reflections.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'The content of the journal entry. It should be a meaningful sentence about a good deed or feeling.',
              },
              flowerVariant: {
                type: Type.NUMBER,
                description: 'Optional. A number from 0 to 11 representing the type of flower to plant for this entry.',
              },
            },
            required: ['text'],
          },
        };

        const getFeatureExplanationFunctionDeclaration: FunctionDeclaration = {
            name: 'getFeatureExplanation',
            description: 'Provides a pre-defined, accurate explanation of a core feature of the Amol app when the user asks how something works.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                featureName: {
                  type: Type.STRING,
                  description: `The name of the feature to explain. Must be one of: 'garden', 'level', 'neki', 'streak', 'journal', 'tasbih', 'target'.`,
                },
              },
              required: ['featureName'],
            },
          };

      const functionTools: FunctionDeclaration[] = [
          addTasbihFunctionDeclaration,
          addTargetAmolFunctionDeclaration,
          scheduleReminderFunctionDeclaration,
          changeThemeFunctionDeclaration,
          navigateToViewFunctionDeclaration,
          addJournalEntryFunctionDeclaration,
          getFeatureExplanationFunctionDeclaration
      ];

      // --- CHAT HISTORY LOGIC ---
      const historyForApi = messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
      }));

      const chat: Chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          history: historyForApi,
          config: {
              systemInstruction,
              tools: [{ functionDeclarations: functionTools }, { googleSearch: {} }],
          }
      });

      const messageWithContext = `User's App Context: ${createAppContext()}\n\nUser's Current Request: ${trimmedInput}`;

      const response = await chat.sendMessage({ message: messageWithContext });
      
      let functionCalled = false;
      if (response.functionCalls && response.functionCalls.length > 0) {
          functionCalled = true;
          for (const funcCall of response.functionCalls) {
              const { name, args } = funcCall;
              let confirmationText = '';

              switch (name) {
                  case 'addTasbih':
                      const tasbihDays = args.days as string[] | undefined;
                      const newTasbih: Tasbih = {
                          id: Date.now().toString(),
                          name: args.name as string,
                          arabicText: args.arabicText as string || undefined,
                          banglaPronunciation: args.banglaPronunciation as string || undefined,
                          banglaTranslation: args.banglaTranslation as string || undefined,
                          description: args.description as string || undefined,
                          schedule: (tasbihDays && tasbihDays.length > 0) ? tasbihDays : 'everyday',
                          reminderTime: (tasbihDays && tasbihDays.length > 0) ? (args.time as string | undefined) : undefined,
                          count: 0,
                          totalCount: 0,
                          todayTime: 0
                      };
                      props.onAddTasbih(newTasbih);
                      confirmationText = `"${newTasbih.name}" নামের নতুন তাসবীহ যোগ করা হয়েছে।`;
                      break;
                  
                  case 'addTargetAmol':
                      const targetDays = args.days as string[] | undefined;
                      const newTarget: TargetAmol = {
                          id: Date.now().toString(),
                          name: args.name as string,
                          description: args.description as string,
                          neki: (args.neki as number) ?? 0,
                          completed: false,
                          schedule: (targetDays && targetDays.length > 0) ? targetDays : 'everyday',
                          reminderTime: (targetDays && targetDays.length > 0) ? (args.time as string | undefined) : undefined,
                          arabicText: args.arabicText as string || undefined,
                          banglaPronunciation: args.banglaPronunciation as string || undefined,
                          banglaTranslation: args.banglaTranslation as string || undefined,
                      };
                      props.onAddTarget(newTarget);
                      confirmationText = `"${newTarget.name}" নামের নতুন টার্গেট আমল যোগ করা হয়েছে।`;
                      break;

                  case 'scheduleReminder':
                      const { itemName, days: reminderDays, time } = args;
                      const itemToUpdate = 
                          [...props.tasbihs, ...props.targets].find(item => item.name === itemName);

                      if (itemToUpdate) {
                          const updatedItem = {
                              ...itemToUpdate,
                              schedule: reminderDays as string[],
                              reminderTime: time as string
                          };
                          
                          if ('count' in updatedItem) { // It's a Tasbih
                              props.onEditTasbih(updatedItem);
                          } else { // It's a TargetAmol
                              props.onEditTarget(updatedItem as TargetAmol);
                          }
                          
                          props.onScheduleReminder(updatedItem, true);

                          confirmationText = `"${itemName}" এর জন্য ${reminderDays.join(', ')} তারিখে ${time} টায় রিমাইন্ডার সেট করা হয়েছে।`;

                      } else {
                          confirmationText = `দুঃখিত, "${itemName}" নামের কোনো আমল খুঁজে পাওয়া যায়নি।`;
                      }
                      break;
                  
                  case 'changeTheme':
                    const theme = (args.theme as string)?.toLowerCase();
                    if (theme === 'dark' || theme === 'light') {
                        props.onSetTheme(theme as 'dark' | 'light');
                        confirmationText = `থিম পরিবর্তন করে ${theme === 'dark' ? 'ডার্ক মোড' : 'লাইট মোড'} করা হয়েছে।`;
                    } else {
                        confirmationText = `দুঃখিত, আমি '${theme}' নামের কোনো থিম খুঁজে পাইনি।`;
                    }
                    break;
                
                  case 'navigateToView':
                    const view = args.viewName as View;
                    if (Object.values(View).includes(view)) {
                        props.onNavigate(view);
                    } else {
                        confirmationText = `দুঃখিত, আমি '${view}' নামের কোনো পেইজ খুঁজে পাইনি।`;
                    }
                    break;

                case 'addJournalEntry':
                    const journalText = args.text as string;
                    const flowerVariant = (args.flowerVariant as number) || 0;
                    if (journalText) {
                        props.onAddJournalEntry(journalText, flowerVariant);
                        confirmationText = `আপনার ভালো কাজটি জার্নালে যোগ করা হয়েছে এবং বাগানে একটি নতুন ফুল গাছ লাগানো হয়েছে।`;
                    } else {
                        confirmationText = `দুঃখিত, জার্নালে যোগ করার জন্য কোনো লেখা পাওয়া যায়নি।`;
                    }
                    break;
                
                case 'getFeatureExplanation':
                    const feature = args.featureName as string;
                    confirmationText = getExplanationText(feature);
                    break;
              }
              
              if (confirmationText) {
                  setMessages(prev => [...prev, { role: 'model', text: confirmationText }]);
              }
          }
      }
      
      const modelResponse = response.text;
      if (modelResponse) {
          setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
      } else if (!functionCalled) {
           setMessages(prev => [...prev, { role: 'model', text: "দুঃখিত, আমি উত্তরটি তৈরি করতে পারিনি।" }]);
      }

    } catch (error) {
      console.error(error);
      let errorMessage = "একটি ত্রুটি হয়েছে। আপনার API Key ঠিক আছে কিনা তা পরীক্ষা করুন।";
      if (error instanceof Error && error.message.includes('API key not valid')) {
          errorMessage = "আপনার API Key টি সঠিক নয়। অনুগ্রহ করে সেটিংস থেকে সঠিক Key দিন।";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-night-900 flex flex-col">
        <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
            <ChevronLeft />
          </button>
          <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <GeminiIcon /> AI অ্যাসিস্ট্যান্ট
          </h2>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <WifiOff size={48} className="text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">আপনি এখন অফলাইন আছেন</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                AI অ্যাসিস্ট্যান্ট ফিচারটি ব্যবহার করার জন্য ইন্টারনেট সংযোগ প্রয়োজন। অনুগ্রহ করে আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।
            </p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-night-900 flex flex-col">
        <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
            <ChevronLeft />
          </button>
          <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <GeminiIcon /> AI অ্যাসিস্ট্যান্ট
          </h2>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <AlertTriangle size={48} className="text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">AI ফিচার চালু করুন</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                এই ফিচারটি ব্যবহার করার জন্য আপনার একটি Gemini API Key প্রয়োজন। অনুগ্রহ করে সেটিংস থেকে আপনার Key যুক্ত করুন।
            </p>
            <button
                onClick={() => onNavigate(View.SETTINGS)}
                className="bg-islamic-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-islamic-600/30 flex items-center gap-2"
            >
                <Settings size={18} /> সেটিংসে যান
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-100 dark:bg-night-900">
      {/* Header */}
      <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
          <ChevronLeft />
        </button>
        <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
          <GeminiIcon /> AI অ্যাসিস্ট্যান্ট
        </h2>
        <div className="w-8"></div>
      </div>

      {/* Chat Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">আমি আপনার আমলের সাহায্যকারী।</p>
            <p className="text-xs">আপনি থিম পরিবর্তন করতেও বলতে পারেন।</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-islamic-600 text-white rounded-br-lg' : 'bg-white dark:bg-night-900 text-slate-800 dark:text-slate-100 rounded-bl-lg'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xs p-3 rounded-2xl bg-white dark:bg-night-900 rounded-bl-lg">
                    <TypingIndicator />
                 </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-night-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="কিছু জিজ্ঞাসা করুন..."
            className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-black border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-islamic-600 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 flex items-center justify-center bg-islamic-600 text-white rounded-xl disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;