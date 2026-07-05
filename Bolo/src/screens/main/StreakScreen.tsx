import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, Icon, ProgressBar, Pop, AnimatedNumber } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { MILESTONES } from '../../content';
import type { Milestone } from '../../content';
import { dayKey, useProgress } from '../../context/ProgressContext';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function StreakScreen() {
  const progress = useProgress();

  // Current Monday-first week, checked against real practice days.
  const week = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const practiced = new Set(progress.practiceDays);
    return DAY_LABELS.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        label,
        done: practiced.has(dayKey(d)),
        isToday: dayKey(d) === dayKey(today),
      };
    });
  }, [progress.practiceDays]);

  const metricValue = (m: Milestone) => {
    switch (m.metric) {
      case 'words':
        return progress.wordCount;
      case 'lessons':
        return progress.completedLessonIds.length;
      case 'streak':
        return progress.streak;
    }
  };

  const earned = MILESTONES.filter((m) => metricValue(m) >= m.goal);
  const upcoming = MILESTONES.filter((m) => metricValue(m) < m.goal);

  return (
    <Screen bottomInset={false} backgroundColor={colors.surface}>
      <LinearGradient colors={['#FFF3DE', colors.surface]} style={StyleSheet.absoluteFill} end={{ x: 0.5, y: 0.42 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <AnimatedNumber
            value={progress.streak}
            suffix={progress.streak === 1 ? ' day' : ' days'}
            style={styles.count}
          />
          <Text style={styles.caption}>you spoke and got feedback 🎤</Text>
        </View>

        {/* week */}
        <View style={styles.week}>
          {week.map((d, i) => (
            <Pop key={i} delay={i * 50} dy={8}>
              <View style={styles.day}>
                <View
                  style={[
                    styles.dayCircle,
                    d.done ? styles.dayDone : styles.dayIdle,
                    d.isToday && !d.done && styles.dayToday,
                  ]}
                >
                  {d.done && <Icon name="check" size={15} color={colors.white} strokeWidth={3.4} />}
                </View>
                <Text style={[styles.dayLabel, { color: d.done ? colors.textMuted : colors.textLocked }]}>
                  {d.label}
                </Text>
              </View>
            </Pop>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Milestones</Text>

        <View style={styles.list}>
          {earned.map((m, i) => (
            <Pop key={m.id} delay={200 + i * 70} dy={10}>
              <EarnedRow title={m.title} subtitle={`Earned · ${m.rewardNote}`} />
            </Pop>
          ))}

          {upcoming.map((m, i) => {
            const value = metricValue(m);
            return (
              <Pop key={m.id} delay={200 + (earned.length + i) * 70} dy={10}>
                <View style={styles.progressRow}>
                  <View style={styles.progressIcon}>
                    <Text style={styles.progressIconText}>{m.goal}</Text>
                  </View>
                  <View style={styles.progressBody}>
                    <Text style={styles.progressTitle}>{m.title}</Text>
                    <ProgressBar
                      progress={m.goal > 0 ? value / m.goal : 0}
                      height={7}
                      fillColor={colors.purple}
                      trackColor="#F0E7DB"
                      style={{ marginTop: spacing.sm }}
                    />
                  </View>
                  <Text style={styles.progressCount}>
                    {value}/{m.goal}
                  </Text>
                </View>
              </Pop>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

function EarnedRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.earnedRow}>
      <View style={styles.earnedIcon}>
        <Icon name="check" size={20} color={colors.white} strokeWidth={3} />
      </View>
      <View>
        <Text style={styles.earnedTitle}>{title}</Text>
        <Text style={styles.earnedSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl3,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.base,
  },
  count: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl9,
    color: colors.ink,
  },
  caption: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base + 0.5,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.xl2,
  },
  day: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDone: {
    backgroundColor: colors.green,
  },
  dayIdle: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#ECDFCB',
  },
  dayToday: {
    borderColor: colors.coral,
  },
  dayLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.xs,
    marginTop: 5,
  },
  sectionTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl - 1,
    color: colors.ink,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.xl3,
  },
  list: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
    gap: spacing.s + 2,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.greenTint,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  earnedIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnedTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.md,
    color: colors.greenDeep,
  },
  earnedSub: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm + 0.5,
    color: colors.greenMid,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border3,
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#EFE6F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIconText: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.lg,
    color: colors.purpleLight,
  },
  progressBody: {
    flex: 1,
  },
  progressTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  progressCount: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
});
