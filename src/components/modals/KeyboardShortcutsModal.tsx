import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Keyboard,
  X,
  Search,
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  RotateCw,
  AlertTriangle,
  BrainCircuit,
  BarChart3,
  Globe,
  Settings,
  Plus,
  Timer,
  Moon,
  Printer,
  FileText,
  Video,
  ShieldAlert,
  ArrowLeftRight,
  Save,
  Check
} from 'lucide-react';
import { AppView } from '../layout/Sidebar';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onOpenSearch: () => void;
  onOpenAddTopic: () => void;
  onOpenFocus: () => void;
  onToggleTheme: () => void;
  onTriggerPrint: () => void;
}

interface ShortcutItem {
  key: string;
  secondaryKey?: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action?: () => void;
  category: 'navigation' | 'actions' | 'drawer';
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSearch,
  onOpenAddTopic,
  onOpenFocus,
  onToggleTheme,
  onTriggerPrint
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      soundManager.playClick();
      haptics.medium();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    // 🧭 Quick View Navigation
    {
      key: '1',
      label: 'Dashboard (Overview)',
      description: 'Jump to main study dashboard & targets',
      icon: LayoutDashboard,
      category: 'navigation',
      action: () => {
        onNavigate('overview');
        onClose();
      }
    },
    {
      key: '2',
      label: 'Syllabus Explorer',
      description: 'Browse subjects, chapters & topics hierarchy',
      icon: BookOpen,
      category: 'navigation',
      action: () => {
        onNavigate('syllabus');
        onClose();
      }
    },
    {
      key: '3',
      label: 'Study Planner',
      description: 'Access weekly schedule & daily study tasks',
      icon: CalendarCheck,
      category: 'navigation',
      action: () => {
        onNavigate('planner');
        onClose();
      }
    },
    {
      key: '4',
      label: 'Spaced Revision',
      description: 'Review topics due for active spaced recall',
      icon: RotateCw,
      category: 'navigation',
      action: () => {
        onNavigate('revision');
        onClose();
      }
    },
    {
      key: '5',
      label: 'Weak Topics & Traps',
      description: 'Diagnose high-weightage error traps & weaknesses',
      icon: AlertTriangle,
      category: 'navigation',
      action: () => {
        onNavigate('weak');
        onClose();
      }
    },
    {
      key: '6',
      label: 'Concept Mind Map',
      description: 'Interactive visual knowledge graph and node links',
      icon: BrainCircuit,
      category: 'navigation',
      action: () => {
        onNavigate('mindmap');
        onClose();
      }
    },
    {
      key: '7',
      label: 'Study Analytics & Heatmap',
      description: 'Track mastery progress, streaks & study hours',
      icon: BarChart3,
      category: 'navigation',
      action: () => {
        onNavigate('analytics');
        onClose();
      }
    },
    {
      key: '8',
      label: 'Study Station & Hub',
      description: 'External study portals, test series & YouTube hubs',
      icon: Globe,
      category: 'navigation',
      action: () => {
        onNavigate('platforms');
        onClose();
      }
    },
    {
      key: '9',
      label: 'App Settings',
      description: 'Configure notifications, target exam & audio',
      icon: Settings,
      category: 'navigation',
      action: () => {
        onNavigate('settings');
        onClose();
      }
    },

    // ⚡ Global Actions
    {
      key: 'Ctrl + K',
      secondaryKey: '/',
      label: 'Search Palette',
      description: 'Instant search topics, formulas & chapters',
      icon: Search,
      category: 'actions',
      action: () => {
        onClose();
        setTimeout(onOpenSearch, 50);
      }
    },
    {
      key: 'F',
      label: '3D Focus Chamber',
      description: 'Launch Pomodoro timer & ambient sound session',
      icon: Timer,
      category: 'actions',
      action: () => {
        onClose();
        setTimeout(onOpenFocus, 50);
      }
    },
    {
      key: 'N',
      label: 'Add Custom Topic',
      description: 'Create a new syllabus topic or subtopic',
      icon: Plus,
      category: 'actions',
      action: () => {
        onClose();
        setTimeout(onOpenAddTopic, 50);
      }
    },
    {
      key: 'D',
      label: 'Toggle Theme',
      description: 'Switch between Light, Dark, and OLED modes',
      icon: Moon,
      category: 'actions',
      action: () => {
        onToggleTheme();
      }
    },
    {
      key: 'Ctrl + P',
      secondaryKey: 'P',
      label: 'Print Desk Revision',
      description: 'Generate ink-friendly printable cheatsheet',
      icon: Printer,
      category: 'actions',
      action: () => {
        onClose();
        setTimeout(onTriggerPrint, 100);
      }
    },
    {
      key: '?',
      secondaryKey: 'Shift + /',
      label: 'Shortcuts Cheatsheet',
      description: 'Open or close this interactive cheatsheet',
      icon: Keyboard,
      category: 'actions'
    },
    {
      key: 'Esc',
      label: 'Close Active Modal',
      description: 'Dismiss drawer, modal dialog, or search bar',
      icon: X,
      category: 'actions',
      action: () => onClose()
    },

