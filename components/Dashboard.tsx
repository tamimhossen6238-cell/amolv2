import React from 'react';
import { View, Stats } from '../types';
import { LEVEL_THRESHOLD } from '../constants';
import { Settings, Mail, Fingerprint, ClipboardCheck } from 'lucide-react';

// Simple B&W Gemini Icon SVG
const GeminiIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.99999 15.6C4.89542 15.6 3.99999 14.7046 3.99999 13.6C3.99999 12.4954 4.89542 11.6 5.99999 11.6C7.10456 11.6 8 12.4954 8 13.6C8 14.7046 7.10456 15.6 5.99999 15.6Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12.4 17.6C11.2954 17.6 10.4 16.7046 10.4 15.6C10.4 14.4954 11.2954 13.6 12.4 13.6C13.5046 13.6 14.4 14.4954 14.4 15.6C14.4 16.7046 13.5046 17.6 12.4 17.6Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11.6 3.99999C11.6 5.10456 12.4954 6 13.6 6C14.7046 6 15.6 5.10456 15.6 3.99999C15.6 2.89542 14.7046 2 13.6 2C12.4954 2 11.6 2.89542 11.6 3.99999Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11.6 3.99999C11.6 5.10456 12.4954 6 13.6 6C14.7046 6 15.6 5.10456 15.6 3.99999C15.6 2.89542 14.7046 2 13.6 2C12.4954 2 11.6 2.89542 11.6 3.99999Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M18 13.6C16.8954 13.6 16 12.7046 16 11.6C16 10.4954 16.8954 9.60001 18 9.60001C19.1046 9.60001 20 10.4954 20 11.6C20 12.7046 19.1046 13.6 18 13.6Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);


interface Props {
  stats: Stats;
  inboxCount: number;
  totalJournalCount: number;
  totalTodayTasbihCount: number;
  completedTargetsCount: number;
  totalTargetsCount: number;
  onNavigate: (view: View) => void;
  onGeneralTasbihClick: () => void;
  darkMode: boolean;
}

const Dashboard: React.FC<Props> = ({ stats, inboxCount, totalJournalCount, totalTodayTasbihCount, completedTargetsCount, totalTargetsCount, onNavigate, onGeneralTasbihClick, darkMode }) => {
  const nextLevelNeki = stats.level * LEVEL_THRESHOLD;
  const progress = ((stats.totalNeki - ((stats.level - 1) * LEVEL_THRESHOLD)) / LEVEL_THRESHOLD) * 100;
  
  // Calculate relative progress for current level (can be > 100% momentarily before level up, clipped at 100 for visual)
  const levelProgress = Math.min(Math.max((stats.totalNeki % LEVEL_THRESHOLD) / LEVEL_THRESHOLD * 100, 0), 100);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center py-2">
        <div>
            {/* Greeting removed and Title updated to Green 'Amol' */}
            <h2 className="text-4xl font-extrabold text-islamic-600 dark:text-islamic-500 tracking-wide font-serif drop-shadow-sm">আমল</h2>
        </div>
        <div className="flex gap-3">
             <button onClick={onGeneralTasbihClick} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform">
                <Fingerprint size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <button onClick={() => onNavigate(View.INBOX)} className="relative p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                {inboxCount > 0 && <span className="absolute inset-0 rounded-full animate-ping-slow bg-islamic-500 opacity-60"></span>}
                <Mail size={20} className={`relative z-10 ${inboxCount > 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`} />
            </button>
            <button onClick={() => onNavigate(View.AI_ASSISTANT)} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform" title="AI অ্যাসিস্ট্যান্ট">
                <GeminiIcon />
            </button>
            <button onClick={() => onNavigate(View.SETTINGS)} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <Settings size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between text-sm mb-2 font-semibold">
            <span className="text-islamic-600 dark:text-islamic-400">লেভেল {stats.level}</span>
            <span className="text-slate-400">{Math.floor(levelProgress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-islamic-500 to-emerald-400 transition-all duration-1000" style={{ width: `${levelProgress}%` }}></div>
        </div>
        <div className="text-xs text-slate-400 mt-1 text-right">{stats.totalNeki % LEVEL_THRESHOLD} / {LEVEL_THRESHOLD} নেকি</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Neki Card */}
        <div className="rounded-2xl p-4 text-white shadow-lg transition-all bg-gradient-to-br from-islamic-500 to-islamic-600 dark:from-islamic-900 dark:to-emerald-950 dark:border dark:border-islamic-800/50 shadow-islamic-500/20 dark:shadow-none">
            <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-medium text-islamic-100">আজকের নেকি</div>
                <div className="text-[10px] bg-white/20 dark:bg-black/20 px-1.5 rounded text-islamic-100 dark:text-islamic-300">Total</div>
            </div>
            <div className="flex items-end gap-2">
                 <div className={`relative inline-block ${stats.todayNeki === 0 ? 'px-2 py-1 rounded-full ring-2 ring-red-400' : ''}`}>
                    <span className="text-3xl font-bold">{stats.todayNeki}</span>
                 </div>
            </div>
            <div className="mt-2 pt-2 border-t border-white/20 dark:border-white/10 flex flex-col">
                 <div className="text-[10px] opacity-80 text-islamic-100">সর্বমোট নেকি</div>
                 <div className="text-xl font-bold tracking-wide">{stats.totalNeki}</div>
            </div>
        </div>

        {/* XP & Journal Card */}
        <div className="rounded-2xl p-4 text-white shadow-lg flex flex-col justify-between transition-all bg-gradient-to-br from-sky-400 to-blue-500 dark:from-sky-900 dark:to-blue-950 dark:border dark:border-sky-800/50 shadow-sky-400/20 dark:shadow-none">
             <div>
                <div className="text-xs font-medium mb-1 text-blue-50 dark:text-sky-200">মোট XP</div>
                <div className="text-2xl font-bold text-white">
                    {stats.totalXP}
                </div>
             </div>
             
             <div className="mt-2 pt-2 border-t border-white/20 dark:border-white/10">
                 <div className="flex justify-between items-end">
                     <div>
                        <div className="text-[10px] opacity-80 text-blue-50">আজকের জার্নাল</div>
                        <div className={`relative inline-block ${stats.todayJournalCount === 0 ? 'px-2 py-1 rounded-full ring-2 ring-red-400' : ''}`}>
                           <span className="text-lg font-bold">{stats.todayJournalCount} টি</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] opacity-80 text-blue-50">সর্বমোট</div>
                        <div className="text-lg font-bold">{totalJournalCount} টি</div>
                     </div>
                 </div>
             </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-300">আজকের আমল</h3>
        
        <div onClick={() => onNavigate(View.TASBIH_LIST)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform group">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:bg-blue-100">
                <Fingerprint size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">দৈনিক তাসবীহ</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">আল্লাহর জিকির দিয়ে দিন শুরু করুন</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-islamic-50 group-hover:text-islamic-600">
                <span className="text-islamic-600 dark:text-islamic-400 font-bold text-xs">GO</span>
            </div>
        </div>

        <div onClick={() => onNavigate(View.TARGET_LIST)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 dark:text-purple-400">
                <ClipboardCheck size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">টার্গেট আমল</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">প্রতিদিনের নির্ধারিত আমলসমূহ</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;