import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Screen,
  RadialBackground,
  SpeechBubble,
  Companion,
  IconButton,
  PrimaryButton,
  Icon,
  Pop,
  useTween,
} from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { useCompanion } from '../../context/CompanionContext';
import { useProgress } from '../../context/ProgressContext';
import { stageFor } from '../../content';
import type { RootStackParamList, TalkStackParamList } from '../../navigation/types';

// Composite: reach sibling Talk-stack routes (Lesson Map) AND root routes
// (speaking session, parent gate).
type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<TalkStackParamList, 'CompanionHub'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const RING = 220;
const R = 103;
const C = 2 * Math.PI * R;

export function CompanionHubScreen() {
  const navigation = useNavigation<Nav>();
  const { companion, childName } = useCompanion();
  const progress = useProgress();

  const stage = stageFor(progress.wordCount, companion);
  const target = stage.nextAt > 0 ? Math.min(1, progress.wordCount / stage.nextAt) : 1;
  // Sweep the ring in on mount / whenever the word count changes.
  const ringProgress = useTween(target, 1200);

  const startSession = () => {
    const lesson = progress.activeLesson;
    navigation.navigate('SayTheWord', {
      lessonId: lesson.id,
      wordIndex: progress.resumeIndex(lesson.id),
    });
  };

  return (
    <Screen
      bottomInset={false}
      backgroundColor={colors.surface}
      background={
        <RadialBackground
          cx={0.5}
          cy={0.12}
          rx={1.2}
          ry={0.8}
          stops={[
            { offset: 0, color: '#EFE6FB' },
            { offset: 0.58, color: '#FBF1EA' },
            { offset: 1, color: colors.surface },
          ]}
        />
      }
    >
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {childName}</Text>
        <View style={styles.headerRight}>
          {progress.streak > 0 && (
            <Pressable
              style={styles.streakChip}
              onPress={() => navigation.navigate('Streak')}
              accessibilityRole="button"
              accessibilityLabel={`${progress.streak} day streak`}
            >
              <Text style={styles.streakFlame}>🔥</Text>
              <Text style={styles.streakText}>{progress.streak}</Text>
            </Pressable>
          )}
          <IconButton
            icon="lock"
            iconColor={colors.textFaint4}
            onPress={() => navigation.navigate('ParentGate')}
          />
        </View>
      </View>

      {/* prompt — the active lesson invites today's talk */}
      <View style={styles.promptWrap}>
        <Pop delay={150} dy={10}>
          <SpeechBubble tail="bottom" style={styles.prompt}>
            <Text style={styles.promptText}>{progress.activeLesson.intro}</Text>
          </SpeechBubble>
        </Pop>
      </View>

      {/* companion + progress ring — tap to open the lesson map */}
      <View style={styles.stage}>
        <Pressable
          style={styles.ringWrap}
          onPress={() => navigation.navigate('LessonMap')}
          accessibilityRole="button"
          accessibilityLabel="Open lesson map"
        >
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <Circle cx={RING / 2} cy={RING / 2} r={R} stroke="#EEE2F3" strokeWidth={14} fill="none" />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={colors.coral}
              strokeWidth={14}
              fill="none"
              strokeDasharray={`${C}`}
              strokeDashoffset={C * (1 - ringProgress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <LinearGradient colors={['#FFFFFF', '#F7EFFA']} style={styles.innerDisc}>
            <Companion type={companion} size={160} />
          </LinearGradient>
          <View style={styles.wordBadge}>
            <Text style={styles.wordBadgeText}>
              🌱 {progress.wordCount} / {stage.nextAt} words
            </Text>
          </View>
        </Pressable>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Pop delay={280} dy={18}>
          <PrimaryButton
            label="Let's Talk"
            variant="coral"
            fontSize={fontSizes.xl4 - 1}
            icon={<Icon name="mic" size={24} color={colors.coralText} strokeWidth={2.4} />}
            onPress={startSession}
          />
        </Pop>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.s,
  },
  greeting: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3D6',
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F5E3B4',
  },
  streakFlame: {
    fontSize: fontSizes.smd,
  },
  streakText: {
    fontFamily: fonts.bodyBlack,
    fontSize: fontSizes.base,
    color: '#C8901D',
  },
  promptWrap: {
    alignItems: 'center',
    paddingTop: spacing.xl3,
    paddingHorizontal: spacing.xl5,
  },
  prompt: {
    alignSelf: 'center',
  },
  promptText: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.lg + 0.5,
    color: colors.ink,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDisc: {
    width: 192,
    height: 192,
    borderRadius: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.xl,
  },
  wordBadgeText: {
    color: colors.white,
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.smd,
  },
  cta: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
});
