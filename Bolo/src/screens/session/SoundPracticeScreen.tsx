import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Screen, Companion, MicButton, Pop } from '../../components';
import { colors, gradients } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import { getLesson } from '../../content';
import { useCompanion } from '../../context/CompanionContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SoundPractice'>;

export function SoundPracticeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'SoundPractice'>>();
  const { companion } = useCompanion();

  const { lessonId, wordIndex } = route.params;
  const lesson = getLesson(lessonId);
  const sound = lesson.sound;

  const goToFeedback = () => navigation.replace('Feedback', { lessonId, wordIndex });

  // Content without a sound drill skips straight to feedback.
  useEffect(() => {
    if (!sound) goToFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The big phoneme tile breathes gently to invite imitation.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  if (!sound) return null;

  // Highlight the first occurrence of the phoneme in the example word.
  const idx = sound.asIn.indexOf(sound.letters);
  const pre = idx >= 0 ? sound.asIn.slice(0, idx) : '';
  const hit = idx >= 0 ? sound.asIn.slice(idx, idx + sound.letters.length) : '';
  const post = idx >= 0 ? sound.asIn.slice(idx + sound.letters.length) : sound.asIn;

  return (
    <Screen backgroundColor={colors.surface}>
      <LinearGradient colors={['#F7F0FC', colors.surface]} style={StyleSheet.absoluteFill} end={{ x: 0.5, y: 0.44 }} />

      <View style={styles.header}>
        <Text style={styles.kicker}>SOUND PRACTICE</Text>
      </View>

      <View style={styles.body}>
        <Pop dy={20} scaleFrom={0.8}>
          <Animated.View
            style={{
              transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
            }}
          >
            <LinearGradient
              colors={gradients.purpleTile}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={[styles.soundTile, shadow(colors.purple, 0.7, 34, 14, 8)]}
            >
              <Text style={styles.soundLetters}>{sound.letters}</Text>
            </LinearGradient>
          </Animated.View>
        </Pop>

        <Pop delay={140} dy={10}>
          <View style={styles.asIn}>
            <Text style={styles.asInLabel}>as in</Text>
            <Text style={styles.asInWord}>
              {pre}
              <Text style={{ color: colors.purple }}>{hit}</Text>
              {post}
            </Text>
          </View>
        </Pop>

        <Pop delay={260} dy={12}>
          <View style={[styles.tip, shadow(colors.ink, 0.35, 18, 8, 3)]}>
            <View style={styles.tipAvatar}>
              <Companion type={companion} size={50} />
            </View>
            <Text style={styles.tipText}>
              {sound.tip.pre}
              <Text style={styles.tipBold}>{sound.tip.bold}</Text>
              {sound.tip.post}
            </Text>
          </View>
        </Pop>
      </View>

      <View style={styles.micArea}>
        <MicButton size={78} rings={1} iconSize={32} onPress={goToFeedback} />
        <Text style={styles.micHint}>Now you try — say “{sound.asIn}”</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  kicker: {
    fontFamily: fonts.bodyBlack,
    fontSize: fontSizes.sm,
    letterSpacing: 1.5,
    color: colors.purpleAccent,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.xl3,
  },
  soundTile: {
    width: 130,
    height: 130,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundLetters: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.huge,
    color: colors.white,
  },
  asIn: {
    alignItems: 'center',
  },
  asInLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  asInWord: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl7,
    color: colors.ink,
  },
  tip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  tipAvatar: {
    width: 50,
    height: 50,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textMuted3,
    lineHeight: 19,
  },
  tipBold: {
    fontFamily: fonts.bodyBlack,
    color: colors.ink,
  },
  micArea: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl3,
  },
  micHint: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
  },
});
