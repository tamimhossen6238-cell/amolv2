import React, { useState } from 'react';
import { ChevronLeft, KeyRound, Save, Trash2, Sun, Moon, ExternalLink, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  apiKey: string | null;
  onSaveApiKey: (key: string) => void;
  darkMode: boolean;
  onSetTheme: (theme: 'dark' | 'light') => void;
  onBack: () => void;
  onClearAiHistory: () => void;
}

const Settings: React.FC<Props> = ({ apiKey, onSaveApiKey, darkMode, onSetTheme, onBack, onClearAiHistory }) => {
  const [keyInput, setKeyInput] = useState('');

  const handleSave = () => {
    if (keyInput.trim()) {
      onSaveApiKey(keyInput.trim());
      setKeyInput('');
      toast.success('API Key সংরক্ষণ করা হয়েছে!');
    }
  };

  const handleDeleteApiKey = () => {
    toast((t) => (
      <div className="w-full">
        <p className="font-bold text-lg text-slate-800 mb-4">API Key মুছে ফেলতে চান?</p>
        <div className="flex justify-end gap-3">
            <button 
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
            >
                না
            </button>
            <button 
                onClick={() => {
                    onSaveApiKey(''); // Save an empty string to delete
                    toast.dismiss(t.id);
                    toast.success('API Key মুছে ফেলা হয়েছে।');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold"
            >
                হ্যাঁ
            </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  const handleClearHistory = () => {
    toast((t) => (
      <div className="w-full">
        <p className="font-bold text-lg text-slate-800 mb-4">AI চ্যাটের ইতিহাস মুছবেন?</p>
        <p className="text-sm text-slate-500 mb-4">এটি করলে AI সহকারীর সাথে আপনার সকল কথোপকথন স্থায়ীভাবে মুছে যাবে।</p>
        <div className="flex justify-end gap-3">
            <button 
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
            >
                না
            </button>
            <button 
                onClick={() => {
                    onClearAiHistory();
                    toast.dismiss(t.id);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold"
            >
                হ্যাঁ, মুছুন
            </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const maskApiKey = (key: string) => {
    if (key.length < 10) return '••••••••';
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
            <ChevronLeft />
          </button>
          <h2 className="font-bold text-lg dark:text-white">সেটিংস</h2>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-night-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">থিম</h3>
          <div className="flex gap-2 bg-slate-100 dark:bg-black p-1 rounded-lg">
            <button
              onClick={() => onSetTheme('light')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${!darkMode ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}
            >
              <Sun size={16} /> লাইট
            </button>
            <button
              onClick={() => onSetTheme('dark')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}
            >
              <Moon size={16} /> ডার্ক
            </button>
          </div>
        </div>

        {/* AI Feature Management */}
        <div className="bg-white dark:bg-night-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">AI ফিচার ম্যানেজমেন্ট</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            আপনার ব্যক্তিগত Gemini API Key ব্যবহার করে AI অ্যাসিস্ট্যান্ট ফিচারটি চালু করুন।
          </p>

          {apiKey ? (
            <div className="bg-slate-50 dark:bg-black p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound size={20} className="text-islamic-600" />
                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{maskApiKey(apiKey)}</span>
              </div>
              <button onClick={handleDeleteApiKey} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200">
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="আপনার Gemini API Key দিন"
                className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={!keyInput.trim()}
                className="w-full py-3 rounded-xl bg-islamic-600 text-white font-semibold shadow-lg shadow-islamic-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> সেভ করুন
              </button>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 p-3 bg-slate-50 dark:bg-black rounded-lg border border-slate-100 dark:border-slate-700">
            <p>আপনার API Key শুধুমাত্র আপনার এই ডিভাইসেই সংরক্ষিত থাকবে এবং অন্য কোথাও শেয়ার করা হবে না।</p>
            <a
              href="https://aistudio.google.com/app/apikey"
              onClick={(e) => {
                e.preventDefault();
                window.open((e.currentTarget as HTMLAnchorElement).href, '_blank', 'noopener,noreferrer');
              }}
              className="mt-2 text-islamic-600 dark:text-islamic-400 font-bold flex items-center gap-1 cursor-pointer"
            >
              এখান থেকে API Key নিন <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* AI Data Management */}
        <div className="bg-white dark:bg-night-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">AI ডেটা ম্যানেজমেন্ট</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            আপনার AI সহকারীর সাথে কথোপকথনের ইতিহাস মুছুন।
          </p>
          <button
            onClick={handleClearHistory}
            className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            <History size={18} /> চ্যাট হিস্ট্রি মুছুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;