/**
 * Career-engine business logic.
 *
 * This file contains the student-focused calculations and generated content
 * used by the backend, such as resume scoring, skill roadmaps, learning
 * plans, weekly planners, and mock interview content.
 */
export type SkillStatus = 'completed' | 'in_progress' | 'missing';

export interface CareerRoleDefinition {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  suggestedTools: string[];
  growthPath: string[];
  track?: string;
  recommendedFor?: string[];
  roadmapSource?: string;
  yearGuidance?: string[];
}

export interface ResumeSectionScores {
  skillsCompleteness: number;
  experienceRelevance: number;
  projectStrength: number;
  formattingConsistency: number;
  skills: number;
  projects: number;
  experience: number;
  education: number;
}

export interface ResumeStrengthScore {
  overallScore: number;
  sections: ResumeSectionScores;
  suggestions: string[];
}

export interface SkillRoadmapItem {
  skill: string;
  status: SkillStatus;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningPlanWeek {
  week: number;
  title: string;
  goals: string[];
  resources: LearningResource[];
}

export interface LearningPlan {
  roleId: string;
  roleName: string;
  durationDays: 30 | 60;
  generatedAt: string;
  weeks: LearningPlanWeek[];
}

export interface LearningResource {
  title: string;
  provider: string;
  url: string;
}

export interface InterviewQuestion {
  question: string;
  suggestedAnswer: string;
}

export interface MockInterviewPack {
  roleId: string;
  roleName: string;
  technical: InterviewQuestion[];
  behavioral: InterviewQuestion[];
}

export interface RecommendationExplanation {
  matchedCount: number;
  totalRequired: number;
  summary: string;
  improvementImpacts: Array<{ skill: string; impact: number }>;
}

export const CAREER_ROLES: CareerRoleDefinition[] = [
  {
    id: 'backend_developer',
    name: 'Backend Developer',
    description: 'Build APIs, data layers, and reliable backend services.',
    requiredSkills: ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Git'],
    suggestedTools: ['Postman', 'pgAdmin', 'Docker Desktop', 'VS Code'],
    growthPath: ['Junior Backend Developer', 'Backend Developer', 'Senior Backend Engineer'],
    track: 'software',
    recommendedFor: ['CSE', 'IT', 'ECE'],
    roadmapSource: 'roadmap.sh + official docs',
    yearGuidance: [
      'Start with programming and SQL in early semesters, then move into APIs and deployment.',
      'By third year, build at least two backend-heavy portfolio projects with databases.',
    ],
  },
  {
    id: 'frontend_developer',
    name: 'Frontend Developer',
    description: 'Build interactive and accessible user interfaces.',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Responsive Design', 'Git'],
    suggestedTools: ['Figma', 'VS Code', 'Chrome DevTools', 'Vite'],
    growthPath: ['Junior Frontend Developer', 'Frontend Developer', 'Senior Frontend Engineer'],
    track: 'software',
    recommendedFor: ['CSE', 'IT', 'ECE'],
    roadmapSource: 'roadmap.sh + official docs',
    yearGuidance: [
      'Use first and second year to build fundamentals, then focus on projects and responsive UI.',
      'By final year, your portfolio should show two polished apps and strong Git discipline.',
    ],
  },
  {
    id: 'full_stack_developer',
    name: 'Full Stack Developer',
    description: 'Combine frontend, backend, database, and deployment skills into end-to-end product delivery.',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'SQL', 'Git'],
    suggestedTools: ['VS Code', 'Postman', 'Docker Desktop', 'Chrome DevTools'],
    growthPath: ['Junior Full Stack Developer', 'Full Stack Developer', 'Product Engineer'],
    track: 'software',
    recommendedFor: ['CSE', 'IT', 'ECE'],
    roadmapSource: 'roadmap.sh + official docs',
    yearGuidance: [
      'Build web fundamentals first, then connect frontend and backend through real projects.',
      'Use third and fourth year for deployment, auth, and interview-ready full stack apps.',
    ],
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Analyze datasets and deliver business insights.',
    requiredSkills: ['Python', 'SQL', 'Excel', 'Pandas', 'Data Visualization', 'Statistics', 'Git'],
    suggestedTools: ['Jupyter Notebook', 'Power BI', 'Tableau', 'Google Colab'],
    growthPath: ['Junior Data Analyst', 'Data Analyst', 'Senior Data Analyst'],
    track: 'software',
    recommendedFor: ['CSE', 'IT', 'ECE', 'EEE'],
    roadmapSource: 'roadmap.sh + Microsoft Learn',
    yearGuidance: [
      'Start with Python and spreadsheets, then move into SQL and dashboard storytelling.',
      'By placement season, be ready with one dashboard project and one business-style case study.',
    ],
  },
  {
    id: 'embedded_systems_engineer',
    name: 'Embedded Systems Engineer',
    description: 'Work on firmware, microcontrollers, hardware interfaces, and real-time device behavior.',
    requiredSkills: ['C Programming', 'Microcontrollers', 'Embedded C', 'Digital Electronics', 'RTOS', 'IoT', 'Git'],
    suggestedTools: ['Arduino IDE', 'PlatformIO', 'VS Code', 'Logic Analyzer'],
    growthPath: ['Embedded Intern', 'Embedded Systems Engineer', 'Firmware Engineer'],
    track: 'electronics',
    recommendedFor: ['ECE', 'EEE', 'CSE'],
    roadmapSource: 'Esencelab + official hardware docs',
    yearGuidance: [
      'Build C and circuit basics early, then move into boards, sensors, and firmware debugging.',
      'Final-year students should target one end-to-end device project with documentation and testing.',
    ],
  },
  {
    id: 'electronics_communication_engineer',
    name: 'Electronics and Communication Track',
    description: 'Strengthen core electronics, communication systems, and practical lab-to-project readiness.',
    requiredSkills: ['Circuit Analysis', 'Analog Electronics', 'Digital Electronics', 'Signals and Systems', 'Communication Systems', 'Embedded C', 'Microcontrollers'],
    suggestedTools: ['LTspice', 'Arduino IDE', 'Oscilloscope', 'MATLAB or Scilab'],
    growthPath: ['ECE Intern', 'Electronics Engineer', 'Communication Systems Engineer'],
    track: 'electronics',
    recommendedFor: ['ECE', 'EEE'],
    roadmapSource: 'Esencelab + SWAYAM NPTEL + official tools',
    yearGuidance: [
      'First and second year should focus on circuits, signals, and digital basics.',
      'By third and fourth year, convert theory into lab simulations, embedded projects, and interview answers.',
    ],
  },
  {
    id: 'electrical_core_engineer',
    name: 'Electrical Core Track',
    description: 'Build a strong electrical engineering base across circuits, control, power, and instrumentation.',
    requiredSkills: ['Circuit Analysis', 'Control Systems', 'Power Systems', 'Instrumentation', 'Electrical Machines', 'MATLAB', 'Technical Communication'],
    suggestedTools: ['LTspice', 'MATLAB or Scilab', 'Multisim', 'Excel'],
    growthPath: ['Electrical Intern', 'Graduate Engineer Trainee', 'Electrical Design Engineer'],
    track: 'electrical',
    recommendedFor: ['EEE', 'ECE'],
    roadmapSource: 'Esencelab + SWAYAM NPTEL + official tools',
    yearGuidance: [
      'Early years should build strong theory and numericals in circuits and machines.',
      'Later years should focus on simulations, instrumentation practice, and placement-ready explanations.',
    ],
  },
];

