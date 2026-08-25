import React, { useState } from 'react';
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

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, authView } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('overview');

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

  const handleOpenTopicDrawer = (topic: Topic, subName: string, chName: string) => {
    setSelectedTopic({ topic, subjectName: subName, chapterName: chName });
  };

  const handleCloseTopicDrawer = () => {
    setSelectedTopic(null);
  };

  const handleLaunchFocus = (topicId?: string) => {
    setFocusTopicId(topicId);
    setIsFocusModalOpen(true);
  };

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
        onSelectView={setCurrentView}
        onOpenAddTopic={() => setIsAddTopicOpen(true)}
      />

      {/* Mobile Slide-Out Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setIsMobileDrawerOpen(false);
        }}
        onOpenAddTopic={() => setIsAddTopicOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setCurrentView('settings')}
          onOpenAddTopic={() => setIsAddTopicOpen(true)}
          onOpenFocus={() => handleLaunchFocus(undefined)}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {currentView === 'overview' && (
            <OverviewView
              onNavigate={setCurrentView}
              onOpenTopicDrawer={handleOpenTopicDrawer}
              onOpenRevisionSession={() => setIsRevisionSessionOpen(true)}
              onOpenAddTopic={() => setIsAddTopicOpen(true)}
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
              onOpenAddTopic={() => setIsAddTopicOpen(true)}
            />
          )}

          {currentView === 'subjects' && (
            <SubjectsView
              onNavigate={setCurrentView}
              onOpenTopicDrawer={handleOpenTopicDrawer}
            />
          )}

          {currentView === 'revision' && (
            <RevisionView onOpenRevisionSession={() => setIsRevisionSessionOpen(true)} />
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
        onSelectView={setCurrentView}
        onOpenAddTopic={() => setIsAddTopicOpen(true)}
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
