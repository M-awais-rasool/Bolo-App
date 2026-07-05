import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, RadialBackground, BoloMark, Companion, PrimaryButton } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen
      backgroundColor={colors.surface}
      background={
        <RadialBackground
          cx={0.5}
          cy={0.2}
          rx={1.2}
          ry={0.8}
          stops={[
            { offset: 0, color: '#EFE6FB' },
            { offset: 0.6, color: '#FBEFE9' },
            { offset: 1, color: colors.surface },
          ]}
        />
      }
    >
      {/* brand */}
      <View style={styles.brand}>
        <BoloMark size={44} />
        <Text style={styles.wordmark}>Bolo</Text>
      </View>

      {/* hero companion */}
      <View style={styles.hero}>
        <Companion type="mano" size={160} />
      </View>

      {/* copy */}
      <View style={styles.copy}>
        <Text style={styles.title}>Learn to speak{'\n'}English, out loud</Text>
        <Text style={styles.subtitle}>
          A friend who listens while your child talks — and helps them get better every day.
        </Text>
      </View>

      {/* actions */}
      <View style={styles.actions}>
        <PrimaryButton
          label="Get started"
          variant="coral"
          onPress={() => navigation.navigate('CreateProfile')}
        />
        <Text style={styles.signinRow}>
          Grown-up?{' '}
          <Text style={styles.signinLink} onPress={() => navigation.navigate('SignIn')}>
            Sign in
          </Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    marginTop: spacing.xl5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  wordmark: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.xl8,
    color: colors.ink,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    paddingHorizontal: spacing.xl5,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl6 - 1,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
  actions: {
    width: '100%',
    paddingHorizontal: spacing.xl3,
    paddingTop: spacing.xl2,
    paddingBottom: spacing.md,
  },
  signinRow: {
    textAlign: 'center',
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.base,
    color: colors.textFaint,
    marginTop: spacing.lg,
  },
  signinLink: {
    color: colors.purple,
  },
});
