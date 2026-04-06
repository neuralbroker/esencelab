'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Compass, ExternalLink, Search } from 'lucide-react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { useRoleAccess } from '@/lib/useRoleAccess';
import {
  ROADMAP_CATALOG,
  ROADMAP_CATEGORY_LABELS,
  RoadmapCategory,
  getRoadmapsForTrack,
} from '@/lib/roadmapCatalog';

const trackFocusCopy: Record<string, { title: string; note: string }> = {
  frontend_developer: {
    title: 'Frontend roadmap bundle',
    note: 'Start with beginner-friendly browser fundamentals, then move into React, Next.js, and performance work.',
  },
  backend_developer: {
    title: 'Backend roadmap bundle',
    note: 'Use backend foundations first, then add Node.js, databases, APIs, and systems workflow roadmaps.',
  },
  full_stack_developer: {
    title: 'Full stack roadmap bundle',
    note: 'Follow a balanced sequence across frontend, backend, Git, deployment, and product delivery.',
  },
  data_analyst: {
    title: 'Data analyst roadmap bundle',
    note: 'Use data analyst, BI, Python, and SQL-adjacent roadmaps to build reporting and insight skills.',
  },
  embedded_systems_engineer: {
    title: 'Embedded systems crossover bundle',
    note: 'roadmap.sh is more software-heavy, so this bundle focuses on Git, Linux, C++, and CS fundamentals that support embedded project growth.',
  },
  electronics_communication_engineer: {
    title: 'ECE crossover bundle',
    note: 'These roadmaps support the software and systems side of ECE growth, especially for embedded, tooling, and placement preparation.',
  },
  electrical_core_engineer: {
    title: 'EEE crossover bundle',
    note: 'These roadmaps are the most useful roadmap.sh-style complements for electrical students building stronger software and project readiness.',
  },
};

const categoryOptions: Array<{ value: 'all' | RoadmapCategory; label: string }> = [
  { value: 'all', label: 'All roadmaps' },
  { value: 'role', label: ROADMAP_CATEGORY_LABELS.role },
  { value: 'beginner', label: ROADMAP_CATEGORY_LABELS.beginner },
  { value: 'language_framework', label: ROADMAP_CATEGORY_LABELS.language_framework },
  { value: 'tool_platform', label: ROADMAP_CATEGORY_LABELS.tool_platform },
  { value: 'foundation_best_practice', label: ROADMAP_CATEGORY_LABELS.foundation_best_practice },
];

export default function RoadmapsPage() {
  const searchParams = useSearchParams();
  const { hasAllowedRole, isCheckingAccess } = useRoleAccess({ allowedRoles: ['student'] });
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | RoadmapCategory>('all');

  const focus = searchParams.get('focus') || '';
  const focusCopy = focus ? trackFocusCopy[focus] : null;

  const recommendedRoadmaps = useMemo(() => {
    if (!focus) return [];
    return getRoadmapsForTrack(focus);
  }, [focus]);

  const filteredRoadmaps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ROADMAP_CATALOG.filter((entry) => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        entry.title,
        entry.summary,
        entry.audience,
        entry.category,
        ...entry.keyTopics,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, selectedCategory]);

  if (isCheckingAccess) {
    return <Loading text="Checking roadmap access..." />;
  }

  if (!hasAllowedRole) return null;

  return (
    <div className="layout-container section-spacing max-w-7xl mx-auto space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card hoverable={false} className="p-8 md:p-10">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit">
              Roadmap workspace
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
                Student roadmaps with direct roadmap.sh links
              </h1>
              <p className="mt-3 max-w-3xl text-base text-secondary">
                Browse the official roadmap.sh tracks inside Esencelab’s own UI. We summarize what each roadmap covers here, then send you straight to the exact roadmap page when you want the full interactive version.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Total roadmaps</p>
                <p className="mt-2 text-lg font-semibold text-primary">{ROADMAP_CATALOG.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Categories</p>
                <p className="mt-2 text-lg font-semibold text-primary">{categoryOptions.length - 1}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Best use</p>
                <p className="mt-2 text-lg font-semibold text-primary">Explore, then build</p>
              </div>
            </div>
          </div>
        </Card>

        <Card hoverable={false} className="p-8 space-y-4">
          <div className="flex items-start gap-3">
            <Compass className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-primary">
                {focusCopy?.title || 'How to use this page'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                {focusCopy?.note ||
                  'Use the search and category filters to find a roadmap, read the summary here, and then open the direct roadmap page for the full guided sequence.'}
              </p>
            </div>
          </div>
          {focus && (
            <div className="rounded-2xl border border-border bg-white/70 p-4 text-sm leading-6 text-secondary">
              This view was opened with a beginner-path focus. The recommended cards below are the best roadmap.sh matches for your selected track.
            </div>
          )}
          <Link href="/resume?mode=discover">
            <Button variant="outline">Back to beginner path</Button>
          </Link>
        </Card>
      </section>

      {recommendedRoadmaps.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                Recommended for your path
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-primary">Start with these roadmaps</h2>
            </div>
            <Badge variant="secondary">{recommendedRoadmaps.length} matched</Badge>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recommendedRoadmaps.slice(0, 6).map((entry) => (
              <RoadmapCard key={`recommended-${entry.slug}`} entry={entry} highlighted />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-5 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roadmaps, topics, or learning focus"
              className="min-h-[44px] w-full rounded-2xl border border-border bg-white pl-10 pr-4 text-sm text-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedCategory(option.value)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === option.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-secondary hover:text-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-secondary">
            Showing {filteredRoadmaps.length} roadmap{filteredRoadmaps.length === 1 ? '' : 's'}
          </p>
          <p className="text-sm text-secondary">Direct links open the exact roadmap page on roadmap.sh</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRoadmaps.map((entry) => (
            <RoadmapCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RoadmapCard({
  entry,
  highlighted = false,
}: {
  entry: (typeof ROADMAP_CATALOG)[number];
  highlighted?: boolean;
}) {
  return (
    <Card
      hoverable={false}
      className={`flex h-full flex-col space-y-4 p-6 ${highlighted ? 'border-primary/35 bg-white' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
            {ROADMAP_CATEGORY_LABELS[entry.category]}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-primary">{entry.title}</h3>
        </div>
        <Badge variant="secondary">{entry.difficulty}</Badge>
      </div>

      <p className="text-sm leading-6 text-secondary">{entry.summary}</p>

      <div className="rounded-2xl border border-border bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Best for</p>
        <p className="mt-2 text-sm leading-6 text-secondary">{entry.audience}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">What you will cover</p>
        <ul className="mt-3 space-y-2 text-sm text-secondary">
          {entry.keyTopics.map((topic) => (
            <li key={`${entry.slug}-${topic}`}>{topic}</li>
          ))}
        </ul>
      </div>

      <a href={entry.directUrl} target="_blank" rel="noopener noreferrer" className="mt-auto">
        <Button className="w-full justify-center">
          Open direct roadmap
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </a>
    </Card>
  );
}
