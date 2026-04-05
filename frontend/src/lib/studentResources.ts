/**
 * Curated student resource catalog.
 *
 * This stays intentionally metadata-only. We link students to trusted
 * platforms and rank those links based on the selected role and missing
 * skills rather than scraping and storing third-party content.
 */
import { StudentResource } from '@/types';

const normalizeSkill = (value: string) => value.trim().toLowerCase();

const skillAliases: Record<string, string[]> = {
  'node.js': ['node.js', 'node', 'backend', 'api'],
  express: ['express', 'express.js', 'api', 'rest api'],
  sql: ['sql', 'postgresql', 'database'],
  postgresql: ['postgresql', 'postgres', 'sql', 'database'],
  react: ['react', 'frontend', 'ui'],
  typescript: ['typescript', 'javascript'],
  javascript: ['javascript', 'js', 'frontend'],
  html: ['html', 'frontend', 'web'],
  css: ['css', 'frontend', 'responsive design'],
  'responsive design': ['responsive design', 'css', 'frontend'],
  python: ['python', 'data analysis', 'backend'],
  pandas: ['pandas', 'python', 'data analysis'],
  excel: ['excel', 'spreadsheet', 'analysis'],
  'data visualization': ['data visualization', 'power bi', 'dashboard', 'analytics'],
  statistics: ['statistics', 'probability', 'analysis'],
  docker: ['docker', 'containers', 'devops'],
  git: ['git', 'github', 'version control'],
  'rest api': ['rest api', 'api', 'http'],
  'data analysis': ['data analysis', 'python', 'sql', 'pandas'],
  'c programming': ['c programming', 'c', 'embedded c'],
  'microcontrollers': ['microcontrollers', 'arduino', 'esp32', 'embedded'],
  'embedded c': ['embedded c', 'firmware', 'c programming'],
  'digital electronics': ['digital electronics', 'logic design', 'digital systems'],
  'analog electronics': ['analog electronics', 'analog circuits'],
  'signals and systems': ['signals and systems', 'signals'],
  'communication systems': ['communication systems', 'communications'],
  'circuit analysis': ['circuit analysis', 'circuits', 'network theory'],
  'control systems': ['control systems', 'control'],
  'power systems': ['power systems', 'power engineering'],
  instrumentation: ['instrumentation', 'measurement'],
  'electrical machines': ['electrical machines', 'machines'],
  iot: ['iot', 'internet of things', 'microcontrollers'],
  rtos: ['rtos', 'real time operating systems', 'embedded'],
  matlab: ['matlab', 'scilab', 'simulation'],
};

