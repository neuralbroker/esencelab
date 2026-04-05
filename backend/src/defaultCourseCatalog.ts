/**
 * Default trusted course/resource seed catalog.
 *
 * These entries keep recommendations useful even when admins have not yet
 * curated courses manually. Only metadata is stored here; the learning
 * content remains on the original provider platforms.
 */
export interface DefaultCourseSeed {
  id: string;
  title: string;
  description: string;
  provider: string;
  url: string;
  skills: string[];
  duration?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  rating?: number;
}

const defaultCourseSeeds: DefaultCourseSeed[] = [
  {
    id: 'course-mdn-web-dev',
    title: 'MDN Learn Web Development',
    description: 'Official HTML, CSS, JavaScript, and responsive design learning path.',
    provider: 'MDN',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
    duration: 'Self-paced',
    level: 'beginner',
    rating: 4.9,
  },
  {
    id: 'course-roadmap-frontend',
    title: 'roadmap.sh Frontend Roadmap',
    description: 'A structured visual path covering browser basics, frontend frameworks, tooling, and project milestones.',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/frontend',
    skills: ['Frontend', 'JavaScript', 'TypeScript', 'React', 'Responsive Design'],
    duration: 'Self-paced',
    level: 'beginner',
    rating: 4.8,
  },
  {
    id: 'course-node-intro',
    title: 'Introduction to Node.js',
    description: 'Official introduction to Node.js runtime fundamentals and backend development basics.',
    provider: 'Node.js',
    url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    skills: ['Node.js', 'JavaScript'],
    duration: '2-4 hours',
    level: 'beginner',
    rating: 4.8,
  },
  {
    id: 'course-roadmap-backend',
    title: 'roadmap.sh Backend Roadmap',
    description: 'Backend-focused roadmap covering APIs, databases, caching, containers, and deployment.',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/backend',
    skills: ['Node.js', 'REST API', 'PostgreSQL', 'Docker', 'Git'],
    duration: 'Self-paced',
    level: 'intermediate',
    rating: 4.8,
  },
  {
    id: 'course-roadmap-fullstack',
    title: 'roadmap.sh Full Stack Roadmap',
    description: 'Structured learning plan for students who want to combine frontend, backend, and deployment skills.',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/full-stack',
    skills: ['React', 'Node.js', 'SQL', 'Git', 'Docker'],
    duration: 'Self-paced',
    level: 'intermediate',
    rating: 4.7,
  },
  {
    id: 'course-postgres-sql',
    title: 'PostgreSQL SQL Tutorial',
    description: 'Official SQL tutorial for querying, filtering, grouping, and joining real database tables.',
    provider: 'PostgreSQL',
    url: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
    skills: ['SQL', 'PostgreSQL'],
    duration: '3-5 hours',
    level: 'beginner',
    rating: 4.7,
  },
  {
    id: 'course-python-tutorial',
    title: 'Python Tutorial',
    description: 'Official Python tutorial covering language fundamentals and practical programming patterns.',
    provider: 'Python',
    url: 'https://docs.python.org/3/tutorial/',
    skills: ['Python'],
    duration: 'Self-paced',
    level: 'beginner',
    rating: 4.8,
  },
  {
    id: 'course-kaggle-data',
    title: 'Kaggle Learning Paths',
    description: 'Hands-on data analysis and machine learning micro-courses with notebooks and datasets.',
    provider: 'Kaggle',
    url: 'https://www.kaggle.com/learn',
    skills: ['Python', 'Pandas', 'Data Analysis', 'Data Visualization'],
    duration: 'Short modules',
    level: 'beginner',
    rating: 4.8,
  },
  {
    id: 'course-microsoft-powerbi',
    title: 'Microsoft Learn Power BI',
    description: 'Guided dashboards and business-intelligence learning path for analytics students.',
    provider: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi/',
    skills: ['Data Visualization', 'Power BI'],
    duration: 'Self-paced',
    level: 'beginner',
    rating: 4.7,
  },
  {
    id: 'course-roadmap-data-analyst',
    title: 'roadmap.sh Data Analyst Roadmap',
    description: 'Structured path for data analysis fundamentals, SQL, BI, and business storytelling.',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/data-analyst',
    skills: ['SQL', 'Python', 'Data Analysis', 'Statistics', 'Data Visualization'],
    duration: 'Self-paced',
    level: 'beginner',
    rating: 4.7,
  },
  {
    id: 'course-arduino-learn',
    title: 'Arduino Learn',
    description: 'Official Arduino learning hub for circuits, microcontrollers, and hardware prototyping.',
    provider: 'Arduino',
    url: 'https://docs.arduino.cc/learn/',
    skills: ['C Programming', 'Microcontrollers', 'Embedded C', 'IoT'],
    duration: 'Self-paced',
    level: 'beginner',
    rating: 4.7,
  },
  {
    id: 'course-esp-idf',
    title: 'ESP-IDF Programming Guide',
    description: 'Official ESP32 firmware development guide for embedded systems and IoT projects.',
    provider: 'Espressif',
    url: 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/',
    skills: ['Embedded C', 'RTOS', 'Microcontrollers', 'IoT'],
    duration: 'Self-paced',
    level: 'intermediate',
    rating: 4.6,
  },
  {
    id: 'course-ltspice',
    title: 'LTspice Simulator',
    description: 'Official LTspice entry point for simulation-based circuit analysis and design validation.',
    provider: 'Analog Devices',
    url: 'https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html',
    skills: ['Circuit Analysis', 'Analog Electronics'],
    duration: 'Self-paced',
    level: 'beginner',
    rating: 4.6,
  },
  {
    id: 'course-swayam-electronics',
    title: 'SWAYAM NPTEL Electronics and Communication',
    description: 'Official NPTEL catalog entry point for communication, signals, embedded, and electronics courses.',
    provider: 'SWAYAM NPTEL',
    url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    skills: ['Digital Electronics', 'Signals and Systems', 'Communication Systems', 'Embedded C'],
    duration: 'Semester style',
    level: 'beginner',
    rating: 4.7,
  },
  {
    id: 'course-swayam-electrical',
    title: 'SWAYAM NPTEL Electrical Engineering',
    description: 'Official NPTEL learning hub for control systems, power systems, and electrical core subjects.',
    provider: 'SWAYAM NPTEL',
    url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    skills: ['Circuit Analysis', 'Control Systems', 'Power Systems', 'Instrumentation'],
    duration: 'Semester style',
    level: 'beginner',
    rating: 4.7,
  },
];

export const buildDefaultCourses = () => {
  const now = new Date();
  return defaultCourseSeeds.map((entry) => ({
    ...entry,
    createdAt: now,
    updatedAt: now,
  }));
};
