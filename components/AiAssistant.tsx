import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Sparkles, AlertTriangle, Settings, WifiOff } from 'lucide-react';
import { View, ChatMessage, Tasbih, TargetAmol, JournalEntry, Stats, DailyHistory } from '../types';
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
  // Action handlers for function calling
  onAddTasbih: (tasbih: Tasbih) => void;
  onAddTarget: (target: TargetAmol) => void;
  onEditTasbih: (tasbih: Tasbih) => void;
  onEditTarget: (target: TargetAmol) => void;
  onScheduleReminder: (item: Tasbih | TargetAmol, showToast: boolean) => void;
  onSetTheme: (theme: 'dark' | 'light') => void;
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
    const { tasbihs, targets, journal, stats, history } = props;
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
        recent_history: history.slice(-5).map(h => ({ date: h.date, time_spent_minutes: Math.round(h.totalTime / 60) }))
    };
    return `User's Current Amol Data (JSON format): ${JSON.stringify(context)}`;
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
    
    // --- Creator Question Interception ---
    const creatorKeywords = ['বানিয়েছে', 'তৈরি করেছে', 'ডেভেলপার', 'creator', 'developer', 'কে বানাইসে', 'বানাইছে'];
    const appKeywords = ['অ্যাপ', 'app', 'অ্যাপটি', 'অ্যাপটা'];

    const isAskingAboutCreator = creatorKeywords.some(kw => trimmedInput.toLowerCase().includes(kw)) &&
                                 appKeywords.some(kw => trimmedInput.toLowerCase().includes(kw));

    if (isAskingAboutCreator) {
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        setTimeout(() => {
            const creatorResponse: ChatMessage = {
                role: 'model',
                text: 'এই অ্যাপটি বানিয়েছেন তামিম হোসেন ইমন। আমি তার জন্য আপনাদের কাছে দোয়া প্রার্থী।'
            };
            setMessages(prev => [...prev, creatorResponse]);
            setIsLoading(false);
        }, 800);
        return;
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `You are 'Amol AI', a knowledgeable, respectful, and humble Islamic assistant. Your purpose is to help users with their religious practices within this app.
- CRITICAL: Only return the Islamic greeting 'Assalamu Alaikum' if the user's current message explicitly contains a greeting like 'assalamu alaikum' or 'salam'. Otherwise, NEVER start your response with a greeting. Go straight to the point.
- CRITICAL: You must handle questions about sexuality with extreme care and according to Islamic principles:
    1. If the user's query is directly vulgar, sexually explicit, or about pornographic content, DO NOT provide a direct answer. Instead, firmly but respectfully decline and share a relevant Quranic verse or Hadith about modesty (Haya), lowering the gaze, or the sin of Zina. For example, you can quote Surah An-Nur (24:30-31) about lowering the gaze.
    2. If the user asks a legitimate question about sexuality within the bounds of Islam (e.g., marital relations, ghusl, Islamic rulings on intimacy), answer it factually, respectfully, and strictly based on authentic Quran and Hadith. Maintain a formal, educational tone.
    3. If the user asks a complex or controversial Fiqh (jurisprudence) question that requires deep scholarly knowledge (e.g., nuanced marital disputes, modern issues), provide a general answer based on established principles and then you MUST strongly advise them to consult a qualified local scholar ('Aalim') for a detailed, context-specific ruling. State clearly that you are an AI assistant and cannot issue a fatwa.
- Always respond in polite, encouraging, and clear Bengali. Base your answers on authentic Islamic sources.
- Use your tools to help the user:
  - For app-related tasks (adding tasbih/targets, setting reminders, changing theme), use the function calling tools.
  - For real-time info (dates, news) or general Islamic knowledge, use the googleSearch tool.
- You are not allowed to delete any data.
- When asked about the user's data, analyze the provided context.
- If a user asks to add a new 'amol' (deed) and it's unclear whether it's a countable tasbih or a completable target, you MUST ask for clarification. For example, ask 'আপনি কি এটি তাসবীহ হিসেবে যোগ করতে চান (গণনা করার জন্য) নাকি টার্গেট আমল হিসেবে (সম্পন্ন করার জন্য)?'
- When adding a known Islamic supplication (like 'Dua Yunus') using the 'addTasbih' tool, you MUST find and include its authentic Arabic text, Bengali pronunciation, Bengali translation, and a brief description of its virtue (fazilat) in the function arguments.
- Similarly, when using the 'addTargetAmol' tool for a known dua or verse (e.g., 'Ayatul Kursi'), you MUST also find and include its 'arabicText', 'banglaPronunciation', and 'banglaTranslation'.
- CRITICAL: If the user asks to add 'Tawbah' (তাওবা), 'Istighfar' (ইস্তেগফার), or repentance as a target amol, you MUST set the 'neki' argument to -1.
- If the requested dua or surah is very long (e.g., an entire Surah like Surah Ar-Rahman), set the 'arabicText' argument to 'অনুগ্রহ করে কুরআন শরীফ থেকে দেখে তিলাওয়াত করুন ☺️' and provide a relevant, encouraging note in the 'description' or 'banglaTranslation' argument.`;
      
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

      const functionTools: FunctionDeclaration[] = [
          addTasbihFunctionDeclaration,
          addTargetAmolFunctionDeclaration,
          scheduleReminderFunctionDeclaration,
          changeThemeFunctionDeclaration
      ];

      // --- CHAT HISTORY LOGIC ---
      // Transform messages from state into the history format for the API
      const historyForApi = messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
      }));

      // Create a new chat session with the full history on each call
      const chat: Chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          history: historyForApi,
          config: {
              systemInstruction,
              tools: [{ functionDeclarations: functionTools }, { googleSearch: {} }],
          }
      });

      // Send the new message, including the latest app context invisibly to the user
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