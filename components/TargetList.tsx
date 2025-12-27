import React, { useState } from 'react';
import { TargetAmol } from '../types';
import { ChevronLeft, CheckCircle2, Circle, Plus, FolderCog, Pencil, Trash2, X, BookOpen, Headphones } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DAYS_OF_WEEK } from '../constants';

interface Props {
  targets: TargetAmol[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onAdd: (target: TargetAmol) => void;
  onEdit: (target: TargetAmol) => void;
  onDelete: (id: string) => void;
}

const TargetList: React.FC<Props> = ({ targets, onToggle, onBack, onAdd, onEdit, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [viewingTarget, setViewingTarget] = useState<TargetAmol | null>(null);
  const [activeTab, setActiveTab] = useState<'arabic' | 'pronunciation' | 'translation'>('arabic');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [neki, setNeki] = useState('');
  const [arabicText, setArabicText] = useState('');
  const [banglaPronunciation, setBanglaPronunciation] = useState('');
  const [banglaTranslation, setBanglaTranslation] = useState('');
  const [scheduleType, setScheduleType] = useState<'everyday' | 'custom'>('everyday');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState('');


  // --- START: Day-based and Time-based filtering logic ---
  const dayMap = [1, 2, 3, 4, 5, 6, 0]; // Sun -> রবি (idx 1), Sat -> শনি (idx 0)
  const todayIndex = dayMap[new Date().getDay()];
  const todayDayName = DAYS_OF_WEEK[todayIndex];
  const now = new Date();

  const visibleTargets = targets.filter(t => {
      const schedule = t.schedule || 'everyday';
      if (schedule === 'everyday') {
          return true;
      }

      if (Array.isArray(schedule) && schedule.includes(todayDayName)) {
          if (t.reminderTime) {
              const [hours, minutes] = t.reminderTime.split(':').map(Number);
              const scheduledTime = new Date();
              scheduledTime.setHours(hours, minutes, 0, 0);
              return now.getTime() >= scheduledTime.getTime();
          }
          return true;
      }
      return false;
  });
  // --- END: Filtering logic ---

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
        setSelectedDays([...selectedDays, day]);
    }
  };

