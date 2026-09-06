import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check, Sigma } from 'lucide-react';
import { soundManager } from './soundEffects';

interface MathBlockProps {
  latex: string;
  className?: string;
}

interface InlineMathProps {
  latex: string;
  className?: string;
}

/**
 * Safely renders LaTeX to HTML string using KaTeX
 */
export function renderMathToHtml(latex: string, isBlock: boolean = false): string {
  if (!latex || !latex.trim()) return '';
  try {
    return katex.renderToString(latex.trim(), {
      displayMode: isBlock,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: false,
    });
  } catch (err) {
    console.warn('KaTeX rendering warning:', err);
    return `<span class="font-mono text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300">${latex}</span>`;
  }
}

/**
 * Component for display / block level mathematical equations ($$ ... $$ or \[ ... \])
 */
export const MathBlock: React.FC<MathBlockProps> = ({ latex, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const cleanLatex = latex.trim();
  const html = renderMathToHtml(cleanLatex, true);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanLatex);
    soundManager.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group relative my-4 p-4 sm:p-5 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-purple-500/5 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 shadow-sm backdrop-blur-xs transition-all hover:border-purple-500/40 [break-inside:avoid] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-purple-500/15 text-[11px] font-mono text-purple-700 dark:text-purple-300">
        <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
          <Sigma className="w-3.5 h-3.5 text-purple-500 stroke-[2.5]" />
          Formula / Equation
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-purple-500/15 border border-purple-500/25 text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 font-sans text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          title="Copy LaTeX formula"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy LaTeX'}</span>
        </button>
      </div>

      <div
        className="overflow-x-auto py-2 text-center text-slate-900 dark:text-slate-100 text-sm sm:text-base font-serif select-text scrollbar-thin"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

/**
 * Component for inline mathematical expressions ($...$ or \(...\))
 */
export const InlineMath: React.FC<InlineMathProps> = ({ latex, className = '' }) => {
  const cleanLatex = latex.trim();
  const html = renderMathToHtml(cleanLatex, false);

  return (
    <span
      className={`inline-block align-middle px-1.5 py-0.5 mx-0.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-900 dark:text-purple-200 text-[13px] sm:text-[14px] font-serif shadow-2xs hover:bg-purple-500/15 transition-colors ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      title={`LaTeX: ${cleanLatex}`}
    />
  );
};
