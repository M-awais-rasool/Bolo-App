import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  Screen,
  RadialBackground,
  Companion,
  SpeechBubble,
  Sparkle,
  Icon,
  PrimaryButton,
  Pop,
  Confetti,
} from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { getLesson } from '../../content';
import { useCompanion } from '../../context/CompanionContext';
import { useProgress } from '../../context/ProgressContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Feedback'>;

/** Rotating praise so back-to-back words don't feel canned. */
const PRAISES = [
  { title: 'Perfect!', sub: "Clear and confident.\nThat's a new word you can say." },
  { title: 'Amazing!', sub: 'You said it so nicely.\nYour voice is getting stronger!' },
  { title: 'Wow!', sub: 'That was loud and proud.\nKeep that big voice going!' },
  { title: 'You did it!', sub: 'Great sounds, great sentence.\nOne more word is yours now.' },
  { title: 'Super!', sub: 'You are talking so well.\nYour companion is proud of you!' },
];

export function FeedbackScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Feedback'>>();
  const { companion } = useCompanion();
  const progress = useProgress();

  const { lessonId, wordIndex } = route.params;
  const lesson = getLesson(lessonId);
  const word = lesson.words[Math.min(wordIndex, lesson.words.length - 1)];
  const praise = PRAISES[wordIndex % PRAISES.length];
  const isLastWord = wordIndex >= lesson.words.length - 1;

  // Saying the word is what earns it — record once when the praise shows.
  useEffect(() => {
    progress.learnWord(word.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  const next = () => {
    if (isLastWord) {
      navigation.navigate('GrowthCelebration', { lessonId });
    } else {
      navigation.navigate('SayTheWord', { lessonId, wordIndex: wordIndex + 1 });
    }
  };

  return (
    <Screen
      backgroundColor={colors.surface}
      background={
        <RadialBackground
          cx={0.5}
          cy={0.22}
          rx={1.2}
          ry={0.7}
          stops={[
            { offset: 0, color: '#E7F6EE' },
            { offset: 0.6, color: '#FBF4EC' },
            { offset: 1, color: colors.surface },
          ]}
        />
      }
    >
      <Confetti count={14} height={420} />

      <View style={styles.body}>
        {/* sparkles */}
        <View style={[styles.deco, { left: 44, top: 40 }]}><Sparkle size={14} color={colors.gold} /></View>
        <View style={[styles.deco, { right: 40, top: 80 }]}><Sparkle size={18} color={colors.green} /></View>
        <View style={[styles.deco, { left: 52, top: 150 }]}><Sparkle size={11} color={colors.purpleLight} /></View>
        <View style={[styles.deco, { right: 52, top: 34 }]}><View style={styles.dot} /></View>

        <Pop scaleFrom={0.7} dy={22}>
          <Companion type={companion} size={160} bobDuration={3200} />
        </Pop>

        <Pop delay={140} dy={10}>
          <SpeechBubble tail="top" style={styles.bubble}>
            <Text style={styles.bubbleText}>“{word.label}!” — you got it! 🎉</Text>
          </SpeechBubble>
        </Pop>

        <Pop delay={260} dy={12}>
          <Text style={styles.perfect}>{praise.title}</Text>
        </Pop>
        <Text style={styles.sub}>{praise.sub}</Text>

        <Pop delay={420} dy={10}>
          <View style={styles.journalBadge}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={13} color={colors.white} strokeWidth={3.4} />
            </View>
            <Text style={styles.journalText}>Added to your Journal · {progress.wordCount} words</Text>
          </View>
        </Pop>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={isLastWord ? 'Finish lesson ✨' : 'Next word →'}
          variant="purple"
          fontSize={fontSizes.xl3}
          onPress={next}
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
    paddingHorizontal: spacing.xl3,
  },
  deco: {
    position: 'absolute',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.coral,
  },
  bubble: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingVertical: 11,
  },
  bubbleText: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.lg + 0.5,
    color: colors.ink,
  },
  perfect: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl6,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  sub: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base + 0.5,
    color: colors.textMuted2,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  journalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.greenTint,
    borderRadius: radii.base,
    paddingVertical: 9,
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.base,
    color: colors.greenDeep,
  },
  footer: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.s,
    paddingBottom: spacing.xl3,
  },
});