  const calculateTargetNeki = (t: TargetAmol): number => {
    // 0. Priority: Explicitly hidden/unspecified
    if (t.neki === -1) return 0;

    // 1. Priority: Fixed Manual Neki
    if (t.neki > 0) return t.neki;

    // 2. Priority: Custom Arabic Text Calculation
    if (t.arabicText && t.arabicText.trim().length > 0) {
        const originalText = t.arabicText.trim();
        
        const cleanText = originalText
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // Remove all diacritics
            .replace(/\u0640/g, "")                         // Remove Tatweel
            .replace(/\s+/g, "")                            // Remove spaces
            .replace(/[^\u0600-\u06FF]/g, "");              // Remove non-Arabic characters

        const letterCount = cleanText.length;
        return letterCount * 10;
    }
    return 0;
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (t: TargetAmol) => {
    setEditingId(t.id);
    setName(t.name);
    setDescription(t.description);
    setNeki(t.neki !== -1 ? t.neki.toString() : '');
    setArabicText(t.arabicText || '');
    setBanglaPronunciation(t.banglaPronunciation || '');
    setBanglaTranslation(t.banglaTranslation || '');
    setScheduleType(Array.isArray(t.schedule) ? 'custom' : 'everyday');
    setSelectedDays(Array.isArray(t.schedule) ? t.schedule : []);
    setReminderTime(t.reminderTime || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (scheduleType === 'custom' && !reminderTime) {
        toast.error('নির্দিষ্ট দিনের জন্য রিমাইন্ডার সময় আবশ্যক।');
        return;
    }

    const targetData: TargetAmol = {
        id: editingId || Date.now().toString(),
        name,
        description,
        neki: neki ? parseInt(neki) : 0,
        completed: editingId ? targets.find(t => t.id === editingId)?.completed || false : false,
        schedule: scheduleType === 'everyday' ? 'everyday' : selectedDays,
        reminderTime: scheduleType === 'custom' && reminderTime ? reminderTime : undefined,
        arabicText: arabicText.trim() || undefined,
        banglaPronunciation: banglaPronunciation.trim() || undefined,
        banglaTranslation: banglaTranslation.trim() || undefined
    };

    if (editingId) {
        onEdit(targetData);
    } else {
        onAdd(targetData);
    }
    
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setNeki('');
    setArabicText('');
    setBanglaPronunciation('');
    setBanglaTranslation('');
    setEditingId(null);
    setScheduleType('everyday');
    setSelectedDays([]);
    setReminderTime('');
  };

  const confirmDelete = (id: string) => {
    toast((t) => (
      <div className="w-full">
        <p className="font-bold text-lg text-slate-800 mb-4">আপনি কি এই আমল করা বাদ দিতে চান?</p>
        <div className="flex justify-end gap-3">
            <button 
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
                না
            </button>
            <button 
                onClick={() => {
                    onDelete(id);
                    toast.dismiss(t.id);
                    toast.success((t2) => (
                        <span onClick={() => toast.dismiss(t2.id)} className="cursor-pointer w-full h-full block">
                            মুছে ফেলা হয়েছে
                        </span>
                    ), { duration: 2000 });
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
                হ্যাঁ
            </button>
        </div>
      </div>
    ), {
        duration: 5000,
        position: 'top-center',
        style: {
            background: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            padding: '24px',
            borderRadius: '20px',
            minWidth: '340px',
            maxWidth: '90vw'
        }
    });
  };

  const confirmToggle = (id: string) => {
    toast((t) => (
      <div className="w-full">
        <p className="font-bold text-lg text-slate-800 mb-4">আপনি কি এই আমলটি সম্পন্ন করেছেন?</p>
        <div className="flex justify-end gap-3">
            <button 
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
                না
            </button>
            <button 
                onClick={() => {
                    onToggle(id);
                    toast.dismiss(t.id);
                }}
                className="px-4 py-2 bg-islamic-600 text-white rounded-xl font-bold hover:bg-islamic-700 transition-colors"
            >
                হ্যাঁ
            </button>
        </div>
      </div>
    ), {
        duration: 5000,
        position: 'top-center',
        style: {
            background: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            padding: '24px',
            borderRadius: '20px',
            minWidth: '340px',
            maxWidth: '90vw'
        }
    });
  };

  const handleTargetClick = (target: TargetAmol) => {
    if (target.completed) return;

    // Show one-time audio suggestion toast
    const hasShownToast = localStorage.getItem('hasShownAudioSuggestion');
    const isDefaultTarget = ['t1', 't2', 't3', 't4'].includes(target.id);

    if (!hasShownToast && isDefaultTarget) {
        toast.custom((t) => (
            <div
              className={`max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 animate-fade-in`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <Headphones size={24} className="text-islamic-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      আমলটি শুনেও করতে পারেন
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      পড়তে অসুবিধা হলে, ইউটিউব বা আপনার ডিভাইসে ডাউনলোড করা অডিও শুনেও এই আমলটি সম্পন্ন করতে পারেন।
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-islamic-600 hover:text-islamic-500 focus:outline-none"
                >
                  বুঝেছি
                </button>
              </div>
            </div>
          ), {
              duration: 7000,
              position: 'top-center'
          });
        localStorage.setItem('hasShownAudioSuggestion', 'true');
    }

    if (target.arabicText || target.banglaPronunciation || target.banglaTranslation) {
        // Set default tab based on availability
        if (target.arabicText) setActiveTab('arabic');
        else if (target.banglaPronunciation) setActiveTab('pronunciation');
        else if (target.banglaTranslation) setActiveTab('translation');
        
        setViewingTarget(target);
    } else {
        confirmToggle(target.id);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent, target: TargetAmol) => {
      e.stopPropagation();
      if (target.completed) return;
      confirmToggle(target.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
            <ChevronLeft />
            </button>
            <h2 className="font-bold text-lg dark:text-white">টার্গেট আমল</h2>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowManager(true)} className="p-2 text-slate-500 hover:text-islamic-600 transition-colors">
                <FolderCog size={20} />
            </button>
            <button onClick={openAddModal} className="p-2 text-islamic-600 font-medium text-sm flex items-center gap-1 bg-islamic-50 dark:bg-islamic-900/30 rounded-lg">
                <Plus size={18} /> যোগ
            </button>
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-4">
        {visibleTargets.map((target) => {
          const effectiveNeki = calculateTargetNeki(target);
          return (
          <div 
            key={target.id} 
            onClick={() => handleTargetClick(target)}
            className={`p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                target.completed 
                ? 'border border-islamic-200 dark:border-islamic-900 bg-islamic-50 dark:bg-islamic-900/10' 
                : 'bg-white dark:bg-night-800 active:scale-[0.98] border-2 border-red-400 dark:border-red-500'
            }`}
          >
            <div className="flex items-start gap-4">
                <div 
                    onClick={(e) => handleCheckboxClick(e, target)}
                    className={`mt-1 transition-colors p-1 -m-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 ${target.completed ? 'text-islamic-500' : 'text-slate-300 dark:text-slate-600'}`}
                >
                    {target.completed ? <CheckCircle2 size={24} className="fill-current" /> : <Circle size={24} />}
                </div>

                <div className="flex-1">
                    <h3 className={`font-bold text-lg ${target.completed ? 'text-islamic-700 dark:text-islamic-300 line-through decoration-2' : 'text-slate-800 dark:text-slate-100'}`}>
                        {target.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{target.description}</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             {/* Only show Neki if greater than 0, and use Green color */}
                             {effectiveNeki > 0 && (
                                <span className="text-xs font-bold text-islamic-600 dark:text-islamic-400 bg-islamic-50 dark:bg-islamic-900/20 px-2 py-1 rounded-md border border-islamic-100 dark:border-islamic-900/20">
                                    +{effectiveNeki} Neki
                                </span>
                             )}
                        </div>
                        
                        {(target.arabicText || target.banglaPronunciation || target.banglaTranslation) && !target.completed && (
                            <span className="text-xs text-islamic-600 dark:text-islamic-400 bg-islamic-50 dark:bg-islamic-900/20 px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                                <BookOpen size={12}/> পড়ুন
                            </span>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )})}

        {visibleTargets.length === 0 && (
            <div className="text-center py-10 text-slate-400">
                আজকের জন্য কোনো নির্ধারিত টার্গেট আমল নেই।
            </div>
        )}
      </div>

      {/* VIEW TARGET MODAL (With Separated Sections) */}
      {viewingTarget && (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setViewingTarget(null)}
        >
            <div className="bg-white dark:bg-night-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] border-2 border-islamic-500">
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-islamic-50 dark:bg-islamic-900/20 rounded-t-xl">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate pr-4">{viewingTarget.name}</h3>
                    <button onClick={() => setViewingTarget(null)} className="p-1 rounded-full hover:bg-black/10 text-slate-500"><X size={24}/></button>
                </div>
                
                {/* Tabs for Separation */}
                <div className="flex p-2 gap-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-night-900">
                     {viewingTarget.arabicText && (
                         <button 
                            onClick={() => setActiveTab('arabic')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'arabic' ? 'bg-white dark:bg-slate-700 shadow text-islamic-600 dark:text-white' : 'text-slate-500'}`}
                         >
                             আরবি
                         </button>
                     )}
                     {viewingTarget.banglaPronunciation && (
                         <button 
                            onClick={() => setActiveTab('pronunciation')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'pronunciation' ? 'bg-white dark:bg-slate-700 shadow text-islamic-600 dark:text-white' : 'text-slate-500'}`}
                         >
                             উচ্চারণ
                         </button>
                     )}
                     {viewingTarget.banglaTranslation && (
                         <button 
                            onClick={() => setActiveTab('translation')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'translation' ? 'bg-white dark:bg-slate-700 shadow text-islamic-600 dark:text-white' : 'text-slate-500'}`}
                         >
                             অর্থ
                         </button>
                     )}
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto p-6 flex-1">
                    {activeTab === 'arabic' && viewingTarget.arabicText && (
                        <div className="text-center animate-fade-in">
                            <p 
                                className="font-serif text-2xl md:text-3xl leading-loose text-slate-800 dark:text-slate-100" 
                                style={{ direction: /[\u0600-\u06FF]/.test(viewingTarget.arabicText) ? 'rtl' : 'ltr' }}
                            >
                                {viewingTarget.arabicText}
                            </p>
                        </div>
                    )}
                    
                    {activeTab === 'pronunciation' && viewingTarget.banglaPronunciation && (
                         <div className="animate-fade-in">
                             <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">বাংলা উচ্চারণ</h4>
                             <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-base text-center">
                                {viewingTarget.banglaPronunciation}
                             </p>
                         </div>
                    )}

                    {activeTab === 'translation' && viewingTarget.banglaTranslation && (
                         <div className="animate-fade-in">
                             <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">বাংলা অর্থ</h4>
                             <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-base text-center">
                                {viewingTarget.banglaTranslation}
                             </p>
                         </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-night-900/50 rounded-b-xl flex gap-3">
                     <button 
                        onClick={() => setViewingTarget(null)}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                        বন্ধ করুন
                     </button>
                     <button 
                        onClick={() => {
                            setViewingTarget(null);
                            confirmToggle(viewingTarget.id);
                        }}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-islamic-600 shadow-lg shadow-islamic-600/30 hover:bg-islamic-700"
                    >
                        সম্পন্ন হয়েছে
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* File Manager Modal */}
      {showManager && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowManager(false)}
        >
            <div className="bg-white dark:bg-night-800 rounded-2xl w-full max-w-sm shadow-xl flex flex-col max-h-[80vh] border dark:border-slate-700">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><FolderCog size={20}/> ফাইল ম্যানেজার</h3>
                    <button onClick={() => setShowManager(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><X size={20}/></button>
                </div>
                <div className="overflow-y-auto p-2 space-y-2">
                    {targets.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">{t.name}</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setShowManager(false); openEditModal(t); }} 
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => confirmDelete(t.id)} 
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {targets.length === 0 && <p className="text-center text-slate-400 py-4">তালিকা খালি</p>}
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Modal (Compact) */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 pb-24 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white dark:bg-night-800 rounded-2xl p-5 w-full max-w-sm shadow-xl max-h-[85vh] overflow-y-auto no-scrollbar border dark:border-slate-700">
            <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'টার্গেট এডিট করুন' : 'নতুন টার্গেট যোগ করুন'}</h3>
            
            <div className="space-y-3">
                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">টার্গেটের নাম (আবশ্যক)</label>
                    <input 
                    type="text" 
                    placeholder="যেমন: সূরা ইয়াসিন পাঠ" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    />
                </div>

                {/* Schedule */}
                <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1.5">সময়সূচি</label>
                     <div className="flex gap-2 mb-2 bg-slate-100 dark:bg-black p-1 rounded-lg">
                        <button 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${scheduleType === 'everyday' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}
                            onClick={() => setScheduleType('everyday')}
                        >প্রতিদিন</button>
                        <button 
                             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${scheduleType === 'custom' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}
                             onClick={() => setScheduleType('custom')}
                        >নির্দিষ্ট দিন</button>
                     </div>
                     
                     {scheduleType === 'custom' && (
                         <>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={`px-3 py-1 text-xs rounded-full border ${selectedDays.includes(day) ? 'bg-islamic-600 text-white border-islamic-600' : 'bg-white dark:bg-black border-slate-200 dark:border-slate-700 dark:text-slate-300'}`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3">
                                <label className="block text-xs font-bold text-slate-500 mb-1">রিমাইন্ডার টাইম (আবশ্যক)</label>
                                <input 
                                    type="time" 
                                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                                    value={reminderTime}
                                    onChange={e => setReminderTime(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">নির্দিষ্ট সময়ে নোটিফিকেশন পেতে সময় নির্ধারণ করুন।</p>
                            </div>
                         </>
                     )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বর্ণনা/ফজিলত (অপশনাল)</label>
                    <textarea 
                    placeholder="বর্ণনা দিন..." 
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white h-14 resize-none focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    />
                </div>

                {/* Arabic Text */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">আরবি টেক্সট (অপশনাল)</label>
                    <textarea 
                    placeholder="আরবি টেক্সট লিখুন..." 
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white h-16 resize-none font-serif focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                    value={arabicText}
                    onChange={e => setArabicText(e.target.value)}
                    />
                </div>

                {/* Pronunciation */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বাংলা উচ্চারণ (অপশনাল)</label>
                    <textarea 
                    placeholder="বাংলা উচ্চারণ..." 
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white h-14 resize-none focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                    value={banglaPronunciation}
                    onChange={e => setBanglaPronunciation(e.target.value)}
                    />
                </div>

                {/* Translation */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বাংলা অর্থ (অপশনাল)</label>
                    <textarea 
                    placeholder="বাংলা অর্থ..." 
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white h-14 resize-none focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                    value={banglaTranslation}
                    onChange={e => setBanglaTranslation(e.target.value)}
                    />
                </div>

                {/* Neki */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">নেকি পরিমাণ (অপশনাল)</label>
                    <input 
                    type="number" 
                    placeholder="উদাঃ 100" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-black dark:text-white focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                    value={neki}
                    onChange={e => setNeki(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-islamic-600 text-white font-semibold shadow-lg shadow-islamic-600/30">সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetList;