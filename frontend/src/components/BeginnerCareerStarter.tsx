'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Compass, GraduationCap, Sparkles } from 'lucide-react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { getReadableErrorMessage, setTargetRole } from '@/lib/dashboardApi';

type BeginnerAnswers = {
  year: '1st year' | '2nd year' | '3rd year' | '4th year';
  branch: 'cse_it' | 'ece' | 'eee' | 'other';
  workStyle: 'interfaces' | 'logic' | 'insights' | 'devices' | 'core';
  favoriteTask: 'design' | 'build' | 'analyze' | 'tinker' | 'circuits';
  strength: 'communication' | 'logic' | 'math' | 'hands_on' | 'patience';
};

interface BeginnerCareerStarterProps {
  onUseUploadFlow: () => void;
  onSavedTrack?: (message: string) => void;
  onError?: (message: string) => void;
}

interface BeginnerBlueprint {
  id: string;
  name: string;
  overview: string;
  fitSummary: string;
  resumeSections: string[];
  starterSkills: string[];
  starterProjects: string[];
  firstSteps: string[];
}

const beginnerBlueprints: Record<string, BeginnerBlueprint> = {
  frontend_developer: {
    id: 'frontend_developer',
    name: 'Frontend Developer',
    overview: 'Best for students who enjoy interfaces, polish, and turning ideas into usable screens.',
    fitSummary: 'You are leaning toward UI work, user experience, and portfolio-ready web projects.',
    resumeSections: ['Education', 'Technical Skills', 'Projects', 'Achievements', 'Links'],
    starterSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design'],
    starterProjects: ['Portfolio website', 'Landing page clone', 'Student dashboard UI'],
    firstSteps: [
      'Start with HTML, CSS, and JavaScript fundamentals.',
      'Build two responsive mini-projects before learning advanced frameworks.',
      'Keep screenshots and live links for every project.',
    ],
  },
  backend_developer: {
    id: 'backend_developer',
    name: 'Backend Developer',
    overview: 'Best for students who enjoy logic, APIs, data flow, and system building more than visuals.',
    fitSummary: 'You are leaning toward server-side problem solving, databases, and application logic.',
    resumeSections: ['Education', 'Technical Skills', 'Projects', 'Internships or Labs', 'Links'],
    starterSkills: ['Node.js', 'Express', 'SQL', 'REST API', 'Git'],
    starterProjects: ['Student records API', 'Authentication service', 'Job board backend'],
    firstSteps: [
      'Learn one backend runtime and one database properly.',
      'Build small CRUD APIs with authentication and documentation.',
      'Practice explaining architecture decisions clearly on your resume.',
    ],
  },
  full_stack_developer: {
    id: 'full_stack_developer',
    name: 'Full Stack Developer',
    overview: 'Best for students who want to build complete products end to end and like variety.',
    fitSummary: 'You are leaning toward balanced product building across UI, APIs, and deployment.',
    resumeSections: ['Education', 'Technical Skills', 'Full Projects', 'Experience', 'Links'],
    starterSkills: ['React', 'Node.js', 'SQL', 'Git', 'Deployment'],
    starterProjects: ['Full stack task manager', 'Placement tracker app', 'Campus event portal'],
    firstSteps: [
      'Get comfortable with both browser and backend basics before scaling up.',
      'Build one complete product with login, data storage, and deployment.',
      'Use GitHub and write project notes that explain your impact.',
    ],
  },
  data_analyst: {
    id: 'data_analyst',
    name: 'Data Analyst',
    overview: 'Best for students who enjoy patterns, numbers, dashboards, and explaining insights clearly.',
    fitSummary: 'You are leaning toward analysis, reporting, and turning data into decisions.',
    resumeSections: ['Education', 'Technical Skills', 'Projects', 'Certifications', 'Links'],
    starterSkills: ['Python', 'SQL', 'Excel', 'Statistics', 'Data Visualization'],
    starterProjects: ['Sales dashboard', 'Placement trend analysis', 'Survey insights report'],
    firstSteps: [
      'Start with Python, spreadsheets, SQL, and basic statistics together.',
      'Build one project that ends with a dashboard or recommendation.',
      'Show numbers, findings, and decision impact in your resume bullets.',
    ],
  },
  embedded_systems_engineer: {
    id: 'embedded_systems_engineer',
    name: 'Embedded Systems Engineer',
    overview: 'Best for students who enjoy devices, firmware, sensors, and practical electronics projects.',
    fitSummary: 'You are leaning toward microcontrollers, hardware-software integration, and hands-on building.',
    resumeSections: ['Education', 'Technical Skills', 'Lab or Hardware Projects', 'Achievements', 'Links'],
    starterSkills: ['C Programming', 'Embedded C', 'Microcontrollers', 'IoT', 'RTOS basics'],
    starterProjects: ['Smart sensor node', 'IoT monitoring system', 'ESP32 automation project'],
    firstSteps: [
      'Learn C well before moving deeper into firmware work.',
      'Start with Arduino or ESP32 projects and document wiring plus outcomes.',
      'Show project photos, metrics, and hardware tools in your resume.',
    ],
  },
  electronics_communication_engineer: {
    id: 'electronics_communication_engineer',
    name: 'ECE Core / Communication',
    overview: 'Best for students who enjoy signals, circuits, communication systems, and electronics labs.',
    fitSummary: 'You are leaning toward electronics concepts with strong placement value in communication and embedded-adjacent roles.',
    resumeSections: ['Education', 'Core Skills', 'Mini Projects', 'Lab Work', 'Achievements'],
    starterSkills: ['Signals and Systems', 'Digital Electronics', 'Communication Systems', 'Microcontrollers'],
    starterProjects: ['Signal processing demo', 'Digital communication mini-project', 'Embedded communication node'],
    firstSteps: [
      'Strengthen fundamentals in signals, digital electronics, and communication.',
      'Support theory with simulations and mini hardware builds.',
      'Write project bullets around outcomes, not only components used.',
    ],
  },
  electrical_core_engineer: {
    id: 'electrical_core_engineer',
    name: 'EEE Core / Electrical Systems',
    overview: 'Best for students who enjoy circuits, control, machines, instrumentation, and applied electrical systems.',
    fitSummary: 'You are leaning toward electrical fundamentals, simulation, and practical system understanding.',
    resumeSections: ['Education', 'Core Skills', 'Projects', 'Lab Work', 'Achievements'],
    starterSkills: ['Circuit Analysis', 'Control Systems', 'Power Systems', 'Instrumentation'],
    starterProjects: ['Motor control mini-project', 'Power monitoring dashboard', 'Control system simulation'],
    firstSteps: [
      'Build strong fundamentals in circuits, machines, and control systems.',
      'Use simulations and practical experiments to support theory.',
      'Include measurable project outcomes and tools on your resume.',
    ],
  },
};

