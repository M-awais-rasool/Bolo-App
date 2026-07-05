import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Screen, Companion, StripedTile, Chip, MicButton, Pop } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import { getLesson, soundStepIndex } from '../../content';
import { useCompanion } from '../../context/CompanionContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MicroConversation'>;

export function MicroConversationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'MicroConversation'>>();
  const { companion } = useCompanion();

  const { lessonId, wordIndex } = route.params;
  const lesson = getLesson(lessonId);
  const word = lesson.words[Math.min(wordIndex, lesson.words.length - 1)];

  // The pronunciation drill plays once, midway through the lesson.
  const next = () => {
    if (lesson.sound && wordIndex === soundStepIndex(lesson)) {
      navigation.navigate('SoundPractice', { lessonId, wordIndex });
    } else {
      navigation.navigate('Feedback', { lessonId, wordIndex });
    }
  };

  return (
    <Screen backgroundColor={colors.surface}>
      <LinearGradient colors={['#EAF5EE', colors.surface]} style={StyleSheet.absoluteFill} end={{ x: 0.5, y: 0.46 }} />

      {/* pill */}
      <View style={styles.badgeWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>USE IT · TALK BACK</Text>
        </View>
      </View>

      {/* companion prompt */}
      <Pop dy={12}>
        <View style={styles.askRow}>
          <View style={styles.avatar}>
            <Companion type={companion} size={56} />
          </View>
          <View style={[styles.askBubble, shadow(colors.ink, 0.28, 12, 6, 3)]}>
            <Text style={styles.askText}>{lesson.prompt}</Text>
          </View>
        </View>
      </Pop>

      {/* image */}
      <Pop delay={120} dy={14}>
        <View style={styles.imageWrap}>
          <StripedTile height={110} radius={22}>
            <Text style={styles.emoji}>{word.emoji}</Text>
          </StripedTile>
        </View>
      </Pop>

      {/* suggestions */}
      <View style={styles.suggest}>
        <Text style={styles.suggestLabel}>TRY SAYING</Text>
        <View style={styles.chips}>
          {word.chips.map((chip, i) => (
            <Pop key={chip} delay={240 + i * 110} dy={8}>
              <Chip label={chip} backgroundColor={colors.purpleTint} textColor={colors.purpleDeep} fontSize={fontSizes.md} />
            </Pop>
          ))}
          <Pop delay={240 + word.chips.length * 110} dy={8}>
            <Chip label="…" backgroundColor="#F3EBDF" textColor="#B4A48C" fontSize={fontSizes.md} />
          </Pop>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* mic */}
      <View style={styles.micArea}>
        <MicButton size={78} rings={1} iconSize={32} onPress={next} />
        <Text style={styles.micHint}>Hold &amp; say the whole sentence</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeWrap: {
    alignItems: 'center',
    paddingTop: spacing.s,
  },
  badge: {
    backgroundColor: colors.greenTint,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  badgeText: {
    fontFamily: fonts.bodyBlack,
    fontSize: fontSizes.sm,
    letterSpacing: 1.3,
    color: colors.greenDeep,
  },
  askRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.s,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
  },
  askBubble: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    borderBottomLeftRadius: 6,
  },
  askText: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  imageWrap: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
  },
  emoji: {
    fontSize: 56,
    lineHeight: 70,
  },
  suggest: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
  },
  suggestLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm + 0.5,
    color: colors.textMuted,
    marginBottom: spacing.s,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  spacer: {
    flex: 1,
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
