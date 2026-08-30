const fs = require('fs');

function cleanFile(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf8');
  let removed = [];

  // Remove Icons
  if (config.icons) {
    config.icons.forEach(icon => {
      const isUsed = new RegExp('<' + icon + '[\\s>]').test(content) || 
                     new RegExp('icon:\\s*' + icon + '\\b').test(content) ||
                     new RegExp('Icon\\s*=\\s*' + icon + '\\b').test(content) ||
                     new RegExp(icon + '\\s+as\\s+').test(content);
      if (!isUsed) {
        // Remove from lucide-react import
        const importRegex = new RegExp('(\\b' + icon + '\\b\\s*,?\\s*)', 'g');
        const oldContent = content;
        content = content.replace(importRegex, '');
        if (oldContent !== content) removed.push('Icon:' + icon);
      }
    });
  }

  // Remove Hooks/Props
  if (config.hooks) {
    config.hooks.forEach(hook => {
      const matches = content.match(new RegExp('\\b' + hook + '\\b', 'g')) || [];
      let isUnused = false;
      if (hook === 'user' || hook === 'logout') isUnused = matches.length <= 2;
      if (['onOpenAddTopic', 'onOpenFocus', 'onOpenTopicDrawer', 'onOpenRevisionSession', 'dueRevisions', 'allTopics', 'currentExam', 'subjectStats', 'isOnline', 'openPermissionModal'].includes(hook)) {
         isUnused = matches.length <= 2;
      }
      
      if (isUnused) {
        const regex = new RegExp('(\\b' + hook + '\\b(\\s*:\\s*[a-zA-Z<>?]+)?\\s*,?\\s*)', 'g');
        const oldContent = content;
        content = content.replace(regex, '');
        if (oldContent !== content) removed.push('Prop/Hook:' + hook);
      }
    });
  }
  
  if (config.custom) {
    config.custom.forEach(customFn => {
      content = customFn(content, removed);
    });
  }

  content = content.replace(/,\s*}/g, '\n}');
  content = content.replace(/{\s*,/g, '{ ');
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/const\s*{\s*}\s*=\s*use[A-Za-z]+\(\);?\n?/g, '');

  fs.writeFileSync(filePath, content);
  console.log('Processed ' + filePath + '. Removed: ' + removed.join(', '));
}

cleanFile('src/components/layout/Sidebar.tsx', {
  icons: ['Layers', 'Sparkles'],
  hooks: ['logout', 'user']
});

cleanFile('src/components/layout/Header.tsx', {
  icons: ['Sparkles'],
  hooks: ['user', 'onOpenAddTopic', 'onOpenFocus'],
  custom: [
    (content, removed) => {
      const old = content;
      content = content.replace(/export type ThemeSystemMode = 'academic';\n?/, '');
      if (old !== content) removed.push('ThemeSystemMode');
      return content;
    }
  ]
});

cleanFile('src/components/modals/TopicDetailDrawer.tsx', {
  icons: ['CheckCircle2', 'Award', 'Sparkles', 'Zap', 'Save', 'AlertTriangle']
});

cleanFile('src/components/common/ProfessionalNotesEditor.tsx', {
  icons: ['FileText', 'Plus']
});

cleanFile('src/components/views/OverviewView.tsx', {
  icons: ['Flame', 'RotateCw'],
  hooks: ['onOpenTopicDrawer', 'onOpenRevisionSession', 'onOpenAddTopic', 'onOpenFocus', 'dueRevisions']
});

cleanFile('src/components/views/RevisionView.tsx', {
  icons: ['CheckCircle2', 'Calendar', 'Layers', 'Sparkles', 'Zap', 'BookOpen', 'Filter', 'Trophy', 'Flame', 'Check', 'BrainCircuit', 'Award', 'ChevronRight'],
  hooks: ['allTopics', 'currentExam', 'onOpenTopicDrawer', 'onOpenFocus']
});

cleanFile('src/components/views/MindMapView.tsx', {
  icons: ['Maximize2', 'Filter', 'Sparkles', 'Layers', 'BookOpen', 'Info', 'CheckCircle2', 'RotateCw', 'AlertTriangle', 'Clock', 'ChevronRight']
});

cleanFile('src/components/views/AnalyticsView.tsx', {
  icons: ['Layers'],
  hooks: ['subjectStats']
});

cleanFile('src/components/views/WeakTopicsView.tsx', {
  icons: ['Brain', 'Calculator', 'Compass', 'Eye', 'Clock', 'Zap', 'BookOpen', 'Sparkles', 'Award', 'ChevronRight', 'Flame', 'Check']
});

cleanFile('src/components/views/SettingsView.tsx', {
  icons: ['Settings', 'Calendar', 'Shield', 'PictureInPicture2', 'Star', 'Zap'],
  hooks: ['isOnline', 'openPermissionModal']
});

cleanFile('src/components/mistakes/AdvancedMistakeJournal.tsx', {
  icons: ['CheckCircle2', 'XCircle', 'HelpCircle', 'Sparkles', 'Search', 'BookOpen', 'Flame', 'Layers', 'ChevronDown', 'ChevronUp', 'Brain', 'Calculator', 'Compass', 'Eye', 'Clock', 'ShieldAlert', 'ArrowRight', 'RotateCw']
});

cleanFile('src/main.tsx', {
  custom: [
    (content, removed) => {
      const old = content;
      content = content.replace(/console\.log\('\[PWA\] ServiceWorker active with scope:', registration\.scope\);/, "if (import.meta.env.DEV) { console.log('[PWA] ServiceWorker active with scope:', registration.scope); }");
      if (old !== content) removed.push('console.log wrapped');
      return content;
    }
  ]
});
