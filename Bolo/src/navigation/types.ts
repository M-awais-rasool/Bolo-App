import type { NavigatorScreenParams } from '@react-navigation/native';

import type { CompanionType } from '../components/companions/Companion';

/** Nested stack that lives inside the "Talk" bottom tab. */
export type TalkStackParamList = {
  CompanionHub: undefined;
  LessonMap: undefined;
  Streak: undefined;
};

/** The child-facing bottom tab navigator. */
export type MainTabParamList = {
  TalkTab: NavigatorScreenParams<TalkStackParamList> | undefined;
  JournalTab: undefined;
  RoomTab: undefined;
};

/** The grown-up area bottom tabs (behind the parent gate). */
export type ParentTabParamList = {
  Progress: undefined;
  Account: undefined;
  Plan: undefined;
};

/** Position inside a lesson's speaking session. */
export type SessionParams = {
  lessonId: string;
  wordIndex: number;
};

/** Top-level stack: onboarding → app → session flow → parent area. */
export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  CreateProfile: undefined;
  PickCompanion: undefined;
  Hatching: { companion?: CompanionType } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  SayTheWord: SessionParams;
  MicroConversation: SessionParams;
  SoundPractice: SessionParams;
  Feedback: SessionParams;
  GrowthCelebration: { lessonId: string };
  ParentGate: undefined;
  ParentArea: NavigatorScreenParams<ParentTabParamList> | undefined;
};

/** Enables typed `useNavigation()` everywhere without per-call generics. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
