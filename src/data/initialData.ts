import { Exam, Subject, AchievementBadge, UserProgressProfile, DailyActivity } from '../types/syllabus';

export const INITIAL_PROFILE: UserProgressProfile = {
  id: 'profile_default',
  name: 'Sunny Rise',
  avatarEmoji: '🦁',
  avatarColor: 'from-amber-500 to-orange-600',
  targetExamDate: '2026-10-15',
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

const INITIAL_SSC_SUBJECTS: Subject[] = [
  {
    id: 'subj_quant',
        name: 'Quantitative Aptitude',
        icon: 'Calculator',
        color: '#2563EB',
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
                ],
                pdfAttachments: [
                  {
                    id: 'pdf_sample_si',
                    name: '06. SIMPLE INTEREST FRB - BY BHUTANI SIR.pdf',
                    fileSize: 1048576,
                    uploadedAt: '2026-08-15T00:00:00.000Z',
                    url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                    type: 'pdf'
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
        color: '#6366F1',
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
        color: '#8B5CF6',
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
        color: '#0D9488',
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
    ];

export const INITIAL_UPSC_SUBJECTS: Subject[] = [
  {
    id: 'subj_upsc_gs1',
    name: 'General Studies I (History & Geography)',
    icon: 'Globe',
    color: '#059669',
    totalChapters: 2,
    chapters: [
      {
        id: 'chap_upsc_history',
        name: 'Indian History, Art & National Movement',
        description: 'Ancient, Medieval, Modern History (1857-1947) & Indian Heritage',
        topics: [
          {
            id: 'top_upsc_modern',
            name: 'Modern Freedom Struggle & National Movement',
            subtopics: ['1857 Revolt & Tribal Uprisings', 'INC Sessions & Moderate-Extremist Split', 'Gandhian Mass Movements (1920-1942)', 'Cabinet Mission & Independence Act 1947'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 320,
            lastStudied: '2026-08-18',
            nextRevision: '2026-08-28',
            accuracy: 84,
            mockAttempts: 32,
            difficulty: 'Hard',
            isWeak: false,
            weightage: 7,
            notes: 'Cabinet Mission Plan (1946) rejected Pakistan demand, proposed grouping of provinces into Sections A, B, C.',
            mistakes: []
          },
          {
            id: 'top_upsc_art',
            name: 'Indian Art, Architecture & Philosophy',
            subtopics: ['Nagara, Dravida & Vesara Temple Architecture', 'Buddhism Hinayana vs Mahayana & Jain Councils', 'Bhakti & Sufi Movement Saints'],
            status: 'in_progress',
            completionPercentage: 60,
            studyTimeMinutes: 180,
            lastStudied: '2026-08-20',
            nextRevision: '2026-08-27',
            accuracy: 78,
            mockAttempts: 20,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 5,
            notes: 'Panchayatana style temple: main shrine surrounded by four subsidiary shrines (e.g. Khajuraho Lakshmana temple).',
            mistakes: []
          }
        ]
      },
      {
        id: 'chap_upsc_geography',
        name: 'Physical & Indian Geography',
        description: 'Geomorphology, Climatology, Oceanography, Indian River Systems',
        topics: [
          {
            id: 'top_upsc_monsoon',
            name: 'Indian Monsoon Mechanism & Climate',
            subtopics: ['Thermal Theory vs Dynamic Jet Stream Concept', 'El Niño-Southern Oscillation (ENSO) & Indian Ocean Dipole', 'Western Disturbances & Winter Rain'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 240,
            lastStudied: '2026-08-16',
            nextRevision: '2026-08-26',
            accuracy: 90,
            mockAttempts: 28,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 6,
            notes: 'Positive IOD warms western Indian Ocean, enhancing monsoon rainfall in India; El Niño brings warming in eastern Pacific, often dampening monsoon.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_upsc_gs2',
    name: 'General Studies II (Polity & Governance)',
    icon: 'BookOpen',
    color: '#2563EB',
    totalChapters: 2,
    chapters: [
      {
        id: 'chap_upsc_polity',
        name: 'Indian Constitution & Federal Framework',
        description: 'Preamble, Fundamental Rights, Separation of Powers, Centre-State Relations',
        topics: [
          {
            id: 'top_upsc_basic_structure',
            name: 'Basic Structure Doctrine & Judicial Review',
            subtopics: ['Kesavananda Bharati Case (1973)', 'Minerva Mills & Waman Rao Doctrines', 'Article 13 vs Article 368 Scope'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 290,
            lastStudied: '2026-08-17',
            nextRevision: '2026-08-27',
            accuracy: 92,
            mockAttempts: 34,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 8,
            notes: 'Basic Structure includes Supremacy of Constitution, Republican & Democratic form, Separation of Powers, Federalism, and Secularism.',
            mistakes: []
          },
          {
            id: 'top_upsc_judiciary',
            name: 'Union & State Judiciary & Special Powers',
            subtopics: ['Collegium System (First, Second, Third Judges Cases)', 'Article 142 Inherent Power for Complete Justice', 'Writs under Article 32 vs 226'],
            status: 'revision_due',
            completionPercentage: 100,
            studyTimeMinutes: 210,
            lastStudied: '2026-08-14',
            nextRevision: '2026-08-23',
            accuracy: 74,
            mockAttempts: 22,
            difficulty: 'Hard',
            isWeak: false,
            weightage: 6,
            notes: 'High Court writ jurisdiction under Art 226 is wider than Supreme Court under Art 32 because it extends to legal rights also.',
            mistakes: []
          }
        ]
      },
      {
        id: 'chap_upsc_governance',
        name: 'Governance, IR & Welfare Mechanisms',
        description: 'Bilateral Relations, Multilateral Groupings (QUAD, BRICS), Social Justice',
        topics: [
          {
            id: 'top_upsc_ir',
            name: 'India Neighborhood Policy & Global Groupings',
            subtopics: ['Neighbourhood First Policy & Act East', 'QUAD, BRICS, SCO, G20 Strategic Frameworks', 'UNSC Reforms & Global South Leadership'],
            status: 'in_progress',
            completionPercentage: 55,
            studyTimeMinutes: 160,
            lastStudied: '2026-08-21',
            nextRevision: '2026-08-25',
            accuracy: 80,
            mockAttempts: 18,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 5,
            notes: 'Strategic autonomy remains core tenet of Indian foreign diplomacy.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_upsc_gs3',
    name: 'General Studies III (Economy & Environment)',
    icon: 'TrendingUp',
    color: '#D97706',
    totalChapters: 2,
    chapters: [
      {
        id: 'chap_upsc_economy',
        name: 'Macroeconomics, Agriculture & Budgeting',
        description: 'Monetary Policy, Fiscal Deficit, Inflation, MSP & Agri Reforms',
        topics: [
          {
            id: 'top_upsc_monetary_policy',
            name: 'RBI Monetary Policy & Inflation Targeting',
            subtopics: ['Repo, Reverse Repo, SDF & MSF Rates', 'Monetary Policy Framework Agreement (Flexible Inflation Target 4±2%)', 'Headline vs Core Inflation (CPI/WPI)'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 260,
            lastStudied: '2026-08-19',
            nextRevision: '2026-08-29',
            accuracy: 86,
            mockAttempts: 30,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 7,
            notes: 'MPC has 6 members: 3 from RBI (including Governor with casting vote) and 3 external members appointed by Central Government.',
            mistakes: []
          }
        ]
      },
      {
        id: 'chap_upsc_environment',
        name: 'Ecology, Climate Change & Biodiversity',
        description: 'Protected Areas, International Conventions, Net Zero Targets',
        topics: [
          {
            id: 'top_upsc_biodiversity',
            name: 'National Parks, Wildlife Corridors & Conventions',
            subtopics: ['Wildlife Protection Act 1972 Schedules (2022 Amendment)', 'UNFCCC COP Summits & Panchamrit Commitments', 'Ramsar Wetlands & Tiger Reserves in India'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 230,
            lastStudied: '2026-08-15',
            nextRevision: '2026-08-25',
            accuracy: 94,
            mockAttempts: 35,
            difficulty: 'Easy',
            isWeak: false,
            weightage: 6,
            notes: 'India committed to Net Zero by 2070 and achieving 50% cumulative electric power from non-fossil sources by 2030.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_upsc_csat',
    name: 'CSAT (Paper II Aptitude & Reading)',
    icon: 'BrainCircuit',
    color: '#7C3AED',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_upsc_csat',
        name: 'Quantitative Aptitude, Logical Reasoning & RC',
        description: 'Qualifying Paper (Minimum 33% / 66 marks required)',
        topics: [
          {
            id: 'top_upsc_num_theory',
            name: 'Number Theory, Permutations & Combinations',
            subtopics: ['Remainder Theorem & Unit Digits', 'Permutation & Combination Seating Puzzles', 'Reading Comprehension Critical Inference Rules'],
            status: 'weak',
            completionPercentage: 50,
            studyTimeMinutes: 190,
            lastStudied: '2026-08-22',
            nextRevision: '2026-08-24',
            accuracy: 58,
            mockAttempts: 25,
            difficulty: 'Hard',
            isWeak: true,
            weightage: 8,
            notes: 'In CSAT, prioritize questions with high accuracy over speed. Total 80 questions, 2.5 marks each with -0.83 penalty.',
            mistakes: []
          }
        ]
      }
    ]
  }
];

export const INITIAL_BANKING_SUBJECTS: Subject[] = [
  {
    id: 'subj_bank_quant',
    name: 'Quantitative Aptitude & Data Interpretation',
    icon: 'Calculator',
    color: '#2563EB',
    totalChapters: 2,
    chapters: [
      {
        id: 'chap_bank_di',
        name: 'High-Level Data Interpretation',
        description: 'Missing DI, Radar, Caselets, Pie & Bar Graphs',
        topics: [
          {
            id: 'top_bank_caselet',
            name: 'Caselet DI & Venn Diagram Formulation',
            subtopics: ['3-Variable Venn Formulation', 'Percentage & Ratio Caselets', 'Income-Expenditure Graphs'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 280,
            lastStudied: '2026-08-17',
            nextRevision: '2026-08-27',
            accuracy: 85,
            mockAttempts: 40,
            difficulty: 'Hard',
            isWeak: false,
            weightage: 8,
            notes: 'Read entire caselet first to identify common base variable before creating tables.',
            mistakes: []
          }
        ]
      },
      {
        id: 'chap_bank_speedmath',
        name: 'Speed Math & Arithmetic',
        description: 'Quadratic Equations, Number Series, Simplification',
        topics: [
          {
            id: 'top_bank_quadratic',
            name: 'Quadratic Equations (Sign Table Technique)',
            subtopics: ['Root Sign Shortcut Table', 'Coefficient Normalization', 'Large Constant Factorization'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 200,
            lastStudied: '2026-08-19',
            nextRevision: '2026-08-29',
            accuracy: 94,
            mockAttempts: 50,
            difficulty: 'Easy',
            isWeak: false,
            weightage: 5,
            notes: 'If constant terms in both equations are negative (-), answer is always Relationship Cannot Be Established (CND).',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_bank_reasoning',
    name: 'Reasoning Ability & Puzzles',
    icon: 'BrainCircuit',
    color: '#6366F1',
    totalChapters: 2,
    chapters: [
      {
        id: 'chap_bank_puzzles',
        name: 'High-Level Seating & Puzzles',
        description: 'Floor, Box, Month-Date, Parallel Row, Uncertain Persons',
        topics: [
          {
            id: 'top_bank_floor_box',
            name: 'Floor & Flat, Box Stacking Puzzles',
            subtopics: ['Floor + Flat 2-Variable Grids', 'Box Stacking with Definite Clues', 'Uncertain Number of People in Line'],
            status: 'in_progress',
            completionPercentage: 65,
            studyTimeMinutes: 310,
            lastStudied: '2026-08-21',
            nextRevision: '2026-08-25',
            accuracy: 78,
            mockAttempts: 35,
            difficulty: 'Hard',
            isWeak: false,
            weightage: 9,
            notes: 'Start with 2 parallel possibilities immediately to avoid erasing and losing time.',
            mistakes: []
          }
        ]
      },
      {
        id: 'chap_bank_misc_reasoning',
        name: 'Logical & Analytical Reasoning',
        description: 'Syllogism (Only a few), Coded Inequalities, Input-Output',
        topics: [
          {
            id: 'top_bank_syllogism',
            name: 'Syllogism (Only a Few & Possibility)',
            subtopics: ['Only a few A are B = Some A are B + Some A are not B', 'Can be vs Can never be', 'Reverse Syllogism'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 220,
            lastStudied: '2026-08-18',
            nextRevision: '2026-08-28',
            accuracy: 90,
            mockAttempts: 45,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 5,
            notes: 'Remember: All A can never be B if Only a few A are B.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_bank_english',
    name: 'English Language & Comprehension',
    icon: 'BookMarked',
    color: '#0D9488',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_bank_grammar_rc',
        name: 'Reading Comprehension, Cloze Test & Error Spotting',
        description: 'Banking context editorials and grammar mechanics',
        topics: [
          {
            id: 'top_bank_rc',
            name: 'Banking & Financial Reading Comprehension',
            subtopics: ['Central Theme & Tone of Author', 'Vocabulary in Context (Synonyms/Antonyms)', 'Direct vs Inference-based Questions'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 210,
            lastStudied: '2026-08-16',
            nextRevision: '2026-08-26',
            accuracy: 82,
            mockAttempts: 30,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 7,
            notes: 'Read first 2 lines and last 2 lines of each paragraph to quickly capture editorial flow.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_bank_awareness',
    name: 'General & Banking Awareness',
    icon: 'ShieldCheck',
    color: '#EA580C',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_bank_financial_gk',
        name: 'Banking System, RBI Norms & Financial News',
        description: 'NPA, Basel III, Capital Adequacy, Digital Banking Schemes',
        topics: [
          {
            id: 'top_bank_regulatory',
            name: 'RBI Functions, Monetary Policy & Banking Structure',
            subtopics: ['Small Finance Banks vs Payments Banks', 'PCA Framework & Basel III Capital Ratios', 'Priority Sector Lending (PSL) Targets (40% for Domestic Banks)'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 250,
            lastStudied: '2026-08-15',
            nextRevision: '2026-08-25',
            accuracy: 88,
            mockAttempts: 38,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 8,
            notes: 'Payments banks cannot issue credit cards or accept term deposits (maximum balance Rs 2 lakh per individual).',
            mistakes: []
          }
        ]
      }
    ]
  }
];

export const INITIAL_RAILWAY_SUBJECTS: Subject[] = [
  {
    id: 'subj_rrb_math',
    name: 'Mathematics',
    icon: 'Calculator',
    color: '#2563EB',
    totalChapters: 2,
    chapters: [
      {
        id: 'chap_rrb_arithmetic',
        name: 'Arithmetic & Number Systems',
        description: 'Percentages, Ratio, SI/CI, Time & Work, Speed Distance',
        topics: [
          {
            id: 'top_rrb_percentage',
            name: 'Percentages & Profit-Loss Calculations',
            subtopics: ['Fraction to Percent Conversion', 'Discount & Marked Price Formulas', 'Partnership Share Ratios'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 210,
            lastStudied: '2026-08-18',
            nextRevision: '2026-08-28',
            accuracy: 92,
            mockAttempts: 35,
            difficulty: 'Easy',
            isWeak: false,
            weightage: 6,
            notes: 'Speed is critical in RRB NTPC Stage 1. Use 1/6 = 16.66%, 1/7 = 14.28%, 1/8 = 12.5%.',
            mistakes: []
          }
        ]
      },
      {
        id: 'chap_rrb_advance',
        name: 'Elementary Algebra & Mensuration',
        description: '2D/3D Mensuration, Basic Trigonometry, Elementary Statistics',
        topics: [
          {
            id: 'top_rrb_mensuration',
            name: 'Mensuration 2D & 3D Solids',
            subtopics: ['Circle, Cylinder & Cone Formulas', 'Volume & Total Surface Area Comparisons', 'Statistics: Mean, Median, Mode'],
            status: 'in_progress',
            completionPercentage: 60,
            studyTimeMinutes: 180,
            lastStudied: '2026-08-20',
            nextRevision: '2026-08-27',
            accuracy: 80,
            mockAttempts: 25,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 7,
            notes: 'Empirical formula: Mode = 3 Median - 2 Mean.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_rrb_reasoning',
    name: 'General Intelligence & Reasoning',
    icon: 'BrainCircuit',
    color: '#6366F1',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_rrb_logic',
        name: 'Logical, Verbal & Non-Verbal Reasoning',
        description: 'Analogies, Series, Coding-Decoding, Venn Diagrams, Syllogisms',
        topics: [
          {
            id: 'top_rrb_analogies',
            name: 'Analogy, Classification & Coding-Decoding',
            subtopics: ['Letter Shift Patterns & Opposites', 'Number Series Differences & Squares', 'Blood Relations Tree Diagram'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 220,
            lastStudied: '2026-08-16',
            nextRevision: '2026-08-26',
            accuracy: 90,
            mockAttempts: 40,
            difficulty: 'Easy',
            isWeak: false,
            weightage: 8,
            notes: 'Opposite letters shortcut: A-Z (Azad), B-Y (Boy), C-X (Crux), D-W (Dew), E-V (Love), G-T (GT Road), H-S (High School), I-R (Indian Railway), J-Q (Jack Queen), K-P (Kurta Pajama), M-N (Man).',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_rrb_science_ga',
    name: 'General Science & Current Affairs',
    icon: 'Sparkles',
    color: '#059669',
    totalChapters: 2,
    chapters: [
      {
        id: 'chap_rrb_science',
        name: 'General Science (Physics, Chemistry, Biology)',
        description: '10th Standard CBSE level core science questions',
        topics: [
          {
            id: 'top_rrb_physics_chem',
            name: 'Physics & Chemistry Core Laws',
            subtopics: ["Newton's Laws of Motion & Work-Energy", 'Ohm’s Law & Resistance in Series/Parallel', 'Periodic Table Elements & Chemical Reactions'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 260,
            lastStudied: '2026-08-19',
            nextRevision: '2026-08-29',
            accuracy: 86,
            mockAttempts: 42,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 8,
            notes: 'Power of lens = 1 / focal length in meters. Unit is Dioptre (D).',
            mistakes: []
          }
        ]
      },
      {
        id: 'chap_rrb_current_affairs',
        name: 'General Awareness & Indian Railways GK',
        description: 'Indian Railway history, modern initiatives (Vande Bharat, Kavach), National GK',
        topics: [
          {
            id: 'top_rrb_railways_gk',
            name: 'Indian Railway History & Safety Systems',
            subtopics: ['First train 1853 Mumbai to Thane', 'Kavach Automatic Train Protection (ATP) System', 'Railway Zones & Headquarters Map'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 190,
            lastStudied: '2026-08-15',
            nextRevision: '2026-08-25',
            accuracy: 94,
            mockAttempts: 36,
            difficulty: 'Easy',
            isWeak: false,
            weightage: 6,
            notes: '18 Railway zones currently in India (Southern Railway HQ: Chennai, Western: Mumbai Churchgate, Northern: New Delhi).',
            mistakes: []
          }
        ]
      }
    ]
  }
];

export const INITIAL_STATE_PCS_SUBJECTS: Subject[] = [
  {
    id: 'subj_pcs_gs',
    name: 'General Studies & Indian Polity',
    icon: 'BookOpen',
    color: '#2563EB',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_pcs_polity',
        name: 'Indian Polity, Governance & Panchayati Raj',
        description: '73rd & 74th Amendments, Governor Powers, State Public Service Commissions',
        topics: [
          {
            id: 'top_pcs_panchayati_raj',
            name: 'Panchayati Raj & Local Self Government',
            subtopics: ['Balwant Rai Mehta & Ashok Mehta Committees', '73rd Amendment 11th Schedule 29 Subjects', 'State Election Commission & Finance Commission'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 240,
            lastStudied: '2026-08-17',
            nextRevision: '2026-08-27',
            accuracy: 88,
            mockAttempts: 30,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 7,
            notes: 'Rajasthan (Nagaur) was the first state to establish Panchayati Raj on 2nd October 1959.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_pcs_history',
    name: 'History & Geography',
    icon: 'Globe',
    color: '#D97706',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_pcs_history_geo',
        name: 'Indian & Regional History & Geography',
        description: 'Revolt of 1857, Freedom Movement, Soils, Rivers & Minerals',
        topics: [
          {
            id: 'top_pcs_revolt_1857',
            name: '1857 Revolt Leaders & Regional Centres',
            subtopics: ['Centres of Revolt (Meerut, Delhi, Kanpur, Lucknow, Jhansi, Arrah)', 'Begum Hazrat Mahal, Kunwar Singh & Tantia Tope', 'Aftermath: Queen Victoria Proclamation 1858'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 210,
            lastStudied: '2026-08-18',
            nextRevision: '2026-08-28',
            accuracy: 92,
            mockAttempts: 32,
            difficulty: 'Easy',
            isWeak: false,
            weightage: 6,
            notes: 'Kunwar Singh led the 1857 revolt in Arrah (Jagdishpur), Bihar.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_pcs_state_special',
    name: 'State Specific GK & Current Affairs',
    icon: 'Award',
    color: '#059669',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_pcs_state_special',
        name: 'State Geography, Culture, Budget & Schemes',
        description: 'State wildlife, rivers, industrial corridors, folklore & welfare initiatives',
        topics: [
          {
            id: 'top_pcs_state_schemes',
            name: 'State Welfare Schemes & Annual Budget',
            subtopics: ['Major Flagship Schemes for Youth & Agriculture', 'State Economic Survey Highlights', 'Major Festivals, Dialects & Archaeological Sites'],
            status: 'in_progress',
            completionPercentage: 60,
            studyTimeMinutes: 190,
            lastStudied: '2026-08-20',
            nextRevision: '2026-08-27',
            accuracy: 80,
            mockAttempts: 25,
            difficulty: 'Medium',
            isWeak: false,
            weightage: 8,
            notes: 'Review the latest state budget deficit percentage and major welfare allocations.',
            mistakes: []
          }
        ]
      }
    ]
  },
  {
    id: 'subj_pcs_csat',
    name: 'General Aptitude & Reasoning',
    icon: 'BrainCircuit',
    color: '#7C3AED',
    totalChapters: 1,
    chapters: [
      {
        id: 'chap_pcs_aptitude',
        name: 'Interpersonal Skills, Logic & Basic Numeracy',
        description: 'Communication skills, decision making, analytical ability, class 10 math',
        topics: [
          {
            id: 'top_pcs_decision_making',
            name: 'Decision Making & Problem Solving',
            subtopics: ['Administrative Case Scenarios', 'Statement & Conclusion Logic', 'Basic Quantitative Data Handling'],
            status: 'completed',
            completionPercentage: 100,
            studyTimeMinutes: 160,
            lastStudied: '2026-08-15',
            nextRevision: '2026-08-25',
            accuracy: 86,
            mockAttempts: 28,
            difficulty: 'Easy',
            isWeak: false,
            weightage: 5,
            notes: 'In administrative decision-making, always prioritize constitutional legality, public welfare, and non-discrimination.',
            mistakes: []
          }
        ]
      }
    ]
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam_ssc_cgl_2026',
    name: 'SSC CGL 2026',
    code: 'SSC_CGL',
    targetYear: 2026,
    examDate: '2026-10-15',
    subjects: INITIAL_SSC_SUBJECTS
  },
  {
    id: 'exam_upsc_cse_2026',
    name: 'UPSC CSE 2026',
    code: 'UPSC_CSE',
    targetYear: 2026,
    examDate: '2026-05-24',
    subjects: INITIAL_UPSC_SUBJECTS
  },
  {
    id: 'exam_ibps_po_2026',
    name: 'IBPS PO 2026',
    code: 'IBPS_PO',
    targetYear: 2026,
    examDate: '2026-11-10',
    subjects: INITIAL_BANKING_SUBJECTS
  },
  {
    id: 'exam_rrb_ntpc_2026',
    name: 'Railway RRB NTPC 2026',
    code: 'RRB_NTPC',
    targetYear: 2026,
    examDate: '2026-09-18',
    subjects: INITIAL_RAILWAY_SUBJECTS
  },
  {
    id: 'exam_state_pcs_2026',
    name: 'State PCS 2026',
    code: 'STATE_PCS',
    targetYear: 2026,
    examDate: '2026-12-05',
    subjects: INITIAL_STATE_PCS_SUBJECTS
  },
  {
    id: 'exam_ssc_cgl_2025',
    name: 'SSC CGL 2025',
    code: 'SSC_CGL',
    targetYear: 2025,
    examDate: '2025-09-15',
    subjects: JSON.parse(JSON.stringify(INITIAL_SSC_SUBJECTS))
  }
];

export interface ExamPresetCatalogItem {
  id: string;
  name: string;
  code: string;
  targetYear: number;
  examDate: string;
  badge: string;
  category: string;
  description: string;
  subjects: Subject[];
}

export const EXAM_PRESETS_CATALOG: ExamPresetCatalogItem[] = [
  {
    id: 'exam_ssc_cgl_2026',
    name: 'SSC CGL 2026',
    code: 'SSC_CGL',
    targetYear: 2026,
    examDate: '2026-10-15',
    badge: 'SSC Staff Selection',
    category: 'ssc',
    description: 'Tier 1 & Tier 2: Quant, Reasoning, English, General Awareness',
    subjects: INITIAL_SSC_SUBJECTS
  },
  {
    id: 'exam_upsc_cse_2026',
    name: 'UPSC CSE 2026',
    code: 'UPSC_CSE',
    targetYear: 2026,
    examDate: '2026-05-24',
    badge: 'Civil Services Prelims',
    category: 'upsc',
    description: 'GS I (History/Geo), GS II (Polity), GS III (Economy/Env), CSAT',
    subjects: INITIAL_UPSC_SUBJECTS
  },
  {
    id: 'exam_ibps_po_2026',
    name: 'IBPS PO 2026',
    code: 'IBPS_PO',
    targetYear: 2026,
    examDate: '2026-11-10',
    badge: 'Bank PO / Officer',
    category: 'banking',
    description: 'Data Interpretation, Reasoning Puzzles, English, Banking Awareness',
    subjects: INITIAL_BANKING_SUBJECTS
  },
  {
    id: 'exam_rrb_ntpc_2026',
    name: 'Railway RRB NTPC 2026',
    code: 'RRB_NTPC',
    targetYear: 2026,
    examDate: '2026-09-18',
    badge: 'Railway Recruitment',
    category: 'railway',
    description: 'Mathematics, General Intelligence, Core Science & Railway GK',
    subjects: INITIAL_RAILWAY_SUBJECTS
  },
  {
    id: 'exam_state_pcs_2026',
    name: 'State PCS 2026',
    code: 'STATE_PCS',
    targetYear: 2026,
    examDate: '2026-12-05',
    badge: 'State Public Service',
    category: 'state_pcs',
    description: 'General Studies, History, State Specific GK, CSAT Aptitude',
    subjects: INITIAL_STATE_PCS_SUBJECTS
  },
  {
    id: 'exam_ssc_chsl_2026',
    name: 'SSC CHSL 2026',
    code: 'SSC_CHSL',
    targetYear: 2026,
    examDate: '2026-07-20',
    badge: 'Higher Secondary',
    category: 'ssc',
    description: 'Quant, Reasoning, English, General Awareness (10+2 Level)',
    subjects: JSON.parse(JSON.stringify(INITIAL_SSC_SUBJECTS))
  }
];

