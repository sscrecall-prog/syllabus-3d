import { Exam, AchievementBadge, UserProgressProfile, DailyActivity } from '../types/syllabus';

export const INITIAL_PROFILE: UserProgressProfile = {
  name: 'Aspirant Rahul',
  targetExamDate: '2026-09-15',
  currentStreak: 18,
  longestStreak: 24,
  level: 4,
  levelTitle: 'Syllabus Specialist',
  xp: 1420,
  soundEnabled: true,
  selectedExamId: 'exam_ssc_cgl_2026'
};

export const INITIAL_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'ach_first_topic',
    title: 'First Step',
    description: 'Complete your first syllabus topic',
    icon: 'Target',
    tier: 'bronze',
    unlocked: true,
    unlockedAt: '2026-07-10',
    progress: 1,
    maxProgress: 1
  },
  {
    id: 'ach_streak_7',
    title: 'Consistency Cadet',
    description: 'Maintain a 7-day daily study streak',
    icon: 'Flame',
    tier: 'bronze',
    unlocked: true,
    unlockedAt: '2026-07-17',
    progress: 7,
    maxProgress: 7
  },
  {
    id: 'ach_streak_14',
    title: 'Streak Titan',
    description: 'Maintain a 14-day study streak',
    icon: 'Flame',
    tier: 'silver',
    unlocked: true,
    unlockedAt: '2026-07-24',
    progress: 14,
    maxProgress: 14
  },
  {
    id: 'ach_quant_master',
    title: 'Quant Gladiator',
    description: 'Complete 15 Quantitative Aptitude topics',
    icon: 'Calculator',
    tier: 'silver',
    unlocked: true,
    unlockedAt: '2026-08-05',
    progress: 15,
    maxProgress: 15
  },
  {
    id: 'ach_spaced_rep',
    title: 'Memory Engine',
    description: 'Complete 25 spaced repetition revision cards',
    icon: 'RotateCw',
    tier: 'silver',
    unlocked: true,
    unlockedAt: '2026-08-12',
    progress: 25,
    maxProgress: 25
  },
  {
    id: 'ach_error_buster',
    title: 'Mistake Obliterator',
    description: 'Resolve 10 logged conceptual or calculation errors',
    icon: 'ShieldCheck',
    tier: 'gold',
    unlocked: false,
    unlockedAt: null,
    progress: 6,
    maxProgress: 10
  },
  {
    id: 'ach_half_syllabus',
    title: 'Halfway Hero',
    description: 'Reach 50% completion across the full exam syllabus',
    icon: 'Trophy',
    tier: 'gold',
    unlocked: false,
    unlockedAt: null,
    progress: 38,
    maxProgress: 50
  },
  {
    id: 'ach_exam_ready',
    title: 'Grandmaster Aspirant',
    description: 'Complete 100% syllabus with 85%+ mock accuracy',
    icon: 'Zap',
    tier: 'platinum',
    unlocked: false,
    unlockedAt: null,
    progress: 38,
    maxProgress: 100
  }
];

