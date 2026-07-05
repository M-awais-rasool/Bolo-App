import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Icon } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ParentGate'>;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'check'];

export function ParentGateScreen() {
  const navigation = useNavigation<Nav>();
  const [answer, setAnswer] = useState('');

  const press = (k: string) => {
    if (k === 'check') {
      navigation.navigate('ParentArea');
      return;
    }
    if (k === '') return;
    setAnswer((prev) => (prev.length >= 2 ? prev : prev + k));
  };

  return (
    <Screen backgroundColor={colors.parentBg} statusBarColor={colors.parentInk}>
      <View style={styles.header}>
        <View style={styles.lockBox}>
          <Icon name="lock" size={26} color={colors.parentPurple} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Grown-ups only</Text>
        <Text style={styles.subtitle}>Solve this to open the parent area. Keeps things kid-safe.</Text>
      </View>

      <View style={styles.question}>
        <Text style={styles.questionText}>What is 7 + 5 ?</Text>
        <View style={styles.answerRow}>
          {[0, 1].map((i) => {
            const filled = answer.length > i;
            const active = answer.length === i;
            return (
              <View
                key={i}
                style={[
                  styles.answerBox,
                  { borderColor: filled || active ? colors.parentPurple : colors.parentBorder },
                ]}
              >
                <Text style={styles.answerText}>{answer[i] ?? ''}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.spacer} />

      {/* keypad */}
      <View style={styles.keypad}>
        {KEYS.map((k, i) => {
          if (k === '') return <View key={i} style={styles.key} />;
          const isZero = k === '0';
          const isCheck = k === 'check';
          return (
            <Pressable
              key={i}
              onPress={() => press(k)}
              style={[
                styles.key,
                isZero && styles.keyZero,
                isCheck && styles.keyCheck,
                !isZero && !isCheck && [styles.keyDigit, shadow(colors.parentInk, 0.3, 10, 4, 2)],
              ]}
            >
              {isCheck ? (
                <Icon name="checkThin" size={22} color={colors.parentPurple} strokeWidth={2.2} />
              ) : (
                <Text style={[styles.keyText, isZero && { color: colors.white }]}>{k}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl5,
    paddingTop: spacing.xl4,
  },
  lockBox: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.purpleTint4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl4 + 1,
    color: colors.parentInk,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base + 0.5,
    color: colors.parentText,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
  question: {
    alignItems: 'center',
    paddingTop: spacing.xl3,
  },
  questionText: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl6,
    color: colors.parentInk,
  },
  answerRow: {
    flexDirection: 'row',
    gap: spacing.s + 2,
    marginTop: spacing.lg,
  },
  answerBox: {
    width: 44,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl5,
    color: colors.parentInk,
  },
  spacer: {
    flex: 1,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl5,
    paddingBottom: spacing.xl3,
    gap: spacing.md,
  },
  key: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: spacing.base,
    borderRadius: radii.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: {
    backgroundColor: colors.white,
  },
  keyZero: {
    backgroundColor: colors.parentPurple,
  },
  keyCheck: {
    backgroundColor: colors.purpleTint4,
  },
  keyText: {
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl4,
    color: colors.parentInk,
  },
});
