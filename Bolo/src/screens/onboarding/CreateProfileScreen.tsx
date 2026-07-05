import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, RadialBackground, Icon } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import { useCompanion } from '../../context/CompanionContext';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateProfile'>;
type Age = '4-6' | '7-9';

export function CreateProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { childName, setChildName } = useCompanion();
  const [age, setAge] = useState<Age>('4-6');

  return (
    <Screen
      backgroundColor={colors.surface}
      background={
        <RadialBackground
          cx={0.5}
          cy={0}
          rx={1.2}
          ry={0.7}
          stops={[
            { offset: 0, color: '#F3ECFC' },
            { offset: 0.6, color: colors.surface },
          ]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.step}>SET UP · STEP 1</Text>
        <Text style={styles.title}>Who's learning?</Text>
      </View>

      <View style={styles.body}>
        {/* avatar picker */}
        <View style={styles.avatar}>
          <Icon name="user" size={46} color={colors.purpleLight} strokeWidth={2} />
          <View style={styles.avatarBadge}>
            <Icon name="plus" size={15} color={colors.white} strokeWidth={2.4} />
          </View>
        </View>

        {/* name */}
        <View style={styles.field}>
          <Text style={styles.label}>CHILD'S NAME</Text>
          <TextInput
            value={childName}
            onChangeText={setChildName}
            style={styles.input}
            cursorColor={colors.purple}
            selectionColor={colors.purple}
            placeholder="Name"
            placeholderTextColor={colors.textFaint2}
          />
        </View>

        {/* age */}
        <View style={styles.fieldWide}>
          <Text style={styles.label}>AGE</Text>
          <View style={styles.ageRow}>
            <AgeOption
              title="4–6"
              subtitle="Little Talkers"
              selected={age === '4-6'}
              onPress={() => setAge('4-6')}
            />
            <AgeOption
              title="7–9"
              subtitle="Growing Speakers"
              selected={age === '7-9'}
              onPress={() => setAge('7-9')}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          variant="purple"
          fontSize={fontSizes.xl2}
          onPress={() => navigation.navigate('PickCompanion')}
        />
      </View>
    </Screen>
  );
}

function AgeOption({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.ageOption,
        selected
          ? [styles.ageSelected, shadow(colors.purple, 0.6, 16, 8, 5)]
          : styles.ageUnselected,
      ]}
    >
      <Text style={[styles.ageTitle, { color: selected ? colors.white : colors.ink }]}>
        {title}
      </Text>
      <Text style={[styles.ageSub, { color: selected ? 'rgba(255,255,255,0.85)' : colors.textMuted }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl4,
    paddingTop: spacing.xl2,
    alignItems: 'center',
  },
  step: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.smd,
    letterSpacing: 1.6,
    color: colors.purpleAccent,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl5,
    color: colors.ink,
    marginTop: spacing.s,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl4,
    paddingTop: spacing.xl3,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(colors.purple, 0.6, 8, 4, 4),
  },
  field: {
    width: '100%',
    marginTop: spacing.xl3,
  },
  fieldWide: {
    width: '100%',
    marginTop: spacing.xl2,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.smd,
    color: colors.textMuted,
    marginBottom: spacing.s,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.base,
    paddingVertical: spacing.base + 1,
    paddingHorizontal: spacing.xl,
    fontFamily: fonts.displayMedium,
    fontSize: fontSizes.xl,
    color: colors.ink,
    borderWidth: 2,
    borderColor: colors.purple,
  },
  ageRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ageOption: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radii.base,
    paddingVertical: spacing.base,
  },
  ageSelected: {
    backgroundColor: colors.purple,
  },
  ageUnselected: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ageTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl2,
  },
  ageSub: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl4,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl3,
  },
});
