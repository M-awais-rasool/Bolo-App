import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Diamond } from '../common/Shapes';

/**
 * The three Bolo companions — Mano (fox), Pip (chick) and Zizi (owl).
 *
 * Each is a faithful re-build of the CSS "div art" from the HTML mock-ups,
 * drawn on a fixed 160 × 160 canvas using absolutely-positioned Views.
 * CSS radial gradients are approximated with a top→bottom LinearGradient
 * (light centre → darker edge), which reads identically at these sizes.
 *
 * Because every part is a unique, pixel-placed shape, inline style objects
 * are the clearest representation here (mirrors the source 1:1).
 */

export const COMPANION_BASE = 160;

/** Dark oval eye with a white catch-light (Mano + Pip). */
function Eye({
  left,
  top,
  w,
  h,
}: {
  left: number;
  top: number;
  w: number;
  h: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        height: h,
        backgroundColor: '#3B2B45',
        borderRadius: Math.min(w, h) / 2,
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 3,
          top: 3,
          width: 6,
          height: 6,
          backgroundColor: '#fff',
          borderRadius: 3,
        }}
      />
    </View>
  );
}

/* ─────────────────────────── Mano (fox) ─────────────────────────── */
export function ManoArt() {
  return (
    <View style={{ width: COMPANION_BASE, height: COMPANION_BASE }}>
      {/* ground shadow */}
      <View
        style={{
          position: 'absolute',
          left: 32,
          bottom: 4,
          width: 96,
          height: 15,
          backgroundColor: 'rgba(124,95,199,0.14)',
          borderRadius: 8,
        }}
      />
      {/* ears */}
      <LinearGradient
        colors={['#FBC79E', '#EF9F6D']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{
          position: 'absolute',
          left: 20,
          top: 6,
          width: 40,
          height: 74,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          transform: [{ rotate: '-20deg' }],
        }}
      />
      <LinearGradient
        colors={['#FBC79E', '#EF9F6D']}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={{
          position: 'absolute',
          left: 100,
          top: 6,
          width: 40,
          height: 74,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          transform: [{ rotate: '20deg' }],
        }}
      />
      {/* inner ears */}
      <View
        style={{
          position: 'absolute',
          left: 29,
          top: 20,
          width: 17,
          height: 42,
          backgroundColor: '#FCDBC7',
          borderRadius: 8.5,
          transform: [{ rotate: '-20deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 114,
          top: 20,
          width: 17,
          height: 42,
          backgroundColor: '#FCDBC7',
          borderRadius: 8.5,
          transform: [{ rotate: '20deg' }],
        }}
      />
      {/* head */}
      <LinearGradient
        colors={['#FCC99F', '#F1A576']}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: 20,
          top: 36,
          width: 120,
          height: 110,
          borderRadius: 56,
        }}
      />
      {/* muzzle */}
      <LinearGradient
        colors={['#FFFBF5', '#FFEFE2']}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: 36,
          top: 70,
          width: 88,
          height: 64,
          borderRadius: 40,
        }}
      />
      {/* eyes */}
      <Eye left={45} top={80} w={17} h={19} />
      <Eye left={98} top={80} w={17} h={19} />
      {/* nose */}
      <View
        style={{
          position: 'absolute',
          left: 73,
          top: 99,
          width: 14,
          height: 11,
          backgroundColor: '#4A3550',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 7,
          borderBottomRightRadius: 7,
        }}
      />
      {/* mouth */}
      <View
        style={{
          position: 'absolute',
          left: 69,
          top: 108,
          width: 22,
          height: 11,
          borderBottomWidth: 3,
          borderColor: '#B57C63',
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        }}
      />
      {/* cheeks */}
      <View
        style={{
          position: 'absolute',
          left: 33,
          top: 101,
          width: 16,
          height: 10,
          backgroundColor: '#FF9E7D',
          opacity: 0.4,
          borderRadius: 5,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 111,
          top: 101,
          width: 16,
          height: 10,
          backgroundColor: '#FF9E7D',
          opacity: 0.4,
          borderRadius: 5,
        }}
      />
    </View>
  );
}

