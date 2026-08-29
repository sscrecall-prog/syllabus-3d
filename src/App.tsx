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

// ⚡ Lazy Loaded Heavy Modals & Drawers
const TopicDetailDrawer = lazy(() => import('./components/modals/TopicDetailDrawer').then(m => ({ default: m.TopicDetailDrawer })));
const RevisionSessionModal = lazy(() => import('./components/modals/RevisionSessionModal').then(m => ({ default: m.RevisionSessionModal })));
const PomodoroFocusModal = lazy(() => import('./components/focus/PomodoroFocusModal').then(m => ({ default: m.PomodoroFocusModal })));
const CommandSearchModal = lazy(() => import('./components/modals/CommandSearchModal').then(m => ({ default: m.CommandSearchModal })));
const AddTopicModal = lazy(() => import('./components/modals/AddTopicModal').then(m => ({ default: m.AddTopicModal })));
const FloatingTimerPermissionModal = lazy(() => import('./components/modals/FloatingTimerPermissionModal').then(m => ({ default: m.FloatingTimerPermissionModal })));

const ViewLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[350px] flex items-center justify-center p-8 animate-fade-in font-sans">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#596B35] dark:border-[#7AA2F7] border-t-transparent animate-spin" />
      <span className="text-xs font-mono font-bold text-[#85877E] tracking-wider uppercase">Loading Workspace...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, authView } = useAuth();
  const { isFullModalOpen, openFullModal, closeFullModal, setSessionTopic } = useTimer();
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');

  useEffect(() => {
    localStorage.removeItem('syllabus3d_theme_system');
    document.documentElement.classList.remove('theme-spatial');
  }, []);

  // 3D Animated Startup Logo Experience
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isRevisionSessionOpen, setIsRevisionSessionOpen] = useState(false);
  const [focusTopicId, setFocusTopicId] = useState<string | undefined>(undefined);

  // Topic Drawer
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: Topic;
    subjectName: string;
    chapterName: string;
  } | null>(null);

  const syllabusBackHandlerRef = useRef<(() => boolean) | null>(null);

  // Navigate with History Push
  const handleNavigate = useCallback((newView: AppView) => {
    if (newView === currentView) return;
    setViewHistory(prev => [...prev, currentView]);
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

  // Keyboard Shortcuts (Ctrl+K for Search, Escape to Close Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isAddTopicOpen) setIsAddTopicOpen(false);
        if (isRevisionSessionOpen) setIsRevisionSessionOpen(false);
        if (selectedTopic) setSelectedTopic(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isAddTopicOpen, isRevisionSessionOpen, selectedTopic]);

  const handleOpenTopicDrawer = (topic: Topic, subjectName: string, chapterName: string) => {
    setSelectedTopic({ topic, subjectName, chapterName });
    window.history.pushState({ modal: 'topic_drawer', topicId: topic.id }, '');
  };

  const handleCloseTopicDrawer = () => {
    setSelectedTopic(null);
  };

  // Launch Focus Chamber for a specific topic
  const handleLaunchFocus = (topicId?: string) => {
    if (topicId) {
      setFocusTopicId(topicId);
      setSessionTopic(topicId);
    } else {
      setFocusTopicId(undefined);
    }
    openFullModal();
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
    <div className="min-h-screen bg-[#F7F6F0] dark:bg-[#12141A] text-[#11120F] dark:text-[#C0CAF5] flex flex-col md:flex-row transition-colors duration-300">
      
      {/* 3D Animated Startup Intro */}
      {showIntro && (
        <AnimatedLogoIntro onComplete={() => setShowIntro(false)} />
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
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSearch={() => {
            setIsSearchOpen(true);
            window.history.pushState({ modal: 'search' }, '');
          }}
          onOpenSettings={() => handleNavigate('settings')}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          canGoBack={currentView !== 'overview' || viewHistory.length > 0 || selectedTopic !== null}
          onGoBack={handleBack}
        />

        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {/* Initial Dashboard View (Instant, Non-Lazy) */}
          {currentView === 'overview' && (
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
          )}

          {/* Lazy-Loaded Secondary Views with Suspense Fallback */}
          <Suspense fallback={<ViewLoadingFallback />}>
            {currentView === 'planner' && (
              <PlannerView
                onOpenFocusChamber={handleLaunchFocus}
                onOpenTopicDrawer={handleOpenTopicDrawer}
              />
            )}

            {currentView === 'mindmap' && (
              <MindMapView onOpenTopicDrawer={handleOpenTopicDrawer} />
            )}

            {currentView === 'syllabus' && (
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
            )}

            {currentView === 'subjects' && (
              <SubjectsView
                onNavigate={handleNavigate}
                onOpenTopicDrawer={handleOpenTopicDrawer}
              />
            )}

            {currentView === 'revision' && (
              <RevisionView onOpenRevisionSession={() => {
                setIsRevisionSessionOpen(true);
                window.history.pushState({ modal: 'revision' }, '');
              }} />
            )}

            {currentView === 'weak' && (
              <WeakTopicsView
                onOpenTopicDrawer={handleOpenTopicDrawer}
                onOpenFocus={handleLaunchFocus}
              />
            )}

            {currentView === 'analytics' && <AnalyticsView />}

            {currentView === 'heatmap' && <HeatmapView />}

            {currentView === 'settings' && <SettingsView />}
          </Suspense>
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
      />

      {/* Floating Background Timer Overlay */}
      <FloatingTimerOverlay />

      {/* Lazy Loaded Heavy Modals & Drawers */}
      <Suspense fallback={null}>
        <FloatingTimerPermissionModal />

        {isFullModalOpen && (
          <PomodoroFocusModal
            isOpen={isFullModalOpen}
            onClose={closeFullModal}
            defaultTopicId={focusTopicId || selectedTopic?.topic.id}
          />
        )}

        {selectedTopic && (
          <TopicDetailDrawer
            topic={selectedTopic.topic}
            subjectName={selectedTopic.subjectName}
            chapterName={selectedTopic.chapterName}
            onClose={handleCloseTopicDrawer}
          />
        )}

        {isSearchOpen && (
          <CommandSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectTopic={(topic) => handleOpenTopicDrawer(topic, '', '')}
          />
        )}

        {isAddTopicOpen && (
          <AddTopicModal
            isOpen={isAddTopicOpen}
            onClose={() => setIsAddTopicOpen(false)}
          />
        )}

        {isRevisionSessionOpen && (
          <RevisionSessionModal
            isOpen={isRevisionSessionOpen}
            onClose={() => setIsRevisionSessionOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
};