    // 📖 Topic Detail Drawer & Study Mode
    {
      key: '1',
      label: 'Drawer: Overview Tab',
      description: 'Concept checkpoints & study metrics',
      icon: LayoutDashboard,
      category: 'drawer'
    },
    {
      key: '2',
      label: 'Drawer: Lectures Tab',
      description: 'Video lectures, YouTube timestamps & player',
      icon: Video,
      category: 'drawer'
    },
    {
      key: '3',
      label: 'Drawer: Notes Tab',
      description: 'Markdown study notes, PDF highlights & formulas',
      icon: FileText,
      category: 'drawer'
    },
    {
      key: '4',
      label: 'Drawer: Mistakes Tab',
      description: 'Active traps, errors & revision logs',
      icon: ShieldAlert,
      category: 'drawer'
    },
    {
      key: '← / →',
      label: 'Switch Adjacent Tabs',
      description: 'Cycle sequentially through drawer tabs',
      icon: ArrowLeftRight,
      category: 'drawer'
    },
    {
      key: 'Ctrl + S',
      label: 'Quick Save Notes',
      description: 'Instant save markdown notes without clicking',
      icon: Save,
      category: 'drawer'
    }
  ];

  const filteredShortcuts = shortcuts.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.key.toLowerCase().includes(q) ||
      (s.secondaryKey && s.secondaryKey.toLowerCase().includes(q))
    );
  });

  const navShortcuts = filteredShortcuts.filter(s => s.category === 'navigation');
  const actionShortcuts = filteredShortcuts.filter(s => s.category === 'actions');
  const drawerShortcuts = filteredShortcuts.filter(s => s.category === 'drawer');

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={() => {
        haptics.light();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#13141F] border border-[#E2E8F0] dark:border-[#28293D] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E2E8F0] dark:border-[#242636] bg-slate-50/80 dark:bg-[#181926]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 dark:bg-[#7AA2F7]/15 text-[#2563EB] dark:text-[#7AA2F7] flex items-center justify-center border border-[#2563EB]/20 dark:border-[#7AA2F7]/30 shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="shortcuts-modal-title"
                className="text-[15px] sm:text-base font-black text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2"
              >
                Keyboard Shortcuts
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2563EB]/15 text-[#2563EB] dark:bg-[#7AA2F7]/20 dark:text-[#7AA2F7] border border-[#2563EB]/30 dark:border-[#7AA2F7]/40 font-bold uppercase">
                  Power User ♿
                </span>
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Navigate and master the app with lightning-fast keyboard controls
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              haptics.light();
              onClose();
            }}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202234] transition-colors cursor-pointer active:scale-95"
            title="Close (Esc)"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-[#E2E8F0] dark:border-[#242636] bg-white dark:bg-[#13141F]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts (e.g. syllabus, timer, save, print)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-medium bg-slate-100 dark:bg-[#1C1E2C] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#6B7280] border border-transparent focus:border-[#2563EB] dark:focus:border-[#7AA2F7] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-md text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Shortcut List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Section: Quick View Navigation */}
          {navShortcuts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#7AA2F7]">
                  🧭 Quick View Navigation (Single Keys)
                </span>
                <span className="h-px flex-1 bg-[#E2E8F0] dark:bg-[#242636]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {navShortcuts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (item.action) {
                          soundManager.playClick();
                          haptics.selection();
                          item.action();
                        }
                      }}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#181928] border border-[#E2E8F0] dark:border-[#28293D] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] hover:bg-[#EFF6FF] dark:hover:bg-[#1E2238] transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-[#24263A] border border-[#E2E8F0] dark:border-[#33354C] text-[#2563EB] dark:text-[#7AA2F7] group-hover:scale-105 transition-transform shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-[13px] font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-[#202234] border border-[#CBD5E1] dark:border-[#33354C] text-xs font-mono font-black text-[#0F172A] dark:text-[#F8FAFC] shadow-xs shrink-0 group-hover:border-[#2563EB] dark:group-hover:border-[#7AA2F7]">
                        {item.key}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Global Actions */}
          {actionShortcuts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  ⚡ Global Actions
                </span>
                <span className="h-px flex-1 bg-[#E2E8F0] dark:bg-[#242636]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actionShortcuts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (item.action) {
                          soundManager.playClick();
                          haptics.selection();
                          item.action();
                        }
                      }}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#181928] border border-[#E2E8F0] dark:border-[#28293D] hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-[#24263A] border border-[#E2E8F0] dark:border-[#33354C] text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-[13px] font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-[#202234] border border-[#CBD5E1] dark:border-[#33354C] text-xs font-mono font-black text-[#0F172A] dark:text-[#F8FAFC] shadow-xs">
                          {item.key}
                        </kbd>
                        {item.secondaryKey && (
                          <>
                            <span className="text-[10px] text-[#94A3B8]">or</span>
                            <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-[#202234] border border-[#CBD5E1] dark:border-[#33354C] text-xs font-mono font-black text-[#0F172A] dark:text-[#F8FAFC] shadow-xs">
                              {item.secondaryKey}
                            </kbd>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Drawer & Study Mode */}
          {drawerShortcuts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  📖 Topic Drawer & Study Mode (Inside Drawer)
                </span>
                <span className="h-px flex-1 bg-[#E2E8F0] dark:bg-[#242636]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {drawerShortcuts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#181928] border border-[#E2E8F0] dark:border-[#28293D] text-left select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-[#24263A] border border-[#E2E8F0] dark:border-[#33354C] text-amber-600 dark:text-amber-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-[13px] font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-[#202234] border border-[#CBD5E1] dark:border-[#33354C] text-xs font-mono font-black text-[#0F172A] dark:text-[#F8FAFC] shadow-xs shrink-0">
                        {item.key}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredShortcuts.length === 0 && (
            <div className="py-12 text-center text-[#64748B] dark:text-[#94A3B8]">
              <p className="text-sm font-semibold">No shortcuts found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-[#2563EB] dark:text-[#7AA2F7] hover:underline"
              >
                Clear search filter
              </button>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#E2E8F0] dark:border-[#242636] bg-slate-50/90 dark:bg-[#161726]/90 flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Shortcuts are automatically paused when typing in inputs or notes.</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#202234] border border-[#CBD5E1] dark:border-[#33354C] font-bold">
              Esc
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
