export type RoadmapCategory =
  | 'role'
  | 'beginner'
  | 'language_framework'
  | 'tool_platform'
  | 'foundation_best_practice';

export interface RoadmapCatalogEntry {
  slug: string;
  title: string;
  category: RoadmapCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  summary: string;
  audience: string;
  keyTopics: string[];
  directUrl: string;
  relatedTracks: string[];
}

const ROADMAP_SLUGS = [
  'ai',
  'ai-agents',
  'ai-data-scientist',
  'ai-engineer',
  'ai-red-teaming',
  'android',
  'angular',
  'api-design',
  'api-security-best-practices',
  'aspnet-core',
  'aws',
  'aws-best-practices',
  'backend',
  'backend-beginner',
  'backend-performance-best-practices',
  'bi-analyst',
  'blockchain',
  'claude-code',
  'cloudflare',
  'code-review-best-practices',
  'computer-science',
  'cpp',
  'css',
  'cyber-security',
  'data-analyst',
  'data-engineer',
  'datastructures-and-algorithms',
  'design-system',
  'devops',
  'devops-beginner',
  'devrel',
  'devsecops',
  'django',
  'docker',
  'elasticsearch',
  'engineering-manager',
  'flutter',
  'frontend',
  'frontend-beginner',
  'frontend-performance-best-practices',
  'full-stack',
  'game-developer',
  'git-github',
  'git-github-beginner',
  'golang',
  'html',
  'ios',
  'java',
  'javascript',
  'kotlin',
  'kubernetes',
  'laravel',
  'linux',
  'machine-learning',
  'mlops',
  'mongodb',
  'nextjs',
  'nodejs',
  'php',
  'postgresql-dba',
  'product-manager',
  'prompt-engineering',
  'python',
  'qa',
  'react',
  'react-native',
  'redis',
  'ruby',
  'ruby-on-rails',
  'rust',
  'scala',
  'server-side-game-developer',
  'shell-bash',
] as const;

const titleOverrides: Record<string, string> = {
  ai: 'AI',
  'ai-agents': 'AI Agents',
  'ai-data-scientist': 'AI Data Scientist',
  'ai-engineer': 'AI Engineer',
  'ai-red-teaming': 'AI Red Teaming',
  angular: 'Angular',
  'api-design': 'API Design',
  'api-security-best-practices': 'API Security Best Practices',
  'aspnet-core': 'ASP.NET Core',
  aws: 'AWS',
  'aws-best-practices': 'AWS Best Practices',
  backend: 'Backend',
  'backend-beginner': 'Backend Beginner',
  'backend-performance-best-practices': 'Backend Performance Best Practices',
  'bi-analyst': 'BI Analyst',
  blockchain: 'Blockchain',
  'claude-code': 'Claude Code',
  cloudflare: 'Cloudflare',
  'code-review-best-practices': 'Code Review Best Practices',
  cpp: 'C++',
  css: 'CSS',
  'cyber-security': 'Cyber Security',
  'data-analyst': 'Data Analyst',
  'data-engineer': 'Data Engineer',
  'datastructures-and-algorithms': 'Data Structures & Algorithms',
  'design-system': 'Design System',
  devops: 'DevOps',
  'devops-beginner': 'DevOps Beginner',
  devrel: 'Developer Relations',
  devsecops: 'DevSecOps',
  django: 'Django',
  docker: 'Docker',
  'engineering-manager': 'Engineering Manager',
  flutter: 'Flutter',
  frontend: 'Frontend',
  'frontend-beginner': 'Frontend Beginner',
  'frontend-performance-best-practices': 'Frontend Performance Best Practices',
  'full-stack': 'Full Stack',
  'game-developer': 'Game Developer',
  'git-github': 'Git & GitHub',
  'git-github-beginner': 'Git & GitHub Beginner',
  golang: 'Go',
  html: 'HTML',
  ios: 'iOS',
  java: 'Java',
  javascript: 'JavaScript',
  kotlin: 'Kotlin',
  kubernetes: 'Kubernetes',
  laravel: 'Laravel',
  linux: 'Linux',
  'machine-learning': 'Machine Learning',
  mlops: 'MLOps',
  mongodb: 'MongoDB',
  nextjs: 'Next.js',
  nodejs: 'Node.js',
  php: 'PHP',
  'postgresql-dba': 'PostgreSQL DBA',
  'product-manager': 'Product Manager',
  'prompt-engineering': 'Prompt Engineering',
  python: 'Python',
  qa: 'QA',
  react: 'React',
  'react-native': 'React Native',
  redis: 'Redis',
  ruby: 'Ruby',
  'ruby-on-rails': 'Ruby on Rails',
  rust: 'Rust',
  scala: 'Scala',
  'server-side-game-developer': 'Server-side Game Developer',
  'shell-bash': 'Shell & Bash',
};