const beginnerWeights: Record<keyof BeginnerAnswers, Record<string, string[]>> = {
  year: {
    '1st year': ['frontend_developer', 'data_analyst', 'embedded_systems_engineer'],
    '2nd year': ['full_stack_developer', 'backend_developer', 'electronics_communication_engineer'],
    '3rd year': ['full_stack_developer', 'backend_developer', 'electrical_core_engineer'],
    '4th year': ['backend_developer', 'data_analyst', 'electronics_communication_engineer'],
  },
  branch: {
    cse_it: ['frontend_developer', 'backend_developer', 'full_stack_developer', 'data_analyst'],
    ece: ['embedded_systems_engineer', 'electronics_communication_engineer', 'frontend_developer'],
    eee: ['electrical_core_engineer', 'embedded_systems_engineer', 'data_analyst'],
    other: ['full_stack_developer', 'data_analyst', 'frontend_developer'],
  },
  workStyle: {
    interfaces: ['frontend_developer', 'full_stack_developer'],
    logic: ['backend_developer', 'full_stack_developer'],
    insights: ['data_analyst'],
    devices: ['embedded_systems_engineer', 'electronics_communication_engineer'],
    core: ['electronics_communication_engineer', 'electrical_core_engineer'],
  },
  favoriteTask: {
    design: ['frontend_developer', 'full_stack_developer'],
    build: ['backend_developer', 'full_stack_developer'],
    analyze: ['data_analyst'],
    tinker: ['embedded_systems_engineer', 'electronics_communication_engineer'],
    circuits: ['electronics_communication_engineer', 'electrical_core_engineer'],
  },
  strength: {
    communication: ['frontend_developer', 'data_analyst'],
    logic: ['backend_developer', 'full_stack_developer'],
    math: ['data_analyst', 'electronics_communication_engineer', 'electrical_core_engineer'],
    hands_on: ['embedded_systems_engineer', 'electronics_communication_engineer'],
    patience: ['electrical_core_engineer', 'backend_developer'],
  },
};

const defaultAnswers: BeginnerAnswers = {
  year: '1st year',
  branch: 'cse_it',
  workStyle: 'interfaces',
  favoriteTask: 'design',
  strength: 'communication',
};

const rankBeginnerTracks = (answers: BeginnerAnswers) => {
  const scores = new Map<string, number>();
  Object.keys(beginnerBlueprints).forEach((roleId) => {
    scores.set(roleId, 0);
  });

  (Object.keys(beginnerWeights) as Array<keyof BeginnerAnswers>).forEach((key) => {
    const weightedRoles = beginnerWeights[key][answers[key]] || [];
    weightedRoles.forEach((roleId, index) => {
      const bonus = index === 0 ? 4 : index === 1 ? 3 : 2;
      scores.set(roleId, (scores.get(roleId) || 0) + bonus);
    });
  });

  return Array.from(scores.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([roleId, score]) => ({
      roleId,
      score,
      blueprint: beginnerBlueprints[roleId],
    }));
};

