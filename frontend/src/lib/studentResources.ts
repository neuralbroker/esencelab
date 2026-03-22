/**
 * Curated student resource catalog.
 *
 * The user asked for internet-backed learning resources on the student page.
 * Instead of scraping unstable pages at runtime, this file stores a vetted
 * catalog of free official or high-trust resources and ranks them by the
 * student's role and missing skills.
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
};

const resourceCatalog: StudentResource[] = [
  {
    id: 'mdn-web-dev',
    title: 'MDN Learn Web Development',
    provider: 'MDN',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    description: 'A complete browser-platform learning path for HTML, CSS, JavaScript, and web foundations.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
    roleIds: ['frontend_developer'],
    whyItHelps: 'It gives a clean, official front-end foundation before React-specific work.',
  },
  {
    id: 'react-learn',
    title: 'React Learn',
    provider: 'React',
    url: 'https://react.dev/learn',
    description: 'The official React learning path for components, state, effects, and app structure.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['React', 'JavaScript'],
    roleIds: ['frontend_developer'],
    whyItHelps: 'It directly matches the framework used in most front-end role requirements.',
  },
  {
    id: 'typescript-docs',
    title: 'TypeScript Documentation',
    provider: 'TypeScript',
    url: 'https://www.typescriptlang.org/docs/',
    description: 'The official TypeScript handbook and language reference.',
    format: 'official_docs',
    level: 'all_levels',
    skills: ['TypeScript', 'JavaScript'],
    roleIds: ['frontend_developer', 'backend_developer'],
    whyItHelps: 'It helps students move from plain JavaScript into safer production code.',
  },
  {
    id: 'web-dev-responsive',
    title: 'web.dev Learn Design',
    provider: 'Google web.dev',
    url: 'https://web.dev/learn/design',
    description: 'A focused guide to responsive layout, breakpoints, and modern adaptive web design.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['Responsive Design', 'CSS'],
    roleIds: ['frontend_developer'],
    whyItHelps: 'It turns static UI work into mobile-friendly front-end projects recruiters expect.',
  },
  {
    id: 'nodejs-intro',
    title: 'Introduction to Node.js',
    provider: 'Node.js',
    url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    description: 'The official Node.js introduction for runtime concepts and backend basics.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['Node.js', 'JavaScript'],
    roleIds: ['backend_developer'],
    whyItHelps: 'It builds the runtime foundation needed for most backend JavaScript roles.',
  },
  {
    id: 'express-guide',
    title: 'Express Starter and Guide',
    provider: 'Express',
    url: 'https://expressjs.com/en/starter/installing.html',
    description: 'The official Express starting guide for routing, middleware, and app structure.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['Express', 'REST API', 'Node.js'],
    roleIds: ['backend_developer'],
    whyItHelps: 'It maps directly to the framework most students use first for API projects.',
  },
  {
    id: 'postgres-sql-tutorial',
    title: 'PostgreSQL SQL Tutorial',
    provider: 'PostgreSQL',
    url: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
    description: 'The official SQL tutorial inside the PostgreSQL documentation.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['SQL', 'PostgreSQL'],
    roleIds: ['backend_developer', 'data_analyst'],
    whyItHelps: 'It covers real SQL basics with a database engine commonly used in hiring projects.',
  },
  {
    id: 'mdn-http-overview',
    title: 'MDN HTTP Overview',
    provider: 'MDN',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
    description: 'A clear explanation of HTTP requests, responses, methods, headers, and web communication.',
    format: 'reference',
    level: 'beginner',
    skills: ['REST API', 'HTTP'],
    roleIds: ['backend_developer', 'frontend_developer'],
    whyItHelps: 'Understanding HTTP makes API debugging and integration much easier.',
  },
  {
    id: 'fastapi-tutorial',
    title: 'FastAPI Tutorial',
    provider: 'FastAPI',
    url: 'https://fastapi.tiangolo.com/tutorial/',
    description: 'The official FastAPI tutorial for building Python APIs with modern typing support.',
    format: 'official_docs',
    level: 'intermediate',
    skills: ['Python', 'REST API'],
    roleIds: ['backend_developer', 'data_analyst'],
    whyItHelps: 'It helps students build AI and data-backed APIs using the same stack this project already uses.',
  },
  {
    id: 'docker-101',
    title: 'Docker 101 Tutorial',
    provider: 'Docker',
    url: 'https://www.docker.com/101-tutorial/',
    description: 'The official Docker getting-started tutorial for images, containers, and local packaging.',
    format: 'hands_on',
    level: 'beginner',
    skills: ['Docker'],
    roleIds: ['backend_developer'],
    whyItHelps: 'Container skills make projects easier to ship, showcase, and discuss in interviews.',
  },
  {
    id: 'git-book',
    title: 'Pro Git Book',
    provider: 'Git',
    url: 'https://git-scm.com/book/en/v2',
    description: 'The official free Git book covering commits, branches, collaboration, and workflows.',
    format: 'reference',
    level: 'all_levels',
    skills: ['Git'],
    roleIds: ['frontend_developer', 'backend_developer', 'data_analyst'],
    whyItHelps: 'Strong Git basics make team contribution and project explanation much more professional.',
  },
  {
    id: 'python-tutorial',
    title: 'Python Tutorial',
    provider: 'Python',
    url: 'https://docs.python.org/3/tutorial/',
    description: 'The official Python tutorial for syntax, data structures, modules, and standard patterns.',
    format: 'official_docs',
    level: 'beginner',
    skills: ['Python'],
    roleIds: ['data_analyst', 'backend_developer'],
    whyItHelps: 'It gives a clean language foundation for both analytics work and backend scripting.',
  },
  {
    id: 'pandas-intro',
    title: 'Pandas Getting Started Tutorials',
    provider: 'Pandas',
    url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html',
    description: 'The official Pandas intro tutorials for working with real tabular data in Python.',
    format: 'hands_on',
    level: 'beginner',
    skills: ['Pandas', 'Data Analysis', 'Python'],
    roleIds: ['data_analyst'],
    whyItHelps: 'It turns raw Python knowledge into real dataframe and analysis skills.',
  },
  {
    id: 'power-bi-learning',
    title: 'Power BI Learning Path',
    provider: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi/',
    description: 'Microsoft Learn paths for dashboards, reporting, and BI workflows in Power BI.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['Data Visualization'],
    roleIds: ['data_analyst'],
    whyItHelps: 'It helps students show business-facing reporting skills, not only raw analysis code.',
  },
  {
    id: 'excel-training',
    title: 'Excel Video Training',
    provider: 'Microsoft',
    url: 'https://support.microsoft.com/en-us/excel',
    description: 'Official Microsoft learning and help entry point for Excel fundamentals and workflows.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['Excel'],
    roleIds: ['data_analyst'],
    whyItHelps: 'Excel remains a practical requirement for many entry-level analytics roles.',
  },
  {
    id: 'statistics-khan',
    title: 'Statistics and Probability',
    provider: 'Khan Academy',
    url: 'https://www.khanacademy.org/math/statistics-probability',
    description: 'A structured statistics path covering distributions, inference, and probability basics.',
    format: 'guided_course',
    level: 'beginner',
    skills: ['Statistics'],
    roleIds: ['data_analyst'],
    whyItHelps: 'It strengthens the reasoning behind analysis work, not just the tooling.',
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
      .filter((resource) => resource.roleIds.includes(roleId) || missingSkills.some((skill) => resourceMatchesSkill(resource, skill)))
      .sort((left, right) => scoreResource(right, roleId, missingSkills) - scoreResource(left, roleId, missingSkills))
  ).slice(0, limit);
};

export const getTopResourceRecommendation = (roleId: string, missingSkills: string[]) => {
  return getSkillGapResources(roleId, missingSkills, 1)[0] || null;
};

export const getResourceCatalog = () => resourceCatalog;
