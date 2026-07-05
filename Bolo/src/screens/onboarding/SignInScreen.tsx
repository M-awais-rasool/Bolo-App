import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, BoloMark, GoogleLogo, AppleLogo } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

export function SignInScreen() {
  const navigation = useNavigation<Nav>();
  const goNext = () => navigation.navigate('CreateProfile');

  return (
    <Screen backgroundColor={colors.surface}>
      <View style={styles.header}>
        <BoloMark size={52} />
        <Text style={styles.title}>Grown-ups, sign in</Text>
        <Text style={styles.subtitle}>
          Set up your child's account. No passwords — kids never sign in themselves.
        </Text>
      </View>

      <View style={styles.body}>
        <Pressable
          onPress={goNext}
          style={[styles.socialBtn, styles.googleBtn, shadow(colors.ink, 0.25, 16, 6, 3)]}
        >
          <GoogleLogo size={22} />
          <Text style={[styles.socialLabel, { color: colors.ink }]}>Continue with Google</Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          style={[styles.socialBtn, styles.appleBtn, shadow(colors.black, 0.4, 18, 8, 4)]}
        >
          <AppleLogo size={20} color={colors.white} />
          <Text style={[styles.socialLabel, { color: colors.white }]}>Continue with Apple</Text>
        </Pressable>

        <Text style={styles.caption}>
          Only social sign-in — we store no passwords.{'\n'}COPPA-aligned · parent-managed.
        </Text>
      </View>

      <Text style={styles.terms}>By continuing you agree to our Terms &amp; Privacy</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl4,
    paddingTop: spacing.xl3,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl5,
    color: colors.ink,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base + 0.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.xl4,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg - 1,
  },
  googleBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  appleBtn: {
    backgroundColor: colors.black,
  },
  socialLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.lgx,
  },
  caption: {
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.smd,
    color: colors.textFaint2,
    marginTop: spacing.s,
    lineHeight: 18,
  },
  terms: {
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm + 0.5,
    color: colors.textFaint3,
    paddingHorizontal: spacing.xl4,
    paddingBottom: spacing.xl3,
  },
});
