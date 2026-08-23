import React, { useState, useEffect, useRef } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Search, X, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Topic } from '../../types/syllabus';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: Topic) => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const { allTopics } = useSyllabus();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
      }, 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTopics = allTopics.filter(item => {
    const q = query.toLowerCase();
    return (
      item.topic.name.toLowerCase().includes(q) ||
      item.subjectName.toLowerCase().includes(q) ||
      item.chapterName.toLowerCase().includes(q) ||
      item.topic.subtopics.some(s => s.toLowerCase().includes(q))
    );
  }).slice(0, 12);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-brand-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a topic, chapter, or subject name..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredTopics.length > 0 ? (
            filteredTopics.map(item => (
              <div
                key={item.topic.id}
                onClick={() => {
                  onSelectTopic(item.topic);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.subjectColor }}
                  />
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-500">
                      {item.topic.name}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.subjectName} · {item.chapterName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <StatusBadge status={item.topic.status} size="sm" />
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No topics found matching "{query}"
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
          <span>Navigate with arrows, select with Enter</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">ESC</kbd>
        </div>
      </div>
    </div>
  );
};
