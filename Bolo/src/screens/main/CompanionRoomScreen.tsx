import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { Screen, Companion, Triangle, Chip, Icon } from '../../components';
import { colors, gradients } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';

const WARDROBE = ['Hats', 'Scarves', 'Room'];

export function CompanionRoomScreen() {
  const [tab, setTab] = useState('Hats');

  return (
    <Screen bottomInset={false} backgroundColor={colors.surface}>
      {/* room diorama */}
      <View style={styles.scene}>
        <LinearGradient
          colors={['#E9DEF7', '#EFE3F2', '#EAD9C4', '#E3CDB2']}
          locations={[0, 0.52, 0.52, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* wall stripes */}
        <View style={styles.wall}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <Pattern id="wallStripes" width={28} height={10} patternUnits="userSpaceOnUse">
                <Rect x={26} width={2} height={10} fill="rgba(255,255,255,0.25)" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#wallStripes)" />
          </Svg>
        </View>

        {/* window */}
        <View style={styles.windowFrame}>
          <LinearGradient colors={['#C9E2F5', '#E8F3FB']} style={styles.window} />
          <View style={styles.windowBarV} />
          <View style={styles.windowBarH} />
          <View style={styles.sun} />
        </View>

        {/* shelf + trophies */}
        <View style={styles.shelf} />
        <View style={[styles.trophy, { right: 30, top: 22, width: 16, height: 18, backgroundColor: colors.gold, borderRadius: 4 }]} />
        <View style={[styles.trophy, { right: 54, top: 20, width: 14, height: 20, backgroundColor: colors.purple, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }]} />
        <View style={[styles.trophy, { right: 76, top: 24, width: 16, height: 16, backgroundColor: colors.green, borderRadius: 8 }]} />

        {/* potted plant */}
        <View style={styles.pot} />
        <View style={[styles.leaf, { left: 22, height: 24, backgroundColor: '#5FA97F', transform: [{ rotate: '-16deg' }] }]} />
        <View style={[styles.leaf, { left: 32, height: 28, backgroundColor: '#6FB98C' }]} />
        <View style={[styles.leaf, { left: 40, height: 22, backgroundColor: '#5FA97F', transform: [{ rotate: '16deg' }] }]} />

        {/* rug */}
        <View style={[styles.rug, { width: 190, height: 36, backgroundColor: '#D99BB0', opacity: 0.55, bottom: 14 }]} />
        <View style={[styles.rug, { width: 130, height: 22, backgroundColor: '#E9B9C9', opacity: 0.6, bottom: 20 }]} />

        {/* companion with hat */}
        <View style={styles.manoWrap}>
          <View style={styles.pompom} />
          <View style={styles.hat}>
            <Triangle size={50} height={44} color={colors.purple} />
          </View>
          <Companion type="mano" size={150} />
        </View>
      </View>

      {/* wardrobe tabs */}
      <View style={styles.wardrobe}>
        {WARDROBE.map((w) => (
          <Chip key={w} label={w} active={tab === w} outlined={tab !== w} onPress={() => setTab(w)} />
        ))}
        <Text style={styles.earn}>Earn by talking</Text>
      </View>

      {/* item grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {/* owned */}
        <View style={[styles.item, styles.itemSelected]}>
          <Triangle size={26} height={24} color={colors.purple} />
        </View>
        <View style={[styles.item, styles.itemIdle]}>
          <View style={{ width: 26, height: 16, backgroundColor: colors.green, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
        </View>
        <View style={[styles.item, styles.itemIdle]}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.gold }} />
        </View>
        {/* locked */}
        {['+5 words', '7-day', '+10', 'conv.', '+20'].map((label) => (
          <View key={label} style={[styles.item, styles.itemLocked]}>
            <Icon name="lock" size={18} color={colors.textLocked2} strokeWidth={2.2} />
            <Text style={styles.lockLabel}>{label}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 290,
    marginHorizontal: spacing.base,
    marginTop: spacing.s,
    borderRadius: radii.xl4,
    overflow: 'hidden',
  },
  wall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  windowFrame: {
    position: 'absolute',
    left: 17,
    top: 21,
    width: 82,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 5,
    ...shadow(colors.ink, 0.15, 12, 6, 3),
  },
  window: {
    flex: 1,
    borderRadius: 16,
  },
  windowBarV: {
    position: 'absolute',
    left: 37,
    top: 5,
    width: 4,
    height: 70,
    backgroundColor: colors.white,
  },
  windowBarH: {
    position: 'absolute',
    left: 5,
    top: 38,
    width: 72,
    height: 4,
    backgroundColor: colors.white,
  },
  sun: {
    position: 'absolute',
    left: 17,
    top: 17,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE38C',
    opacity: 0.9,
  },
  shelf: {
    position: 'absolute',
    right: 22,
    top: 40,
    width: 80,
    height: 8,
    backgroundColor: '#C9A87F',
    borderRadius: 4,
  },
  trophy: {
    position: 'absolute',
  },
  pot: {
    position: 'absolute',
    left: 20,
    bottom: 16,
    width: 26,
    height: 22,
    backgroundColor: '#C98A5B',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  leaf: {
    position: 'absolute',
    bottom: 34,
    width: 8,
    borderRadius: 6,
  },
  rug: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 999,
  },
  manoWrap: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 22,
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hat: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    zIndex: 3,
  },
  pompom: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gold,
    zIndex: 4,
  },
  wardrobe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  earn: {
    marginLeft: 'auto',
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s + 2,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  item: {
    width: 62,
    height: 62,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSelected: {
    backgroundColor: colors.purpleTint,
    borderWidth: 3,
    borderColor: colors.purple,
  },
  itemIdle: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  itemLocked: {
    backgroundColor: '#F5EFE5',
  },
  lockLabel: {
    position: 'absolute',
    bottom: 4,
    fontFamily: fonts.bodyBlack,
    fontSize: 8,
    color: colors.textLocked,
  },
});