const categorySets: Record<RoadmapCategory, string[]> = {
  role: [
    'ai',
    'ai-agents',
    'ai-data-scientist',
    'ai-engineer',
    'ai-red-teaming',
    'android',
    'backend',
    'bi-analyst',
    'blockchain',
    'cyber-security',
    'data-analyst',
    'data-engineer',
    'devops',
    'devrel',
    'devsecops',
    'engineering-manager',
    'frontend',
    'full-stack',
    'game-developer',
    'ios',
    'machine-learning',
    'mlops',
    'product-manager',
    'qa',
    'server-side-game-developer',
  ],
  beginner: ['backend-beginner', 'devops-beginner', 'frontend-beginner', 'git-github-beginner'],
  language_framework: [
    'angular',
    'aspnet-core',
    'cpp',
    'css',
    'django',
    'flutter',
    'golang',
    'html',
    'java',
    'javascript',
    'kotlin',
    'laravel',
    'nextjs',
    'nodejs',
    'php',
    'python',
    'react',
    'react-native',
    'ruby',
    'ruby-on-rails',
    'rust',
    'scala',
  ],
  tool_platform: [
    'aws',
    'claude-code',
    'cloudflare',
    'docker',
    'elasticsearch',
    'git-github',
    'kubernetes',
    'linux',
    'mongodb',
    'postgresql-dba',
    'redis',
    'shell-bash',
  ],
  foundation_best_practice: [
    'api-design',
    'api-security-best-practices',
    'aws-best-practices',
    'backend-performance-best-practices',
    'code-review-best-practices',
    'computer-science',
    'datastructures-and-algorithms',
    'design-system',
    'frontend-performance-best-practices',
    'prompt-engineering',
  ],
};

