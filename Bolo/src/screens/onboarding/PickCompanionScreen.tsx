import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, RadialBackground, Companion, Icon, PrimaryButton } from '../../components';
import type { CompanionType } from '../../components/companions/Companion';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import { useCompanion } from '../../context/CompanionContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PickCompanion'>;

const OPTIONS: { type: CompanionType; name: string; trait: string; bobDuration: number }[] = [
  { type: 'mano', name: 'Mano', trait: 'Calm & patient', bobDuration: 3600 },
  { type: 'pip', name: 'Pip', trait: 'Curious & cheery', bobDuration: 3200 },
  { type: 'zizi', name: 'Zizi', trait: 'Silly & bouncy', bobDuration: 2800 },
];

export function PickCompanionScreen() {
  const navigation = useNavigation<Nav>();
  const { setCompanion } = useCompanion();
  const [selected, setSelected] = useState<CompanionType>('mano');

  const chosen = OPTIONS.find((o) => o.type === selected)!;

  const onChoose = () => {
    setCompanion(selected);
    navigation.navigate('Hatching', { companion: selected });
  };

  return (
    <Screen
      backgroundColor={colors.surface}
      background={
        <RadialBackground
          cx={0.5}
          cy={0}
          rx={1.2}
          ry={0.9}
          stops={[
            { offset: 0, color: '#F3ECFC' },
            { offset: 0.62, color: '#FDF3EC' },
            { offset: 1, color: colors.surface },
          ]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.step}>SET UP · STEP 2</Text>
        <Text style={styles.title}>Pick your friend</Text>
      </View>

      <View style={styles.list}>
        {OPTIONS.map((o) => {
          const active = o.type === selected;
          return (
            <Pressable
              key={o.type}
              onPress={() => setSelected(o.type)}
              style={[
                styles.row,
                active
                  ? [styles.rowActive, shadow(colors.purple, 0.4, 20, 10, 5)]
                  : [styles.rowIdle, shadow(colors.ink, 0.35, 16, 6, 2)],
              ]}
            >
              {active && (
                <View style={styles.check}>
                  <Icon name="check" size={13} color={colors.white} strokeWidth={3.4} />
                </View>
              )}
              <View style={styles.avatarBox}>
                <Companion type={o.type} size={66} bobDuration={o.bobDuration} />
              </View>
              <View>
                <Text style={styles.name}>{o.name}</Text>
                <Text style={styles.trait}>{o.trait}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={`Choose ${chosen.name}`} variant="coral" fontSize={fontSizes.xl2} onPress={onChoose} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl3,
    paddingTop: spacing.base,
  },
  step: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.smd,
    letterSpacing: 1.6,
    color: colors.purpleAccent,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl6,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  list: {
    flex: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.base,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.white,
    borderRadius: radii.xl2,
    paddingVertical: spacing.s + 2,
    paddingHorizontal: spacing.lg,
  },
  rowActive: {
    borderWidth: 3,
    borderColor: colors.purple,
  },
  rowIdle: {
    borderWidth: 1,
    borderColor: colors.border3,
  },
  check: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBox: {
    width: 66,
    height: 66,
  },
  name: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl2,
    color: colors.ink,
  },
  trait: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.smd + 0.5,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.s,
    paddingBottom: spacing.xl3,
  },
});