const SKILL_RESOURCES: Record<string, LearningResource[]> = {
  frontend: [
    {
      title: 'roadmap.sh Frontend Roadmap',
      provider: 'roadmap.sh',
      url: 'https://roadmap.sh/frontend',
    },
  ],
  'node.js': [
    {
      title: 'Introduction to Node.js',
      provider: 'Node.js',
      url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    },
  ],
  express: [
    {
      title: 'Express Starter Guide',
      provider: 'Express',
      url: 'https://expressjs.com/en/starter/installing.html',
    },
  ],
  'c programming': [
    {
      title: 'Learn C Programming',
      provider: 'freeCodeCamp',
      url: 'https://www.freecodecamp.org/news/tag/c-programming/',
    },
  ],
  sql: [
    {
      title: 'PostgreSQL SQL Tutorial',
      provider: 'PostgreSQL',
      url: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
    },
  ],
  postgresql: [
    {
      title: 'PostgreSQL SQL Tutorial',
      provider: 'PostgreSQL',
      url: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
    },
  ],
  'rest api': [
    {
      title: 'MDN HTTP Overview',
      provider: 'MDN',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
    },
  ],
  react: [
    {
      title: 'React Docs - Learn',
      provider: 'React',
      url: 'https://react.dev/learn',
    },
  ],
  'full stack': [
    {
      title: 'roadmap.sh Full Stack Roadmap',
      provider: 'roadmap.sh',
      url: 'https://roadmap.sh/full-stack',
    },
  ],
  typescript: [
    {
      title: 'TypeScript Handbook',
      provider: 'Microsoft',
      url: 'https://www.typescriptlang.org/docs/',
    },
  ],
  javascript: [
    {
      title: 'JavaScript Guide',
      provider: 'MDN',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    },
  ],
  html: [
    {
      title: 'MDN Learn HTML',
      provider: 'MDN',
      url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    },
  ],
  css: [
    {
      title: 'web.dev Learn Design',
      provider: 'Google web.dev',
      url: 'https://web.dev/learn/design',
    },
    {
      title: 'MDN Learn Web Development',
      provider: 'MDN',
      url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    },
  ],
  'responsive design': [
    {
      title: 'web.dev Learn Design',
      provider: 'Google web.dev',
      url: 'https://web.dev/learn/design',
    },
  ],
  python: [
    {
      title: 'Python Tutorial',
      provider: 'Python',
      url: 'https://docs.python.org/3/tutorial/',
    },
  ],
  pandas: [
    {
      title: 'Pandas Intro Tutorials',
      provider: 'Pandas',
      url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html',
    },
  ],
  excel: [
    {
      title: 'Excel Video Training',
      provider: 'Microsoft',
      url: 'https://support.microsoft.com/en-us/excel',
    },
  ],
  docker: [
    {
      title: 'Docker 101 Tutorial',
      provider: 'Docker',
      url: 'https://www.docker.com/101-tutorial/',
    },
  ],
  git: [
    {
      title: 'Pro Git Book',
      provider: 'Git',
      url: 'https://git-scm.com/book/en/v2',
    },
  ],
  'data visualization': [
    {
      title: 'Power BI Learning Path',
      provider: 'Microsoft Learn',
      url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi/',
    },
  ],
  statistics: [
    {
      title: 'Intro to Statistics',
      provider: 'Khan Academy',
      url: 'https://www.khanacademy.org/math/statistics-probability',
    },
  ],
  'circuit analysis': [
    {
      title: 'LTspice Simulator',
      provider: 'Analog Devices',
      url: 'https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html',
    },
  ],
  'analog electronics': [
    {
      title: 'LTspice Simulator',
      provider: 'Analog Devices',
      url: 'https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html',
    },
  ],
  'digital electronics': [
    {
      title: 'SWAYAM NPTEL Catalog',
      provider: 'SWAYAM NPTEL',
      url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    },
  ],
  'signals and systems': [
    {
      title: 'SWAYAM NPTEL Catalog',
      provider: 'SWAYAM NPTEL',
      url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    },
  ],
  'communication systems': [
    {
      title: 'SWAYAM NPTEL Catalog',
      provider: 'SWAYAM NPTEL',
      url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    },
  ],
  'microcontrollers': [
    {
      title: 'Arduino Learn',
      provider: 'Arduino',
      url: 'https://docs.arduino.cc/learn/',
    },
  ],
  'embedded c': [
    {
      title: 'ESP-IDF Get Started',
      provider: 'Espressif',
      url: 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/',
    },
  ],
  rtos: [
    {
      title: 'ESP-IDF Get Started',
      provider: 'Espressif',
      url: 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/',
    },
  ],
  iot: [
    {
      title: 'Arduino Learn',
      provider: 'Arduino',
      url: 'https://docs.arduino.cc/learn/',
    },
  ],
  'control systems': [
    {
      title: 'SWAYAM NPTEL Catalog',
      provider: 'SWAYAM NPTEL',
      url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    },
  ],
  'power systems': [
    {
      title: 'SWAYAM NPTEL Catalog',
      provider: 'SWAYAM NPTEL',
      url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    },
  ],
  instrumentation: [
    {
      title: 'SWAYAM NPTEL Catalog',
      provider: 'SWAYAM NPTEL',
      url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    },
  ],
  'electrical machines': [
    {
      title: 'SWAYAM NPTEL Catalog',
      provider: 'SWAYAM NPTEL',
      url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    },
  ],
  matlab: [
    {
      title: 'Scilab Tutorials',
      provider: 'Scilab',
      url: 'https://www.scilab.org/tutorials',
    },
  ],
  'technical communication': [
    {
      title: 'Career Development',
      provider: 'Microsoft Learn',
      url: 'https://learn.microsoft.com/en-us/training/career-paths/',
    },
  ],
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const toNormalizedSkill = (skill: string) => skill.trim().toLowerCase();

const dedupeNormalized = (skills: string[]) => {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const skill of skills) {
    const normalized = toNormalizedSkill(skill);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
};

const toDisplaySkill = (skill: string) => {
  if (!skill) return '';
  if (skill.length <= 3) return skill.toUpperCase();
  return skill
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const hasSkill = (skills: string[], candidate: string) =>
  skills.includes(toNormalizedSkill(candidate));

const IMPACT_KEYWORDS = [
  'improved',
  'reduced',
  'optimized',
  'increased',
  'delivered',
  'built',
  'designed',
  'implemented',
  'led',
  'launched',
  'automated',
];

const toTextBlob = (value: any): string => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((entry) => toTextBlob(entry)).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((entry) => toTextBlob(entry))
      .join(' ');
  }
  return '';
};

