import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, Rect, Skia } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { Particle, SpoilerConfig } from '../types';

interface ParticleCanvasProps {
  /** Particles as SharedValue for reactivity */
  particles: SharedValue<Particle[]>;
  /** Configuration */
  config: SpoilerConfig;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Reveal animation progress (0 = hidden, 1 = revealed) */
  revealProgress: SharedValue<number>;
}

/**
 * Renders the particle system using Skia.
 * Single path approach for stability - all particles batched into one draw call.
 */
export function ParticleCanvas({
  particles,
  config,
  width,
  height,
  revealProgress,
}: ParticleCanvasProps) {
  // Time value updated each frame
  const time = useSharedValue(0);

  // Update time on each frame
  useFrameCallback(info => {
    'worklet';
    if (revealProgress.value >= 0.99) return;
    time.value = info.timeSinceFirstFrame / 1000;
  });

  // Single combined path for all particles (simpler, less crash-prone)
  const particlePath = useDerivedValue(() => {
    'worklet';

    const path = Skia.Path.Make();
    if (width <= 0 || height <= 0) return path;

    const t = time.value;
    const ps = particles.value;
    const progress = revealProgress.value;

    // Convert progress to time using config duration (e.g., 600ms = 0.6s)
    const durationSec = config.revealDuration / 1000;
    const burstTime = progress * durationSec;

    for (let i = 0; i < ps.length; i += 1) {
      const p = ps[i];
      if (p) {
        const rawPhase = t / p.lifetime + p.life;
        const lifePhase = rawPhase % 1;

        // Lifecycle shimmer only when fully hidden
        let lifecycleOpacity = 1;
        if (progress < 0.01) {
          if (lifePhase < 0.1) {
            lifecycleOpacity = lifePhase / 0.1;
          } else if (lifePhase > 0.8) {
            lifecycleOpacity = (1 - lifePhase) / 0.2;
          }
        }

        if (lifecycleOpacity >= 0.05) {
          let x: number;
          let y: number;
          let shouldDraw = true;

          if (progress > 0.01) {
            // REVEALING: Time-based continuous movement
            x = p.baseX + p.velocityX * burstTime;
            y = p.baseY + p.velocityY * burstTime;

            // Calculate distance traveled for fade effect
            const dx = x - p.baseX;
            const dy = y - p.baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Particles fade as they travel (like spoilerjs lifetime fade)
            // Max visible distance ~90px, then fully faded
            const distanceFade = Math.max(0, 1 - dist / 90);
            if (distanceFade < 0.05) {
              shouldDraw = false;
            }
          } else {
            // HIDDEN: Normal drift with edge wrapping
            const driftX = p.driftVx * lifePhase * p.lifetime;
            const driftY = p.driftVy * lifePhase * p.lifetime;
            x = p.baseX + driftX;
            y = p.baseY + driftY;
            x = ((x % width) + width) % width;
            y = ((y % height) + height) % height;
          }

          if (shouldDraw) {
            path.addCircle(x, y, p.size);
          }
        }
      }
    }
    return path;
  });

  // Overlay opacity (fades out during reveal)
  const overlayOpacity = useDerivedValue(() => {
    'worklet';

    return 1 - revealProgress.value;
  });

  // Particle opacity - all tiers fade together during reveal
  const particleOpacity = useDerivedValue(() => {
    'worklet';

    return 1 - revealProgress.value;
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        color={config.overlayColor}
        opacity={overlayOpacity}
      />
      <Path path={particlePath} color={config.particleColor} opacity={particleOpacity} />
    </Canvas>
  );
}
