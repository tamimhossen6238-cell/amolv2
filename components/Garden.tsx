import React, { useState, useEffect, useMemo, memo } from 'react';
import { GardenTree, Tasbih, JournalEntry } from '../types';
import { Sprout, TreeDeciduous, CalendarDays, Filter, Quote, X, Search, CalendarCheck, Palette } from 'lucide-react';

interface Props {
  trees: GardenTree[];
  tasbihs: Tasbih[]; 
  journalEntries: JournalEntry[];
  onUpdateEntry: (id: string, variant: number) => void;
}

// Bengali Month Names
const MONTH_NAMES_BN = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

// --- ISOLATED FILTER MODAL COMPONENT (Performance Fix) ---
interface FilterModalProps {
    onClose: () => void;
    onApply: (year: number, month: number, day: number | 'all') => void;
    onClear: () => void;
}

const FilterModal = memo(({ onClose, onApply, onClear }: FilterModalProps) => {
    const currentDate = new Date();
    const [tempYear, setTempYear] = useState(currentDate.getFullYear());
    const [tempMonth, setTempMonth] = useState(currentDate.getMonth());
    const [tempDay, setTempDay] = useState<number | 'all'>(currentDate.getDate());

    const availableYears = useMemo(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: current - 2023 }, (_, i) => current - i);
    }, []);

    const availableDays = useMemo(() => {
        const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }, [tempYear, tempMonth]);

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-night-800 rounded-2xl w-full max-w-xs shadow-2xl p-4 border dark:border-slate-700 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-base dark:text-white flex items-center gap-2">
                        <CalendarCheck size={18} className="text-islamic-600"/> তারিখ খুঁজুন
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><X size={18}/></button>
                </div>

                <div className="overflow-y-auto no-scrollbar space-y-4 flex-1">
                    {/* Year Selector - Row */}
                    <div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setTempYear(year)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${tempYear === year ? 'bg-islamic-600 text-white border-islamic-600' : 'bg-slate-50 dark:bg-black text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Month Selector - 3 Cols */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">মাস</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {MONTH_NAMES_BN.map((mName, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setTempMonth(idx); setTempDay('all'); }} 
                                    className={`py-1.5 rounded-md text-[11px] font-bold border transition-colors ${tempMonth === idx ? 'bg-islamic-600 text-white border-islamic-600' : 'bg-white dark:bg-black text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                                >
                                    {mName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day Selector - 7 Cols Calendar Style */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">তারিখ</label>
                        <div className="grid grid-cols-7 gap-1">
                            {availableDays.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setTempDay(day)}
                                    className={`aspect-square flex items-center justify-center rounded-md text-[10px] font-bold border transition-colors ${tempDay === day ? 'bg-islamic-600 text-white border-islamic-600' : 'bg-white dark:bg-black text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={onClear} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition-transform">সব দেখুন</button>
                    <button onClick={() => onApply(tempYear, tempMonth, tempDay)} className="flex-1 py-2 rounded-lg bg-islamic-600 text-white font-bold shadow-lg shadow-islamic-600/20 text-xs active:scale-95 transition-transform">খুঁজুন</button>
                </div>
            </div>
        </div>
    );
});