const summaryOverrides: Record<string, string> = {
  frontend:
    'Covers the modern frontend journey from browser fundamentals to framework patterns, styling, accessibility, performance, and production-ready interfaces.',
  'frontend-beginner':
    'A beginner-first frontend path that starts with HTML, CSS, JavaScript, and early project building before deeper framework work.',
  backend:
    'Maps backend engineering from APIs and databases to auth, caching, messaging, deployment, and production systems thinking.',
  'backend-beginner':
    'A gentler backend starting path focused on server fundamentals, CRUD APIs, databases, and practical project progression.',
  'full-stack':
    'Connects frontend and backend skills into one product-building path, including auth, state, APIs, persistence, and deployment.',
  'data-analyst':
    'Focuses on SQL, spreadsheets, Python, reporting, dashboards, and communicating insights clearly for business-facing analysis roles.',
  'data-engineer':
    'Covers pipelines, storage, orchestration, transformation, warehousing, and the infrastructure needed to move and trust data at scale.',
  'bi-analyst':
    'Centers on reporting, dashboards, business metrics, stakeholder communication, and data storytelling with practical analytics tooling.',
  devops:
    'Builds the DevOps path from Linux and scripting into CI/CD, cloud, containers, observability, and reliable delivery practices.',
  'devops-beginner':
    'A beginner-friendly DevOps sequence that helps students move from command line basics into deployment and automation workflows.',
  'cyber-security':
    'Introduces security foundations, threat modeling, hardening, testing, response thinking, and safe engineering practices.',
  'ai-engineer':
    'Covers the practical AI engineer stack: models, prompts, evaluation, tooling, orchestration, and shipping AI-assisted products.',
  'ai-data-scientist':
    'Blends machine learning, experimentation, data science reasoning, and the model workflow used in applied AI projects.',
  'ai-agents':
    'Focuses on planning, tool use, orchestration, memory, evaluation, and agent-driven product workflows.',
  'prompt-engineering':
    'Covers prompt design patterns, instruction quality, evaluation, and practical ways to improve AI output reliability.',
  'git-github':
    'Builds core version-control habits for team workflows, portfolio projects, pull requests, and delivery discipline.',
  'git-github-beginner':
    'A first-step roadmap for students who are new to repositories, commits, branching, and collaboration.',
  react:
    'Covers React fundamentals, state, composition, rendering patterns, routing, and practical interface building.',
  nextjs:
    'Maps the Next.js ecosystem around routing, rendering, data fetching, full-stack React, and deployment.',
  nodejs:
    'Focuses on Node.js runtime concepts, packages, async patterns, APIs, and server-side application structure.',
  python:
    'Covers the Python learning path from syntax and scripting into backend, data, and automation use cases.',
  javascript:
    'Builds JavaScript understanding from language fundamentals to browser APIs, async behavior, and modern app development.',
  html: 'A foundation roadmap for semantic structure, forms, accessibility, and the markup skills every web path depends on.',
  css: 'Covers layouts, responsiveness, spacing, visual systems, and the styling fundamentals behind polished interfaces.',
  docker:
    'Focuses on container basics, image workflows, local environments, deployment packaging, and reproducible project setups.',
  kubernetes:
    'Covers orchestration, workloads, scaling, configuration, networking, and operating containerized services at a higher level.',
  linux:
    'Builds Linux fluency for terminals, processes, filesystems, permissions, and developer workflows.',
  'computer-science':
    'Covers the broad CS foundations that make engineering decisions stronger: systems, networking, databases, and algorithms.',
  'datastructures-and-algorithms':
    'A structured path for interview preparation and problem solving through core data structures, patterns, and algorithmic thinking.',
  android:
    'Maps native Android development from language choice to UI, storage, architecture, testing, and mobile release workflows.',
  ios: 'Covers iOS development concepts, app architecture, mobile UX, testing, and the native application lifecycle.',
  qa: 'Focuses on test design, manual and automated quality workflows, reliability, debugging, and release confidence.',
};

const audienceOverrides: Record<string, string> = {
  frontend: 'Students targeting UI-heavy product roles and portfolio-driven web work.',
  backend: 'Students who enjoy APIs, logic, data flow, and system thinking.',
  'full-stack': 'Students who want to build complete products and stay flexible across the stack.',
  'data-analyst': 'Students interested in reporting, dashboards, and business decision support.',
  'bi-analyst': 'Students who want to present insights clearly to teams and management.',
  'data-engineer': 'Students who enjoy systems, storage, and data movement more than presentation.',
  'cyber-security': 'Students aiming for security foundations, safer systems, and security-focused roles.',
  'ai-engineer': 'Students building AI-assisted applications and practical model-backed features.',
  'ai-agents': 'Students interested in tool-using AI systems and orchestration workflows.',
  'backend-beginner': 'Students who are new to server-side development and want a safer entry path.',
  'frontend-beginner': 'Students who are new to development and need a gentler first roadmap.',
  'git-github-beginner': 'Students who have never used Git seriously and need a practical starting point.',
};

