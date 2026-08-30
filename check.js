const fs = require('fs');

const files = {
  'src/components/layout/Sidebar.tsx': {
    icons: ['Layers', 'Sparkles'],
    hooks: ['logout', 'user']
  },
  'src/components/layout/Header.tsx': {
    icons: ['Sparkles'],
    hooks: ['user', 'ThemeSystemMode', 'onOpenAddTopic', 'onOpenFocus']
  },
  'src/components/modals/TopicDetailDrawer.tsx': {
    icons: ['CheckCircle2', 'Award', 'Sparkles', 'Zap', 'Save', 'AlertTriangle']
  },
  'src/components/common/ProfessionalNotesEditor.tsx': {
    icons: ['FileText', 'Plus']
  },
  'src/components/views/OverviewView.tsx': {
    icons: ['Flame', 'RotateCw'],
    hooks: ['onOpenTopicDrawer', 'onOpenRevisionSession', 'onOpenAddTopic', 'onOpenFocus', 'dueRevisions']
  },
  'src/components/views/RevisionView.tsx': {
    icons: ['CheckCircle2', 'Calendar', 'Layers', 'Sparkles', 'Zap', 'BookOpen', 'Filter', 'Trophy', 'Flame', 'Check', 'BrainCircuit', 'Award', 'ChevronRight'],
    hooks: ['allTopics', 'currentExam', 'onOpenTopicDrawer', 'onOpenFocus']
  },
  'src/components/views/MindMapView.tsx': {
    icons: ['Maximize2', 'Filter', 'Sparkles', 'Layers', 'BookOpen', 'Info', 'CheckCircle2', 'RotateCw', 'AlertTriangle', 'Clock', 'ChevronRight']
  },
  'src/components/views/AnalyticsView.tsx': {
    icons: ['Layers'],
    hooks: ['subjectStats']
  },
  'src/components/views/WeakTopicsView.tsx': {
    icons: ['Brain', 'Calculator', 'Compass', 'Eye', 'Clock', 'Zap', 'BookOpen', 'Sparkles', 'Award', 'ChevronRight', 'Flame', 'Check']
  },
  'src/components/views/SettingsView.tsx': {
    icons: ['Settings', 'Calendar', 'Shield', 'PictureInPicture2', 'Star', 'Zap'],
    hooks: ['isOnline', 'openPermissionModal']
  },
  'src/components/mistakes/AdvancedMistakeJournal.tsx': {
    icons: ['CheckCircle2', 'XCircle', 'HelpCircle', 'Sparkles', 'Search', 'BookOpen', 'Flame', 'Layers', 'ChevronDown', 'ChevronUp', 'Brain', 'Calculator', 'Compass', 'Eye', 'Clock', 'ShieldAlert', 'ArrowRight', 'RotateCw']
  },
  'src/main.tsx': {
    hooks: ['console.log']
  }
};

for (const [file, checks] of Object.entries(files)) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(\nChecking :);
  
  if (checks.icons) {
    for (const icon of checks.icons) {
      const isImported = new RegExp(import\\s+{[^}]*\\b\\b[^}]*}\\s+from\\s+['"]lucide-react['"], 's').test(content);
      const isUsed = new RegExp(<\\b).test(content);
      if (isImported && !isUsed) {
        console.log(  Icon  is imported but NOT used.);
      } else if (isImported && isUsed) {
        console.log(  Icon  is imported AND USED.);
      }
    }
  }
  
  if (checks.hooks) {
    for (const hook of checks.hooks) {
      const matchCount = (content.match(new RegExp(\\b\\b, 'g')) || []).length;
      console.log(  Hook/Prop  occurs  times.);
    }
  }
}
