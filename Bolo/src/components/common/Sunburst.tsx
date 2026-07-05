import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Line } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface SunburstProps {
  size?: number;
  rayCount?: number;
  color?: string;
  opacity?: number;
  innerRatio?: number;
  outerRatio?: number;
  spin?: boolean;
}

/**
 * Rotating ray halo behind the celebration companion — a stand-in for the
 * masked `conic-gradient` sunburst in the source (`@keyframes rays`).
 */
export function Sunburst({
  size = 220,
  rayCount = 18,
  color = '#FFCF5C',
  opacity = 0.5,
  innerRatio = 0.46,
  outerRatio = 1,
  spin = true,
}: SunburstProps) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spin) return;
    const loop = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rot, spin]);

  const spinDeg = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const cx = size / 2;
  const cy = size / 2;
  const ri = (size / 2) * innerRatio;
  const ro = (size / 2) * outerRatio;

  const rays = Array.from({ length: rayCount }, (_, i) => {
    const a = (i / rayCount) * Math.PI * 2;
    return {
      x1: cx + ri * Math.cos(a),
      y1: cy + ri * Math.sin(a),
      x2: cx + ro * Math.cos(a),
      y2: cy + ro * Math.sin(a),
    };
  });

  return (
    <AnimatedSvg
      width={size}
      height={size}
      style={{ position: 'absolute', transform: [{ rotate: spinDeg }] }}
    >
      {rays.map((r, i) => (
        <Line
          key={i}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke={color}
          strokeWidth={7}
          strokeOpacity={opacity}
          strokeLinecap="butt"
        />
      ))}
    </AnimatedSvg>
  );
}
