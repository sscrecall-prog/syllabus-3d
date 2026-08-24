import React, { useState } from 'react';
import { Sidebar, AppView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { OverviewView } from './components/views/OverviewView';
import { SyllabusView } from './components/views/SyllabusView';
import { SubjectsView } from './components/views/SubjectsView';
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
import { LandingHero } from './components/landing/LandingHero';
import { Topic } from './types/syllabus';

export const App: React.FC = () => {
  const [isLanding, setIsLanding] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('overview');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isRevisionSessionOpen, setIsRevisionSessionOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

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

  if (isLanding) {
    return <LandingHero onEnterApp={() => setIsLanding(false)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar
        activeView={currentView}
        onSelectView={setCurrentView}
        onOpenAddTopic={() => setIsAddTopicOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setCurrentView('settings')}
          onOpenAddTopic={() => setIsAddTopicOpen(true)}
          onOpenFocus={() => setIsFocusModalOpen(true)}
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
        onOpenFocus={() => setIsFocusModalOpen(true)}
      />

      {/* 3D Pomodoro Focus Chamber */}
      <PomodoroFocusModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        defaultTopicId={selectedTopic?.topic.id}
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
