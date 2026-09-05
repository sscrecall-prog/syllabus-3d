import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  LayoutDashboard,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { storageManager } from '../../services/storageManager';

interface ViewErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  fallbackTitle?: string;
  showHomeButton?: boolean;
  onReset?: () => void;
  onNavigateHome?: () => void;
  compact?: boolean;
}

interface ViewErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDetailsOpen: boolean;
  isCopied: boolean;
  isRepairing: boolean;
}

export class ViewErrorBoundary extends Component<ViewErrorBoundaryProps, ViewErrorBoundaryState> {
  public state: ViewErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    isDetailsOpen: false,
    isCopied: false,
    isRepairing: false
  };

  public static getDerivedStateFromError(error: Error): Partial<ViewErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[ViewErrorBoundary] Caught crash in [${this.props.sectionName || 'View'}]:`, error, errorInfo);
    this.setState({ errorInfo });

    // Automatically attempt background sanity check/healing
    try {
      storageManager.healCorruptState(this.props.sectionName);
    } catch {
      // Ignore background heal failure
    }
  }

  private handleAutoRepair = async () => {
    soundManager.playClick();
    this.setState({ isRepairing: true });

    try {
      // Clean any corrupted temporary storage or keys
      storageManager.healCorruptState(this.props.sectionName);

      // Invoke optional reset callback provided by parent
      if (this.props.onReset) {
        this.props.onReset();
      }
    } catch (e) {
      console.warn('[ViewErrorBoundary] Auto-repair warning:', e);
    }

    // Brief timeout to provide smooth UI feedback
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRepairing: false,
        isDetailsOpen: false
      });
      soundManager.playCompleteChime();
    }, 450);
  };

  private handleCopyDiagnostics = () => {
    soundManager.playClick();
    const { error, errorInfo } = this.state;
    const diagnosticText = [
      `Section: ${this.props.sectionName || 'Unnamed View'}`,
      `Time: ${new Date().toISOString()}`,
      `Error: ${error?.name || 'Error'}: ${error?.message || 'Unknown error'}`,
      `Stack:\n${error?.stack || 'No stack trace available'}`,
      `Component Stack:\n${errorInfo?.componentStack || 'No component stack'}`
    ].join('\n\n');

    navigator.clipboard.writeText(diagnosticText).then(() => {
      this.setState({ isCopied: true });
      setTimeout(() => this.setState({ isCopied: false }), 2500);
    }).catch(() => {});
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { sectionName = 'This Section', compact, showHomeButton, onNavigateHome } = this.props;
    const { error, isDetailsOpen, isCopied, isRepairing } = this.state;

    // ── Compact In-Section Mode (For Tabs, Video embeds, or Drawer cards) ──
    if (compact) {
      return (
        <div className="w-full my-3 p-4 sm:p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 text-[#0F172A] dark:text-[#E2E8F0] shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[14px] font-bold text-[#0F172A] dark:text-white">
                  {sectionName} Protected
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  Auto-Recovery Ready
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                An unexpected data or link issue occurred here. Your syllabus notes and progress are safe.
              </p>

              <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={this.handleAutoRepair}
                  disabled={isRepairing}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-[12px] shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                  <span>{isRepairing ? 'Repairing Section...' : 'Auto-Repair & Reload'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ isDetailsOpen: !prev.isDetailsOpen }))}
                  className="px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-[#E2E8F0] dark:border-[#28293D] text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Details</span>
                  {isDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {isDetailsOpen && (
                <div className="mt-3 p-3 rounded-xl bg-white/80 dark:bg-[#15161E] border border-amber-500/20 text-[11px] font-mono text-[#475569] dark:text-[#94A3B8] overflow-x-auto">
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-sans font-semibold text-rose-500">
                    <span>{error?.name || 'Error'}: {error?.message || 'Data error'}</span>
                    <button
                      type="button"
                      onClick={this.handleCopyDiagnostics}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] whitespace-pre-wrap break-all opacity-80">
                    {error?.stack || 'No additional stack details'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── Full View Mode (For Main Views: Overview, Syllabus, Planner, etc.) ──
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-white/95 dark:bg-[#1A1B26]/95 backdrop-blur-md shadow-xl text-center animate-fade-in select-none">
        {/* Shield Icon Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 mb-3">
          <Wrench className="w-3.5 h-3.5" />
          <span>Crash-Proof Shield Active</span>
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
          {sectionName} Encountered an Issue
        </h3>

        {/* Reassurance Message */}
        <p className="mt-2 text-[13px] sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
          Don&apos;t worry! Your syllabus progress, revision data, and study notes are <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">100% safe</strong>. You can auto-repair this view instantly.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.handleAutoRepair}
            disabled={isRepairing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-[13px] shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRepairing ? 'animate-spin' : ''}`} />
            <span>{isRepairing ? 'Repairing & Restoring...' : 'Auto-Repair & Reload View'}</span>
          </button>

          {(showHomeButton || onNavigateHome) && (
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                if (onNavigateHome) onNavigateHome();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#F1F5F9] dark:bg-[#28293D] hover:bg-[#E2E8F0] dark:hover:bg-[#34354D] text-[#0F172A] dark:text-white font-semibold text-[13px] border border-[#E2E8F0] dark:border-[#383A52] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          )}
        </div>

        {/* Diagnostic Accordion */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0]/70 dark:border-[#28293D]/70 text-left">
          <button
            type="button"
            onClick={() => this.setState(prev => ({ isDetailsOpen: !prev.isDetailsOpen }))}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Technical Diagnostics</span>
            </span>
            {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isDetailsOpen && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#15161E] border border-[#E2E8F0] dark:border-[#28293D] font-mono text-[11px]">
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E2E8F0] dark:border-[#28293D] font-sans">
                <span className="font-semibold text-rose-500 truncate">
                  {error?.name || 'Error'}: {error?.message || 'Unexpected exception'}
                </span>
                <button
                  type="button"
                  onClick={this.handleCopyDiagnostics}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-[#20212F] border border-[#E2E8F0] dark:border-[#28293D] text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#28293D]"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[10px] text-[#475569] dark:text-[#94A3B8] whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {error?.stack || 'No stack trace captured.'}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}