/* ─────────────────────────── Pip (chick) ────────────────────────── */
export function PipArt() {
  return (
    <View style={{ width: COMPANION_BASE, height: COMPANION_BASE }}>
      {/* shadow */}
      <View
        style={{
          position: 'absolute',
          left: 32,
          bottom: 2,
          width: 96,
          height: 15,
          backgroundColor: 'rgba(124,95,199,0.14)',
          borderRadius: 8,
        }}
      />
      {/* head tufts */}
      <View
        style={{
          position: 'absolute',
          left: 74.5,
          top: 6,
          width: 11,
          height: 26,
          backgroundColor: '#FBBE31',
          borderRadius: 5.5,
          transformOrigin: 'bottom',
          transform: [{ rotate: '-15deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 74,
          top: 0,
          width: 12,
          height: 32,
          backgroundColor: '#FFD25A',
          borderRadius: 6,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 74.5,
          top: 6,
          width: 11,
          height: 26,
          backgroundColor: '#FBBE31',
          borderRadius: 5.5,
          transformOrigin: 'bottom',
          transform: [{ rotate: '15deg' }],
        }}
      />
      {/* body */}
      <LinearGradient
        colors={['#FFE38C', '#FBC53A']}
        start={{ x: 0.5, y: 0.18 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: 21,
          top: 28,
          width: 118,
          height: 114,
          borderRadius: 58,
        }}
      />
      {/* wings */}
      <View
        style={{
          position: 'absolute',
          left: 6,
          top: 76,
          width: 30,
          height: 46,
          backgroundColor: '#F5B72A',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 20,
          transform: [{ rotate: '16deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 124,
          top: 76,
          width: 30,
          height: 46,
          backgroundColor: '#F5B72A',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 16,
          transform: [{ rotate: '-16deg' }],
        }}
      />
      {/* face */}
      <LinearGradient
        colors={['#FFF9E4', '#FFEFC2']}
        start={{ x: 0.5, y: 0.25 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: 43,
          top: 66,
          width: 74,
          height: 64,
          borderRadius: 37,
        }}
      />
      {/* eyes */}
      <Eye left={51} top={62} w={16} h={18} />
      <Eye left={93} top={62} w={16} h={18} />
      {/* beak */}
      <View style={{ position: 'absolute', left: 72, top: 82 }}>
        <Diamond size={16} color="#F19233" />
      </View>
      {/* cheeks */}
      <View
        style={{
          position: 'absolute',
          left: 38,
          top: 84,
          width: 15,
          height: 9,
          backgroundColor: '#FF7E52',
          opacity: 0.35,
          borderRadius: 4.5,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 107,
          top: 84,
          width: 15,
          height: 9,
          backgroundColor: '#FF7E52',
          opacity: 0.35,
          borderRadius: 4.5,
        }}
      />
      {/* feet */}
      <View
        style={{
          position: 'absolute',
          left: 57,
          bottom: 6,
          width: 13,
          height: 8,
          backgroundColor: '#F19233',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 90,
          bottom: 6,
          width: 13,
          height: 8,
          backgroundColor: '#F19233',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}

/* ─────────────────────────── Zizi (owl) ─────────────────────────── */
export function ZiziArt() {
  return (
    <View style={{ width: COMPANION_BASE, height: COMPANION_BASE }}>
      {/* shadow */}
      <View
        style={{
          position: 'absolute',
          left: 34,
          bottom: 2,
          width: 92,
          height: 15,
          backgroundColor: 'rgba(124,95,199,0.16)',
          borderRadius: 8,
        }}
      />
      {/* antenna stalk */}
      <View
        style={{
          position: 'absolute',
          left: 78.5,
          top: 8,
          width: 3,
          height: 15,
          backgroundColor: '#9B7BD0',
        }}
      />
      {/* antenna glow ring + ball */}
      <View
        style={{
          position: 'absolute',
          left: 70,
          top: -3,
          width: 19,
          height: 19,
          borderRadius: 9.5,
          backgroundColor: 'rgba(255,207,92,0.3)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 13,
            height: 13,
            borderRadius: 6.5,
            backgroundColor: '#FFCF5C',
          }}
        />
      </View>
      {/* body */}
      <LinearGradient
        colors={['#D3BEF3', '#A987E0']}
        start={{ x: 0.4, y: 0.2 }}
        end={{ x: 0.6, y: 1 }}
        style={{
          position: 'absolute',
          left: 21,
          top: 24,
          width: 118,
          height: 116,
          borderRadius: 58,
        }}
      />
      {/* wings */}
      <View
        style={{
          position: 'absolute',
          left: 2,
          top: 92,
          width: 20,
          height: 16,
          backgroundColor: '#B99CEA',
          borderRadius: 8,
          transform: [{ rotate: '-10deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 138,
          top: 92,
          width: 20,
          height: 16,
          backgroundColor: '#B99CEA',
          borderRadius: 8,
          transform: [{ rotate: '10deg' }],
        }}
      />
      {/* big eyes (white + pupil + catch-light) */}
      {[43, 90].map((left) => (
        <View
          key={left}
          style={{
            position: 'absolute',
            left,
            top: 58,
            width: 27,
            height: 31,
            backgroundColor: '#fff',
            borderRadius: 14,
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: 6,
              bottom: 5,
              width: 15,
              height: 17,
              backgroundColor: '#3B2B45',
              borderRadius: 8,
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 3,
                top: 2,
                width: 5,
                height: 5,
                backgroundColor: '#fff',
                borderRadius: 2.5,
              }}
            />
          </View>
        </View>
      ))}
      {/* beak / mouth */}
      <View
        style={{
          position: 'absolute',
          left: 67,
          top: 97,
          width: 26,
          height: 13,
          borderBottomWidth: 3,
          borderColor: '#6B4E9E',
          borderBottomLeftRadius: 13,
          borderBottomRightRadius: 13,
        }}
      />
      {/* cheeks */}
      <View
        style={{
          position: 'absolute',
          left: 38,
          top: 93,
          width: 14,
          height: 9,
          backgroundColor: '#FF7E52',
          opacity: 0.35,
          borderRadius: 4.5,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 108,
          top: 93,
          width: 14,
          height: 9,
          backgroundColor: '#FF7E52',
          opacity: 0.35,
          borderRadius: 4.5,
        }}
      />
    </View>
  );
}