const projectEntries = (parsedData: any): any[] => {
  if (Array.isArray(parsedData?.projects) && parsedData.projects.length > 0) {
    return parsedData.projects;
  }
  const experience = Array.isArray(parsedData?.experience) ? parsedData.experience : [];
  return experience.filter((entry: any) =>
    String(toTextBlob(entry)).toLowerCase().includes('project')
  );
};

const scoreExperienceRelevance = (parsedData: any, roleSkills: string[]) => {
  const experience = Array.isArray(parsedData?.experience) ? parsedData.experience : [];
  if (experience.length === 0) return 0;

  const experienceBlob = toTextBlob(experience).toLowerCase();
  const roleSkillMatches = roleSkills.filter((skill) =>
    experienceBlob.includes(toNormalizedSkill(skill))
  ).length;
  const roleCoverage = roleSkills.length > 0 ? roleSkillMatches / roleSkills.length : 0;
  const depthSignal = Math.min(experience.length / 3, 1);

  return clampPercent(roleCoverage * 70 + depthSignal * 30);
};

const scoreProjectStrength = (parsedData: any) => {
  const projects = projectEntries(parsedData);
  if (projects.length === 0) return 0;

  const projectBlob = toTextBlob(projects).toLowerCase();
  const projectCountScore = Math.min(projects.length / 3, 1) * 60;
  const impactHits = IMPACT_KEYWORDS.filter((keyword) => projectBlob.includes(keyword)).length;
  const impactScore = Math.min(impactHits / 4, 1) * 40;

  return clampPercent(projectCountScore + impactScore);
};