export const INITIAL_ACTIVITY_HISTORY: DailyActivity[] = (() => {
  const list: DailyActivity[] = [];
  const today = new Date();
  for (let i = 119; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Generate realistic simulated activity with weekends and study patterns
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isStudied = (i % 7 !== 3) && (i % 11 !== 0);
    const mins = isStudied ? (isWeekend ? 180 + (i % 60) : 120 + (i % 90)) : 0;
    const topics = isStudied ? Math.floor(mins / 60) : 0;
    const revs = isStudied ? Math.floor(mins / 45) : 0;

    list.push({
      date: dateStr,
      studyMinutes: mins,
      topicsCompleted: topics,
      revisionsCompleted: revs
    });
  }
  return list;
})();

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam_ssc_cgl_2026',
    name: 'SSC CGL 2026',
    code: 'SSC_CGL',
    targetYear: 2026,
    examDate: '2026-09-15',
    subjects: [
      {
        id: 'subj_quant',
        name: 'Quantitative Aptitude',
        icon: 'Calculator',
        color: '#596B35',
        totalChapters: 4,
        chapters: [
          {
            id: 'chap_arithmetic',
            name: 'Arithmetic Math',
            description: 'Percentages, Profit & Loss, Ratio, Time & Work, SI/CI',
            topics: [
              {
                id: 'top_percentage',
                name: 'Percentages & Fractional Equivalents',
                subtopics: ['Base Conversion', 'Successive Percentage', 'Product Constancy Ratio'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 240,
                lastStudied: '2026-08-15',
                nextRevision: '2026-08-25',
                accuracy: 92,
                mockAttempts: 45,
                difficulty: 'Easy',
                isWeak: false,
                weightage: 4,
                notes: 'Rule of product constancy: If price increases by a/b, consumption must reduce by a/(a+b) to keep expenditure constant.',
                mistakes: [
                  {
                    id: 'm1',
                    topicId: 'top_percentage',
                    questionDescription: 'Failed to apply successive percentage in multi-step discount with tax.',
                    mistakeType: 'calculation',
                    correctApproach: 'Use formula Net % = a + b + (ab/100) or effective multiplier method.',
                    dateLogged: '2026-08-10',
                    resolved: true
                  }
                ]
              },
              {
                id: 'top_profit_loss',
                name: 'Profit, Loss & Discount',
                subtopics: ['Marked Price & Discount', 'Dishonest Dealer Concepts', 'False Weights'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 300,
                lastStudied: '2026-08-18',
                nextRevision: '2026-08-28',
                accuracy: 84,
                mockAttempts: 38,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 5,
                notes: 'CP / MP = (100 - Discount%) / (100 + Profit%). In dishonest dealer, Profit % = (True Value - False Value) / False Value * 100.',
                mistakes: []
              },
              {
                id: 'top_time_work',
                name: 'Time, Work & Pipes & Cisterns',
                subtopics: ['LCM Efficiency Method', 'Alternate Days Work', 'Negative Work (Emptying Pipes)'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 220,
                lastStudied: '2026-08-20',
                nextRevision: '2026-08-27',
                accuracy: 78,
                mockAttempts: 30,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 4,
                notes: 'Always assign total work = LCM of individual times. Efficiency = Work / Time.',
                mistakes: []
              },
              {
                id: 'top_si_ci',
                name: 'Simple & Compound Interest',
                subtopics: ['Difference between CI and SI for 2 & 3 years', 'Installments (CI & SI)', 'Half-Yearly Compounding'],
                status: 'weak',
                completionPercentage: 50,
                studyTimeMinutes: 180,
                lastStudied: '2026-08-21',
                nextRevision: '2026-08-23',
                accuracy: 54,
                mockAttempts: 25,
                difficulty: 'Hard',
                isWeak: true,
                weightage: 5,
                notes: 'For 2 years: Diff = P * (R/100)^2. For 3 years: Diff = P * (R/100)^2 * (300 + R)/100.',
                mistakes: [
                  {
                    id: 'm2',
                    topicId: 'top_si_ci',
                    questionDescription: 'Forgot to double rate and halve time in quarterly CI calculation.',
                    mistakeType: 'formula',
                    correctApproach: 'For quarterly: r_new = R/4, t_new = 4t. Convert before applying formula.',
                    dateLogged: '2026-08-21',
                    resolved: false
                  },
                  {
                    id: 'm3',
                    topicId: 'top_si_ci',
                    questionDescription: 'Compounded annually installment equation solved incorrectly under time pressure.',
                    mistakeType: 'time_pressure',
                    correctApproach: 'Each installment P = x / (1 + r/100) + x / (1 + r/100)^2.',
                    dateLogged: '2026-08-22',
                    resolved: false
                  }
                ]
              }
            ]
          },
          {
            id: 'chap_advance_math',
            name: 'Advance Mathematics',
            description: 'Algebra, Trigonometry, Geometry, Mensuration 2D/3D',
            topics: [
              {
                id: 'top_algebra',
                name: 'Algebraic Identities & Polynomials',
                subtopics: ['Symmetric Identities', 'Value Putting Technique', 'x + 1/x Standard Forms'],
                status: 'in_progress',
                completionPercentage: 60,
                studyTimeMinutes: 210,
                lastStudied: '2026-08-22',
                nextRevision: '2026-08-24',
                accuracy: 82,
                mockAttempts: 32,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 6,
                notes: 'If x + 1/x = k, then x^2 + 1/x^2 = k^2 - 2, x^3 + 1/x^3 = k^3 - 3k.',
                mistakes: []
              },
              {
                id: 'top_geometry',
                name: 'Geometry: Triangles & Circles',
                subtopics: ['Incenter, Circumcenter, Centroid Properties', 'Chord Theorems', 'Cyclic Quadrilateral & Tangent Secant'],
                status: 'revision_due',
                completionPercentage: 100,
                studyTimeMinutes: 340,
                lastStudied: '2026-08-14',
                nextRevision: '2026-08-23',
                accuracy: 76,
                mockAttempts: 40,
                difficulty: 'Hard',
                isWeak: false,
                weightage: 8,
                notes: 'Tangent Secant Theorem: PT^2 = PA * PB. Apollonius Theorem: AB^2 + AC^2 = 2(AD^2 + BD^2).',
                mistakes: [
                  {
                    id: 'm4',
                    topicId: 'top_geometry',
                    questionDescription: 'Confused incenter angle formula (90 + A/2) with circumcenter (2A).',
                    mistakeType: 'conceptual',
                    correctApproach: 'Angle at incenter = 90 + A/2. Angle at circumcenter = 2 * angle A.',
                    dateLogged: '2026-08-14',
                    resolved: true
                  }
                ]
              },
              {
                id: 'top_trigonometry',
                name: 'Trigonometry & Heights and Distances',
                subtopics: ['Angle Value Table 0-90', 'Complementary Angles', 'Heights & Distances with 30-60-90 Ratios'],
                status: 'not_started',
                completionPercentage: 0,
                studyTimeMinutes: 0,
                lastStudied: null,
                nextRevision: null,
                accuracy: 0,
                mockAttempts: 0,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 6,
                notes: '',
                mistakes: []
              }
            ]
          }
        ]
      },
      {
        id: 'subj_reasoning',
        name: 'General Intelligence & Reasoning',
        icon: 'BrainCircuit',
        color: '#3A3F33',
        totalChapters: 3,
        chapters: [
          {
            id: 'chap_verbal_reasoning',
            name: 'Verbal Reasoning',
            description: 'Syllogism, Analogy, Blood Relations, Coding-Decoding',
            topics: [
              {
                id: 'top_syllogism',
                name: 'Syllogism (Only a Few & Possibility cases)',
                subtopics: ['Standard Venn Diagram Method', 'Only a Few Cases', 'Either-Or Conditions'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 190,
                lastStudied: '2026-08-16',
                nextRevision: '2026-08-26',
                accuracy: 88,
                mockAttempts: 50,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 5,
                notes: 'Only a few A are B implies: (1) Some A are B (Definite), (2) Some A are not B (Definite).',
                mistakes: []
              },
              {
                id: 'top_blood_relations',
                name: 'Blood Relations (Coded & Pointing towards a person)',
                subtopics: ['Family Tree Notation', 'Coded Blood Relations (A+B, A-B)', 'Pointing Towards Photographs'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 150,
                lastStudied: '2026-08-19',
                nextRevision: '2026-08-29',
                accuracy: 94,
                mockAttempts: 35,
                difficulty: 'Easy',
                isWeak: false,
                weightage: 4,
                notes: 'Use standard brackets: Square for Male, Circle for Female, Double horizontal line for Spouse.',
                mistakes: []
              },
              {
                id: 'top_coding_decoding',
                name: 'Advanced Coding-Decoding',
                subtopics: ['Alphabet Place Values & Opposites', 'Pattern Matrix Shifting', 'Conditional Letter Coding'],
                status: 'in_progress',
                completionPercentage: 50,
                studyTimeMinutes: 120,
                lastStudied: '2026-08-22',
                nextRevision: '2026-08-25',
                accuracy: 85,
                mockAttempts: 25,
                difficulty: 'Easy',
                isWeak: false,
                weightage: 4,
                notes: 'Opposite letters sum to 27 (A=1, Z=26 -> 1+26=27). EJOTY (5, 10, 15, 20, 25).',
                mistakes: []
              }
            ]
          },
          {
            id: 'chap_non_verbal_reasoning',
            name: 'Non-Verbal & Analytical Reasoning',
            description: 'Mirror Images, Paper Folding, Embedded Figures, Series',
            topics: [
              {
                id: 'top_paper_folding',
                name: 'Paper Folding & Cutting',
                subtopics: ['Symmetry Analysis', 'Unfolding Sequential Matrices', 'Punch Hole Coordinates'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 130,
                lastStudied: '2026-08-17',
                nextRevision: '2026-08-27',
                accuracy: 90,
                mockAttempts: 28,
                difficulty: 'Easy',
                isWeak: false,
                weightage: 3,
                notes: 'Every fold is an axis of mirror reflection in reverse.',
                mistakes: []
              },
              {
                id: 'top_cube_dice',
                name: 'Cubes & Open Dice',
                subtopics: ['Opposite Face Rules in Open Dice', 'Standard vs Non-Standard Dice', 'Painted Cube Cuts'],
                status: 'weak',
                completionPercentage: 40,
                studyTimeMinutes: 90,
                lastStudied: '2026-08-20',
                nextRevision: '2026-08-23',
                accuracy: 52,
                mockAttempts: 20,
                difficulty: 'Medium',
                isWeak: true,
                weightage: 3,
                notes: 'In open dice, alternate boxes are opposite to each other with 1 box gap.',
                mistakes: [
                  {
                    id: 'm5',
                    topicId: 'top_cube_dice',
                    questionDescription: 'Counted edge cubes instead of corner cubes for 3-side painted cuts.',
                    mistakeType: 'conceptual',
                    correctApproach: 'Corner cubes (3-side) = always 8. Edge cubes (2-side) = 12 * (n-2). Face center (1-side) = 6 * (n-2)^2.',
                    dateLogged: '2026-08-20',
                    resolved: false
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'subj_english',
        name: 'English Comprehension',
        icon: 'BookOpen',
        color: '#708250',
        totalChapters: 3,
        chapters: [
          {
            id: 'chap_grammar',
            name: 'Grammar Rules & Error Spotting',
            description: 'Subject-Verb Agreement, Tenses, Prepositions, Voice & Narration',
            topics: [
              {
                id: 'top_sva',
                name: 'Subject-Verb Agreement (12 Golden Rules)',
                subtopics: ['Neither-Nor / Either-Or Nearest Subject', 'Collective Noun Disagreements', 'Along with / As well as Rule'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 200,
                lastStudied: '2026-08-18',
                nextRevision: '2026-08-28',
                accuracy: 89,
                mockAttempts: 40,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 5,
                notes: 'When subjects joined by "along with", "together with", "as well as", verb agrees with the FIRST subject.',
                mistakes: []
              },
              {
                id: 'top_active_passive',
                name: 'Active & Passive Voice Transformation',
                subtopics: ['Tense Shift Matrix', 'Imperative Sentences (Let it be done)', 'Modal Auxiliaries in Passive'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 160,
                lastStudied: '2026-08-19',
                nextRevision: '2026-08-29',
                accuracy: 96,
                mockAttempts: 32,
                difficulty: 'Easy',
                isWeak: false,
                weightage: 5,
                notes: 'Present Continuous: is/am/are + Ving -> is/am/are + being + V3.',
                mistakes: []
              },
              {
                id: 'top_narration',
                name: 'Direct & Indirect Speech',
                subtopics: ['Tense Backshifts in Reporting Past', 'Interrogative Conversions (if/whether)', 'Universal Truth Exceptions'],
                status: 'weak',
                completionPercentage: 45,
                studyTimeMinutes: 110,
                lastStudied: '2026-08-21',
                nextRevision: '2026-08-23',
                accuracy: 58,
                mockAttempts: 24,
                difficulty: 'Hard',
                isWeak: true,
                weightage: 5,
                notes: 'Universal truths DO NOT change tense even when reporting verb is in the past.',
                mistakes: [
                  {
                    id: 'm6',
                    topicId: 'top_narration',
                    questionDescription: 'Backshifted tense in universal truth statement: Teacher said water boils at 100C.',
                    mistakeType: 'conceptual',
                    correctApproach: 'Keep present simple for scientific facts and universal truths in indirect speech.',
                    dateLogged: '2026-08-21',
                    resolved: false
                  }
                ]
              }
            ]
          },
          {
            id: 'chap_vocabulary',
            name: 'Vocabulary & Idioms',
            description: 'One Word Substitution, Idioms, Synonyms & Antonyms',
            topics: [
              {
                id: 'top_idioms',
                name: 'High-Frequency Idioms & Phrases (Top 300)',
                subtopics: ['Color Idioms', 'Action & Animal Idioms', 'Latin/Greek Origin Phrases'],
                status: 'in_progress',
                completionPercentage: 55,
                studyTimeMinutes: 180,
                lastStudied: '2026-08-22',
                nextRevision: '2026-08-25',
                accuracy: 80,
                mockAttempts: 45,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 6,
                notes: 'Burn the candle at both ends = to exhaust energy. Once in a blue moon = very rarely.',
                mistakes: []
              }
            ]
          }
        ]
      },
      {
        id: 'subj_ga',
        name: 'General Awareness & GK',
        icon: 'Globe',
        color: '#4A582F',
        totalChapters: 3,
        chapters: [
          {
            id: 'chap_polity',
            name: 'Indian Polity & Constitution',
            description: 'Fundamental Rights, DPSP, Parliament, President, Amendments',
            topics: [
              {
                id: 'top_fundamental_rights',
                name: 'Fundamental Rights (Articles 12-35)',
                subtopics: ['Article 19 6 Freedoms', 'Article 21 & 21A', 'Writs under Article 32 & 226 (Habeas Corpus, Mandamus)'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 260,
                lastStudied: '2026-08-16',
                nextRevision: '2026-08-26',
                accuracy: 90,
                mockAttempts: 55,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 5,
                notes: 'Heart & Soul of Constitution = Article 32 (Dr. B.R. Ambedkar). Article 20 & 21 cannot be suspended during National Emergency.',
                mistakes: []
              },
              {
                id: 'top_parliament',
                name: 'Indian Parliament & Union Executive',
                subtopics: ['Lok Sabha vs Rajya Sabha Powers', 'Money Bill Article 110', 'President Veto Powers Article 111'],
                status: 'revision_due',
                completionPercentage: 100,
                studyTimeMinutes: 210,
                lastStudied: '2026-08-15',
                nextRevision: '2026-08-23',
                accuracy: 74,
                mockAttempts: 34,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 4,
                notes: 'Money Bill can only be introduced in Lok Sabha with prior recommendation of the President.',
                mistakes: []
              }
            ]
          },
          {
            id: 'chap_science',
            name: 'General Science',
            description: 'Physics, Chemistry & Biology basics for SSC',
            topics: [
              {
                id: 'top_human_body',
                name: 'Human Biology: Vitamins, Diseases & Organs',
                subtopics: ['Water vs Fat Soluble Vitamins (ADEK)', 'Viral vs Bacterial Diseases', 'Endocrine Glands & Hormones'],
                status: 'completed',
                completionPercentage: 100,
                studyTimeMinutes: 190,
                lastStudied: '2026-08-17',
                nextRevision: '2026-08-27',
                accuracy: 86,
                mockAttempts: 38,
                difficulty: 'Medium',
                isWeak: false,
                weightage: 5,
                notes: 'Fat Soluble: Vitamin A, D, E, K. Water Soluble: Vitamin B-complex, Vitamin C.',
                mistakes: []
              }
            ]
          }
        ]
      }
    ]
  }
];
