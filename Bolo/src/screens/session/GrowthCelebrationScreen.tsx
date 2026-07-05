import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  Screen,
  RadialBackground,
  Sunburst,
  Companion,
  Sparkle,
  ProgressBar,
  PrimaryButton,
  Pop,
  Confetti,
  AnimatedNumber,
  useTween,
} from '../../components';
import { colors, gradients } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { COMPANION_NAMES, getLesson, stageFor, themeOf } from '../../content';
import { useCompanion } from '../../context/CompanionContext';
import { useProgress } from '../../context/ProgressContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GrowthCelebration'>;

export function GrowthCelebrationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'GrowthCelebration'>>();
  const { companion } = useCompanion();
  const progress = useProgress();

  const { lessonId } = route.params;
  const lesson = getLesson(lessonId);
  const theme = themeOf(lesson);

  // Finishing the last word completes the lesson and unlocks the next one.
  useEffect(() => {
    progress.completeLesson(lessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const stage = stageFor(progress.wordCount, companion);
  const stageProgress = useTween(stage.progress, 1400);

  return (
    <Screen
      backgroundColor="#F3E7FB"
      background={
        <RadialBackground
          cx={0.5}
          cy={0.34}
          rx={1.1}
          ry={0.6}
          stops={[
            { offset: 0, color: '#FFE9BC' },
            { offset: 0.55, color: '#FFD9E0' },
            { offset: 1, color: '#F3E7FB' },
          ]}
        />
      }
    >
      <Confetti count={20} height={520} />

      <View style={styles.body}>
        {/* sparkles */}
        <View style={[styles.deco, { left: 40, top: 30, transform: [{ rotate: '20deg' }] }]}>
          <View style={[styles.confetti, { backgroundColor: colors.purple }]} />
        </View>
        <View style={[styles.deco, { right: 44, top: 50, transform: [{ rotate: '-30deg' }] }]}>
          <View style={[styles.confetti, { backgroundColor: colors.green }]} />
        </View>
        <View style={[styles.deco, { left: 64, top: 110 }]}>
          <View style={styles.confettiDot} />
        </View>
        <View style={[styles.deco, { right: 60, top: 110 }]}>
          <Sparkle size={12} color={colors.gold} />
        </View>

        {/* rays + companion */}
        <Pop scaleFrom={0.6} dy={26}>
          <View style={styles.hero}>
            <Sunburst size={220} />
            <View style={{ transform: [{ scale: 1.15 }] }}>
              <Companion type={companion} size={160} />
            </View>
          </View>
        </Pop>

        <Pop delay={200} dy={12}>
          <View style={[styles.lessonChip, { backgroundColor: theme.tint }]}>
            <Text style={[styles.lessonChipText, { color: theme.deep }]}>
              {lesson.emoji} {lesson.title} complete!
            </Text>
          </View>
        </Pop>

        <View style={styles.copy}>
          <Pop delay={300} dy={10}>
            <Text style={styles.title}>{COMPANION_NAMES[companion]} is growing up!</Text>
          </Pop>
          <View style={styles.subRow}>
            <Text style={styles.sub}>You've said </Text>
            <AnimatedNumber value={progress.wordCount} duration={1200} style={[styles.sub, styles.subStrong]} />
            <Text style={styles.sub}> words out loud 🌟</Text>
          </View>
        </View>

        {/* stage bar */}
        <View style={styles.stage}>
          <View style={styles.stageLabels}>
            <Text style={styles.stageLabel}>{stage.current}</Text>
            <Text style={[styles.stageLabel, { color: colors.purple }]}>{stage.next} ✨</Text>
          </View>
          <ProgressBar
            progress={stageProgress}
            height={12}
            gradient={gradients.purpleButton}
            trackColor={colors.white}
            borderColor={colors.purpleTintBorder}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Yay! Keep going"
          variant="coral"
          fontSize={fontSizes.xl3}
          onPress={() => navigation.navigate('Main')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deco: {
    position: 'absolute',
  },
  confetti: {
    width: 10,
    height: 16,
    borderRadius: 3,
  },
  confettiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.coral,
  },
  hero: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonChip: {
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.base,
    marginTop: spacing.s,
  },
  lessonChipText: {
    fontFamily: fonts.bodyBlack,
    fontSize: fontSizes.base,
  },
  copy: {
    alignItems: 'center',
    marginTop: spacing.base,
    paddingHorizontal: spacing.xl4,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl6 + 1,
    color: colors.ink,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  sub: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textMuted2,
  },
  subStrong: {
    fontFamily: fonts.bodyBlack,
    color: colors.purple,
  },
  stage: {
    width: '100%',
    paddingHorizontal: spacing.xl4,
    paddingTop: spacing.xl3,
  },
  stageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  stageLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  footer: {
    width: '100%',
    paddingHorizontal: spacing.xl4,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl3,
  },
});