const scoreFormattingConsistency = (parsedData: any, normalizedSkills: string[]) => {
  let score = 0;
  const name = String(parsedData?.name || '').trim();
  const email = String(parsedData?.email || '').trim();
  const summary = String(parsedData?.summary || '').trim();
  const educationCount = Array.isArray(parsedData?.education) ? parsedData.education.length : 0;
  const experienceCount = Array.isArray(parsedData?.experience) ? parsedData.experience.length : 0;

  if (name.length >= 2) score += 20;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) score += 20;
  if (normalizedSkills.length >= 3) score += 20;
  if (summary.length >= 30) score += 15;
  if (experienceCount > 0) score += 15;
  if (educationCount > 0) score += 10;

  return clampPercent(score);
};

const getRole = (roleId: string) => CAREER_ROLES.find((role) => role.id === roleId) || CAREER_ROLES[0];

export const calculateResumeStrength = (
  parsedData: any,
  resumeSkills: string[],
  roleId?: string
): ResumeStrengthScore => {
  const parsedSkills = Array.isArray(parsedData?.skills) ? parsedData.skills : [];
  const normalizedSkills = dedupeNormalized([...resumeSkills, ...parsedSkills]);
  const role = getRole(roleId || CAREER_ROLES[0].id);

  const requiredSkillCount = role.requiredSkills.length || 1;
  const matchedRoleSkills = role.requiredSkills.filter((skill) => hasSkill(normalizedSkills, skill)).length;
  const skillsCompleteness = clampPercent((matchedRoleSkills / requiredSkillCount) * 100);
  const experienceRelevance = scoreExperienceRelevance(parsedData, role.requiredSkills);
  const projectStrength = scoreProjectStrength(parsedData);
  const formattingConsistency = scoreFormattingConsistency(parsedData, normalizedSkills);

  const overallScore = clampPercent(
    skillsCompleteness * 0.4 +
      experienceRelevance * 0.25 +
      projectStrength * 0.2 +
      formattingConsistency * 0.15
  );

  const suggestions: string[] = [];
  if (skillsCompleteness < 70) {
    const missing = role.requiredSkills.filter((skill) => !hasSkill(normalizedSkills, skill)).slice(0, 3);
    if (missing.length > 0) {
      suggestions.push(`Add or strengthen these skills: ${missing.join(', ')}.`);
    }
  }
  if (experienceRelevance < 60) {
    suggestions.push('Make experience bullets role-relevant by including tools, outcomes, and impact.');
  }
  if (projectStrength < 60) {
    suggestions.push('Add at least 2 project highlights with outcomes and tools used.');
  }
  if (formattingConsistency < 70) {
    suggestions.push('Improve resume structure by including clear contact info, summary, and section completeness.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Great progress. Keep your resume updated with latest projects and achievements.');
  }

  return {
    overallScore,
    sections: {
      skillsCompleteness,
      experienceRelevance,
      projectStrength,
      formattingConsistency,
      skills: skillsCompleteness,
      projects: projectStrength,
      experience: experienceRelevance,
      education: formattingConsistency,
    },
    suggestions,
  };
};