const resourceCatalog: StudentResource[] = [
  {
    id: 'roadmap-frontend',
    title: 'roadmap.sh Frontend',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/frontend',
    description: 'Visual roadmap for frontend fundamentals, frameworks, tooling, and project sequencing.',
    format: 'reference',
    level: 'beginner',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design'],
    roleIds: ['frontend_developer'],
    whyItHelps: 'It gives students a clean progression path from browser basics to job-ready frontend work.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['1st year', '2nd year', '3rd year'],
    roadmapSource: 'roadmap.sh',
  },
  {
    id: 'mdn-web-dev',
    title: 'MDN Learn Web Development',
    provider: 'MDN',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    description: 'A complete browser-platform learning path for HTML, CSS, JavaScript, and web foundations.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
    roleIds: ['frontend_developer', 'full_stack_developer'],
    whyItHelps: 'It builds strong fundamentals before students move into frameworks and portfolio apps.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['1st year', '2nd year'],
    isOfficial: true,
  },
  {
    id: 'react-learn',
    title: 'React Learn',
    provider: 'React',
    url: 'https://react.dev/learn',
    description: 'Official React path for components, state, effects, and app architecture.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['React', 'JavaScript'],
    roleIds: ['frontend_developer', 'full_stack_developer'],
    whyItHelps: 'It maps directly to frontend interview expectations and project work.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['2nd year', '3rd year'],
    isOfficial: true,
  },
  {
    id: 'typescript-docs',
    title: 'TypeScript Documentation',
    provider: 'TypeScript',
    url: 'https://www.typescriptlang.org/docs/',
    description: 'Official TypeScript handbook and language reference.',
    format: 'official_docs',
    level: 'all_levels',
    skills: ['TypeScript', 'JavaScript'],
    roleIds: ['frontend_developer', 'backend_developer', 'full_stack_developer'],
    whyItHelps: 'It helps students write safer, more professional code across the stack.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['2nd year', '3rd year', '4th year'],
    isOfficial: true,
  },
  {
    id: 'web-dev-responsive',
    title: 'web.dev Learn Design',
    provider: 'Google web.dev',
    url: 'https://web.dev/learn/design',
    description: 'Guide to modern responsive layout, breakpoints, and adaptive web design.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['Responsive Design', 'CSS'],
    roleIds: ['frontend_developer', 'full_stack_developer'],
    whyItHelps: 'It turns static layouts into mobile-friendly projects recruiters expect.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['2nd year', '3rd year'],
  },
  {
    id: 'roadmap-backend',
    title: 'roadmap.sh Backend',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/backend',
    description: 'Structured backend roadmap covering APIs, databases, caching, auth, and deployment.',
    format: 'reference',
    level: 'beginner',
    skills: ['Node.js', 'REST API', 'PostgreSQL', 'Docker', 'Git'],
    roleIds: ['backend_developer', 'full_stack_developer'],
    whyItHelps: 'It helps students understand how backend topics connect instead of learning them in isolation.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['2nd year', '3rd year', '4th year'],
    roadmapSource: 'roadmap.sh',
  },
  {
    id: 'nodejs-intro',
    title: 'Introduction to Node.js',
    provider: 'Node.js',
    url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    description: 'Official Node.js introduction for runtime concepts and backend basics.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['Node.js', 'JavaScript'],
    roleIds: ['backend_developer', 'full_stack_developer'],
    whyItHelps: 'It builds the runtime foundation for backend JavaScript roles and API work.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['2nd year', '3rd year'],
    isOfficial: true,
  },
  {
    id: 'express-guide',
    title: 'Express Starter and Guide',
    provider: 'Express',
    url: 'https://expressjs.com/en/starter/installing.html',
    description: 'Official Express starting guide for routing, middleware, and API structure.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['Express', 'REST API', 'Node.js'],
    roleIds: ['backend_developer', 'full_stack_developer'],
    whyItHelps: 'It gives students a fast path to building interview-ready API projects.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['2nd year', '3rd year'],
    isOfficial: true,
  },
  {
    id: 'postgres-sql-tutorial',
    title: 'PostgreSQL SQL Tutorial',
    provider: 'PostgreSQL',
    url: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
    description: 'Official SQL tutorial inside the PostgreSQL documentation.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['SQL', 'PostgreSQL'],
    roleIds: ['backend_developer', 'data_analyst', 'full_stack_developer'],
    whyItHelps: 'It covers real querying skills used in both project work and interviews.',
    branchTags: ['CSE', 'IT', 'ECE', 'EEE'],
    recommendedYears: ['2nd year', '3rd year'],
    isOfficial: true,
  },
  {
    id: 'mdn-http-overview',
    title: 'MDN HTTP Overview',
    provider: 'MDN',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
    description: 'Clear explanation of requests, responses, headers, methods, and web communication.',
    format: 'reference',
    level: 'beginner',
    skills: ['REST API', 'HTTP'],
    roleIds: ['backend_developer', 'frontend_developer', 'full_stack_developer'],
    whyItHelps: 'Understanding HTTP makes debugging API integrations much easier.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['2nd year', '3rd year'],
  },
  {
    id: 'docker-101',
    title: 'Docker 101 Tutorial',
    provider: 'Docker',
    url: 'https://www.docker.com/101-tutorial/',
    description: 'Official Docker tutorial for images, containers, and local packaging.',
    format: 'hands_on',
    level: 'beginner',
    skills: ['Docker'],
    roleIds: ['backend_developer', 'full_stack_developer'],
    whyItHelps: 'Container skills make projects easier to ship and discuss in interviews.',
    branchTags: ['CSE', 'IT'],
    recommendedYears: ['3rd year', '4th year'],
    isOfficial: true,
  },
  {
    id: 'roadmap-fullstack',
    title: 'roadmap.sh Full Stack',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/full-stack',
    description: 'End-to-end roadmap connecting UI, APIs, data, deployment, and product thinking.',
    format: 'reference',
    level: 'intermediate',
    skills: ['React', 'Node.js', 'SQL', 'Git', 'Docker'],
    roleIds: ['full_stack_developer'],
    whyItHelps: 'It helps students build a cohesive skill stack instead of isolated frontend and backend fragments.',
    branchTags: ['CSE', 'IT', 'ECE'],
    recommendedYears: ['3rd year', '4th year'],
    roadmapSource: 'roadmap.sh',
  },
  {
    id: 'python-tutorial',
    title: 'Python Tutorial',
    provider: 'Python',
    url: 'https://docs.python.org/3/tutorial/',
    description: 'Official Python tutorial for syntax, data structures, modules, and standard patterns.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['Python'],
    roleIds: ['data_analyst', 'backend_developer'],
    whyItHelps: 'It gives a clean language base for analytics work, scripting, and automation.',
    branchTags: ['CSE', 'IT', 'ECE', 'EEE'],
    recommendedYears: ['1st year', '2nd year'],
    isOfficial: true,
  },
  {
    id: 'pandas-intro',
    title: 'Pandas Getting Started Tutorials',
    provider: 'Pandas',
    url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html',
    description: 'Official Pandas intro tutorials for working with real tabular data in Python.',
    format: 'hands_on',
    level: 'beginner',
    skills: ['Pandas', 'Data Analysis', 'Python'],
    roleIds: ['data_analyst'],
    whyItHelps: 'It turns raw Python knowledge into real dataframe and analysis skills.',
    branchTags: ['CSE', 'IT', 'ECE', 'EEE'],
    recommendedYears: ['2nd year', '3rd year'],
    isOfficial: true,
  },
  {
    id: 'power-bi-learning',
    title: 'Power BI Learning Path',
    provider: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi/',
    description: 'Microsoft Learn paths for dashboards, reporting, and BI workflows.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['Data Visualization'],
    roleIds: ['data_analyst'],
    whyItHelps: 'It helps students demonstrate business-facing reporting skills, not only raw analysis code.',
    branchTags: ['CSE', 'IT', 'ECE', 'EEE'],
    recommendedYears: ['2nd year', '3rd year', '4th year'],
    isOfficial: true,
  },
  {
    id: 'statistics-khan',
    title: 'Statistics and Probability',
    provider: 'Khan Academy',
    url: 'https://www.khanacademy.org/math/statistics-probability',
    description: 'Structured statistics path covering distributions, inference, and probability basics.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['Statistics'],
    roleIds: ['data_analyst'],
    whyItHelps: 'It strengthens the reasoning behind analysis work, not just the tooling.',
    branchTags: ['CSE', 'IT', 'ECE', 'EEE'],
    recommendedYears: ['1st year', '2nd year'],
  },
  {
    id: 'roadmap-data-analyst',
    title: 'roadmap.sh Data Analyst',
    provider: 'roadmap.sh',
    url: 'https://roadmap.sh/data-analyst',
    description: 'Structured map for SQL, data storytelling, dashboards, and applied analytics.',
    format: 'reference',
    level: 'beginner',
    skills: ['Python', 'SQL', 'Data Analysis', 'Statistics', 'Data Visualization'],
    roleIds: ['data_analyst'],
    whyItHelps: 'It gives students a placement-oriented sequence instead of random analytics tutorials.',
    branchTags: ['CSE', 'IT', 'ECE', 'EEE'],
    recommendedYears: ['2nd year', '3rd year', '4th year'],
    roadmapSource: 'roadmap.sh',
  },
  {
    id: 'arduino-learn',
    title: 'Arduino Learn',
    provider: 'Arduino',
    url: 'https://docs.arduino.cc/learn/',
    description: 'Official Arduino learning hub for boards, sensors, circuits, and prototyping.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['C Programming', 'Microcontrollers', 'Embedded C', 'IoT'],
    roleIds: ['embedded_systems_engineer', 'electronics_communication_engineer'],
    whyItHelps: 'It gives ECE and EEE students a practical entry point into device projects and embedded thinking.',
    branchTags: ['ECE', 'EEE', 'CSE'],
    recommendedYears: ['1st year', '2nd year', '3rd year'],
    isOfficial: true,
  },
  {
    id: 'esp-idf-guide',
    title: 'ESP-IDF Programming Guide',
    provider: 'Espressif',
    url: 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/',
    description: 'Official ESP32 firmware and RTOS guide for embedded systems and IoT projects.',
    format: 'official_docs',
    level: 'intermediate',
    skills: ['Embedded C', 'RTOS', 'Microcontrollers', 'IoT'],
    roleIds: ['embedded_systems_engineer', 'electronics_communication_engineer'],
    whyItHelps: 'It helps students move from hobby prototyping into structured firmware development.',
    branchTags: ['ECE', 'EEE', 'CSE'],
    recommendedYears: ['2nd year', '3rd year', '4th year'],
    isOfficial: true,
  },
  {
    id: 'ltspice-simulator',
    title: 'LTspice Simulator',
    provider: 'Analog Devices',
    url: 'https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html',
    description: 'Official circuit simulation tool entry point for analog and circuit analysis work.',
    format: 'hands_on',
    level: 'beginner',
    skills: ['Circuit Analysis', 'Analog Electronics'],
    roleIds: ['electronics_communication_engineer', 'electrical_core_engineer'],
    whyItHelps: 'It turns circuit theory into simulation-backed understanding and project evidence.',
    branchTags: ['ECE', 'EEE'],
    recommendedYears: ['2nd year', '3rd year'],
    isOfficial: true,
  },
  {
    id: 'swayam-nptel-electronics',
    title: 'SWAYAM NPTEL Catalog',
    provider: 'SWAYAM NPTEL',
    url: 'https://www.swayam.gov.in/nc_details/NPTEL',
    description: 'Official NPTEL catalog entry point for electronics, embedded, signals, and communication courses.',
    format: 'guided_course',
    level: 'all_levels',
    skills: ['Digital Electronics', 'Signals and Systems', 'Communication Systems', 'Microcontrollers'],
    roleIds: ['electronics_communication_engineer', 'embedded_systems_engineer', 'electrical_core_engineer'],
    whyItHelps: 'It gives Indian engineering students semester-style high-trust learning from a familiar academic platform.',
    branchTags: ['ECE', 'EEE'],
    recommendedYears: ['1st year', '2nd year', '3rd year', '4th year'],
    roadmapSource: 'SWAYAM NPTEL',
    isOfficial: true,
  },
  {
    id: 'scilab-tutorials',
    title: 'Scilab Tutorials',
    provider: 'Scilab',
    url: 'https://www.scilab.org/tutorials',
    description: 'Simulation-friendly learning resources for numerical work and control-oriented problem solving.',
    format: 'guided_course',
    level: 'intermediate',
    skills: ['MATLAB', 'Control Systems'],
    roleIds: ['electrical_core_engineer', 'electronics_communication_engineer'],
    whyItHelps: 'It gives students a practical path for simulation and control work even without expensive licensed tools.',
    branchTags: ['EEE', 'ECE'],
    recommendedYears: ['2nd year', '3rd year', '4th year'],
  },
];

