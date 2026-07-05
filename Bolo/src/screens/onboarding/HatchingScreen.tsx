import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, MicButton, Sparkle, Bob } from '../../components';
import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Hatching'>;

export function HatchingScreen() {
  const navigation = useNavigation<Nav>();
  const wake = () => navigation.navigate('Main');

  return (
    <Screen backgroundColor="#2E2340" statusBarColor="#EBE2F5">
      <LinearGradient
        colors={['#4B3A63', '#3A2C50', '#2E2340']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.stage}>
        {/* twinkles */}
        <View style={[styles.deco, { left: 46, top: 40 }]}>
          <Sparkle size={12} color={colors.gold} />
        </View>
        <View style={[styles.deco, { right: 42, top: 80 }]}>
          <Sparkle size={16} color="#B79CE8" />
        </View>
        <View style={[styles.deco, { left: 56, top: 190 }]}>
          <View style={styles.dot} />
        </View>

        {/* egg */}
        <View style={styles.eggWrap}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
          <Bob distance={8} duration={3400}>
            {/* peeking ears */}
            <View style={styles.ears} pointerEvents="none">
              <View style={[styles.ear, { transform: [{ rotate: '-16deg' }] }]} />
              <View style={[styles.ear, { transform: [{ rotate: '16deg' }] }]} />
            </View>
            <LinearGradient
              colors={['#FFF6EC', '#F3D9C6']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.egg}
            >
              <View style={[styles.spot, { top: 20, left: 22, backgroundColor: '#F4A340', opacity: 0.5 }]} />
              <View style={[styles.spot, { top: 60, right: 20, width: 12, height: 12, backgroundColor: colors.purple, opacity: 0.35 }]} />
              <View style={[styles.spot, { bottom: 40, left: 30, width: 14, height: 14, backgroundColor: colors.green, opacity: 0.4 }]} />
              <View style={styles.crack} />
            </LinearGradient>
          </Bob>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Say your name to{'\n'}wake Mano up!</Text>
          <Text style={styles.subtitle}>This helps Bolo learn your voice</Text>
        </View>

        <MicButton size={82} rings={1} onPress={wake} style={styles.mic} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deco: {
    position: 'absolute',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.coralGlow,
  },
  eggWrap: {
    width: 150,
    height: 170,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glowOuter: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,207,92,0.10)',
    top: -10,
  },
  glowInner: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,207,92,0.16)',
    top: 20,
  },
  egg: {
    width: 118,
    height: 150,
    borderTopLeftRadius: 59,
    borderTopRightRadius: 59,
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
    overflow: 'hidden',
  },
  spot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  crack: {
    position: 'absolute',
    top: '50%',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#C79B7F',
    opacity: 0.7,
  },
  ears: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 26,
  },
  ear: {
    width: 22,
    height: 34,
    backgroundColor: '#F1A576',
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  copy: {
    alignItems: 'center',
    marginTop: spacing.xl3,
    paddingHorizontal: spacing.xl5,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: fontSizes.xl4 + 1,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#C6B8DE',
    marginTop: spacing.s,
  },
  mic: {
    marginTop: spacing.xl2,
  },
});
