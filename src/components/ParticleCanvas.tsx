import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';

import { resolveParticleCount } from '../particles';
import type { SpoilerConfig } from '../types';
import {
  isNativeParticleAvailable,
  NativeParticleView,
} from './NativeParticleView';

interface ParticleCanvasProps {
  config: SpoilerConfig;
  width: number;
  height: number;
  revealOriginX: SharedValue<number>;
  revealOriginY: SharedValue<number>;
  revealProgress: SharedValue<number>;
}

let nextParticleSeed = 1;

export function ParticleCanvas({
  config,
  width,
  height,
  revealOriginX,
  revealOriginY,
  revealProgress,
}: ParticleCanvasProps) {
  const count = resolveParticleCount(config, width, height);
  const [seed] = useState(() => nextParticleSeed++);
  const reduceMotion = useReducedMotion();

  if (!isNativeParticleAvailable) {
    return (
      <FallbackCover
        color={config.overlayColor}
        revealProgress={revealProgress}
      />
    );
  }

  return (
    <NativeParticleView
      config={config}
      count={count}
      height={height}
      reduceMotion={reduceMotion}
      revealOriginX={revealOriginX}
      revealOriginY={revealOriginY}
      revealProgress={revealProgress}
      seed={seed}
      width={width}
    />
  );
}

function FallbackCover({
  color,
  revealProgress,
}: {
  color: string;
  revealProgress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - revealProgress.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.fallback, { backgroundColor: color }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFillObject,
  },
});
