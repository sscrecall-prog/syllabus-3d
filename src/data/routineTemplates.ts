import { RoutineTemplate, ALL_ROUTINE_DAYS, WEEKDAYS, WEEKENDS } from '../types/routine';

export const PROVEN_ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'early_bird',
    name: 'Early Bird Aspirant (5 AM - 10:30 PM)',
    tagline: 'High morning energy, peak focus blocks & balanced recovery',
    description: 'Designed for aspirants who capitalize on quiet morning hours for difficult math and theory subjects, leaving evenings for revision and analysis.',
    badge: '★ Most Popular',
    icon: '🌅',
    targetAspirant: 'Full-time SSC / UPSC / Banking Aspirants studying from home or library',
    totalStudyHours: 8.5,
    totalSleepHours: 6.5,
    slots: [
      {
        title: 'Morning Wakeup, Hydration & Light Workout',
        startTime: '05:00',
        endTime: '06:00',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Drink 500ml water, stretch, do 15 mins pranayama/workout to activate mind.'
      },
      {
        title: 'Block 1: Core Mathematics / Quantitative Aptitude',
        startTime: '06:00',
        endTime: '08:30',
        category: 'concept',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Formula sheet review', 'Complete 30-40 targeted concept problems', 'Log difficult questions in Mistake Journal'],
        notes: 'Highest cognitive capacity of the day. Zero phone or notifications.'
      },
      {
        title: 'Healthy Breakfast & Editorial Reading',
        startTime: '08:30',
        endTime: '09:30',
        category: 'reading',
        days: ALL_ROUTINE_DAYS,
        checklists: ['Read 2 Editorial columns (The Hindu/Express)', 'Note 10 new vocabulary words'],
        notes: 'Combine breakfast with language comprehension.'
      },
      {
        title: 'Block 2: Reasoning Ability & Speed Drills',
        startTime: '09:30',
        endTime: '12:30',
        category: 'practice',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Solve 50 sectional reasoning questions', 'Time management: max 30s per puzzle'],
        notes: 'Focus on accuracy under speed pressure.'
      },
      {
        title: 'Nutritious Lunch & 30-Min Power Nap',
        startTime: '12:30',
        endTime: '14:00',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Light meal to avoid brain fog. 25-30 mins nap restores cognitive alertness.'
      },
      {
        title: 'Block 3: General Awareness & Static GS Deep Dive',
        startTime: '14:00',
        endTime: '16:30',
        category: 'concept',
        days: ALL_ROUTINE_DAYS,
        priority: 'medium',
        checklists: ['Study 1 GS module (Polity/History/Geography)', 'Review previous day current affairs'],
        notes: 'Use concept mind maps and mnemonics for high retention.'
      },
      {
        title: 'Evening Tea, Fresh Air & Light Walk',
        startTime: '16:30',
        endTime: '17:30',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Step outside. Rest your eyes from screens.'
      },
      {
        title: 'Block 4: English Language & Grammar Rules',
        startTime: '17:30',
        endTime: '19:30',
        category: 'practice',
        days: ALL_ROUTINE_DAYS,
        priority: 'medium',
        checklists: ['Rule of the day revision', 'Solve 30 error spotting / cloze test MCQs'],
        notes: 'Systematic practice of grammar rules and idioms.'
      },
      {
        title: 'Spaced Revision & Mistakes Review',
        startTime: '19:30',
        endTime: '21:00',
        category: 'revision',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Review due flashcards in Revision Hub', 'Inspect logged Examiner Traps'],
        notes: 'Crucial for SuperMemo retention. Never skip revision for new topics!'
      },
      {
        title: 'Dinner & Relaxation',
        startTime: '21:00',
        endTime: '22:00',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Relax, light conversation, step away from study books.'
      },
      {
        title: 'Daily Reflection & Tomorrow Planning',
        startTime: '22:00',
        endTime: '22:30',
        category: 'reading',
        days: ALL_ROUTINE_DAYS,
        checklists: ['Check off today Top 3 Non-Negotiables', 'Set 3 priorities for tomorrow'],
        notes: 'Clear your mind so you sleep without anxiety.'
      },
      {
        title: 'Restorative Night Sleep',
        startTime: '22:30',
        endTime: '05:00',
        category: 'sleep',
        days: ALL_ROUTINE_DAYS,
        notes: 'Dark room, cool temperature, phone away from bed.'
      }
    ]
  },
  {
    id: 'night_owl',
    name: 'Night Owl Scholar (9 AM - 2:30 AM)',
    tagline: 'Quiet late-night deep work & uninterrupted problem sprints',
    description: 'Tailored for aspirants who study with laser focus at night when the world is quiet and daytime distractions are zero.',
    badge: '🌙 Night Mode',
    icon: '🦉',
    targetAspirant: 'Aspirants who thrive in silence, hostel students, and night learners',
    totalStudyHours: 9.5,
    totalSleepHours: 6.5,
    slots: [
      {
        title: 'Wakeup, Refreshment & Breakfast',
        startTime: '09:00',
        endTime: '10:00',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Nutritious breakfast and planning the day.'
      },
      {
        title: 'Block 1: Core Theory & High-Weightage Chapters',
        startTime: '10:00',
        endTime: '12:30',
        category: 'concept',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Complete 1 high-weightage chapter', 'Take structured Notion notes'],
        notes: 'Kick off your daytime with substantive study.'
      },
      {
        title: 'Lunch & Editorial / Current Affairs Review',
        startTime: '12:30',
        endTime: '14:00',
        category: 'reading',
        days: ALL_ROUTINE_DAYS,
        checklists: ['Daily news digest & editorial analysis'],
        notes: 'Combine meal with informative reading.'
      },
      {
        title: 'Block 2: Practice Drills & Previous Year Questions',
        startTime: '14:00',
        endTime: '17:00',
        category: 'practice',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['60 PYQ questions under timed condition', 'Mark tricky questions'],
        notes: 'Active problem solving avoids afternoon sluggishness.'
      },
      {
        title: 'Workout, Walk & Evening Tea',
        startTime: '17:00',
        endTime: '18:00',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Physical activity to stay alert for the long night ahead.'
      },
      {
        title: 'Block 3: Full Sectional Mock Test & Speed Drill',
        startTime: '18:00',
        endTime: '20:30',
        category: 'mock',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Complete 1 timed sectional test', 'Review accuracy percentile'],
        notes: 'Simulate exact exam pressure.'
      },
      {
        title: 'Dinner & Relaxation',
        startTime: '20:30',
        endTime: '21:30',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Light meal.'
      },
      {
        title: 'Block 4: Midnight Deep Work (Heavy Maths / Science)',
        startTime: '21:30',
        endTime: '00:30',
        category: 'concept',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Advance maths problem set', 'Zero-distraction marathon session'],
        notes: 'Golden hours! Total silence and zero interruptions.'
      },
      {
        title: 'Block 5: Active Recall, Flashcards & Trap Audit',
        startTime: '00:30',
        endTime: '02:00',
        category: 'revision',
        days: ALL_ROUTINE_DAYS,
        priority: 'medium',
        checklists: ['Flashcard session in Revision Hub', 'Read today formulas'],
        notes: 'Information reviewed right before sleep is consolidated deeply into long-term memory.'
      },
      {
        title: 'Wind-down & Day Review',
        startTime: '02:00',
        endTime: '02:30',
        category: 'reading',
        days: ALL_ROUTINE_DAYS,
        notes: 'Log daily reflection and schedule tomorrow non-negotiables.'
      },
      {
        title: 'Deep Restorative Sleep',
        startTime: '02:30',
        endTime: '09:00',
        category: 'sleep',
        days: ALL_ROUTINE_DAYS,
        notes: 'Uninterrupted 6.5 hours sleep cycle.'
      }
    ]
  },
  {
    id: 'working_professional',
    name: 'College & Working Professional (Office / College Pacing)',
    tagline: 'Morning 2h sprint + Evening 3.5h deep work + Weekend power marathon',
    description: 'Specifically engineered for students attending college or working aspirants who have fixed 8-hour commitments during the daytime.',
    badge: '💼 Working Hero',
    icon: '💼',
    targetAspirant: 'Working professionals, college students, and part-time learners',
    totalStudyHours: 5.5,
    totalSleepHours: 6.0,
    slots: [
      {
        title: 'Block 1: Early Morning High-Focus Concept Sprint',
        startTime: '05:30',
        endTime: '07:30',
        category: 'concept',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Core theory topic completed before the world wakes up'],
        notes: 'Your most guaranteed study hours of the day before work fatigue sets in.'
      },
      {
        title: 'Commute & Audio Notes / Current Affairs Podcast',
        startTime: '07:30',
        endTime: '08:30',
        category: 'reading',
        days: WEEKDAYS,
        checklists: ['Listen to Daily Current Affairs / Flashcard review'],
        notes: 'Turn transit dead-time into high-yield memory retention.'
      },
      {
        title: 'Office / College / Primary Duty',
        startTime: '08:30',
        endTime: '17:30',
        category: 'custom',
        days: WEEKDAYS,
        notes: 'Give your 100% to work. Stay calm and hydrated.'
      },
      {
        title: 'Commute & Evening Decompression',
        startTime: '17:30',
        endTime: '18:30',
        category: 'break',
        days: WEEKDAYS,
        notes: 'Listen to ambient music, disconnect from work mindset.'
      },
      {
        title: 'Block 2: Core Subject Problem Solving & PYQs',
        startTime: '18:30',
        endTime: '21:00',
        category: 'practice',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Solve 40 targeted practice questions', 'Focus drill on weak areas'],
        notes: 'Sit at your desk immediately after tea without touching social media.'
      },
      {
        title: 'Dinner & Family Time',
        startTime: '21:00',
        endTime: '21:45',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Healthy light dinner.'
      },
      {
        title: 'Block 3: Spaced Revision & Mock Review',
        startTime: '21:45',
        endTime: '23:30',
        category: 'revision',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Review due flashcards', 'Revise mistake journal notes'],
        notes: 'End the day with retention consolidation.'
      },
      {
        title: 'Restful Sleep',
        startTime: '23:30',
        endTime: '05:30',
        category: 'sleep',
        days: ALL_ROUTINE_DAYS,
        notes: 'Consistent 6.0 hours sleep cycle.'
      }
    ]
  },
  {
    id: 'exam_sprint_30d',
    name: 'Last 30-Day Exam Sprint (11 Hours Ultra-Intensity)',
    tagline: 'Full mock simulations, mistake eradication & formula drill marathons',
    description: 'Maximum intensity for the final 30 to 45 days before exam day. Heavy focus on full-length mock tests, error log analysis, and rapid-fire recall.',
    badge: '⚡ High Yield',
    icon: '⚡',
    targetAspirant: 'Aspirants in the final 30-60 days before exam date',
    totalStudyHours: 11.0,
    totalSleepHours: 6.5,
    slots: [
      {
        title: 'Morning Wakeup & Quick Formula Sheet Scan',
        startTime: '06:00',
        endTime: '07:00',
        category: 'revision',
        days: ALL_ROUTINE_DAYS,
        checklists: ['Rapid scan of Maths and Science formula cheat sheets'],
        notes: 'Prime your brain with active formulas before taking the test.'
      },
      {
        title: 'Full-Length Tier-1 / Tier-2 Mock Test Simulation',
        startTime: '07:00',
        endTime: '09:30',
        category: 'mock',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Full test under strict exam timer', 'Zero phone or breaks'],
        notes: 'Simulate exact exam conditions (table, chair, timer).'
      },
      {
        title: 'Breakfast & Mental Reset',
        startTime: '09:30',
        endTime: '10:15',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Take a complete mental break from the screen.'
      },
      {
        title: 'In-Depth Mock Analysis & Mistake Log Root-Cause Audit',
        startTime: '10:15',
        endTime: '13:00',
        category: 'revision',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Analyze all wrong and unattempted questions', 'Categorize root cause: Calculation vs Conceptual vs Misread', 'Log into Examiner Traps'],
        notes: 'A mock without 2.5 hours of analysis is 100% wasted! Analysis is where score increases.'
      },
      {
        title: 'Lunch & 30-Min Power Nap',
        startTime: '13:00',
        endTime: '14:00',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Refresh your mind for afternoon speed drills.'
      },
      {
        title: 'Topic Speed Drills on Weak Areas Identified in Mock',
        startTime: '14:00',
        endTime: '16:30',
        category: 'practice',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Focus on the 2 weakest chapters from morning mock', 'Drill 50 speed questions'],
        notes: 'Immediate remediation of weak spots.'
      },
      {
        title: 'Evening Walk, Tea & Fresh Air',
        startTime: '16:30',
        endTime: '17:15',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Crucial for avoiding burnout in a 30-day sprint.'
      },
      {
        title: 'Heavy Weightage Chapters Fast-Track Re-Solving',
        startTime: '17:15',
        endTime: '19:45',
        category: 'concept',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Solve top 30 recurring PYQs', 'Review shortcut techniques'],
        notes: 'High yield chapters guarantee maximum exam marks.'
      },
      {
        title: 'Current Affairs Marathon & Rapid Vocab Drill',
        startTime: '19:45',
        endTime: '21:00',
        category: 'reading',
        days: ALL_ROUTINE_DAYS,
        checklists: ['Revise last 6 months monthly current affairs compilation', '100 idioms / synonyms revision'],
        notes: 'Rapid-fire memory retention.'
      },
      {
        title: 'Dinner & Light Walk',
        startTime: '21:00',
        endTime: '21:45',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Eat clean and light.'
      },
      {
        title: 'High-Yield Formula Recap & Flashcard Blitz',
        startTime: '21:45',
        endTime: '23:30',
        category: 'revision',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Clear all due flashcards in Spaced Revision Hub'],
        notes: 'Zero backlog before sleeping.'
      },
      {
        title: 'Deep Recovery Sleep',
        startTime: '23:30',
        endTime: '06:00',
        category: 'sleep',
        days: ALL_ROUTINE_DAYS,
        notes: 'Deep 6.5 hours sleep so you wake up sharp for tomorrow mock test.'
      }
    ]
  },
  {
    id: 'balanced_lifestyle',
    name: 'Balanced & Sustainable (7 Hours Zero-Burnout)',
    tagline: 'Sustainable daily pacing with exercise, healthy meals & 8-hour sleep',
    description: 'Designed for aspirants preparing over 6 to 12 months who want to maintain high mental wellness, physical health, and zero exam anxiety.',
    badge: '🌿 Wellness Focus',
    icon: '🌿',
    targetAspirant: 'Long-term aspirants (6-12 months preparation runway)',
    totalStudyHours: 7.0,
    totalSleepHours: 8.0,
    slots: [
      {
        title: 'Morning Yoga, Running & Healthy Breakfast',
        startTime: '06:30',
        endTime: '07:30',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Physical stamina directly boosts study endurance.'
      },
      {
        title: 'Session 1: Deep Concept Learning & Theory',
        startTime: '07:30',
        endTime: '09:30',
        category: 'concept',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Core theory chapter with video lecture or textbook'],
        notes: 'First study session with high energy.'
      },
      {
        title: 'Hydration Break & Stretch',
        startTime: '09:30',
        endTime: '10:00',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Rest eyes, drink warm water or tea.'
      },
      {
        title: 'Session 2: Active Problem Solving & Exercises',
        startTime: '10:00',
        endTime: '12:30',
        category: 'practice',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['Complete 40 practice problems with stopwatch timer'],
        notes: 'Pomodoro style: 50m study, 10m break.'
      },
      {
        title: 'Lunch, Relax & Casual Reading',
        startTime: '12:30',
        endTime: '14:30',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Healthy balanced lunch.'
      },
      {
        title: 'Session 3: Sectional Mock / Speed Drill',
        startTime: '14:30',
        endTime: '16:30',
        category: 'mock',
        days: ALL_ROUTINE_DAYS,
        priority: 'medium',
        checklists: ['1 timed sectional quiz + error review'],
        notes: 'Train your brain to perform at peak during exam hours.'
      },
      {
        title: 'Evening Coffee, Walk & Friends/Family',
        startTime: '16:30',
        endTime: '17:30',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Maintain healthy social balance.'
      },
      {
        title: 'Session 4: Spaced Revision & Flashcards',
        startTime: '17:30',
        endTime: '19:00',
        category: 'revision',
        days: ALL_ROUTINE_DAYS,
        priority: 'high',
        checklists: ['SuperMemo flashcards session', 'Review formulas'],
        notes: 'Prevent the forgetting curve.'
      },
      {
        title: 'Session 5: Newspaper Editorial & Current Affairs',
        startTime: '19:00',
        endTime: '20:30',
        category: 'reading',
        days: ALL_ROUTINE_DAYS,
        priority: 'medium',
        checklists: ['The Hindu Editorial analysis', 'Daily CA quiz'],
        notes: 'End your study day with general awareness.'
      },
      {
        title: 'Dinner, Relax & Hobby Time',
        startTime: '20:30',
        endTime: '22:30',
        category: 'break',
        days: ALL_ROUTINE_DAYS,
        notes: 'Enjoy your evening without study guilt.'
      },
      {
        title: 'Golden 8-Hour Restorative Sleep',
        startTime: '22:30',
        endTime: '06:30',
        category: 'sleep',
        days: ALL_ROUTINE_DAYS,
        notes: 'Full 8-hour sleep cycle guarantees zero burnout.'
      }
    ]
  }
];
