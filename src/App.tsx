import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, AppView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { OverviewView } from './components/views/OverviewView';
import { SyllabusView } from './components/views/SyllabusView';
import { SubjectsView } from './components/views/SubjectsView';
import { PlannerView } from './components/views/PlannerView';
import { MindMapView } from './components/views/MindMapView';
import { RevisionView } from './components/views/RevisionView';
import { WeakTopicsView } from './components/views/WeakTopicsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { HeatmapView } from './components/views/HeatmapView';
import { SettingsView } from './components/views/SettingsView';
import { CommandSearchModal } from './components/modals/CommandSearchModal';
import { AddTopicModal } from './components/modals/AddTopicModal';
import { TopicDetailDrawer } from './components/modals/TopicDetailDrawer';
import { RevisionSessionModal } from './components/modals/RevisionSessionModal';
import { PomodoroFocusModal } from './components/focus/PomodoroFocusModal';
import { Topic } from './types/syllabus';
import { useAuth } from './context/AuthContext';
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginView } from './components/auth/LoginView';
import { SignUpView } from './components/auth/SignUpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { InitialAuthLoading } from './components/auth/InitialAuthLoading';
import { soundManager } from './utils/soundEffects';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, authView } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isRevisionSessionOpen, setIsRevisionSessionOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusTopicId, setFocusTopicId] = useState<string | undefined>(undefined);

  // Topic Drawer
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: Topic;
    subjectName: string;
    chapterName: string;
  } | null>(null);

  // Navigate with History Push
  const handleNavigate = useCallback((newView: AppView) => {
    if (newView === currentView) return;
    setViewHistory(prev => [...prev, currentView]);
    setCurrentView(newView);
    // Push shallow history state for mobile hardware back button
    window.history.pushState({ view: newView }, '');
  }, [currentView]);

  // Master Back Navigation Handler
  const handleGoBack = useCallback(() => {
    // 1. Close open drawer if present
    if (selectedTopic) {
      setSelectedTopic(null);
      return;
    }

    // 2. Close open modals if present
    if (isFocusModalOpen) {
      setIsFocusModalOpen(false);
      return;
    }
    if (isRevisionSessionOpen) {
      setIsRevisionSessionOpen(false);
      return;
    }
    if (isAddTopicOpen) {
      setIsAddTopicOpen(false);
      return;
    }
    if (isSearchOpen) {
      setIsSearchOpen(false);
      return;
    }
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
      return;
    }

    // 3. Pop from View History Stack
    if (viewHistory.length > 0) {
      const prevView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, prev.length - 1));
      setCurrentView(prevView);
    } else if (currentView !== 'overview') {
      setCurrentView('overview');
    }
  }, [
    selectedTopic,
    isFocusModalOpen,
    isRevisionSessionOpen,
    isAddTopicOpen,
    isSearchOpen,
    isMobileDrawerOpen,
    viewHistory,
    currentView
  ]);

  // Intercept Mobile Hardware / Browser Back Gesture (popstate)
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      handleGoBack();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleGoBack]);

  const handleOpenTopicDrawer = (topic: Topic, subName: string, chName: string) => {
    setSelectedTopic({ topic, subjectName: subName, chapterName: chName });
    window.history.pushState({ modal: 'topic_drawer' }, '');
  };

  const handleCloseTopicDrawer = () => {
    setSelectedTopic(null);
  };

  const handleLaunchFocus = (topicId?: string) => {
    setFocusTopicId(topicId);
    setIsFocusModalOpen(true);
    window.history.pushState({ modal: 'focus' }, '');
  };

  const getViewTitle = (view: AppView): string => {
    switch (view) {
      case 'planner': return 'Study Planner';
      case 'mindmap': return 'Concept Mind Map';
      case 'syllabus': return 'Syllabus Explorer';
      case 'subjects': return 'Subjects & Chapters';
      case 'revision': return 'Spaced Revision';
      case 'weak': return 'Weak Topics';
      case 'analytics': return 'Analytics & Heatmap';
      case 'settings': return 'App Settings';
      default: return 'SYLLABUS 3D';
    }
  };

  const canGoBack = currentView !== 'overview' || Boolean(selectedTopic) || isFocusModalOpen || isRevisionSessionOpen || isAddTopicOpen || isSearchOpen || isMobileDrawerOpen;

  // 1. Initial Session Checking (Zero Flash)
  if (isLoading) {
    return <InitialAuthLoading />;
  }

  // 2. Unauthenticated Flow
  if (!isAuthenticated) {
    return (
      <AuthLayout>
        {authView === 'login' && <LoginView />}
        {authView === 'signup' && <SignUpView />}
        {authView === 'forgot_password' && <ForgotPasswordView />}
      </AuthLayout>
    );
  }

  // 3. Authenticated Main Application Flow
  return (
    <div className="flex min-h-screen bg-[#FAF8F5] dark:bg-[#171717] text-[#171717] dark:text-[#F5E6C8] antialiased font-sans transition-colors duration-200">
      {/* Desktop Sidebar (Website View) */}
      <Sidebar
        activeView={currentView}
        onSelectView={handleNavigate}
        onOpenAddTopic={() => {
          setIsAddTopicOpen(true);
          window.history.pushState({ modal: 'add_topic' }, '');
        }}
      />

      {/* Mobile Slide-Out Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeView={currentView}
        onSelectView={(view) => {
          handleNavigate(view);
          setIsMobileDrawerOpen(false);
        }}
        onOpenAddTopic={() => {
          setIsAddTopicOpen(true);
          window.history.pushState({ modal: 'add_topic' }, '');
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSearch={() => {
            setIsSearchOpen(true);
            window.history.pushState({ modal: 'search' }, '');
          }}
          onOpenSettings={() => handleNavigate('settings')}
          onOpenAddTopic={() => {
            setIsAddTopicOpen(true);
            window.history.pushState({ modal: 'add_topic' }, '');
          }}
          onOpenFocus={() => handleLaunchFocus(undefined)}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          canGoBack={canGoBack}
          onGoBack={handleGoBack}
          currentViewTitle={getViewTitle(currentView)}
        />

        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {currentView === 'overview' && (
            <OverviewView
              onNavigate={handleNavigate}
              onOpenTopicDrawer={handleOpenTopicDrawer}
              onOpenRevisionSession={() => {
                setIsRevisionSessionOpen(true);
                window.history.pushState({ modal: 'revision' }, '');
              }}
              onOpenAddTopic={() => {
                setIsAddTopicOpen(true);
                window.history.pushState({ modal: 'add_topic' }, '');
              }}
            />
          )}

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
            <WeakTopicsView onOpenTopicDrawer={handleOpenTopicDrawer} />
          )}

          {currentView === 'analytics' && <AnalyticsView />}

          {currentView === 'heatmap' && <HeatmapView />}

          {currentView === 'settings' && <SettingsView />}
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

      {/* 3D Pomodoro Focus Chamber */}
      <PomodoroFocusModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        defaultTopicId={focusTopicId || selectedTopic?.topic.id}
      />

      {/* Topic Detail Drawer */}
      <TopicDetailDrawer
        topic={selectedTopic?.topic || null}
        subjectName={selectedTopic?.subjectName}
        chapterName={selectedTopic?.chapterName}
        onClose={handleCloseTopicDrawer}
      />

      {/* Quick Search Ctrl+K Modal */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTopic={(topic) => handleOpenTopicDrawer(topic, '', '')}
      />

      {/* Add Topic / Subject Modal */}
      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
      />

      {/* Flashcard Revision Modal */}
      <RevisionSessionModal
        isOpen={isRevisionSessionOpen}
        onClose={() => setIsRevisionSessionOpen(false)}
      />
    </div>
  );
};