// --- MINI TREE / FLOWER COMPONENT ---
export const MiniTree = memo(({ count, darkMode, type = 'tasbih', variant = 0 }: { count: number, darkMode: boolean, type?: 'tasbih' | 'journal', variant?: number }) => {
    
    // --- SPECIAL JOURNAL FLOWERS (NOW 12 VARIANTS) ---
    if (type === 'journal') {
        const getJournalFlowerSVG = (v: number) => {
            const safeVariant = v || 0;
            const size = "100%";
            const commonProps = { viewBox: "0 0 100 100", className: "w-full h-full overflow-visible", style: { transformOrigin: 'bottom center' } };

            switch (safeVariant) {
                // 1. Daisy (Standard)
                case 0: return (
                    <svg {...commonProps}>
                        <path d="M50,100 Q50,70 50,50" stroke={darkMode ? "#059669" : "#10b981"} strokeWidth="4" fill="none" />
                        <path d="M50,80 Q35,70 30,85" stroke={darkMode ? "#059669" : "#10b981"} strokeWidth="0" fill={darkMode ? "#10b981" : "#34d399"} />
                        <path d="M50,70 Q65,60 70,75" stroke={darkMode ? "#059669" : "#10b981"} strokeWidth="0" fill={darkMode ? "#10b981" : "#34d399"} />
                        <g transform="translate(50, 40)">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(rot => (
                                <ellipse key={rot} cx="0" cy="-12" rx="5" ry="12" fill="white" transform={`rotate(${rot})`} />
                            ))}
                            <circle r="8" fill="#fbbf24" />
                        </g>
                    </svg>
                );
                // 2. Rose
                case 1: return (
                    <svg {...commonProps}>
                        <path d="M50,100 Q55,75 50,55" stroke={darkMode ? "#064e3b" : "#15803d"} strokeWidth="4" fill="none" />
                        <path d="M50,85 Q30,80 35,95" fill={darkMode ? "#166534" : "#22c55e"} />
                        <path d="M50,75 Q70,70 65,85" fill={darkMode ? "#166534" : "#22c55e"} />
                        <g transform="translate(50, 45)">
                            <circle r="18" fill={darkMode ? "#9f1239" : "#e11d48"} />
                            <circle r="12" fill={darkMode ? "#be123c" : "#f43f5e"} />
                            <path d="M-5,-5 Q5,-10 10,0 Q5,10 -5,5 Q-10,-5 -5,-5" fill="#fecdd3" opacity="0.5" />
                        </g>
                    </svg>
                );
                // 3. Sunflower
                case 2: return (
                    <svg {...commonProps}>
                         <path d="M50,100 Q45,70 50,45" stroke={darkMode ? "#3f6212" : "#4d7c0f"} strokeWidth="5" fill="none" />
                         <path d="M50,80 Q25,70 20,80" fill={darkMode ? "#4d7c0f" : "#65a30d"} />
                         <path d="M50,70 Q75,60 80,70" fill={darkMode ? "#4d7c0f" : "#65a30d"} />
                         <g transform="translate(50, 35)">
                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(rot => (
                                <path key={rot} d="M0,0 Q-4,-20 0,-25 Q4,-20 0,0" fill="#facc15" transform={`rotate(${rot})`} />
                            ))}
                            <circle r="12" fill="#78350f" />
                         </g>
                    </svg>
                );
                // 4. Tulip
                case 3: return (
                    <svg {...commonProps}>
                        <path d="M50,100 Q50,60 50,55" stroke="#15803d" strokeWidth="4" fill="none" />
                        <path d="M50,90 Q30,70 30,50 Q40,80 50,90" fill="#22c55e" />
                         <g transform="translate(50, 50)">
                            <path d="M-15,0 Q-15,-25 0,-25 Q15,-25 15,0 Q0,10 -15,0" fill="#a855f7" />
                            <path d="M-8,-5 Q0,-30 8,-5" fill="#d8b4fe" />
                         </g>
                    </svg>
                );
                // 5. Sakura (Cherry Blossom)
                case 4: return (
                     <svg {...commonProps}>
                        <path d="M50,100 Q50,70 50,60" stroke="#573824" strokeWidth="4" fill="none" />
                        <path d="M50,70 L30,50" stroke="#573824" strokeWidth="3" />
                        <path d="M50,80 L70,60" stroke="#573824" strokeWidth="3" />
                        <g transform="translate(30, 50)">
                             <circle r="6" fill="#fbcfe8" />
                             <circle r="2" fill="#f472b6" />
                        </g>
                        <g transform="translate(70, 60)">
                             <circle r="6" fill="#fbcfe8" />
                             <circle r="2" fill="#f472b6" />
                        </g>
                        <g transform="translate(50, 50)">
                             <circle r="8" fill="#fbcfe8" />
                             <circle r="3" fill="#ec4899" />
                        </g>
                    </svg>
                );
                // 6. Lavender
                case 5: return (
                     <svg {...commonProps}>
                        <path d="M50,100 Q50,60 50,40" stroke="#166534" strokeWidth="3" fill="none" />
                        <g transform="translate(50, 80)">
                            <path d="M0,0 Q-10,-10 0,-15" stroke="#166534" strokeWidth="2" fill="none"/>
                            <path d="M0,-5 Q10,-15 0,-20" stroke="#166534" strokeWidth="2" fill="none"/>
                        </g>
                        <g transform="translate(50, 40)">
                            {[0, 10, 20, 30].map(y => (
                                <g key={y} transform={`translate(0, ${y})`}>
                                    <ellipse cx="-4" cy="0" rx="3" ry="5" fill="#8b5cf6" />
                                    <ellipse cx="4" cy="0" rx="3" ry="5" fill="#8b5cf6" />
                                </g>
                            ))}
                            <ellipse cx="0" cy="-5" rx="3" ry="5" fill="#8b5cf6" />
                        </g>
                    </svg>
                );
                // 7. Cactus
                case 6: return (
                    <svg {...commonProps}>
                         <path d="M50,100 L50,90" stroke="#166534" strokeWidth="4" />
                         <rect x="40" y="55" width="20" height="40" rx="10" fill="#22c55e" />
                         <rect x="30" y="65" width="10" height="15" rx="5" fill="#22c55e" />
                         <rect x="60" y="60" width="10" height="20" rx="5" fill="#22c55e" />
                         <circle cx="50" cy="55" r="4" fill="#f43f5e" />
                         {/* Prickles */}
                         <path d="M42,65 L40,65 M58,70 L60,70 M50,80 L50,82" stroke="black" strokeWidth="1" opacity="0.3" />
                    </svg>
                );
                // 8. Lily (Water Lily Style)
                case 7: return (
                    <svg {...commonProps}>
                        <path d="M50,100 Q60,80 50,70" stroke="#065f46" strokeWidth="4" />
                        <path d="M20,95 Q50,95 80,95" stroke="#10b981" strokeWidth="2" /> {/* Water line */}
                        <path d="M30,95 Q50,105 70,95 L50,95 Z" fill="#34d399" opacity="0.5" /> {/* Pad */}
                        <g transform="translate(50, 75)">
                            <path d="M0,0 Q-10,-15 0,-25 Q10,-15 0,0" fill="#f472b6" />
                            <path d="M0,0 Q-15,-10 -5,-20" fill="#fbcfe8" />
                            <path d="M0,0 Q15,-10 5,-20" fill="#fbcfe8" />
                        </g>
                    </svg>
                );
                // 9. Marigold
                case 8: return (
                    <svg {...commonProps}>
                        <path d="M50,100 Q55,70 50,60" stroke="#15803d" strokeWidth="4" fill="none" />
                        <path d="M50,85 Q30,85 35,75" fill="#22c55e" />
                        <path d="M50,80 Q70,80 65,70" fill="#22c55e" />
                        <circle cx="50" cy="55" r="14" fill="#f97316" />
                        <circle cx="50" cy="55" r="10" fill="#fb923c" />
                        <circle cx="50" cy="55" r="6" fill="#fdba74" />
                    </svg>
                );
                // 10. Magic Tree (Golden)
                case 9: return (
                     <svg {...commonProps}>
                        <path d="M50,100 Q55,70 50,50" stroke="#78350f" strokeWidth="4" fill="none" />
                        <g transform="translate(50, 45)">
                            <circle r="15" fill="#fbbf24" opacity="0.8">
                                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle r="10" fill="#fcd34d" />
                            <circle cx="-10" cy="10" r="8" fill="#fbbf24" />
                            <circle cx="10" cy="10" r="8" fill="#fbbf24" />
                            <circle cx="0" cy="-10" r="8" fill="#fbbf24" />
                        </g>
                        <circle cx="40" cy="40" r="1" fill="white">
                             <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="60" cy="50" r="1" fill="white">
                             <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                );
                // 11. Hibiscus (Joba)
                case 10: return (
                    <svg {...commonProps}>
                        <path d="M50,100 Q50,75 50,60" stroke="#15803d" strokeWidth="4" fill="none" />
                        <g transform="translate(50, 50)">
                            {/* 5 Petals */}
                            {[0, 72, 144, 216, 288].map(rot => (
                                <path key={rot} d="M0,0 Q-15,-20 0,-30 Q15,-20 0,0" fill="#ef4444" transform={`rotate(${rot})`} />
                            ))}
                            {/* Stamen */}
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#fbbf24" strokeWidth="2" />
                            <circle cx="0" cy="-20" r="3" fill="#facc15" />
                        </g>
                        {/* Leaves */}
                        <path d="M50,80 Q35,75 30,85" fill="#16a34a" />
                        <path d="M50,70 Q65,65 70,75" fill="#16a34a" />
                    </svg>
                );
                // 12. Orchid
                case 11: return (
                    <svg {...commonProps}>
                        <path d="M50,100 Q50,70 50,55" stroke="#15803d" strokeWidth="3" fill="none" />
                        <g transform="translate(50, 55)">
                            {/* Sepals */}
                            <ellipse cx="0" cy="-15" rx="5" ry="12" fill="#e9d5ff" />
                            <ellipse cx="-12" cy="5" rx="10" ry="5" fill="#e9d5ff" transform="rotate(-30)" />
                            <ellipse cx="12" cy="5" rx="10" ry="5" fill="#e9d5ff" transform="rotate(30)" />
                            {/* Petals */}
                            <ellipse cx="-8" cy="-5" rx="8" ry="6" fill="#c084fc" />
                            <ellipse cx="8" cy="-5" rx="8" ry="6" fill="#c084fc" />
                            {/* Lip */}
                            <path d="M-5,5 Q0,15 5,5 Q0,0 -5,5" fill="#9333ea" />
                        </g>
                    </svg>
                );
                default: return null;
            }
        };

        return getJournalFlowerSVG(variant || 0);
    }

    // --- STANDARD TASBIH TREE ---
    // Fixed positions for consistent rendering
    const FRUIT_POSITIONS = [
        { cx: 150, cy: 50, r: 6 }, { cx: 120, cy: 60, r: 7 }, { cx: 180, cy: 55, r: 6 },
        { cx: 90, cy: 130, r: 5 }, { cx: 210, cy: 110, r: 6 }, { cx: 140, cy: 90, r: 7 },
        { cx: 160, cy: 110, r: 6 }, { cx: 110, cy: 80, r: 5 }, { cx: 190, cy: 75, r: 6 },
        { cx: 70, cy: 90, r: 5 }, { cx: 230, cy: 80, r: 6 }, { cx: 130, cy: 130, r: 5 },
        { cx: 170, cy: 130, r: 6 }, { cx: 100, cy: 110, r: 5 }, { cx: 200, cy: 90, r: 6 },
        { cx: 150, cy: 30, r: 5 }, { cx: 120, cy: 40, r: 5 }, { cx: 180, cy: 40, r: 5 },
        { cx: 80, cy: 110, r: 5 }, { cx: 220, cy: 95, r: 6 }, { cx: 150, cy: 150, r: 6 },
        { cx: 135, cy: 70, r: 7 }, { cx: 165, cy: 70, r: 7 }, { cx: 60, cy: 80, r: 4 },
        { cx: 240, cy: 60, r: 4 }, { cx: 100, cy: 50, r: 5 }, { cx: 200, cy: 50, r: 5 },
        { cx: 150, cy: 75, r: 8 }, { cx: 115, cy: 100, r: 6 }, { cx: 185, cy: 100, r: 6 }
    ];

    let currentScale = 0.3; 
    if (count > 0) {
        const progressTo100 = Math.min(count, 100) / 100;
        currentScale = 0.2 + (Math.pow(progressTo100, 2.5) * 0.8);
    }
    currentScale = Math.min(currentScale, 0.85);

    let densityProgress = 0;
    if (count > 100) {
        const rawDensity = Math.min((count - 100) / 400, 1);
        densityProgress = Math.pow(rawDensity, 1.5); 
    }

    // --- COLOR LOGIC (Adjusted for Dark Mode Comfort) ---
    let mainLeafColor = darkMode ? "#22c55e" : "#4ade80"; // Green-500 : Green-400
    let trunkColor = darkMode ? "#5e4b35" : "#8B4513"; // Softer brown for dark mode
    let isMixedLeaves = false;
    let mixedPalette: string[] = [];
    
    // Fruit settings
    let fruitColor = "transparent";
    let visibleFruitCount = 0;
    let isMixedFruit = false;
    
    const total = count;

    // 1. Stage 0-499: Green
    if (total < 500) {
        if (total >= 100) {
             const ratio = (total - 100) / 400;
             const lightness = darkMode ? 50 - (ratio * 20) : 60 - (ratio * 25);
             const saturation = darkMode ? 60 + (ratio * 10) : 70 + (ratio * 15);
             mainLeafColor = `hsl(142, ${saturation}%, ${lightness}%)`;
        }
    }
    // 2. Stage 500-999: Yellow (Warmer in dark mode)
    else if (total >= 500 && total < 1000) {
        mainLeafColor = darkMode ? "#fbbf24" : "#facc15"; // Amber-400 : Yellow-400
    }
    // 3. Stage 1000-1499: Pink (Deep pink in dark mode)
    else if (total >= 1000 && total < 1500) {
        mainLeafColor = darkMode ? "#ec4899" : "#f472b6"; // Pink-500 : Pink-400
    }
    // 4. Stage 1500-2999: Red (Bright Red in dark mode for contrast)
    else if (total >= 1500 && total < 3000) {
        mainLeafColor = darkMode ? "#ef4444" : "#dc2626"; // Red-500 : Red-600
        visibleFruitCount = Math.min(Math.floor((total - 1500) / 100), FRUIT_POSITIONS.length);
        fruitColor = "#fcd34d"; 
    }
    // 5. Stage 3000-4999: Mixed
    else if (total >= 3000 && total < 5000) {
        isMixedLeaves = true;
        mixedPalette = darkMode 
            ? ["#fbbf24", "#ec4899", "#22c55e"] 
            : ["#facc15", "#f472b6", "#4ade80"];
        trunkColor = darkMode ? "#4a3b2a" : "#5D4037";
        visibleFruitCount = FRUIT_POSITIONS.length;
        fruitColor = "#fff"; 
    }
    // 6. Stage 5000+: Legendary
    else if (total >= 5000) {
        isMixedLeaves = true;
        mixedPalette = darkMode 
            ? ["#0ea5e9", "#ef4444", "#fbbf24"] // Sky-500, Red-500, Amber-400
            : ["#0ea5e9", "#ef4444", "#fbbf24"]; 
        trunkColor = "#312e81"; 
        visibleFruitCount = FRUIT_POSITIONS.length;
        fruitColor = "#ffffff";
        isMixedFruit = true;
    }

    const getLeafColor = (index: number) => {
        if (!isMixedLeaves) return mainLeafColor;
        return mixedPalette[index % mixedPalette.length];
    };

    const getFruitColor = (index: number) => {
        if (isMixedFruit) {
             const colors = ["#fff", "#fef08a", "#bae6fd"];
             return colors[index % colors.length];
        }
        return fruitColor;
    };

    return (
        <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible" style={{ transform: `scale(${currentScale})`, transformOrigin: 'bottom center' }}>
            <g transform-origin="150 280">
                {/* Trunk */}
                <path d="M150,280 Q160,200 145,150 T150,50" stroke={trunkColor} strokeWidth="18" fill="none" strokeLinecap="round" />
                <path d="M150,280 Q130,290 120,300" stroke={trunkColor} strokeWidth="12" fill="none" strokeLinecap="round" />
                <path d="M150,280 Q170,290 180,300" stroke={trunkColor} strokeWidth="12" fill="none" strokeLinecap="round" />

                <g stroke={trunkColor} fill="none" strokeLinecap="round">
                    <path d="M148,180 Q110,160 90,130" strokeWidth="12" />
                    <path d="M152,160 Q190,140 210,110" strokeWidth="11" />
                </g>

                <g stroke={trunkColor} fill="none" strokeLinecap="round" opacity={densityProgress}>
                    <path d="M90,130 Q70,110 60,80" strokeWidth="8" />
                    <path d="M210,110 Q230,90 240,60" strokeWidth="8" />
                    <path d="M148,110 Q120,90 110,60" strokeWidth="8" />
                    <path d="M152,100 Q180,80 190,50" strokeWidth="8" />
                </g>
                
                {/* Leaves - Now individually colored support */}
                <g>
                    <circle cx="150" cy="50" r="45" opacity="0.95" fill={getLeafColor(0)} />
                    <circle cx="90" cy="130" r="35" opacity="0.9" fill={getLeafColor(1)} />
                    <circle cx="210" cy="110" r="38" opacity="0.9" fill={getLeafColor(2)} />
                    <circle cx="120" cy="60" r="35" opacity="0.85" fill={getLeafColor(3)} />
                    <circle cx="180" cy="55" r="38" opacity="0.85" fill={getLeafColor(4)} />

                    <g opacity={Math.min(densityProgress + 0.2, 1)}>
                        <circle cx="60" cy="80" r="32" opacity="0.95" fill={getLeafColor(5)} />
                        <circle cx="240" cy="60" r="34" opacity="0.95" fill={getLeafColor(6)} />
                        <circle cx="110" cy="60" r="30" opacity="0.9" fill={getLeafColor(7)} />
                        <circle cx="190" cy="50" r="30" opacity="0.9" fill={getLeafColor(8)} />
                    </g>
                    <g opacity={densityProgress}>
                        <circle cx="150" cy="80" r="40" opacity="0.8" fill={getLeafColor(9)} />
                        <circle cx="85" cy="100" r="28" opacity="0.85" fill={getLeafColor(10)} />
                        <circle cx="215" cy="80" r="30" opacity="0.85" fill={getLeafColor(11)} />
                        <circle cx="130" cy="30" r="25" opacity="0.9" fill={getLeafColor(12)} />
                        <circle cx="170" cy="30" r="25" opacity="0.9" fill={getLeafColor(13)} />
                    </g>
                </g>

                {visibleFruitCount > 0 && (
                    <g>
                        {FRUIT_POSITIONS.slice(0, visibleFruitCount).map((pos, index) => (
                            <circle 
                                key={index}
                                cx={pos.cx} 
                                cy={pos.cy} 
                                r={pos.r} 
                                fill={getFruitColor(index)}
                            />
                        ))}
                    </g>
                )}
            </g>
        </svg>
    );
});

