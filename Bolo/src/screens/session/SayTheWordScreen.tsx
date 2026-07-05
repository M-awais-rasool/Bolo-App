import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  Screen,
  IconButton,
  Card,
  StripedTile,
  Icon,
  Companion,
  MicButton,
  SoundWave,
  Pop,
} from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { getLesson } from '../../content';
import { useCompanion } from '../../context/CompanionContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SayTheWord'>;

export function SayTheWordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'SayTheWord'>>();
  const { companion } = useCompanion();

  const { lessonId, wordIndex } = route.params;
  const lesson = getLesson(lessonId);
  const word = lesson.words[Math.min(wordIndex, lesson.words.length - 1)];

  // Playful wiggle when the speaker is tapped (audio comes later).
  const wiggle = useRef(new Animated.Value(0)).current;
  const playWiggle = () => {
    wiggle.setValue(0);
    Animated.sequence([
      Animated.timing(wiggle, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: 120, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0.6, duration: 120, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Screen backgroundColor={colors.surface}>
      <LinearGradient colors={['#FBF4EC', colors.surface]} style={StyleSheet.absoluteFill} />

      {/* progress header — one segment per word in this lesson */}
      <View style={styles.topRow}>
        <IconButton icon="chevronLeft" iconColor={colors.textMuted} strokeWidth={2.6} onPress={() => navigation.goBack()} />
        <View style={styles.segments}>
          {lesson.words.map((w, i) => (
            <View
              key={w.id}
              style={[
                styles.segment,
                {
                  backgroundColor:
                    i < wordIndex ? colors.green : i === wordIndex ? colors.coral : '#EDE3D6',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* word card */}
      <View style={styles.cardWrap}>
        <Pop dy={18}>
          <Card padded={false} style={styles.wordCard}>
            <StripedTile height={120} radius={20}>
              <Text style={styles.emoji}>{word.emoji}</Text>
            </StripedTile>
            <View style={styles.wordRow}>
              <Text style={styles.word}>{word.label}</Text>
              <Pressable onPress={playWiggle} accessibilityRole="button" accessibilityLabel={`Hear ${word.label}`}>
                <Animated.View
                  style={[
                    styles.speaker,
                    { transform: [{ rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] }) }] },
                  ]}
                >
                  <Icon name="speaker" size={22} color={colors.purple} />
                </Animated.View>
              </Pressable>
            </View>
            <Text style={styles.hint}>Tap the speaker to hear it</Text>
          </Card>
        </Pop>
      </View>

      {/* listening */}
      <View style={styles.listen}>
        <Companion type={companion} size={76} style={{ transform: [{ rotate: '-6deg' }] }} bobDuration={3200} />
        <Text style={styles.listening}>I'm listening…</Text>
        <MicButton
          size={90}
          rings={2}
          iconSize={36}
          onPress={() => navigation.navigate('MicroConversation', { lessonId, wordIndex })}
        />
        <SoundWave height={20} style={styles.wave} />
        <Text style={styles.sayItLoud}>Say it out loud</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.s,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 6,
  },
  cardWrap: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.xl,
  },
  wordCard: {
    borderRadius: radii.xl4 + 2,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 62,
    lineHeight: 76,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  word: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl7,
    color: colors.ink,
  },
  speaker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.smd + 0.5,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  listen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  listening: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.md,
    color: colors.purple,
  },
  wave: {
    marginTop: spacing.xs / 2,
  },
  sayItLoud: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
});
