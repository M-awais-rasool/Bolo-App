import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, Icon } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import { useCompanion } from '../../context/CompanionContext';

const AYESHA_BARS = [
  { h: 0.4, c: '#CFC3DA' },
  { h: 0.8, c: colors.parentPurple },
  { h: 0.55, c: colors.parentPurple },
  { h: 1, c: colors.parentPurple },
  { h: 0.65, c: colors.parentPurple },
  { h: 0.45, c: '#CFC3DA' },
  { h: 0.75, c: '#CFC3DA' },
  { h: 0.35, c: '#CFC3DA' },
];
const MODEL_BARS = [0.5, 0.75, 0.6, 0.9, 0.7, 0.5, 0.8, 0.4].map((h) => ({ h, c: '#DDD3E6' }));

export function ParentDashboardScreen() {
  const { childName } = useCompanion();

  return (
    <Screen bottomInset={false} backgroundColor={colors.parentBg} statusBarColor={colors.parentInk}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>GROWN-UP AREA</Text>
          <Text style={styles.title}>{childName} · this week</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{childName.charAt(0)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* stats */}
        <View style={styles.statRow}>
          <StatCard value="+8" label="new words" color={colors.parentPurple} />
          <StatCard value="6" label="speaking days" color="#6FA98C" />
          <StatCard value="41m" label="talking" color="#C08A4A" />
        </View>

        {/* sounds */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sounds we're working on</Text>
          <View style={styles.soundRow}>
            <SoundTile letters="th" word="think" bg={colors.parentCardTint} lettersColor={colors.parentPurple} wordColor={colors.parentText3} />
            <SoundTile letters="sh" word="ship" bg={colors.parentCardTint} lettersColor={colors.parentPurple} wordColor={colors.parentText3} />
            <SoundTile letters="r" word="now ok" bg={colors.parentGreenTint} lettersColor="#4E8C6E" wordColor="#7BA593" />
          </View>
        </View>

        {/* progress audio */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hear her progress</Text>
          <AudioRow bars={AYESHA_BARS} label={childName} dark />
          <AudioRow bars={MODEL_BARS} label="Model" dark={false} />
        </View>

        {/* tonight tip */}
        <LinearGradient colors={['#5B4667', '#6E5680']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tip}>
          <Text style={styles.tipKicker}>TONIGHT, TRY</Text>
          <Text style={styles.tipText}>Ask her to name 5 foods in the kitchen — in English.</Text>
        </LinearGradient>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.statCard, shadow(colors.parentInk, 0.5, 14, 6, 2)]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SoundTile({
  letters,
  word,
  bg,
  lettersColor,
  wordColor,
}: {
  letters: string;
  word: string;
  bg: string;
  lettersColor: string;
  wordColor: string;
}) {
  return (
    <View style={[styles.soundTile, { backgroundColor: bg }]}>
      <Text style={[styles.soundLetters, { color: lettersColor }]}>{letters}</Text>
      <Text style={[styles.soundWord, { color: wordColor }]}>{word}</Text>
    </View>
  );
}

function AudioRow({ bars, label, dark }: { bars: { h: number; c: string }[]; label: string; dark: boolean }) {
  return (
    <View style={styles.audioRow}>
      <View style={[styles.playCircle, { backgroundColor: dark ? colors.parentPurple : '#EAE3F0' }]}>
        <Icon name="play" size={13} color={dark ? colors.white : colors.parentPurple} />
      </View>
      <View style={styles.equalizer}>
        {bars.map((b, i) => (
          <View key={i} style={{ flex: 1, height: b.h * 22, backgroundColor: b.c, borderRadius: 2 }} />
        ))}
      </View>
      <Text style={styles.audioLabel}>{label}</Text>
    </View>
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
  kicker: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    letterSpacing: 1.4,
    color: colors.parentPurple,
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl4,
    color: colors.parentInk,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.parentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl - 1,
    color: colors.white,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.s,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl5,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm - 0.5,
    color: colors.parentText2,
    marginTop: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.base,
    ...shadow(colors.parentInk, 0.5, 14, 6, 2),
  },
  cardTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.smd + 0.5,
    color: colors.parentInk,
    marginBottom: spacing.s + 2,
  },
  soundRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  soundTile: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radii.sm,
    paddingVertical: spacing.s,
  },
  soundLetters: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl - 1,
  },
  soundWord: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs - 0.5,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  playCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equalizer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 22,
  },
  audioLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.xs,
    color: colors.parentText3,
  },
  tip: {
    borderRadius: radii.lg,
    padding: spacing.base,
  },
  tipKicker: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    letterSpacing: 1,
    color: '#D6C9E4',
  },
  tipText: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.lg,
    color: colors.white,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
});