interface GroupedTrees {
    date: string;
    trees: GardenTree[];
}

interface FilterCriteria {
    year: number;
    month: number; // 0-11
    day: number | 'all';
}

const Garden: React.FC<Props> = ({ trees, tasbihs, journalEntries, onUpdateEntry }) => {
  const [gridCols, setGridCols] = useState<number>(() => {
    const savedCols = localStorage.getItem('gardenGridCols');
    return savedCols ? parseInt(savedCols, 10) : 3;
  });
  
  const [selectedJournal, setSelectedJournal] = useState<{id: string, text: string, date: string, variant?: number} | null>(null);
  const [showFlowerSelector, setShowFlowerSelector] = useState(false);

  // --- SEARCH/FILTER STATE ---
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria | null>(null);

  useEffect(() => {
    localStorage.setItem('gardenGridCols', gridCols.toString());
  }, [gridCols]);

  const toggleGridLayout = () => {
    setGridCols(prev => {
      if (prev === 2) return 3;
      if (prev === 3) return 4;
      return 2; // Cycle from 4 back to 2
    });
  };

  const gridClassMap: { [key: number]: string } = {
      2: 'grid-cols-2 gap-3',
      3: 'grid-cols-3 gap-3',
      4: 'grid-cols-4 gap-2',
  };

  const liveTrees: GardenTree[] = tasbihs
      .filter(t => t.count >= 100)
      .map(t => ({
          id: `live_${t.id}`,
          tasbihName: t.name,
          date: new Date().toISOString(),
          count: t.count,
          isLive: true,
          type: 'tasbih'
      }));

  // Combine and sort
  let allTrees = [...liveTrees, ...[...trees].reverse()];

  // --- FILTER LOGIC ---
  if (filterCriteria) {
      allTrees = allTrees.filter(tree => {
          const d = new Date(tree.date);
          const matchesYear = d.getFullYear() === filterCriteria.year;
          const matchesMonth = d.getMonth() === filterCriteria.month;
          const matchesDay = filterCriteria.day === 'all' || d.getDate() === filterCriteria.day;
          return matchesYear && matchesMonth && matchesDay;
      });
  }

  const groups: GroupedTrees[] = [];
  
  allTrees.forEach(tree => {
      let dateLabel = '';
      const treeDate = new Date(tree.date);
      
      if (tree.isLive) {
          dateLabel = 'আজ';
      } else {
          dateLabel = treeDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      let group = groups.find(g => g.date === dateLabel);
      if (!group) {
          group = { date: dateLabel, trees: [] };
          groups.push(group);
      }
      group.trees.push(tree);
  });

  const handleTreeClick = (tree: GardenTree) => {
      if (tree.type === 'journal') {
          const entryId = tree.id.replace('journal_', '');
          const entry = journalEntries.find(e => e.id === entryId);
          if (entry) {
              setSelectedJournal({
                  id: entry.id,
                  text: entry.text,
                  date: entry.date,
                  variant: entry.variant
              });
              setShowFlowerSelector(false); // Reset selector on open
          }
      }
  };

  const applyFilter = (year: number, month: number, day: number | 'all') => {
      setFilterCriteria({
          year,
          month,
          day
      });
      setShowFilterModal(false);
  };

  const clearFilter = () => {
      setFilterCriteria(null);
      setShowFilterModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 pb-24">
      {/* Header with increased Z-Index to avoid scroll overlap */}
      <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <Sprout size={20} className="text-islamic-600"/> আমলের বাগান
        </h2>
        <div className="flex items-center gap-3">
             {/* Total Tree Counter - Separated */}
            <div className="bg-islamic-50 dark:bg-islamic-900/30 px-3 py-1.5 rounded-full border border-islamic-100 dark:border-islamic-800">
                <span className="text-xs font-bold text-islamic-700 dark:text-islamic-400">মোট গাছ: {allTrees.length}</span>
            </div>

             {/* Action Buttons */}
             <div className="flex gap-2">
                <button 
                    onClick={() => setShowFilterModal(true)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm active:scale-95 border ${filterCriteria ? 'bg-islamic-600 text-white border-islamic-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-100 dark:border-slate-700'}`}
                >
                    <Search size={16} />
                </button>
                <button
                    onClick={toggleGridLayout}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shadow-sm active:scale-95 transition-transform border border-slate-200 dark:border-slate-600"
                    aria-label={`Change grid layout`}
                >
                    <Filter size={16} />
                </button>
             </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {filterCriteria && allTrees.length === 0 ? (
             <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">ফলাফল পাওয়া যায়নি</h3>
                <p className="text-sm text-slate-500 mb-4">আপনার নির্বাচিত তারিখে কোনো গাছ রোপন করা হয়নি।</p>
                <button onClick={clearFilter} className="px-4 py-2 bg-islamic-600 text-white rounded-lg text-sm font-bold">সব দেখুন</button>
             </div>
        ) : allTrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 rounded-full flex items-center justify-center mb-6">
                    <TreeDeciduous size={48} className="text-emerald-500/50" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">বাগান এখনো খালি</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    যেকোনো তাসবীহ কমপক্ষে ১০০ বার পাঠ করলে অথবা একটি জার্নাল লিখলে তা এখানে গাছ হিসেবে যুক্ত হবে। আজ বেশি বেশি আমল করুন একটি সুন্দর বাগানের জন্য! 🌳
                </p>
            </div>
        ) : (
            groups.map((group) => (
                <div key={group.date}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <CalendarDays size={16} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{group.date}</h3>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                        <span className="text-xs text-slate-400 font-mono">({group.trees.length})</span>
                    </div>

                    <div className={`grid ${gridClassMap[gridCols]}`}>
                        {group.trees.map((tree) => (
                            <div 
                                key={tree.id} 
                                onClick={() => handleTreeClick(tree)}
                                className={`rounded-xl p-2 shadow-sm border flex flex-col items-center relative overflow-hidden group transition-all transform-gpu 
                                    ${tree.type === 'journal' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 ring-1 ring-emerald-200 dark:ring-emerald-700 cursor-pointer hover:scale-[1.02]' : (tree.isLive ? 'bg-islamic-50/50 dark:bg-islamic-900/10 border-islamic-100 dark:border-islamic-800 ring-1 ring-islamic-200 dark:ring-islamic-700' : 'bg-white dark:bg-night-800 border-islamic-200 dark:border-islamic-900')}
                                `}
                            >
                                {/* Background Decoration */}
                                <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t to-transparent pointer-events-none ${tree.type === 'journal' ? 'from-emerald-50 dark:from-emerald-900/10' : 'from-emerald-50 dark:from-emerald-900/10'}`}></div>
                                
                                {/* Tree Rendering */}
                                <div className="w-full h-24 flex items-end justify-center mb-1 z-10">
                                    <MiniTree count={tree.count} darkMode={document.documentElement.classList.contains('dark')} type={tree.type} variant={tree.variant} />
                                </div>

                                {/* Info */}
                                <div className="text-center z-10 w-full px-1">
                                    <h4 className={`font-bold text-xs truncate ${tree.type === 'journal' ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-100'}`}>{tree.tasbihName}</h4>
                                    <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${tree.type === 'journal' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : (tree.isLive ? 'bg-islamic-100 dark:bg-islamic-900 text-islamic-700 dark:text-islamic-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300')}`}>
                                        {tree.type === 'journal' ? 'জার্নাল' : `${tree.count}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>

      {/* RENDER ISOLATED FILTER MODAL */}
      {showFilterModal && (
        <FilterModal 
            onClose={() => setShowFilterModal(false)}
            onApply={applyFilter}
            onClear={clearFilter}
        />
      )}

      {/* Journal View Modal */}
      {selectedJournal && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSelectedJournal(null)}
        >
            <div className="bg-white dark:bg-night-800 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-100 to-transparent dark:from-emerald-900/30 dark:to-transparent pointer-events-none"></div>
                
                {/* Header */}
                <div className="flex justify-between items-start p-6 relative z-10">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                        <Quote size={24} className="transform rotate-180" />
                    </div>
                    <button 
                        onClick={() => setSelectedJournal(null)}
                        className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 overflow-y-auto relative z-10 no-scrollbar">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">{selectedJournal.date}</h3>
                    
                    {/* Flower Display with Edit Option */}
                    <div className="w-24 h-24 mx-auto mb-4 relative group">
                        <MiniTree count={1} darkMode={document.documentElement.classList.contains('dark')} type="journal" variant={selectedJournal.variant} />
                        
                        {/* Edit Button - Visible only if date matches today */}
                        {selectedJournal.date === new Date().toLocaleDateString('bn-BD') && (
                            <button 
                                onClick={() => setShowFlowerSelector(!showFlowerSelector)}
                                className="absolute -right-2 -bottom-2 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-600 text-slate-500 hover:text-islamic-600 transition-colors z-20"
                                title="ফুল পরিবর্তন করুন"
                            >
                                <Palette size={14} />
                            </button>
                        )}
                    </div>

                    {/* Flower Selector Grid - Inline */}
                    {showFlowerSelector && (
                        <div className="mb-6 p-3 bg-slate-50 dark:bg-black/40 rounded-xl border border-slate-100 dark:border-slate-700 animate-fade-in">
                            <p className="text-xs font-bold text-slate-500 mb-2 text-center">নতুন ফুল বেছে নিন</p>
                            <div className="grid grid-cols-6 gap-2">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => {
                                            onUpdateEntry(selectedJournal.id, v);
                                            setSelectedJournal(prev => prev ? {...prev, variant: v} : null);
                                            setShowFlowerSelector(false);
                                        }}
                                        className={`aspect-square rounded-lg p-1 border transition-all ${selectedJournal.variant === v ? 'bg-islamic-100 dark:bg-islamic-900/50 border-islamic-500' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        <MiniTree count={1} darkMode={document.documentElement.classList.contains('dark')} type="journal" variant={v} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed text-center font-serif italic">
                        "{selectedJournal.text}"
                    </p>
                    <div className="flex justify-center mt-6">
                        <div className="h-1 w-12 bg-emerald-200 dark:bg-emerald-800 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Garden;