import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Sidebar, AppView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { OverviewView } from './components/views/OverviewView';
import { FloatingTimerOverlay } from './components/focus/FloatingTimerOverlay';
import { useTimer } from './context/TimerContext';
import { AnimatedLogoIntro } from './components/intro/AnimatedLogoIntro';
import { Topic } from './types/syllabus';
import { useAuth } from './context/AuthContext';
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginView } from './components/auth/LoginView';
import { SignUpView } from './components/auth/SignUpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { InitialAuthLoading } from './components/auth/InitialAuthLoading';
import { soundManager } from './utils/soundEffects';
import { haptics } from './utils/haptics';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { OfflineStatusIndicator } from './components/common/OfflineStatusIndicator';
import { ViewErrorBoundary } from './components/common/ViewErrorBoundary';
import { storageManager } from './services/storageManager';
import { useTheme } from './context/ThemeContext';

// ⚡ Lazy Loaded Secondary Views (Code Splitting for Lightning-Fast Initial Load)
const SyllabusView = lazy(() => import('./components/views/SyllabusView').then(m => ({ default: m.SyllabusView })));
const SubjectsView = lazy(() => import('./components/views/SubjectsView').then(m => ({ default: m.SubjectsView })));
const PlannerView = lazy(() => import('./components/views/PlannerView').then(m => ({ default: m.PlannerView })));
const MindMapView = lazy(() => import('./components/views/MindMapView').then(m => ({ default: m.MindMapView })));
const RevisionView = lazy(() => import('./components/views/RevisionView').then(m => ({ default: m.RevisionView })));
const WeakTopicsView = lazy(() => import('./components/views/WeakTopicsView').then(m => ({ default: m.WeakTopicsView })));
const AnalyticsView = lazy(() => import('./components/views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const HeatmapView = lazy(() => import('./components/views/HeatmapView').then(m => ({ default: m.HeatmapView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const PlatformsView = lazy(() => import('./components/views/PlatformsView').then(m => ({ default: m.PlatformsView })));
const PacingView = lazy(() => import('./components/views/PacingView').then(m => ({ default: m.PacingView })));

// ⚡ Lazy Loaded Heavy Modals & Drawers
const TopicDetailDrawer = lazy(() => import('./components/modals/TopicDetailDrawer').then(m => ({ default: m.TopicDetailDrawer })));
const RevisionSessionModal = lazy(() => import('./components/modals/RevisionSessionModal').then(m => ({ default: m.RevisionSessionModal })));
const PomodoroFocusModal = lazy(() => import('./components/focus/PomodoroFocusModal').then(m => ({ default: m.PomodoroFocusModal })));
const CommandSearchModal = lazy(() => import('./components/modals/CommandSearchModal').then(m => ({ default: m.CommandSearchModal })));
const AddTopicModal = lazy(() => import('./components/modals/AddTopicModal').then(m => ({ default: m.AddTopicModal })));
const FloatingTimerPermissionModal = lazy(() => import('./components/modals/FloatingTimerPermissionModal').then(m => ({ default: m.FloatingTimerPermissionModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/modals/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));

const ViewLoadingFallback: React.FC = () => (
  <div className="w-full space-y-5 animate-view-fade select-none pb-12">
    {/* Banner Skeleton */}
    <div className="w-full h-44 sm:h-56 rounded-3xl skeleton-shimmer border border-[#E2E8F0]/40 dark:border-[#28293D]/40 shadow-xs" />

    {/* Bento Cards 3-Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div className="h-32 rounded-2xl skeleton-shimmer border border-[#E2E8F0]/30 dark:border-[#28293D]/30" />
      <div className="h-32 rounded-2xl skeleton-shimmer border border-[#E2E8F0]/30 dark:border-[#28293D]/30" />
      <div className="h-32 rounded-2xl skeleton-shimmer border border-[#E2E8F0]/30 dark:border-[#28293D]/30" />
    </div>

    {/* Content Table/List Skeleton */}
    <div className="w-full h-64 rounded-2xl skeleton-shimmer border border-[#E2E8F0]/30 dark:border-[#28293D]/30" />
  </div>
);

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, authView } = useAuth();
  const { isFullModalOpen, openFullModal, closeFullModal, setSessionTopic } = useTimer();
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');

  // 3D Animated Startup Logo Experience
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return !sessionStorage.getItem('syllabus3d_intro_seen');
  });

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isRevisionSessionOpen, setIsRevisionSessionOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusTopicId, setFocusTopicId] = useState<string | undefined>(undefined);

  const { toggleTheme } = useTheme();

  const showShortcutToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShortcutToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setShortcutToast(null);
    }, 1800);
  }, []);

  // Topic Drawer
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: Topic;
    subjectName: string;
    chapterName: string;
  } | null>(null);

  const syllabusBackHandlerRef = useRef<(() => boolean) | null>(null);

  // 🛡️ Proactive Storage Health Check & Auto-Healing on Startup
  useEffect(() => {
    storageManager.checkStorageHealthAndAutoHeal();
  }, []);

  // Navigate with History Push
  const handleNavigate = useCallback((newView: AppView) => {
    if (newView === currentView) return;
    if (newView === 'overview') {
      setViewHistory([]);
    } else {
      setViewHistory(prev => [...prev, currentView]);
    }
    window.history.pushState({ view: newView }, '');
    setCurrentView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    soundManager.playClick();
  }, [currentView]);

  // Navigate directly to a specific subject in Syllabus view
  const handleNavigateToSubject = useCallback((subjectId: string) => {
    setTargetSubjectId(subjectId);
    handleNavigate('syllabus');
  }, [handleNavigate]);

  // Global Back Handler
  const handleBack = useCallback(() => {
    if (selectedTopic) {
      setSelectedTopic(null);
      return;
    }
    if (isSearchOpen) {
      setIsSearchOpen(false);
      return;
    }
    if (isAddTopicOpen) {
      setIsAddTopicOpen(false);
      return;
    }
    if (isRevisionSessionOpen) {
      setIsRevisionSessionOpen(false);
      return;
    }
    if (isFullModalOpen) {
      closeFullModal();
      return;
    }

    if (currentView === 'syllabus' && syllabusBackHandlerRef.current) {
      const handled = syllabusBackHandlerRef.current();
      if (handled) return;
    }

    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      soundManager.playClick();
    } else if (currentView !== 'overview') {
      setCurrentView('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      soundManager.playClick();
    }
  }, [
    selectedTopic,
    isSearchOpen,
    isAddTopicOpen,
    isRevisionSessionOpen,
    isFullModalOpen,
    currentView,
    viewHistory,
    closeFullModal
  ]);

  // Browser History / Android Back Button Support
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (selectedTopic) {
        setSelectedTopic(null);
        return;
      }
      if (isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }
      if (isAddTopicOpen) {
        setIsAddTopicOpen(false);
        return;
      }
      if (isRevisionSessionOpen) {
        setIsRevisionSessionOpen(false);
        return;
      }
      if (isFullModalOpen) {
        closeFullModal();
        return;
      }

      if (currentView === 'syllabus' && syllabusBackHandlerRef.current) {
        const handled = syllabusBackHandlerRef.current();
        if (handled) return;
      }

      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
      } else if (viewHistory.length > 0) {
        const previousView = viewHistory[viewHistory.length - 1];
        setViewHistory(prev => prev.slice(0, -1));
        setCurrentView(previousView);
      } else {
        setCurrentView('overview');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    selectedTopic,
    isSearchOpen,
    isAddTopicOpen,
    isRevisionSessionOpen,
    isFullModalOpen,
    currentView,
    viewHistory,
    closeFullModal
  ]);

  const handleOpenTopicDrawer = (topic: Topic, subjectName: string, chapterName: string) => {
    haptics.medium();
    setSelectedTopic({ topic, subjectName, chapterName });
    window.history.pushState({ modal: 'topic_drawer', topicId: topic.id }, '');
  };

  const handleCloseTopicDrawer = () => {
    haptics.light();
    setSelectedTopic(null);
  };

  // Launch Focus Chamber for a specific topic
  const handleLaunchFocus = (topicId?: string) => {
    haptics.medium();
    if (topicId) {
      setFocusTopicId(topicId);
      setSessionTopic(topicId);
    } else {
      setFocusTopicId(undefined);
    }
    openFullModal();
  };

  // ♿ Power User Keyboard Shortcuts & Quick Navigation Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Search Palette: Ctrl+K or Cmd+K (allowed everywhere)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      // Allow native browser print: Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        return;
      }

      // Hierarchical Escape Handler
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isSearchOpen) {
          setIsSearchOpen(false);
          return;
        }
        if (isAddTopicOpen) {
          setIsAddTopicOpen(false);
          return;
        }
        if (isRevisionSessionOpen) {
          setIsRevisionSessionOpen(false);
          return;
        }
        if (selectedTopic) {
          setSelectedTopic(null);
          return;
        }
        if (isFullModalOpen) {
          closeFullModal();
          return;
        }
        if (isMobileDrawerOpen) {
          setIsMobileDrawerOpen(false);
          return;
        }
      }

      // Check if user is actively typing in an input, textarea, or contenteditable
      const activeEl = document.activeElement;
      const isTyping = Boolean(
        activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true'
        )
      );

      if (isTyping) return;

      // ? or Shift + / -> Toggle Keyboard Shortcuts Modal (Web / Desktop Only)
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && window.innerWidth >= 768) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // / -> Open Command Search Palette
      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Single-Key Direct View Navigation:
      if (e.key === '1') {
        e.preventDefault();
        handleNavigate('overview');
        showShortcutToast('Jumped to Dashboard [1]');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        handleNavigate('syllabus');
        showShortcutToast('Jumped to Syllabus Explorer [2]');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        handleNavigate('planner');
        showShortcutToast('Jumped to Study Planner [3]');
        return;
      }
      if (e.key === '4') {
        e.preventDefault();
        handleNavigate('revision');
        showShortcutToast('Jumped to Spaced Revision [4]');
        return;
      }
      if (e.key === '5') {
        e.preventDefault();
        handleNavigate('weak');
        showShortcutToast('Jumped to Weak Topics & Traps [5]');
        return;
      }
      if (e.key === '6') {
        e.preventDefault();
        handleNavigate('mindmap');
        showShortcutToast('Jumped to Concept Mind Map [6]');
        return;
      }
      if (e.key === '7') {
        e.preventDefault();
        handleNavigate('analytics');
        showShortcutToast('Jumped to Analytics & Heatmap [7]');
        return;
      }
      if (e.key === '8') {
        e.preventDefault();
        handleNavigate('platforms');
        showShortcutToast('Jumped to Study Station & Hub [8]');
        return;
      }
      if (e.key === '9') {
        e.preventDefault();
        handleNavigate('settings');
        showShortcutToast('Jumped to App Settings [9]');
        return;
      }

      // Single-Key Action Shortcuts:
      // F -> 3D Focus Chamber
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleLaunchFocus(undefined);
        showShortcutToast('Opened 3D Focus Chamber [F]');
        return;
      }

      // N -> Add Custom Topic
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsAddTopicOpen(true);
        showShortcutToast('Opened Add Custom Topic [N]');
        return;
      }

      // D -> Toggle Dark / Light Theme
      if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleTheme();
        showShortcutToast('Theme Toggled [D]');
        return;
      }

      // P -> Clean Desk Print Mode
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        soundManager.playClick();
        haptics.selection();
        window.print();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isShortcutsOpen,
    isSearchOpen,
    isAddTopicOpen,
    isRevisionSessionOpen,
    selectedTopic,
    isFullModalOpen,
    isMobileDrawerOpen,
    handleNavigate,
    showShortcutToast,
    toggleTheme,
    closeFullModal
  ]);

  // 📱 Mobile Top-Level Horizontal View Swiping (Overview ⇄ Syllabus ⇄ Planner)
  const viewSwipeStartX = useRef<number | null>(null);
  const viewSwipeStartY = useRef<number | null>(null);
  const viewSwipeStartTime = useRef<number>(0);
  const isHorizontalViewSwipe = useRef<boolean | null>(null);

  const isInteractiveSwipeTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest(
        'input, textarea, select, button, a, [contenteditable="true"], [role="slider"], .no-swipe, [data-no-swipe], audio, video, iframe, canvas, table, .overflow-x-auto, [data-canvas]'
      )
    );
  };

  const handleMainTouchStart = (e: React.TouchEvent) => {
    if (
      isMobileDrawerOpen ||
      selectedTopic ||
      isSearchOpen ||
      isAddTopicOpen ||
      isRevisionSessionOpen ||
      isFullModalOpen
    ) {
      viewSwipeStartX.current = null;
      return;
    }

    if (isInteractiveSwipeTarget(e.target)) {
      viewSwipeStartX.current = null;
      return;
    }

    viewSwipeStartX.current = e.touches[0].clientX;
    viewSwipeStartY.current = e.touches[0].clientY;
    viewSwipeStartTime.current = Date.now();
    isHorizontalViewSwipe.current = null;
  };

  const handleMainTouchMove = (e: React.TouchEvent) => {
    if (viewSwipeStartX.current === null || viewSwipeStartY.current === null) return;

    const diffX = e.touches[0].clientX - viewSwipeStartX.current;
    const diffY = e.touches[0].clientY - viewSwipeStartY.current;

    if (isHorizontalViewSwipe.current === null) {
      if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) {
        if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          isHorizontalViewSwipe.current = true;
        } else {
          isHorizontalViewSwipe.current = false;
        }
      }
    }
  };

  const handleMainTouchEnd = (e: React.TouchEvent) => {
    if (
      isHorizontalViewSwipe.current === true &&
      viewSwipeStartX.current !== null &&
      e.changedTouches.length > 0
    ) {
      const diffX = e.changedTouches[0].clientX - viewSwipeStartX.current;
      const duration = Date.now() - viewSwipeStartTime.current;

      const isFastFlick = duration < 350 && Math.abs(diffX) > 40;
      const isNormalSwipe = Math.abs(diffX) > 70;

      if (isFastFlick || isNormalSwipe) {
        if (diffX < 0) {
          // Swiped Left -> Move forward
          if (currentView === 'overview') {
            haptics.light();
            handleNavigate('syllabus');
          } else if (currentView === 'syllabus') {
            haptics.light();
            handleNavigate('planner');
          }
        } else if (diffX > 0) {
          // Swiped Right -> Move backward
          if (currentView === 'planner') {
            haptics.light();
            handleNavigate('syllabus');
          } else if (currentView === 'syllabus') {
            haptics.light();
            handleNavigate('overview');
          }
        }
      }
    }

    viewSwipeStartX.current = null;
    viewSwipeStartY.current = null;
    isHorizontalViewSwipe.current = null;
  };

  if (isLoading) {
    return <InitialAuthLoading />;
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        {authView === 'login' && <LoginView />}
        {authView === 'signup' && <SignUpView />}
        {authView === 'forgot_password' && <ForgotPasswordView />}
      </AuthLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#12141A] text-[#0F172A] dark:text-[#C0CAF5] flex flex-col md:flex-row transition-colors duration-300">
      
      {/* ♿ Skip to Main Content Link for Keyboard & Screen Reader Users */}
      <a href="#main-content" className="skip-link">
        Skip to main content (Press Enter)
      </a>

      {/* 3D Animated Startup Intro */}
      {showIntro && (
        <AnimatedLogoIntro onComplete={() => {
          sessionStorage.setItem('syllabus3d_intro_seen', '1');
          setShowIntro(false);
        }} />
      )}

      {/* Desktop Sidebar Navigation */}
      <Sidebar
        activeView={currentView}
        onSelectView={handleNavigate}
        onOpenAddTopic={() => {
          setIsAddTopicOpen(true);
          window.history.pushState({ modal: 'add_topic' }, '');
        }}
        onOpenFocus={() => handleLaunchFocus(undefined)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Mobile Drawer (Left Hamburger Sheet) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeView={currentView}
        onSelectView={(view) => {
          setIsMobileDrawerOpen(false);
          handleNavigate(view);
        }}
        onOpenAddTopic={() => {
          setIsMobileDrawerOpen(false);
          setIsAddTopicOpen(true);
          window.history.pushState({ modal: 'add_topic' }, '');
        }}
        onOpenFocus={() => {
          setIsMobileDrawerOpen(false);
          handleLaunchFocus(undefined);
        }}
        onOpenSearch={() => {
          setIsMobileDrawerOpen(false);
          setIsSearchOpen(true);
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Header
          onOpenSearch={() => {
            setIsSearchOpen(true);
            window.history.pushState({ modal: 'search' }, '');
          }}
          onOpenSettings={() => handleNavigate('settings')}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          canGoBack={currentView !== 'overview'}
          onGoBack={handleBack}
        />

        <main
          id="main-content"
          tabIndex={-1}
          onTouchStart={handleMainTouchStart}
          onTouchMove={handleMainTouchMove}
          onTouchEnd={handleMainTouchEnd}
          className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-28 md:pb-8 touch-pan-y overscroll-contain focus:outline-none"
        >
          <div key={currentView} className="animate-view-fade">
            {/* Initial Dashboard View (Instant, Non-Lazy) */}
            {currentView === 'overview' && (
              <ViewErrorBoundary sectionName="Overview Dashboard" onNavigateHome={() => handleNavigate('overview')}>
                <OverviewView
                  onNavigate={handleNavigate}
                  onNavigateToSubject={handleNavigateToSubject}
                  onOpenTopicDrawer={handleOpenTopicDrawer}
                  onOpenRevisionSession={() => {
                    setIsRevisionSessionOpen(true);
                    window.history.pushState({ modal: 'revision' }, '');
                  }}
                  onOpenAddTopic={() => {
                    setIsAddTopicOpen(true);
                    window.history.pushState({ modal: 'add_topic' }, '');
                  }}
                  onOpenFocus={() => handleLaunchFocus(undefined)}
                />
              </ViewErrorBoundary>
            )}

            {/* Lazy-Loaded Secondary Views with Suspense Fallback & Per-View Crash Protection */}
            <Suspense fallback={<ViewLoadingFallback />}>
              {currentView === 'planner' && (
                <ViewErrorBoundary sectionName="Study Planner" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <PlannerView
                    onOpenFocusChamber={handleLaunchFocus}
                    onOpenTopicDrawer={handleOpenTopicDrawer}
                  />
                </ViewErrorBoundary>
              )}

              {currentView === 'mindmap' && (
                <ViewErrorBoundary sectionName="Interactive Mind Map" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <MindMapView onOpenTopicDrawer={handleOpenTopicDrawer} />
                </ViewErrorBoundary>
              )}

              {currentView === 'syllabus' && (
                <ViewErrorBoundary sectionName="Syllabus Browser" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <SyllabusView
                    onOpenTopicDrawer={handleOpenTopicDrawer}
                    onOpenAddTopic={() => {
                      setIsAddTopicOpen(true);
                      window.history.pushState({ modal: 'add_topic' }, '');
                    }}
                    initialSubjectId={targetSubjectId}
                    onSelectSubjectId={setTargetSubjectId}
                    onBackToDashboard={() => handleNavigate('overview')}
                    onRegisterBackHandler={(handler) => {
                      syllabusBackHandlerRef.current = handler;
                    }}
                  />
                </ViewErrorBoundary>
              )}

              {currentView === 'subjects' && (
                <ViewErrorBoundary sectionName="Subjects Directory" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <SubjectsView
                    onNavigate={handleNavigate}
                    onOpenTopicDrawer={handleOpenTopicDrawer}
                  />
                </ViewErrorBoundary>
              )}

              {currentView === 'revision' && (
                <ViewErrorBoundary sectionName="Revision Hub" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <RevisionView onOpenRevisionSession={() => {
                    setIsRevisionSessionOpen(true);
                    window.history.pushState({ modal: 'revision' }, '');
                  }} />
                </ViewErrorBoundary>
              )}

              {currentView === 'weak' && (
                <ViewErrorBoundary sectionName="Weak Traps Diagnostic" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <WeakTopicsView
                    onOpenTopicDrawer={handleOpenTopicDrawer}
                    onOpenFocus={handleLaunchFocus}
                  />
                </ViewErrorBoundary>
              )}

              {currentView === 'analytics' && (
                <ViewErrorBoundary sectionName="Study Analytics" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <AnalyticsView />
                </ViewErrorBoundary>
              )}

              {currentView === 'heatmap' && (
                <ViewErrorBoundary sectionName="Consistency Heatmap" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <HeatmapView />
                </ViewErrorBoundary>
              )}

              {currentView === 'platforms' && (
                <ViewErrorBoundary sectionName="Learning Resources" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <PlatformsView />
                </ViewErrorBoundary>
              )}

              {currentView === 'pacing' && (
                <ViewErrorBoundary sectionName="Target Pacing & Forecast" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <PacingView
                    onNavigate={handleNavigate}
                    onNavigateToSubject={handleNavigateToSubject}
                  />
                </ViewErrorBoundary>
              )}

              {currentView === 'settings' && (
                <ViewErrorBoundary sectionName="App Settings" showHomeButton onNavigateHome={() => handleNavigate('overview')}>
                  <SettingsView />
                </ViewErrorBoundary>
              )}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeView={currentView}
        onSelectView={handleNavigate}
        onOpenAddTopic={() => {
          setIsAddTopicOpen(true);
          window.history.pushState({ modal: 'add_topic' }, '');
        }}
        onOpenFocus={() => handleLaunchFocus(undefined)}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Real-Time Network Offline Status Indicator */}
      <OfflineStatusIndicator />

      {/* Floating Smart PWA Install Banner */}
      <PWAInstallBanner />

      {/* Floating Background Timer Overlay */}
      <FloatingTimerOverlay />

      {/* Lazy Loaded Heavy Modals & Drawers with Crash Isolation */}
      <Suspense fallback={null}>
        <FloatingTimerPermissionModal />

        {isFullModalOpen && (
          <ViewErrorBoundary sectionName="Pomodoro Focus Chamber" onReset={closeFullModal}>
            <PomodoroFocusModal
              isOpen={isFullModalOpen}
              onClose={closeFullModal}
              defaultTopicId={focusTopicId || selectedTopic?.topic.id}
            />
          </ViewErrorBoundary>
        )}

        {selectedTopic && (
          <ViewErrorBoundary sectionName="Topic Details Drawer" onReset={handleCloseTopicDrawer}>
            <TopicDetailDrawer
              topic={selectedTopic.topic}
              subjectName={selectedTopic.subjectName}
              chapterName={selectedTopic.chapterName}
              onClose={handleCloseTopicDrawer}
            />
          </ViewErrorBoundary>
        )}

        {isSearchOpen && (
          <ViewErrorBoundary sectionName="Search Palette" onReset={() => setIsSearchOpen(false)}>
            <CommandSearchModal
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              onSelectTopic={(topic, subjectName, chapterName) => handleOpenTopicDrawer(topic, subjectName || '', chapterName || '')}
            />
          </ViewErrorBoundary>
        )}

        {isAddTopicOpen && (
          <ViewErrorBoundary sectionName="Add Topic Modal" onReset={() => setIsAddTopicOpen(false)}>
            <AddTopicModal
              isOpen={isAddTopicOpen}
              onClose={() => setIsAddTopicOpen(false)}
            />
          </ViewErrorBoundary>
        )}

        {isRevisionSessionOpen && (
          <ViewErrorBoundary sectionName="Revision Session Modal" onReset={() => setIsRevisionSessionOpen(false)}>
            <RevisionSessionModal
              isOpen={isRevisionSessionOpen}
              onClose={() => setIsRevisionSessionOpen(false)}
            />
          </ViewErrorBoundary>
        )}

        {isShortcutsOpen && (
          <ViewErrorBoundary sectionName="Keyboard Shortcuts Modal" onReset={() => setIsShortcutsOpen(false)}>
            <KeyboardShortcutsModal
              isOpen={isShortcutsOpen}
              onClose={() => setIsShortcutsOpen(false)}
              onNavigate={handleNavigate}
              onOpenSearch={() => {
                setIsShortcutsOpen(false);
                setTimeout(() => setIsSearchOpen(true), 50);
              }}
              onOpenAddTopic={() => {
                setIsShortcutsOpen(false);
                setTimeout(() => setIsAddTopicOpen(true), 50);
              }}
              onOpenFocus={() => {
                setIsShortcutsOpen(false);
                setTimeout(() => handleLaunchFocus(undefined), 50);
              }}
              onToggleTheme={toggleTheme}
              onTriggerPrint={() => {
                setIsShortcutsOpen(false);
                setTimeout(() => window.print(), 100);
              }}
            />
          </ViewErrorBoundary>
        )}
      </Suspense>

      {/* ⚡ Power User Keyboard Shortcut Toast Banner (Web / Desktop Only) */}
      {shortcutToast && (
        <div
          role="status"
          aria-live="polite"
          className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-2xl bg-[#0F172A]/90 dark:bg-[#1E1F2E]/95 text-white border border-[#334155]/60 dark:border-[#383A52] shadow-2xl backdrop-blur-md items-center gap-2.5 animate-fade-in pointer-events-none select-none"
        >
          <div className="w-5 h-5 rounded-lg bg-[#2563EB]/25 dark:bg-[#7AA2F7]/25 text-[#60A5FA] dark:text-[#7AA2F7] flex items-center justify-center font-bold text-xs">
            ⌨️
          </div>
          <span className="text-xs sm:text-[13px] font-bold tracking-tight">
            {shortcutToast}
          </span>
        </div>
      )}
    </div>
  );
};
