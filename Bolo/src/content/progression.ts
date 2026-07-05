import type { CompanionType } from '../components/companions/Companion';

/** What each companion "grows into" as the child speaks more words. */
const SPECIES: Record<CompanionType, string> = {
  mano: 'Fox',
  pip: 'Chick',
  zizi: 'Sprite',
};

export const COMPANION_NAMES: Record<CompanionType, string> = {
  mano: 'Mano',
  pip: 'Pip',
  zizi: 'Zizi',
};

interface StageDef {
  /** `{s}` is replaced with the companion's species. */
  label: string;
  /** Words spoken to reach this stage. */
  at: number;
}

const STAGES: StageDef[] = [
  { label: 'Hatchling', at: 0 },
  { label: 'Young {s}', at: 50 },
  { label: 'Brave {s}', at: 120 },
  { label: 'Wise {s}', at: 220 },
  { label: 'Star {s}', at: 350 },
];

export interface StageInfo {
  current: string;
  next: string;
  /** 0–1 progress from current stage toward the next. */
  progress: number;
  /** Word target of the next stage (or current, at the final stage). */
  nextAt: number;
}

/** Resolve the growth stage for a word count + companion. */
export function stageFor(words: number, companion: CompanionType): StageInfo {
  const species = SPECIES[companion];
  const name = (d: StageDef) => d.label.replace('{s}', species);

  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (words >= STAGES[i].at) idx = i;
  }
  const current = STAGES[idx];
  const next = STAGES[Math.min(idx + 1, STAGES.length - 1)];
  const span = next.at - current.at;
  return {
    current: name(current),
    next: name(next),
    progress: span > 0 ? Math.min(1, (words - current.at) / span) : 1,
    nextAt: next.at,
  };
}

export type MilestoneMetric = 'words' | 'lessons' | 'streak';

export interface Milestone {
  id: string;
  title: string;
  goal: number;
  metric: MilestoneMetric;
  /** Little reward flavour shown once earned. */
  rewardNote: string;
}

export const MILESTONES: Milestone[] = [
  { id: 'words-10', title: 'First 10 words', goal: 10, metric: 'words', rewardNote: 'your egg hatched' },
  { id: 'lessons-1', title: 'First conversation', goal: 1, metric: 'lessons', rewardNote: 'a new scarf' },
  { id: 'words-50', title: 'Say 50 words', goal: 50, metric: 'words', rewardNote: 'a party hat' },
  { id: 'streak-7', title: '7-day streak', goal: 7, metric: 'streak', rewardNote: 'a gold star' },
  { id: 'lessons-5', title: 'Finish 5 lessons', goal: 5, metric: 'lessons', rewardNote: 'a cozy rug' },
  { id: 'words-100', title: 'Say 100 words', goal: 100, metric: 'words', rewardNote: 'a magic lamp' },
];
