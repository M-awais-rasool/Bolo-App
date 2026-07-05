import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

import { Bob } from '../common/Bob';
import { COMPANION_BASE, ManoArt, PipArt, ZiziArt } from './CompanionArt';

export type CompanionType = 'mano' | 'pip' | 'zizi';

interface CompanionProps {
  type: CompanionType;
  /** Rendered edge length in dp (the art is authored at 160). */
  size?: number;
  /** Float animation (on by default). */
  bob?: boolean;
  bobDuration?: number;
  style?: StyleProp<ViewStyle>;
}

const ART = {
  mano: ManoArt,
  pip: PipArt,
  zizi: ZiziArt,
} as const;

/**
 * Renders a companion at any size by scaling the 160pt master art.
 * Used full-size on hero screens and shrunk down inside list rows,
 * speech rows, map nodes, etc. — exactly like the `transform:scale(...)`
 * wrappers in the source HTML.
 */
export function Companion({
  type,
  size = COMPANION_BASE,
  bob = true,
  bobDuration = 3600,
  style,
}: CompanionProps) {
  const scale = size / COMPANION_BASE;
  const Art = ART[type];

  const art = (
    <View style={{ width: COMPANION_BASE, height: COMPANION_BASE, transform: [{ scale }] }}>
      <Art />
    </View>
  );

  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {bob ? <Bob duration={bobDuration}>{art}</Bob> : art}
    </View>
  );
}
