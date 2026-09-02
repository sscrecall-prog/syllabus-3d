import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import { Search, X, ArrowRight, Sparkles, BookOpen, Check } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Topic } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: Topic, subjectName: string, chapterName: string) => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const { allTopics } = useSyllabus();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 1. Pre-compute Search Index (Lightning Fast O(1) Token Lookup)
  const indexedTopics = useMemo(() => {
    return allTopics.map(item => ({
      ...item,
      searchToken: `${item.topic.name} ${item.subjectName} ${item.chapterName} ${item.topic.subtopics.join(' ')}`.toLowerCase()
    }));
  }, [allTopics]);

  // 2. Memoized Filtered Results
  const filteredTopics = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return indexedTopics.slice(0, 10);
    }
    const words = trimmed.split(/\s+/);
    return indexedTopics.filter(item => {
      return words.every(w => item.searchToken.includes(w));
    }).slice(0, 15);
  }, [indexedTopics, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredTopics.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredTopics.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredTopics.length) % filteredTopics.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredTopics[selectedIndex];
        if (selected) {
          soundManager.playClick();
          onSelectTopic(selected.topic, selected.subjectName, selected.chapterName);
          onClose();
        }
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-[#FAF9F5] dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#28293D] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#D8D8CF] dark:border-[#28293D] bg-white dark:bg-[#161726]">
          <Search className="w-5 h-5 text-[#596B35] dark:text-[#7AA2F7] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type any topic, formula, chapter, or subject..."
            className="flex-1 bg-transparent text-sm font-semibold text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-[#85877E] hover:text-[#11120F] dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-bold bg-[#EEEEE8] dark:bg-[#232438] text-[#85877E] rounded-md border border-[#D8D8CF] dark:border-[#2E3048]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((item, index) => (
              <div
                key={item.topic.id}
                ref={el => itemRefs.current[index] = el}
                onClick={() => {
                  soundManager.playClick();
                  onSelectTopic(item.topic, item.subjectName, item.chapterName);
                  onClose();
                }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  index === selectedIndex
                    ? 'bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 border border-[#B8CE80] dark:border-[#7AA2F7]/40 shadow-xs'
                    : 'hover:bg-[#EEEEE8] dark:hover:bg-[#181926]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.subjectColor }}
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-[#11120F] dark:text-white truncate group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7]">
                      {item.topic.name}
                    </h5>
                    <p className="text-[11px] text-[#85877E] truncate">
                      <span className="font-semibold text-[#596B35] dark:text-[#7AA2F7]">{item.subjectName}</span> Â· {item.chapterName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={item.topic.status} size="sm" />
                  <ArrowRight className="w-4 h-4 text-[#85877E] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-[#85877E] space-y-1">
              <p className="font-bold text-sm text-[#11120F] dark:text-white">No topics found matching "{query}"</p>
              <p className="text-xs">Try searching for a different keyword, formula, or chapter name.</p>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#161726] border-t border-[#D8D8CF] dark:border-[#28293D] text-[11px] text-[#85877E] font-mono">
          <span>{filteredTopics.length} matches found</span>
          <span className="hidden sm:inline">â†‘â†“ Navigate â€¢ â†µ Select â€¢ ESC Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

