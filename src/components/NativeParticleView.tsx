import React from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleSheet,
  UIManager,
  type ColorValue,
  type ViewProps,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';

import type { SpoilerConfig } from '../types';

interface NativeParticleProps extends ViewProps {
  driftAmount?: number;
  maximumSize?: number;
  minimumSize?: number;
  noiseSpeed?: number;
  originX?: number;
  originY?: number;
  overlayColor?: ColorValue;
  particleColor?: ColorValue;
  particleCount?: number;
  progress?: number;
  reduceMotion?: boolean;
  revealDuration?: number;
  seed?: number;
}

interface NativeParticleViewProps {
  config: SpoilerConfig;
  count: number;
  height: number;
  reduceMotion: boolean;
  revealOriginX: SharedValue<number>;
  revealOriginY: SharedValue<number>;
  revealProgress: SharedValue<number>;
  seed: number;
  width: number;
}

const componentName = 'RNSpoilerParticleView';
export const isNativeParticleAvailable =
  Platform.OS !== 'web' &&
  UIManager.getViewManagerConfig(componentName) != null;
const NativeParticle = isNativeParticleAvailable
  ? Animated.createAnimatedComponent(
      requireNativeComponent<NativeParticleProps>(componentName),
    )
  : null;

export function NativeParticleView({
  config,
  count,
  height,
  reduceMotion,
  revealOriginX,
  revealOriginY,
  revealProgress,
  seed,
  width,
}: NativeParticleViewProps) {
  const animatedProps = useAnimatedProps<NativeParticleProps>(() => ({
    originX: width > 0 ? revealOriginX.value / width : 0.5,
    originY: height > 0 ? revealOriginY.value / height : 0.5,
    progress: revealProgress.value,
  }));

  if (!NativeParticle) return null;

  const platformProps =
    Platform.OS === 'android'
      ? { revealDuration: config.revealDuration }
      : undefined;

  return (
    <NativeParticle
      {...platformProps}
      animatedProps={animatedProps}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      particleCount={count}
      particleColor={config.particleColor}
      overlayColor={config.overlayColor}
      minimumSize={config.particleSizeRange[0]}
      maximumSize={config.particleSizeRange[1]}
      driftAmount={config.driftAmount}
      noiseSpeed={config.noiseSpeed}
      reduceMotion={reduceMotion}
      seed={seed}
    />
  );
}