const keyTopicOverrides: Record<string, string[]> = {
  frontend: ['HTML, CSS, JavaScript', 'React and UI architecture', 'Performance and accessibility'],
  backend: ['Server runtime and APIs', 'Databases and auth', 'Caching, queues, and deployment'],
  'full-stack': ['Frontend plus backend flow', 'Auth and persistence', 'End-to-end product delivery'],
  'data-analyst': ['SQL and Python', 'Dashboards and reporting', 'Communicating insights'],
  'data-engineer': ['Pipelines and warehousing', 'Transformation and orchestration', 'Data reliability'],
  'bi-analyst': ['Metrics and reporting', 'Dashboard design', 'Business communication'],
  devops: ['Linux and scripting', 'CI/CD and automation', 'Cloud and observability'],
  'cyber-security': ['Security fundamentals', 'Testing and hardening', 'Threat awareness'],
  'ai-engineer': ['Model-backed product work', 'Evaluation and tooling', 'Prompt and workflow design'],
  'ai-agents': ['Tool use and orchestration', 'Memory and planning', 'Evaluation loops'],
  react: ['Components and state', 'Rendering patterns', 'Production React workflows'],
  nextjs: ['Routing and rendering', 'Data fetching', 'Full-stack React delivery'],
  nodejs: ['Runtime and packages', 'Async workflows', 'API development'],
  javascript: ['Language basics', 'Async behavior', 'Browser and app patterns'],
  python: ['Language fundamentals', 'Scripting and automation', 'Data and backend crossover'],
  docker: ['Images and containers', 'Local environment setup', 'Deployment packaging'],
  kubernetes: ['Pods and workloads', 'Config and networking', 'Scaling and operations'],
  linux: ['Terminal basics', 'Processes and permissions', 'Daily developer workflows'],
  'git-github': ['Commits and branches', 'Pull requests', 'Portfolio-ready collaboration'],
  'git-github-beginner': ['Repository basics', 'Commit habits', 'Collaboration starting point'],
  'datastructures-and-algorithms': ['Core structures', 'Problem-solving patterns', 'Interview readiness'],
};

const relatedTrackOverrides: Record<string, string[]> = {
  frontend: ['frontend_developer', 'full_stack_developer'],
  'frontend-beginner': ['frontend_developer', 'full_stack_developer'],
  backend: ['backend_developer', 'full_stack_developer'],
  'backend-beginner': ['backend_developer', 'full_stack_developer'],
  'full-stack': ['full_stack_developer'],
  'data-analyst': ['data_analyst'],
  'bi-analyst': ['data_analyst'],
  'data-engineer': ['data_analyst', 'backend_developer'],
  'ai-engineer': ['backend_developer', 'data_analyst', 'full_stack_developer'],
  'ai-agents': ['backend_developer', 'full_stack_developer', 'data_analyst'],
  'cyber-security': ['backend_developer', 'full_stack_developer'],
  react: ['frontend_developer', 'full_stack_developer'],
  nextjs: ['frontend_developer', 'full_stack_developer'],
  nodejs: ['backend_developer', 'full_stack_developer'],
  javascript: ['frontend_developer', 'backend_developer', 'full_stack_developer'],
  html: ['frontend_developer', 'full_stack_developer'],
  css: ['frontend_developer', 'full_stack_developer'],
  python: ['data_analyst', 'backend_developer'],
  'git-github': [
    'frontend_developer',
    'backend_developer',
    'full_stack_developer',
    'data_analyst',
    'embedded_systems_engineer',
    'electronics_communication_engineer',
    'electrical_core_engineer',
  ],
  'git-github-beginner': [
    'frontend_developer',
    'backend_developer',
    'full_stack_developer',
    'data_analyst',
    'embedded_systems_engineer',
    'electronics_communication_engineer',
    'electrical_core_engineer',
  ],
  linux: ['embedded_systems_engineer', 'electronics_communication_engineer', 'electrical_core_engineer'],
  cpp: ['embedded_systems_engineer', 'electronics_communication_engineer', 'electrical_core_engineer'],
  'computer-science': [
    'embedded_systems_engineer',
    'electronics_communication_engineer',
    'electrical_core_engineer',
    'backend_developer',
  ],
  'datastructures-and-algorithms': [
    'frontend_developer',
    'backend_developer',
    'full_stack_developer',
    'data_analyst',
  ],
};

const difficultyOverrides: Record<string, RoadmapCatalogEntry['difficulty']> = {
  'frontend-beginner': 'beginner',
  'backend-beginner': 'beginner',
  'devops-beginner': 'beginner',
  'git-github-beginner': 'beginner',
  html: 'beginner',
  css: 'beginner',
  javascript: 'beginner',
  python: 'beginner',
};

