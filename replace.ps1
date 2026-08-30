$c = Get-Content -Raw src/components/layout/Sidebar.tsx
$c = $c -replace '\bLayers,\s*', ''
$c = $c -replace '\bSparkles\s*', ''
$c = $c -replace ',\s*}', '}'
$c = $c -replace 'const { logout, user } = useAuth\(\);\s*', ''
Set-Content -Path src/components/layout/Sidebar.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/layout/Header.tsx
$c = $c -replace '\bSparkles,\s*', ''
$c = $c -replace 'const { user } = useAuth\(\);\s*', ''
$c = $c -replace 'export type ThemeSystemMode = ''academic'';\s*', ''
$c = $c -replace '\s*onOpenAddTopic\?: \(\) => void;\s*', ''
$c = $c -replace '\s*onOpenFocus\?: \(\) => void;\s*', ''
Set-Content -Path src/components/layout/Header.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/modals/TopicDetailDrawer.tsx
$c = $c -replace '\bCheckCircle2,\s*', ''
$c = $c -replace '\bAward,\s*', ''
$c = $c -replace '\bSparkles,\s*', ''
$c = $c -replace '\bZap,\s*', ''
$c = $c -replace '\bSave,\s*', ''
$c = $c -replace '\bAlertTriangle\s*', ''
$c = $c -replace ',\s*}', '}'
Set-Content -Path src/components/modals/TopicDetailDrawer.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/common/ProfessionalNotesEditor.tsx
$c = $c -replace '\bFileText,\s*', ''
$c = $c -replace '\bPlus,\s*', ''
$c = $c -replace ',\s*}', '}'
Set-Content -Path src/components/common/ProfessionalNotesEditor.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/views/OverviewView.tsx
$c = $c -replace '\bFlame,\s*', ''
$c = $c -replace '\bRotateCw,\s*', ''
$c = $c -replace ',\s*}', '}'
$c = $c -replace '\s*onOpenTopicDrawer,\s*', ''
$c = $c -replace '\s*onOpenRevisionSession,\s*', ''
$c = $c -replace '\s*onOpenAddTopic,\s*', ''
$c = $c -replace '\s*onOpenFocus\s*', ''
$c = $c -replace 'dueRevisions,\s*', ''
Set-Content -Path src/components/views/OverviewView.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/views/RevisionView.tsx
$c = $c -replace '\bCheckCircle2,\s*', ''
$c = $c -replace '\bLayers,\s*', ''
$c = $c -replace '\bSparkles,\s*', ''
$c = $c -replace '\bZap,\s*', ''
$c = $c -replace '\bBookOpen,\s*', ''
$c = $c -replace '\bFlame,\s*', ''
$c = $c -replace '\bCheck,\s*', ''
$c = $c -replace '\bBrainCircuit,\s*', ''
$c = $c -replace '\bAward,\s*', ''
$c = $c -replace '\bChevronRight\s*', ''
$c = $c -replace ',\s*}', '}'
$c = $c -replace '\s*onOpenFocus\?: \(\) => void;\s*', ''
$c = $c -replace ',\s*onOpenFocus\s*', ''
Set-Content -Path src/components/views/RevisionView.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/views/MindMapView.tsx
$c = $c -replace '\bFilter,\s*', ''
$c = $c -replace '\bSparkles,\s*', ''
$c = $c -replace '\bLayers,\s*', ''
$c = $c -replace '\bInfo,\s*', ''
$c = $c -replace '\bCheckCircle2,\s*', ''
$c = $c -replace '\bRotateCw,\s*', ''
$c = $c -replace '\bAlertTriangle,\s*', ''
$c = $c -replace '\bClock,\s*', ''
$c = $c -replace ',\s*}', '}'
Set-Content -Path src/components/views/MindMapView.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/views/AnalyticsView.tsx
$c = $c -replace '\bLayers\s*', ''
$c = $c -replace ',\s*}', '}'
$c = $c -replace ',\s*subjectStats\s*', ' '
Set-Content -Path src/components/views/AnalyticsView.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/views/WeakTopicsView.tsx
$c = $c -replace '\bZap,\s*', ''
$c = $c -replace '\bBookOpen,\s*', ''
$c = $c -replace '\bSparkles,\s*', ''
$c = $c -replace '\bAward,\s*', ''
$c = $c -replace '\bFlame,\s*', ''
Set-Content -Path src/components/views/WeakTopicsView.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/views/SettingsView.tsx
$c = $c -replace '\bSettings,\s*', ''
$c = $c -replace '\bCalendar,\s*', ''
$c = $c -replace '\bShield,\s*', ''
$c = $c -replace '\bPictureInPicture2,\s*', ''
$c = $c -replace '\bStar,\s*', ''
$c = $c -replace '\bZap,\s*', ''
$c = $c -replace ',\s*}', '}'
$c = $c -replace '\s*isOnline\s*,?', ''
$c = $c -replace '\s*openPermissionModal\s*,?', ''
Set-Content -Path src/components/views/SettingsView.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/components/mistakes/AdvancedMistakeJournal.tsx
$c = $c -replace '\bHelpCircle,\s*', ''
$c = $c -replace '\bBookOpen,\s*', ''
$c = $c -replace '\bFlame,\s*', ''
$c = $c -replace '\bLayers,\s*', ''
$c = $c -replace '\bChevronDown,\s*', ''
$c = $c -replace '\bChevronUp,\s*', ''
$c = $c -replace '\bArrowRight,\s*', ''
$c = $c -replace ',\s*}', '}'
Set-Content -Path src/components/mistakes/AdvancedMistakeJournal.tsx -Value $c -NoNewline

$c = Get-Content -Raw src/main.tsx
$c = $c -replace "console\.log\('\[PWA\] ServiceWorker active with scope:', registration\.scope\);", "if (import.meta.env.DEV) { console.log('[PWA] ServiceWorker active with scope:', registration.scope); }"
Set-Content -Path src/main.tsx -Value $c -NoNewline