export default function BeginnerCareerStarter({
  onUseUploadFlow,
  onSavedTrack,
  onError,
}: BeginnerCareerStarterProps) {
  const [answers, setAnswers] = useState<BeginnerAnswers>(defaultAnswers);
  const [savingTrack, setSavingTrack] = useState(false);
  const ranking = useMemo(() => rankBeginnerTracks(answers), [answers]);
  const primaryTrack = ranking[0]?.blueprint || null;
  const alternateTracks = ranking.slice(1, 3).map((entry) => entry.blueprint);

  const handleSaveTrack = async () => {
    if (!primaryTrack || savingTrack) return;
    setSavingTrack(true);
    try {
      await setTargetRole(primaryTrack.id);
      onSavedTrack?.(
        `${primaryTrack.name} saved as your learning path. You can now build a starter resume around it.`
      );
    } catch (error: any) {
      onError?.(getReadableErrorMessage(error, 'Unable to save this learning path right now.'));
    } finally {
      setSavingTrack(false);
    }
  };

  if (!primaryTrack) return null;

  return (
    <section className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
      <Card hoverable={false} className="space-y-6 p-8">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            Beginner path
          </Badge>
          <h2 className="text-2xl font-semibold text-primary">Domain discovery for beginners</h2>
          <p className="text-sm leading-6 text-secondary">
            Answer these simple prompts. Esencelab will suggest a likely-fit path and help you
            build your first resume around it.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Academic year</label>
            <select
              value={answers.year}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  year: event.target.value as BeginnerAnswers['year'],
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-primary"
            >
              <option value="1st year">1st year</option>
              <option value="2nd year">2nd year</option>
              <option value="3rd year">3rd year</option>
              <option value="4th year">4th year</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Branch</label>
            <select
              value={answers.branch}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  branch: event.target.value as BeginnerAnswers['branch'],
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-primary"
            >
              <option value="cse_it">CSE / IT</option>
              <option value="ece">ECE</option>
              <option value="eee">EEE</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">What do you enjoy most?</label>
            <select
              value={answers.workStyle}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  workStyle: event.target.value as BeginnerAnswers['workStyle'],
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-primary"
            >
              <option value="interfaces">Designing screens and user flows</option>
              <option value="logic">Building logic and APIs</option>
              <option value="insights">Working with numbers and insights</option>
              <option value="devices">Building with sensors and boards</option>
              <option value="core">Core engineering concepts and systems</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">What task sounds exciting?</label>
            <select
              value={answers.favoriteTask}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  favoriteTask: event.target.value as BeginnerAnswers['favoriteTask'],
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-primary"
            >
              <option value="design">Making something look polished</option>
              <option value="build">Connecting systems end to end</option>
              <option value="analyze">Finding patterns in data</option>
              <option value="tinker">Building practical hardware setups</option>
              <option value="circuits">Understanding circuits and systems deeply</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Your strongest trait right now</label>
            <select
              value={answers.strength}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  strength: event.target.value as BeginnerAnswers['strength'],
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-primary"
            >
              <option value="communication">I explain things clearly</option>
              <option value="logic">I like step-by-step problem solving</option>
              <option value="math">I am comfortable with maths and analysis</option>
              <option value="hands_on">I learn best by doing and building</option>
              <option value="patience">I can stay patient with harder concepts</option>
            </select>
          </div>
        </div>
      </Card>

      <Card hoverable={false} className="space-y-6 p-8">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            Suggested path
          </Badge>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-primary">{primaryTrack.name}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">{primaryTrack.fitSummary}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
              <Sparkles className="h-3.5 w-3.5" />
              Best fit for {answers.year}
            </span>
          </div>
          <p className="rounded-2xl border border-border bg-white/70 p-4 text-sm leading-6 text-secondary">
            {primaryTrack.overview}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Starter resume sections</p>
            <ul className="mt-3 space-y-2 text-sm text-secondary">
              {primaryTrack.resumeSections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Skills to start with</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {primaryTrack.starterSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Good first projects</p>
            <ul className="mt-3 space-y-2 text-sm text-secondary">
              {primaryTrack.starterProjects.map((project) => (
                <li key={project}>{project}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">What to do first</p>
            <ul className="mt-3 space-y-2 text-sm text-secondary">
              {primaryTrack.firstSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>

        {alternateTracks.length > 0 && (
          <div className="rounded-2xl border border-border bg-white/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Close alternatives</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {alternateTracks.map((track) => (
                <span
                  key={track.id}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {track.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white/70 p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-0.5 h-5 w-5 text-primary" />
            <p className="text-sm leading-6 text-secondary">
              Once you create your first version, upload it here and the normal resume-analysis
              workflow will continue exactly as usual.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void handleSaveTrack()} isLoading={savingTrack}>
            Save this as my path
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onUseUploadFlow}>
            I already have a resume
          </Button>
        </div>
      </Card>
    </section>
  );
}