const resourceMatchesSkill = (resource: StudentResource, skill: string) => {
  const normalized = normalizeSkill(skill);
  const aliases = skillAliases[normalized] || [normalized];
  return resource.skills.some((entry) => aliases.includes(normalizeSkill(entry)));
};

const scoreResource = (resource: StudentResource, roleId: string, missingSkills: string[]) => {
  let score = 0;
  if (resource.roleIds.includes(roleId)) score += 8;
  if (resource.level === 'beginner') score += 2;
  if (resource.format === 'official_docs' || resource.format === 'guided_course') score += 2;
  if (resource.isOfficial) score += 2;
  for (const skill of missingSkills) {
    if (resourceMatchesSkill(resource, skill)) score += 5;
  }
  return score;
};

const uniqueById = (resources: StudentResource[]) => {
  const seen = new Set<string>();
  return resources.filter((resource) => {
    if (seen.has(resource.id)) return false;
    seen.add(resource.id);
    return true;
  });
};

export const getRoleStarterResources = (roleId: string, limit = 4) => {
  return resourceCatalog.filter((resource) => resource.roleIds.includes(roleId)).slice(0, limit);
};

export const getSkillGapResources = (roleId: string, missingSkills: string[], limit = 8) => {
  return uniqueById(
    resourceCatalog
      .filter(
        (resource) =>
          resource.roleIds.includes(roleId) ||
          missingSkills.some((skill) => resourceMatchesSkill(resource, skill))
      )
      .sort((left, right) => scoreResource(right, roleId, missingSkills) - scoreResource(left, roleId, missingSkills))
  ).slice(0, limit);
};

export const getTopResourceRecommendation = (roleId: string, missingSkills: string[]) => {
  return getSkillGapResources(roleId, missingSkills, 1)[0] || null;
};

export const getResourceCatalog = () => resourceCatalog;
