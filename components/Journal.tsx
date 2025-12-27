import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { PenLine, Calendar, FolderOpen, Save, Quote, ChevronRight, FileText, FolderCog, X, Pencil, Trash2, Clock, Flower, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MiniTree } from './Garden'; // Import MiniTree for preview

interface Props {
  entries: JournalEntry[];
  onAdd: (text: string, variant: number) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const Journal: React.FC<Props> = ({ entries, onAdd, onEdit, onDelete }) => {
  const [text, setText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showManager, setShowManager] = useState(false);
  
  // Flower Selection State
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showFlowerSelector, setShowFlowerSelector] = useState(false);

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editText, setEditText] = useState('');

  // Get current formatted date for edit restriction logic
  const todayDateStr = new Date().toLocaleDateString('bn-BD');

  const handleSave = () => {
    if (!text.trim()) return;
    onAdd(text, selectedVariant);
    setText('');
    setSelectedVariant(0); // Reset to default flower
    setShowHistory(true); // Switch to history after saving
  };

  const openEditModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditText(entry.text);
    setShowManager(false); // Close manager to open edit modal
  };

  const handleEditSave = () => {
    if (!editingEntry || !editText.trim()) return;
    onEdit(editingEntry.id, editText);
    setEditingEntry(null);
    setEditText('');
  };

  const confirmDelete = (id: string) => {
    toast((t) => (
      <div className="w-full">
        <p className="font-bold text-lg text-slate-800 mb-4">আপনি কি এই লেখাটি মুছে ফেলতে চান?</p>
        <p className="text-sm text-slate-500 mb-4">এটি মুছে ফেললে বাগান থেকে সংশ্লিষ্ট ফুল গাছটি হারিয়ে যাবে এবং ১০০ XP কেটে নেয়া হবে।</p>
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
                    toast.success('লেখাটি মুছে ফেলা হয়েছে।');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
                হ্যাঁ, মুছুন
            </button>
        </div>
      </div>
    ), {
        duration: 6000,
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <PenLine size={20} className="text-islamic-600"/> জার্নাল
        </h2>
        <div className="flex items-center gap-2">
            <button onClick={() => setShowManager(true)} className="p-2 text-slate-500 hover:text-islamic-600 transition-colors">
                <FolderCog size={20} />
            </button>
            {showHistory && (
                <button 
                    onClick={() => setShowHistory(false)}
                    className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors active:scale-95"
                >
                    <PenLine size={14}/> নতুন
                </button>
            )}
        </div>
      </div>

      <div className="p-4">
        {showHistory ? (
            <div className="max-w-lg mx-auto animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        পূর্বের ভালো কাজ সমূহ ({entries.length})
                    </span>
                </div>

                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 bg-white dark:bg-night-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 mx-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                            <FolderOpen size={32} className="opacity-40 text-slate-500"/>
                        </div>
                        <p className="font-bold text-lg text-slate-600 dark:text-slate-300">কোনো জার্নাল নেই</p>
                        <p className="text-xs mt-2 opacity-60 text-center">আপনার মনের কথাগুলো লিখে রাখতে 'নতুন লিখুন' বাটনে চাপ দিন</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-10">
                        {entries.map(entry => (
                            <div key={entry.id} className="bg-white dark:bg-night-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center justify-between mb-3 border-b border-slate-50 dark:border-slate-700/50 pb-2">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold">
                                        <div className="bg-islamic-50 dark:bg-islamic-900/30 p-1.5 rounded-md text-islamic-600">
                                            <Calendar size={14}/>
                                        </div>
                                        <span>{entry.date}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                                        {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className="flex items-start gap-3">
                                    {/* Flower Icon Preview */}
                                    <div className="w-10 h-10 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-lg p-1">
                                        <MiniTree count={1} darkMode={false} type="journal" variant={entry.variant} />
                                    </div>
                                    <div className="relative flex-1">
                                        <Quote size={12} className="absolute -top-1 -left-1 text-slate-200 dark:text-slate-700 transform -scale-x-100" />
                                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-sm font-medium pl-1">
                                            {entry.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            <div className="max-w-lg mx-auto space-y-5 animate-fade-in relative">
                {/* Input Area */}
                <div className="bg-white dark:bg-night-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-islamic-500 rounded-full"></span>
                        আজকের ভালো কাজ বা অনুভূতি লিখুন
                    </label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="আজ আমি..."
                        className="w-full h-40 p-4 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white resize-none focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors placeholder:text-slate-400 leading-relaxed"
                    ></textarea>
                    
                    <div className="flex justify-between items-center mt-4">
                         <span className="text-xs text-slate-400 font-mono">{text.length} char</span>
                         
                         <div className="flex gap-2">
                            {/* Flower Selector Trigger */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowFlowerSelector(!showFlowerSelector)}
                                    className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-600 active:scale-95 transition-transform"
                                    title="ফুল সিলেক্ট করুন"
                                >
                                    {selectedVariant !== undefined ? (
                                         <div className="w-8 h-8 pointer-events-none">
                                             <MiniTree count={1} darkMode={false} type="journal" variant={selectedVariant} />
                                         </div>
                                    ) : (
                                        <Flower size={20} />
                                    )}
                                </button>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={!text.trim()}
                                className="bg-islamic-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-islamic-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-islamic-700 active:scale-95 transition-all"
                            >
                                <Save size={18} /> সংরক্ষণ
                            </button>
                         </div>
                    </div>
                </div>

                {/* VISIBLE FILE CARD FOR HISTORY */}
                <div 
                    onClick={() => setShowHistory(true)}
                    className="bg-white dark:bg-night-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group active:scale-[0.98]"
                >
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <FileText size={24} className="drop-shadow-sm" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">পূর্বের ভালো কাজ সমূহ</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entries.length} টি এন্ট্রি জমা আছে</p>
                    </div>
                    <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </div>

                {/* Motivation Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                    <h4 className="text-blue-700 dark:text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
                        <div className="bg-white dark:bg-blue-800/50 p-1 rounded-full"><PenLine size={12}/></div>
                        কেন লিখবেন?
                    </h4>
                    <p className="text-blue-600 dark:text-blue-200 text-xs leading-relaxed opacity-90">
                        প্রতিদিন অন্তত একটি ভালো কাজ বা অনুভূতি লিখে রাখলে তা আপনাকে মানসিকভাবে প্রশান্তি দেবে এবং ভালো কাজের প্রতি আরও উৎসাহিত করবে।
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* Flower Selector Modal - Centered */}
      {showFlowerSelector && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowFlowerSelector(false)}
        >
            <div 
                className="bg-white dark:bg-night-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-full max-w-xs"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">পছন্দের ফুল বেছে নিন</span>
                    <button onClick={() => setShowFlowerSelector(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><X size={18}/></button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {/* Added variants 10 and 11 */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(variant => (
                        <button
                            key={variant}
                            onClick={() => { setSelectedVariant(variant); setShowFlowerSelector(false); }}
                            className={`aspect-square rounded-xl p-1.5 border transition-colors ${selectedVariant === variant ? 'bg-islamic-50 dark:bg-islamic-900/30 border-islamic-500 ring-1 ring-islamic-500' : 'bg-slate-50 dark:bg-black border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                            <MiniTree count={1} darkMode={false} type="journal" variant={variant} />
                        </button>
                    ))}
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
                    {entries.map(entry => {
                        // Edit logic changed: only allow if date is same as today
                        const isEditable = entry.date === todayDateStr;
                        return (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2 text-sm">{entry.text}</p>
                                <span className="text-xs text-slate-400">{entry.date}</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => isEditable && openEditModal(entry)} 
                                    disabled={!isEditable}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                                    title={!isEditable ? "তারিখ পরিবর্তনের পর এডিট করা যাবে না" : "এডিট করুন"}
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => confirmDelete(entry.id)} 
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )})}
                    {entries.length === 0 && <p className="text-center text-slate-400 py-4">তালিকা খালি</p>}
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setEditingEntry(null)}
        >
            <div className="bg-white dark:bg-night-800 rounded-2xl w-full max-w-sm shadow-xl flex flex-col border dark:border-slate-700">
                <div className="p-5">
                    <h3 className="font-bold text-lg dark:text-white mb-2">জার্নাল এডিট করুন</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                        <Clock size={12}/>
                        <span>আজকের দিন শেষ হওয়ার আগেই এডিট করুন</span>
                    </div>
                    <textarea 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white resize-none focus:border-islamic-600 focus:ring-1 focus:ring-islamic-600 outline-none transition-colors"
                    ></textarea>
                </div>
                <div className="flex gap-3 p-4 bg-slate-50 dark:bg-black/20 rounded-b-xl border-t border-slate-100 dark:border-slate-700">
                    <button onClick={() => setEditingEntry(null)} className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">বাতিল</button>
                    <button onClick={handleEditSave} className="flex-1 py-3 rounded-xl bg-islamic-600 text-white font-semibold shadow-lg shadow-islamic-600/30">সংরক্ষণ</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Journal;