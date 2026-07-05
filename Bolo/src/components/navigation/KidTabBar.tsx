import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Icon, IconName } from '../common/Icon';

/** Route-name → glyph + label for the kid-facing bottom tabs. */
const TABS: Record<string, { icon: IconName; label: string }> = {
  TalkTab: { icon: 'mic', label: 'Talk' },
  JournalTab: { icon: 'journal', label: 'Journal' },
  RoomTab: { icon: 'room', label: 'Room' },
};

/**
 * Custom bottom navigation bar matching the source design: white surface with
 * a hairline top border, an active purple tab and faint inactive tabs.
 */
export function KidTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xl3 },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TABS[route.name] ?? { icon: 'mic' as IconName, label: route.name };
        const tint = focused ? colors.purple : colors.textFaint3;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={meta.label}
          >
            <Icon name={meta.icon} size={24} color={tint} strokeWidth={2.2} />
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
    borderTopColor: colors.border4,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl2,
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
