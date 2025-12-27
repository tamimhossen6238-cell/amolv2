import React, { useState, useRef } from 'react';
import { InboxMessage } from '../types';
import { ChevronLeft, Trash2, MailOpen, Mail, X, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  messages: InboxMessage[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onBack: () => void;
  onClaim: (id: string, amount: number) => void;
}

const Inbox: React.FC<Props> = ({ messages, onMarkRead, onDelete, onDeleteMultiple, onBack }) => {
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  
  // Selection Mode State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Handlers ---

  const handleTouchStart = (id: string) => {
    if (isSelectionMode) return; // Already selecting, regular tap logic handles toggle
    pressTimer.current = setTimeout(() => {
        setIsSelectionMode(true);
        toggleSelection(id);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
        const newSelection = selectedIds.filter(sid => sid !== id);
        setSelectedIds(newSelection);
        // If nothing left selected, exit mode
        if (newSelection.length === 0) setIsSelectionMode(false);
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  const cancelSelectionMode = () => {
      setIsSelectionMode(false);
      setSelectedIds([]);
  };

  const handleMessageClick = (msg: InboxMessage) => {
      if (isSelectionMode) {
          toggleSelection(msg.id);
      } else {
          handleOpenMessage(msg);
      }
  };

  const handleOpenMessage = (msg: InboxMessage) => {
      setSelectedMessage(msg);
      if (!msg.read) {
          onMarkRead(msg.id);
      }
  };

  const handleCloseMessage = () => {
      setSelectedMessage(null);
  };

  const confirmDelete = (id: string) => {
    toast((t) => (
      <div className="w-full">
        <p className="font-bold text-lg text-slate-800 mb-4">মেসেজটি ডিলিট করতে চান?</p>
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
                    handleCloseMessage();
                    toast.success('মেসেজ ডিলিট করা হয়েছে', { duration: 3000 });
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

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    toast((t) => (
      <div className="w-full">
        <p className="font-bold text-lg text-slate-800 mb-4">{selectedIds.length} টি মেসেজ ডিলিট করতে চান?</p>
        <div className="flex justify-end gap-3">
            <button 
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
                না
            </button>
            <button 
                onClick={() => {
                    onDeleteMultiple(selectedIds);
                    toast.dismiss(t.id);
                    cancelSelectionMode();
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

  // Detail View
  if (selectedMessage) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-night-900 pb-24 flex flex-col">
            <div className="bg-white dark:bg-night-800 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <button onClick={handleCloseMessage} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ChevronLeft />
                    </button>
                    <h2 className="font-bold text-lg dark:text-white truncate max-w-[200px]">{selectedMessage.title}</h2>
                </div>
                <button 
                    onClick={() => confirmDelete(selectedMessage.id)} 
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
                <div className="bg-white dark:bg-night-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${selectedMessage.type === 'report' ? 'bg-blue-100 text-blue-600' : 'bg-islamic-100 text-islamic-600'}`}>
                                <MailOpen size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{selectedMessage.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(selectedMessage.date).toLocaleDateString()} &bull; {new Date(selectedMessage.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.body}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // List View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 pb-24">
      {/* Dynamic Header */}
      <div className={`
          p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between border-b transition-colors
          ${isSelectionMode 
             ? 'bg-red-600 border-red-500 text-white' 
             : 'bg-white dark:bg-night-800 border-slate-100 dark:border-slate-700'
          }
      `}>
         {isSelectionMode ? (
            <>
                <div className="flex items-center gap-3">
                    <button onClick={cancelSelectionMode} className="p-1 hover:bg-red-500 rounded-full">
                        <X size={24} />
                    </button>
                    <span className="font-bold text-lg">{selectedIds.length} নির্বাচিত</span>
                </div>
                <button 
                    onClick={confirmBulkDelete}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                    <Trash2 size={20} className="text-white"/>
                </button>
            </>
         ) : (
            <>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                    <ChevronLeft />
                    </button>
                    <h2 className="font-bold text-lg dark:text-white">ইনবক্স</h2>
                </div>
            </>
         )}
      </div>

      <div className="p-4 space-y-3">
        {messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                 <MailOpen size={48} className="mb-4 opacity-50" />
                 <p>কোন নতুন বার্তা নেই</p>
             </div>
        ) : (
            messages.map((msg) => {
                const isSelected = selectedIds.includes(msg.id);
                
                return (
                <div 
                    key={msg.id} 
                    onClick={() => handleMessageClick(msg)}
                    onTouchStart={() => handleTouchStart(msg.id)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(msg.id)} // For desktop testing
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    onContextMenu={(e) => { e.preventDefault(); }} // Prevent native menu
                    className={`
                        p-4 rounded-xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all active:scale-[0.99] select-none
                        ${isSelectionMode && isSelected 
                            ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 ring-1 ring-red-300'
                            : !msg.read 
                                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' 
                                : 'bg-white dark:bg-night-800 border-slate-100 dark:border-slate-700 opacity-90'
                        }
                    `}
                >
                    {isSelectionMode ? (
                         <div className={`p-1 rounded-md transition-colors ${isSelected ? 'text-red-600' : 'text-slate-300'}`}>
                             {isSelected ? <CheckSquare size={24} fill="currentColor" className="text-white" /> : <div className="w-6 h-6 border-2 border-slate-300 rounded-md"></div>}
                         </div>
                    ) : (
                        <div className={`
                            p-3 rounded-full shrink-0 flex items-center justify-center transition-colors
                            ${!msg.read 
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' 
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            }
                        `}>
                            {msg.read ? <MailOpen size={20} /> : <Mail size={20} />}
                        </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className={`font-bold text-sm truncate ${!msg.read ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {msg.title}
                            </h3>
                            <span className={`text-[10px] whitespace-nowrap ${!msg.read ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                                {new Date(msg.date).toLocaleDateString()}
                            </span>
                        </div>
                        <p className={`text-xs truncate ${!msg.read ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                            {msg.body}
                        </p>
                    </div>
                </div>
            )})
        )}
      </div>
    </div>
  );
};

export default Inbox;