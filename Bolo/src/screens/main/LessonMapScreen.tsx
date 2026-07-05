import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Icon, Companion, Pop, AnimatedNumber } from '../../components';
import type { RootStackParamList, TalkStackParamList } from '../../navigation/types';
import { lessons, themeOf } from '../../content';
import type { LessonContent } from '../../content';
import { useCompanion } from '../../context/CompanionContext';
import { useProgress } from '../../context/ProgressContext';
import type { LessonStatus } from '../../context/ProgressContext';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';

/** The map coordinates are authored on the 320pt artboard; we render the path
 *  inside a fixed-width canvas centred in the (wider) device for exact fidelity. */
const MAP_W = 320;
/** Vertical rhythm of the journey path. */
const NODE_GAP = 104;
const MAP_TOP = 14;

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<TalkStackParamList, 'LessonMap'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function LessonMapScreen() {
  const navigation = useNavigation<Nav>();
  const progress = useProgress();

  const mapHeight = MAP_TOP + lessons.length * NODE_GAP + 40;

  const startLesson = (lesson: LessonContent, status: LessonStatus) => {
    // Replays start over; the active lesson resumes at its first new word.
    const wordIndex = status === 'done' ? 0 : progress.resumeIndex(lesson.id);
    navigation.navigate('SayTheWord', { lessonId: lesson.id, wordIndex });
  };

  return (
    <Screen
      bottomInset={false}
      backgroundColor={colors.surface}
    >
      <LinearGradient
        colors={['#EAF5EE', '#FBF4EC', colors.surface]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.55, 1]}
      />

      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your journey</Text>
        <Pressable
          style={styles.wordChip}
          onPress={() => navigation.navigate('Streak')}
          accessibilityRole="button"
          accessibilityLabel="View streak and milestones"
        >
          <Text style={styles.seed}>🌱</Text>
          <AnimatedNumber value={progress.wordCount} suffix=" words" style={styles.wordChipText} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ minHeight: mapHeight }} showsVerticalScrollIndicator={false}>
        <View style={[styles.map, { height: mapHeight }]}>
          {/* connectors (drawn first, behind nodes) */}
          {lessons.slice(0, -1).map((_, i) => {
            const nextStatus = progress.lessonStatus(lessons[i + 1].id);
            return (
              <Connector
                key={`c${i}`}
                left={i % 2 === 0 ? 88 : 118}
                top={MAP_TOP + i * NODE_GAP + 64}
                height={NODE_GAP - 64}
                color={nextStatus === 'locked' ? colors.borderLocked : '#CBB9EC'}
              />
            );
          })}

          {lessons.map((lesson, i) => {
            const status = progress.lessonStatus(lesson.id);
            const top = MAP_TOP + i * NODE_GAP;
            const reverse = i % 2 === 1;
            // Stagger entrances, but cap the delay so deep nodes don't lag.
            const delay = Math.min(i, 8) * 55;
            return (
              <Pop key={lesson.id} delay={delay} style={StyleSheet.absoluteFill}>
                {status === 'active' ? (
                  <ActiveNode
                    left={reverse ? 146 : 56}
                    top={top}
                    reverse={reverse}
                    lesson={lesson}
                    wordsLeft={lesson.words.length - progress.learnedInLesson(lesson.id)}
                    onPress={() => startLesson(lesson, status)}
                  />
                ) : (
                  <MapNode
                    left={reverse ? 150 : 60}
                    top={top}
                    reverse={reverse}
                    lesson={lesson}
                    status={status}
                    onPress={() => startLesson(lesson, status)}
                  />
                )}
              </Pop>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Connector({ left, top, height, color }: { left: number; top: number; height: number; color: string }) {
  const dashes = Math.floor(height / 12);
  return (
    <View style={{ position: 'absolute', left, top, width: 3, height }}>
      {Array.from({ length: dashes }).map((_, i) => (
        <View key={i} style={{ width: 3, height: 6, marginBottom: 6, backgroundColor: color, borderRadius: 1.5 }} />
      ))}
    </View>
  );
}

function MapNode({
  left,
  top,
  lesson,
  status,
  reverse,
  onPress,
}: {
  left: number;
  top: number;
  lesson: LessonContent;
  status: 'done' | 'locked';
  reverse: boolean;
  onPress: () => void;
}) {
  const done = status === 'done';
  const shake = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (done) {
      onPress();
      return;
    }
    // Locked: a playful "not yet" wiggle instead of navigation.
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.7, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={done ? `Replay ${lesson.title}` : `${lesson.title} is locked`}
      style={[styles.node, { left, top, flexDirection: reverse ? 'row-reverse' : 'row' }]}
    >
      <Animated.View
        style={[
          styles.nodeIcon,
          done ? [styles.nodeDone, shadow(colors.green, 0.6, 16, 6, 4)] : styles.nodeLocked,
          { transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] },
        ]}
      >
        <Text style={[styles.nodeEmoji, !done && styles.nodeEmojiLocked]}>{lesson.emoji}</Text>
        <View style={[styles.nodeBadge, done ? styles.badgeDone : styles.badgeLocked]}>
          {done ? (
            <Icon name="check" size={12} color={colors.white} strokeWidth={3.4} />
          ) : (
            <Icon name="lock" size={11} color={colors.textLocked} strokeWidth={2.4} />
          )}
        </View>
      </Animated.View>
      <View style={reverse ? styles.textRight : undefined}>
        <Text style={[styles.nodeTitle, { color: done ? colors.ink : colors.textLocked }]}>{lesson.title}</Text>
        <Text style={[styles.nodeSub, { color: done ? colors.green : colors.textLocked2 }]}>
          {done ? 'Mastered' : 'Locked'}
        </Text>
      </View>
    </Pressable>
  );
}

function ActiveNode({
  left,
  top,
  lesson,
  wordsLeft,
  reverse,
  onPress,
}: {
  left: number;
  top: number;
  lesson: LessonContent;
  wordsLeft: number;
  reverse: boolean;
  onPress: () => void;
}) {
  const { companion } = useCompanion();
  const theme = themeOf(lesson);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.4] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.1, 0] });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Continue ${lesson.title}, ${wordsLeft} words left`}
      style={[styles.node, { left, top, flexDirection: reverse ? 'row-reverse' : 'row' }]}
    >
      <View style={styles.activeWrap}>
        <Animated.View
          pointerEvents="none"
          style={[styles.activePulse, { transform: [{ scale }], opacity }]}
        />
        <LinearGradient
          colors={['#FFB08E', '#FF8266']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.activeIcon, shadow(colors.coralDeep, 0.7, 20, 6, 6)]}
        >
          <Text style={styles.activeEmoji}>{lesson.emoji}</Text>
        </LinearGradient>
        {/* peeking companion */}
        <View style={[styles.peek, reverse && styles.peekReverse]}>
          <Companion type={companion} size={42} />
        </View>
      </View>
      <View style={reverse ? styles.textRight : undefined}>
        <Text style={[styles.nodeTitle, { fontFamily: fonts.displaySemiBold, color: colors.ink }]}>
          {lesson.title}
        </Text>
        <Text style={[styles.nodeSub, { color: theme.deep }]}>
          {wordsLeft > 0 ? `Talking now · ${wordsLeft} left` : 'Talking now'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.s,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl3,
    color: colors.ink,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.base,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  seed: {
    fontSize: fontSizes.md,
  },
  wordChipText: {
    fontFamily: fonts.bodyBlack,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  map: {
    width: MAP_W,
    alignSelf: 'center',
  },
  node: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nodeIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: {
    backgroundColor: colors.green,
  },
  nodeLocked: {
    backgroundColor: '#F1E9DC',
    borderWidth: 1,
    borderColor: colors.borderLocked,
  },
  nodeEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  nodeEmojiLocked: {
    opacity: 0.45,
  },
  nodeBadge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeDone: {
    backgroundColor: colors.greenDeep,
  },
  badgeLocked: {
    backgroundColor: '#EFE6D6',
  },
  textRight: {
    alignItems: 'flex-end',
  },
  nodeTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  nodeSub: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    marginTop: 1,
  },
  activeWrap: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePulse: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: radii.xl2,
    backgroundColor: colors.coral,
  },
  activeIcon: {
    width: 66,
    height: 66,
    borderRadius: radii.xl2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  peek: {
    position: 'absolute',
    right: -18,
    top: -22,
    width: 42,
    height: 42,
  },
  peekReverse: {
    right: undefined,
    left: -18,
  },
});
