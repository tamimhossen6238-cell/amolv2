import React from 'react';
import { View } from '../types';
import { Home, BookOpen, BarChart2, Sprout } from 'lucide-react';

interface Props {
  currentView: View;
  onNavigate: (view: View) => void;
}

const BottomNav: React.FC<Props> = ({ currentView, onNavigate }) => {
  const getButtonClass = (view: View) => 
    `flex flex-col items-center justify-center w-full py-3 transition-colors ${
      currentView === view 
        ? 'text-islamic-600 dark:text-islamic-400 font-bold' 
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
    }`;

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-around items-center pb-safe z-50">
      <button onClick={() => onNavigate(View.HOME)} className={getButtonClass(View.HOME)}>
        <Home size={24} strokeWidth={currentView === View.HOME ? 2.5 : 2} />
        <span className="text-[10px] mt-1">হোম</span>
      </button>
      
      <button onClick={() => onNavigate(View.JOURNAL)} className={getButtonClass(View.JOURNAL)}>
        <BookOpen size={24} strokeWidth={currentView === View.JOURNAL ? 2.5 : 2} />
        <span className="text-[10px] mt-1">জার্নাল</span>
      </button>

      <button onClick={() => onNavigate(View.GARDEN)} className={getButtonClass(View.GARDEN)}>
        <Sprout size={24} strokeWidth={currentView === View.GARDEN ? 2.5 : 2} />
        <span className="text-[10px] mt-1">বাগান</span>
      </button>
      
      <button onClick={() => onNavigate(View.ANALYSIS)} className={getButtonClass(View.ANALYSIS)}>
        <BarChart2 size={24} strokeWidth={currentView === View.ANALYSIS ? 2.5 : 2} />
        <span className="text-[10px] mt-1">বিশ্লেষণ</span>
      </button>
    </div>
  );
};

export default BottomNav;