const categoryLabels: Record<RoadmapCategory, string> = {
  role: 'Role Roadmaps',
  beginner: 'Beginner Roadmaps',
  language_framework: 'Languages & Frameworks',
  tool_platform: 'Tools & Platforms',
  foundation_best_practice: 'Foundations & Best Practices',
};

const inferCategory = (slug: string): RoadmapCategory => {
  for (const [category, slugs] of Object.entries(categorySets) as Array<[RoadmapCategory, string[]]>) {
    if (slugs.includes(slug)) return category;
  }
  return 'role';
};

const inferDifficulty = (slug: string, category: RoadmapCategory): RoadmapCatalogEntry['difficulty'] => {
  if (difficultyOverrides[slug]) return difficultyOverrides[slug];
  if (category === 'beginner') return 'beginner';
  if (category === 'foundation_best_practice') return 'mixed';
  return 'intermediate';
};

const titleFromSlug = (slug: string) => {
  if (titleOverrides[slug]) return titleOverrides[slug];
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const inferAudience = (slug: string, category: RoadmapCategory) => {
  if (audienceOverrides[slug]) return audienceOverrides[slug];
  if (category === 'beginner') return 'Students who want a safer first-step roadmap before going deeper.';
  if (category === 'language_framework') return 'Students who want to strengthen one language or framework for projects and placements.';
  if (category === 'tool_platform') return 'Students who want stronger engineering workflows, environments, and delivery tools.';
  if (category === 'foundation_best_practice') return 'Students who want stronger fundamentals and more mature engineering habits.';
  return 'Students exploring a focused technical path with a structured learning sequence.';
};

const inferSummary = (slug: string, title: string, category: RoadmapCategory) => {
  if (summaryOverrides[slug]) return summaryOverrides[slug];
  if (category === 'beginner') {
    return `A beginner-first ${title} path that helps you start with foundations, practice the basics, and build confidence before moving deeper.`;
  }
  if (category === 'language_framework') {
    return `A focused ${title} roadmap covering the core concepts, practical usage, and project-level skills needed to use ${title} confidently.`;
  }
  if (category === 'tool_platform') {
    return `A structured ${title} roadmap covering setup, workflows, production usage, and the practical habits that make engineering work more reliable.`;
  }
  if (category === 'foundation_best_practice') {
    return `A ${title} roadmap focused on stronger engineering judgment, system understanding, and production-ready habits.`;
  }
  return `A structured ${title} roadmap that helps you learn in the right order and turn topics into practical project progress.`;
};

const inferKeyTopics = (slug: string, title: string, category: RoadmapCategory) => {
  if (keyTopicOverrides[slug]) return keyTopicOverrides[slug];
  if (category === 'beginner') return ['Core foundations', 'Starter projects', 'Next-step roadmap handoff'];
  if (category === 'language_framework') return [`${title} syntax and patterns`, 'Project usage', 'Interview-ready understanding'];
  if (category === 'tool_platform') return ['Setup and workflows', 'Production usage', 'Troubleshooting and operations'];
  if (category === 'foundation_best_practice') return ['Principles and patterns', 'Common mistakes', 'Production-level habits'];
  return ['Core concepts', 'Hands-on project work', 'Placement-focused revision'];
};

const buildRoadmapEntry = (slug: string): RoadmapCatalogEntry => {
  const category = inferCategory(slug);
  const title = titleFromSlug(slug);
  return {
    slug,
    title,
    category,
    difficulty: inferDifficulty(slug, category),
    summary: inferSummary(slug, title, category),
    audience: inferAudience(slug, category),
    keyTopics: inferKeyTopics(slug, title, category),
    directUrl: `https://roadmap.sh/${slug}`,
    relatedTracks: relatedTrackOverrides[slug] || [],
  };
};

export const ROADMAP_CATALOG = ROADMAP_SLUGS.map(buildRoadmapEntry);

export const ROADMAP_CATEGORY_LABELS = categoryLabels;

export const getRoadmapsForTrack = (trackId: string) =>
  ROADMAP_CATALOG.filter((entry) => entry.relatedTracks.includes(trackId));
