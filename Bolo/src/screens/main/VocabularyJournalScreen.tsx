import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Chip, Icon, Companion, PrimaryButton, Pop } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import { findWord, themeOf } from '../../content';
import type { LessonContent, WordContent } from '../../content';
import { useCompanion } from '../../context/CompanionContext';
import { useProgress } from '../../context/ProgressContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface JournalEntry {
  word: WordContent;
  lesson: LessonContent;
}

export function VocabularyJournalScreen() {
  const navigation = useNavigation<Nav>();
  const { companion } = useCompanion();
  const progress = useProgress();
  const [filter, setFilter] = useState('All');

  // Newest words first — the journal celebrates what was just said.
  const entries = useMemo<JournalEntry[]>(
    () =>
      [...progress.learnedWordIds]
        .reverse()
        .map((id) => findWord(id))
        .filter((e): e is JournalEntry => e !== undefined),
    [progress.learnedWordIds],
  );

  const filters = useMemo(() => {
    const titles: string[] = [];
    for (const e of entries) {
      if (!titles.includes(e.lesson.title)) titles.push(e.lesson.title);
    }
    return ['All', ...titles];
  }, [entries]);

  const visible = filter === 'All' ? entries : entries.filter((e) => e.lesson.title === filter);

  return (
    <Screen bottomInset={false} backgroundColor={colors.surface}>
      <LinearGradient colors={['#F7F0FC', colors.surface]} style={StyleSheet.absoluteFill} end={{ x: 0.5, y: 0.45 }} />

      <View style={styles.header}>
        <Text style={styles.title}>Words I can say</Text>
        <Text style={styles.subtitle}>
          {entries.length} {entries.length === 1 ? 'word' : 'words'} · tap to hear yourself
        </Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Companion type={companion} size={130} bobDuration={3200} />
          <Text style={styles.emptyTitle}>No words yet!</Text>
          <Text style={styles.emptySub}>Say your first word and it will live here forever.</Text>
          <PrimaryButton
            label="Start talking"
            variant="coral"
            fontSize={fontSizes.xl2}
            style={styles.emptyCta}
            onPress={() =>
              navigation.navigate('SayTheWord', {
                lessonId: progress.activeLesson.id,
                wordIndex: progress.resumeIndex(progress.activeLesson.id),
              })
            }
          />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterStrip}
            contentContainerStyle={styles.filters}
          >
            {filters.map((f) => (
              <Chip
                key={f}
                label={f}
                active={filter === f}
                outlined={filter !== f}
                onPress={() => setFilter(f)}
              />
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {visible.map((entry, i) => {
              const theme = themeOf(entry.lesson);
              return (
                <Pop key={entry.word.id} delay={Math.min(i, 10) * 45} dy={12} style={styles.cardSlot}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Hear yourself say ${entry.word.label}`}
                    style={({ pressed }) => [
                      styles.card,
                      shadow(colors.ink, 0.16, 16, 8, 3),
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={[styles.tile, { backgroundColor: theme.tint }]}>
                      <Text style={styles.tileEmoji}>{entry.word.emoji}</Text>
                    </View>
                    <Text style={styles.word}>{entry.word.label}</Text>
                    <View style={styles.playBadge}>
                      <Icon name="play" size={12} color={colors.purple} />
                    </View>
                  </Pressable>
                </Pop>
              );
            })}
          </ScrollView>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.s,
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl3,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    marginTop: 2,
  },
  filterStrip: {
    flexGrow: 0,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl2,
    gap: spacing.md,
  },
  cardSlot: {
    width: '47%',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  tile: {
    width: '100%',
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: {
    fontSize: 30,
    lineHeight: 38,
  },
  word: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.lgx,
    color: colors.ink,
    marginTop: spacing.s,
  },
  playBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl4,
    gap: spacing.s,
  },
  emptyTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl4,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptySub: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyCta: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});
