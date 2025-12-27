import React, { useState, useEffect } from 'react';
import { Stats, Tasbih, TargetAmol, DailyHistory } from '../types';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Calendar, History, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  stats: Stats;
  tasbihs: Tasbih[];
  targets: TargetAmol[];
  history: DailyHistory[];
}

type TimeFilter = 'today' | '7days' | '30days' | 'all';

const Analysis: React.FC<Props> = ({ stats, tasbihs, targets, history }) => {
  const [filter, setFilter] = useState<TimeFilter>('today');
  const [modalData, setModalData] = useState<{ name: string; fullDateString: string; seconds: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (modalData) {
        const timer = setTimeout(() => {
            setModalData(null);
            setActiveIndex(null);
        }, 3000); // Modal stays for 3 seconds
        return () => clearTimeout(timer);
    }
  }, [modalData]);
  
  // --- 1. Calculate Real-Time Data ---
  const liveTodayTime = tasbihs.reduce((acc, t) => acc + (t.todayTime || 0), 0);
  
  // --- 2. Calculate Historical Aggregates ---
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const getHistoryTime = (daysBack: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysBack);
      
      const filtered = history.filter(h => {
          const hDate = new Date(h.date);
          return h.date !== todayStr && hDate >= cutoff;
      });
      
      const pastTime = filtered.reduce((acc, h) => acc + h.totalTime, 0);
      return pastTime + liveTodayTime;
  };

  const timeLast7Days = getHistoryTime(6); // 6 days past + today
  const timeLast30Days = getHistoryTime(29); // 29 days past + today
  
  const allTimeTotal = history.reduce((acc, h) => acc + h.totalTime, 0) + (history.find(h=>h.date===todayStr) ? 0 : liveTodayTime);

  // --- 3. Format Time Function ---
  const formatDuration = (seconds: number) => {
      if (seconds < 60) return `${seconds} সেকেন্ড`;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) return `${h} ঘণ্টা ${m} মিনিট`;
      return `${m} মিনিট ${seconds % 60} সেকেন্ড`;
  };

  // Helper for short format in cards
  const formatDurationShort = (seconds: number) => {
      if (seconds < 60) return `${seconds} সেঃ`;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) return `${h}ঘঃ ${m}মিঃ`;
      return `${m} মিনিট`;
  };

  // --- 4. Prepare Chart Data (Last 7 Days) ---
  const chartData = [];
  
  // Loop from 6 days ago to today (0)
  for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      
      // Determine Label
      let dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });
      if (i === 0) dayName = 'আজ'; // Explicitly set 'Today' label

      // Determine Time
      let time = 0;
      if (i === 0) {
          time = liveTodayTime; // Use Live Data for Today
      } else {
          const entry = history.find(h => h.date === dStr);
          time = entry ? entry.totalTime : 0;
      }
      
      // Convert to minutes for relative comparison
      const minutes = parseFloat((time / 60).toFixed(1)); 
      
      // Full date string for toast
      const fullDateString = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

      chartData.push({
          name: dayName,
          minutes: minutes,
          seconds: time,
          fullDate: dStr,
          fullDateString: fullDateString,
          isToday: i === 0
      });
  }

  const completedTargets = targets.filter(t => t.completed).length;
  const productivity = Math.round((completedTargets / targets.length) * 100);

  // --- 5. Chart Click Handler ---
  const handleBarClick = (data: any, index: number) => {
      if (!data) return;
      setActiveIndex(index);
      setModalData({
        name: data.name,
        fullDateString: data.fullDateString,
        seconds: data.seconds,
      });
  };

  // --- 6. Dynamic Tasbih Count Calculation Logic ---
  const getFilteredTasbihCounts = () => {
    const calculated = tasbihs.map(t => {
        let count = 0;
        
        if (filter === 'today') {
            count = t.count;
        } else if (filter === 'all') {
            count = t.totalCount;
        } else {
            // Calculate 7 or 30 days
            const daysBack = filter === '7days' ? 6 : 29;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - daysBack);
            const cutoffDate = cutoff.toISOString().split('T')[0];
            
            // Add current live count (since 'last X days' usually includes today)
            count += t.count;
            
            // Add historical counts
            history.forEach(h => {
                if (h.date >= cutoffDate && h.date !== todayStr) {
                    if (h.tasbihCounts && h.tasbihCounts[t.id]) {
                        count += h.tasbihCounts[t.id];
                    }
                }
            });
        }
        
        return { ...t, filteredCount: count };
    });

    // Filter logic: Hide 'general_tasbih' if count is 0. Keep others.
    return calculated.filter(t => {
        if (t.id === 'general_tasbih' && t.filteredCount === 0) {
            return false;
        }
        return true;
    }).sort((a, b) => b.filteredCount - a.filteredCount); // Sort by highest count
  };

  const filteredTasbihs = getFilteredTasbihCounts();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 pb-24 p-4">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">বিশ্লেষণ</h2>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transform-gpu">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">প্রোডাক্টিভিটি</div>
            <div className="text-2xl font-bold text-islamic-600 mt-1">{productivity}%</div>
            <div className="text-xs text-slate-400 mt-2">টার্গেট আমল পূর্ণ</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transform-gpu">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">ধারাবাহিকতা</div>
            <div className="text-2xl font-bold text-orange-500 mt-1">{stats.streak} দিন</div>
            <div className="text-xs text-slate-400 mt-2">স্ট্রীক বজায় রাখুন</div>
        </div>
      </div>

      {/* Time Analysis Section */}
      <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-indigo-500"/> সময়ের হিসাব
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Today */}
          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm transform-gpu">
              <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-indigo-500"/>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">আজকের সময়</span>
              </div>
              <div className="text-xl font-bold text-slate-800 dark:text-white">{formatDurationShort(liveTodayTime)}</div>
          </div>

          {/* All Time */}
          <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm transform-gpu">
              <div className="flex items-center gap-2 mb-1">
                  <History size={14} className="text-emerald-500"/>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">সর্বমোট</span>
              </div>
              <div className="text-xl font-bold text-slate-800 dark:text-white">{formatDurationShort(allTimeTotal)}</div>
          </div>

          {/* 7 Days */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transform-gpu">
              <div className="flex items-center gap-2 mb-1">
                  <Calendar size={14} className="text-blue-500"/>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">গত ৭ দিন</span>
              </div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{formatDurationShort(timeLast7Days)}</div>
          </div>

          {/* 30 Days */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transform-gpu">
              <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-purple-500"/>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">গত ৩০ দিন</span>
              </div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{formatDurationShort(timeLast30Days)}</div>
          </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-night-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 transform-gpu">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">তাসবীহ পাঠের সময় (মিনিট)</h3>
        <p className="text-xs text-slate-400 mb-4">গত ৭ দিনের তুলনা (ক্লিক করে বিস্তারিত দেখুন)</p>
        
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        interval={0}
                        tick={({ x, y, payload }) => (
                            <text 
                                x={x} 
                                y={y + 12} 
                                textAnchor="middle" 
                                fill={payload.value === 'আজ' ? '#16a34a' : '#94a3b8'} 
                                fontSize={11} 
                                fontWeight={payload.value === 'আজ' ? 'bold' : 'normal'}
                            >
                                {payload.value}
                            </text>
                        )} 
                    />
                    <Bar 
                        dataKey="minutes" 
                        radius={[4, 4, 0, 0]} 
                        onClick={(data, index) => handleBarClick(data, index)} 
                        cursor="pointer"
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isToday ? '#16a34a' : '#cbd5e1'} 
                                stroke={index === activeIndex ? "#3b82f6" : "none"}
                                strokeWidth={index === activeIndex ? 1 : 0}
                                style={{ outline: 'none' }}
                                className={`transition-opacity hover:opacity-80 ${!entry.isToday ? "dark:fill-slate-600" : ""}`}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Tasbih Summary with Filters */}
      <div className="bg-white dark:bg-night-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transform-gpu">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-700 dark:text-slate-200">তাসবীহ সারাংশ</h3>
         </div>

         {/* Filter Tabs */}
         <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
             {[
                 { id: 'today', label: 'আজ' },
                 { id: '7days', label: 'গত ৭ দিন' },
                 { id: '30days', label: '৩০ দিন' },
                 { id: 'all', label: 'সর্বমোট' }
             ].map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as TimeFilter)}
                    className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                        filter === tab.id 
                        ? 'bg-white dark:bg-slate-700 text-islamic-600 dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                 >
                     {tab.label}
                 </button>
             ))}
         </div>

         {/* Tasbih List */}
         <div className="space-y-4">
            {filteredTasbihs.map(t => {
                return (
                <div key={t.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2 flex-1">{t.name}</span>
                        <div className="flex items-center">
                             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 rounded min-w-[3rem] text-center">
                                {t.filteredCount} বার
                             </span>
                        </div>
                    </div>
                    {/* Progress bar context relative to max in list or fixed threshold */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-islamic-500 transition-all duration-500" 
                            style={{ width: `${Math.min((t.filteredCount / (filteredTasbihs[0]?.filteredCount || 1)) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            )})}
            {filteredTasbihs.length === 0 && <p className="text-center text-slate-400 text-xs py-2">কোনো ডাটা নেই</p>}
         </div>
      </div>

      {/* Temporary Modal for Chart Click */}
      {modalData && (
        <div className="fixed inset-x-0 top-[25%] z-50 flex justify-center px-4 pointer-events-none">
            <div className="bg-white dark:bg-night-800 shadow-xl rounded-2xl p-6 w-full max-w-xs border border-islamic-100 dark:border-islamic-800 pointer-events-auto">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-islamic-100 dark:bg-islamic-900/30 flex items-center justify-center text-islamic-600 dark:text-islamic-400">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {modalData.name} ({modalData.fullDateString})
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            মোট সময়: <span className="text-islamic-600 dark:text-islamic-400 font-bold">{formatDuration(modalData.seconds)}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;