export const buildRoadmap = (
  roleId: string,
  resumeSkills: string[],
  skillProgress: Array<{ skillName: string; status: SkillStatus }>
): SkillRoadmapItem[] => {
  const role = getRole(roleId);
  const normalizedSkills = dedupeNormalized(resumeSkills);
  const progressMap = new Map(
    skillProgress.map((entry) => [toNormalizedSkill(entry.skillName), entry.status])
  );

  const total = role.requiredSkills.length || 1;
  const beginnerCutoff = Math.ceil(total / 3);
  const intermediateCutoff = Math.ceil((2 * total) / 3);

  return role.requiredSkills.map((skill, index) => {
    const normalized = toNormalizedSkill(skill);
    const level =
      index < beginnerCutoff ? 'beginner' : index < intermediateCutoff ? 'intermediate' : 'advanced';
    const fromProgress = progressMap.get(normalized);
    if (fromProgress) return { skill, status: fromProgress, level };
    if (normalizedSkills.includes(normalized)) return { skill, status: 'completed', level };
    return { skill, status: 'missing', level };
  });
};

const fallbackResource = (skill: string): LearningResource => ({
  title: `${toDisplaySkill(skill)} Learning Path`,
  provider: 'roadmap.sh',
  url: 'https://roadmap.sh/roadmaps',
});

const pickResources = (skill: string) => {
  const key = toNormalizedSkill(skill);
  const resources = SKILL_RESOURCES[key];
  if (resources && resources.length > 0) return resources;
  return [fallbackResource(skill)];
};

