import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { Icon, IconName } from './Icon';

/**
 * On-brand empty state for parent-area tabs that don't yet have a designed
 * screen (Account, Plan). Keeps the grown-up palette so navigation feels
 * complete without introducing a new design language.
 */
export function ComingSoon({
  icon,
  title,
  message,
}: {
  icon: IconName;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBox}>
        <Icon name={icon} size={30} color={colors.parentPurple} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>COMING SOON</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl5,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.purpleTint4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl4,
    color: colors.parentInk,
    marginTop: spacing.lg,
  },
  message: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.parentText,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
  badge: {
    marginTop: spacing.lg,
    backgroundColor: colors.purpleTint4,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  badgeText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    letterSpacing: 1.2,
    color: colors.parentPurple,
  },
});
