import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Icon, IconName } from '../common/Icon';

const TABS: Record<string, { icon: IconName; label: string }> = {
  Progress: { icon: 'barChart', label: 'Progress' },
  Account: { icon: 'userAlt', label: 'Account' },
  Plan: { icon: 'lock', label: 'Plan' },
};

/** Grown-up-area bottom tabs — calmer palette than the kid tab bar. */
export function ParentTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xl3 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TABS[route.name] ?? { icon: 'barChart' as IconName, label: route.name };
        const tint = focused ? colors.parentPurple : colors.parentInactive;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <Icon name={meta.icon} size={22} color={tint} strokeWidth={2.2} />
            <Text style={[styles.label, { color: tint }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.parentBorder2,
    paddingTop: spacing.md - 1,
    paddingHorizontal: spacing.xl,
  },
  item: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.xs,
  },
});
