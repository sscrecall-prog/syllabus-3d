import React, { useState } from 'react';
import { Sidebar, AppView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { LandingHero } from './components/landing/LandingHero';
import { OverviewView } from './components/views/OverviewView';
import { SyllabusView } from './components/views/SyllabusView';
import { SubjectsView } from './components/views/SubjectsView';
import { RevisionView } from './components/views/RevisionView';
import { WeakTopicsView } from './components/views/WeakTopicsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { HeatmapView } from './components/views/HeatmapView';
import { SettingsView } from './components/views/SettingsView';
import { CommandSearchModal } from './components/modals/CommandSearchModal';
import { TopicDetailDrawer } from './components/modals/TopicDetailDrawer';
import { RevisionSessionModal } from './components/modals/RevisionSessionModal';
import { AddTopicModal } from './components/modals/AddTopicModal';
import { Topic } from './types/syllabus';

export const App: React.FC = () => {
  const [isLanding, setIsLanding] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('overview');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRevisionSessionOpen, setIsRevisionSessionOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubName, setSelectedSubName] = useState('');
  const [selectedChName, setSelectedChName] = useState('');

  const handleOpenTopicDrawer = (topic: Topic, subName: string, chName: string) => {
    setSelectedTopic(topic);
    setSelectedSubName(subName);
    setSelectedChName(chName);
  };

  const handleSelectFromSearch = (topic: Topic) => {
    handleOpenTopicDrawer(topic, 'Syllabus', 'Chapter');
  };

  if (isLanding) {
    return <LandingHero onEnterApp={() => setIsLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <Sidebar
        activeView={activeView}
        onSelectView={view => setActiveView(view)}
        onOpenAddTopic={() => setIsAddTopicOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setActiveView('settings')}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeView === 'overview' && (
            <OverviewView
              onNavigate={view => setActiveView(view)}
              onOpenTopicDrawer={handleOpenTopicDrawer}
              onOpenRevisionSession={() => setIsRevisionSessionOpen(true)}
              onOpenAddTopic={() => setIsAddTopicOpen(true)}
            />
          )}

          {activeView === 'syllabus' && (
            <SyllabusView
              onOpenTopicDrawer={handleOpenTopicDrawer}
              onOpenAddTopic={() => setIsAddTopicOpen(true)}
            />
          )}

          {activeView === 'subjects' && (
            <SubjectsView
              onNavigate={view => setActiveView(view)}
              onOpenTopicDrawer={handleOpenTopicDrawer}
            />
          )}

          {activeView === 'revision' && (
            <RevisionView
              onOpenRevisionSession={() => setIsRevisionSessionOpen(true)}
            />
          )}

          {activeView === 'weak' && (
            <WeakTopicsView
              onOpenTopicDrawer={handleOpenTopicDrawer}
            />
          )}

          {activeView === 'analytics' && <AnalyticsView />}

          {activeView === 'heatmap' && <HeatmapView />}

          {activeView === 'settings' && <SettingsView />}
        </main>

        <MobileNav
          activeView={activeView}
          onSelectView={view => setActiveView(view)}
        />
      </div>

      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTopic={handleSelectFromSearch}
      />

      <TopicDetailDrawer
        topic={selectedTopic}
        subjectName={selectedSubName}
        chapterName={selectedChName}
        onClose={() => setSelectedTopic(null)}
      />

      <RevisionSessionModal
        isOpen={isRevisionSessionOpen}
        onClose={() => setIsRevisionSessionOpen(false)}
      />

      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
      />
    </div>
  );
};