export const generateLearningPlan = (
  roleId: string,
  roadmap: SkillRoadmapItem[],
  durationDays: 30 | 60
): LearningPlan => {
  const role = getRole(roleId);
  const weekCount = durationDays === 60 ? 8 : 4;
  const skillsToFocus = roadmap.filter((entry) => entry.status !== 'completed').map((entry) => entry.skill);
  const fallbackSkills = role.requiredSkills.slice(0, weekCount);
  const focusSkills = skillsToFocus.length > 0 ? skillsToFocus : fallbackSkills;

  const weeks: LearningPlanWeek[] = [];
  for (let index = 0; index < weekCount; index += 1) {
    const primarySkill = focusSkills[index % focusSkills.length];
    const secondarySkill = focusSkills[(index + 1) % focusSkills.length];
    const goals = [
      `Complete core concepts of ${primarySkill}.`,
      `Build one mini project, lab task, or simulation using ${primarySkill}.`,
      `Revise ${secondarySkill} basics and finish 3 practice tasks or notes updates.`,
    ];
    const resources = [...pickResources(primarySkill), ...pickResources(secondarySkill)].slice(0, 3);

    weeks.push({
      week: index + 1,
      title: `Week ${index + 1}: ${primarySkill} Focus`,
      goals,
      resources,
    });
  }

  return {
    roleId: role.id,
    roleName: role.name,
    durationDays,
    generatedAt: new Date().toISOString(),
    weeks,
  };
};

export const generateWeeklyPlanner = (roadmap: SkillRoadmapItem[]) => {
  const focus = roadmap.filter((entry) => entry.status !== 'completed').slice(0, 3);
  const fallback = roadmap.slice(0, 3);
  const selected = focus.length > 0 ? focus : fallback;

  return selected.map((item, index) => ({
    day: index + 1,
    title: `Day ${index + 1}: ${item.skill}`,
    tasks: [
      `Review fundamentals of ${item.skill}.`,
      `Practice one hands-on task, problem, or lab using ${item.skill}.`,
      `Document what you learned and note how it connects to placements or projects.`,
    ],
  }));
};

export const generateMockInterview = (roleId: string): MockInterviewPack => {
  const role = getRole(roleId);
  const coreSkills = role.requiredSkills.slice(0, 4);
  const technical = coreSkills.map((skill) => ({
    question: `How have you used ${skill} in a project, lab, internship, or coursework setting?`,
    suggestedAnswer: `Explain one concrete situation where you used ${skill}, what you personally handled, and what outcome or insight it produced.`,
  }));

  const behavioral: InterviewQuestion[] = [
    {
      question: 'Tell me about a time you faced a difficult bug and how you solved it.',
      suggestedAnswer: 'Use STAR format: situation, your actions, and the measurable outcome.',
    },
    {
      question: 'How do you prioritize tasks when deadlines are tight?',
      suggestedAnswer: 'Explain how you break tasks, estimate impact, and communicate tradeoffs early.',
    },
    {
      question: 'Describe a project where you worked with a team.',
      suggestedAnswer: 'Highlight collaboration, communication, and how your work helped the team deliver.',
    },
  ];

  return {
    roleId: role.id,
    roleName: role.name,
    technical,
    behavioral,
  };
};

export const buildRecommendationExplanation = (
  resumeSkills: string[],
  requiredSkills: string[]
): RecommendationExplanation => {
  const normalizedResumeSkills = dedupeNormalized(resumeSkills);
  const normalizedRequired = dedupeNormalized(requiredSkills);

  const matched = normalizedRequired.filter((skill) => normalizedResumeSkills.includes(skill));
  const missing = normalizedRequired.filter((skill) => !normalizedResumeSkills.includes(skill));
  const matchedCount = matched.length;
  const totalRequired = normalizedRequired.length || 1;

  const summary = `You match ${matchedCount} out of ${normalizedRequired.length} required skills.`;
  const perSkillImpact = totalRequired > 0 ? clampPercent(100 / totalRequired) : 0;
  const improvementImpacts = missing.slice(0, 3).map((skill) => ({
    skill: toDisplaySkill(skill),
    impact: perSkillImpact,
  }));

  return {
    matchedCount,
    totalRequired: normalizedRequired.length,
    summary,
    improvementImpacts,
  };
};

export const deriveProgressDelta = (history: Array<{ score: number; createdAt: Date }>) => {
  if (history.length < 2) return 0;
  const sorted = [...history].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
  );
  const first = sorted[0].score;
  const latest = sorted[sorted.length - 1].score;
  return clampPercent(latest - first);
};

export const getRoleExplorerData = () =>
  CAREER_ROLES.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    requiredSkills: role.requiredSkills,
    suggestedTools: role.suggestedTools,
    growthPath: role.growthPath,
    track: role.track,
    recommendedFor: role.recommendedFor,
    roadmapSource: role.roadmapSource,
    yearGuidance: role.yearGuidance,
  }));
