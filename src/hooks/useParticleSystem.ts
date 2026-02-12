import { useCallback, useMemo } from 'react';
import { useSharedValue, withTiming, runOnUI, Easing } from 'react-native-reanimated';

import { DEFAULT_CONFIG } from '../constants';
import type { AlphaTier, Particle, ParticleSystemState, SpoilerConfig } from '../types';

/**
 * Manages the particle system state and animations.
 * All particle data is stored in SharedValue for UI thread reactivity.
 */
export function useParticleSystem(partialConfig?: Partial<SpoilerConfig>): ParticleSystemState {
  // Merge with defaults
  const config = useMemo<SpoilerConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...partialConfig,
    }),
    [partialConfig],
  );

  // CRITICAL: Particles MUST be SharedValue for useDerivedValue reactivity
  const particles = useSharedValue<Particle[]>([]);

  // Animation progress (0 = hidden, 1 = revealed)
  const revealProgress = useSharedValue(0);

  /**
   * Initialize particles with random positions within bounds.
   * Should be called on layout measurement.
   */
  const initParticles = useCallback(
    (width: number, height: number) => {
      const newParticles: Particle[] = [];
      const { particleCount, particleDensity, particleSizeRange } = config;
      const [minSize, maxSize] = particleSizeRange;
      const sizeRange = maxSize - minSize;

      // Internal padding to prevent particles at edges (prevents cutoff)
      const padding = maxSize + 2;
      const innerWidth = Math.max(1, width - padding * 2);
      const innerHeight = Math.max(1, height - padding * 2);

      // Calculate count: use density if provided, otherwise fixed count
      // Density is particles per px² (e.g., 0.08 like spoiled)
      const count = particleDensity
        ? Math.round(Math.min(1000, particleDensity * innerWidth * innerHeight))
        : particleCount;

      for (let i = 0; i < count; i += 1) {
        // Random drift direction (like Telegram's velocityRange: 20, but gentler)
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8; // 4-12 pixels per second (gentler)

        // Random alpha tier (0, 1, 2) - matches Telegram Android's approach
        const alphaTier = Math.floor(Math.random() * 3) as AlphaTier;

        newParticles.push({
          baseX: padding + Math.random() * innerWidth,
          baseY: padding + Math.random() * innerHeight,
          size: minSize + Math.random() * sizeRange,
          alphaTier,
          noiseOffsetX: Math.random() * 1000,
          noiseOffsetY: Math.random() * 1000,
          velocityX: 0,
          velocityY: 0,
          life: Math.random(), // Stagger spawn times
          lifetime: 0.6 + Math.random() * 0.6, // 0.6-1.2 seconds (like Telegram's 1.0s)
          driftVx: Math.cos(angle) * speed,
          driftVy: Math.sin(angle) * speed,
        });
      }

      // Update on UI thread
      runOnUI(() => {
        'worklet';

        particles.value = newParticles;
      })();
    },
    [config, particles],
  );

  /**
   * Trigger reveal animation.
   * Particles burst outward from the touch point with dramatic explosion.
   */
  const triggerReveal = useCallback(
    (touchX: number, touchY: number) => {
      const { burstSpeed } = config;

      runOnUI(() => {
        'worklet';

        // Calculate burst velocities - particles fly away from touch point
        const updated = particles.value.map(p => {
          const dx = p.baseX - touchX;
          const dy = p.baseY - touchY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Closer particles move faster (px/second for time-based movement)
          const speed = burstSpeed * Math.max(0.5, 1 - dist / 200);
          const angle = Math.atan2(dy, dx);

          // Add randomness for organic feel
          const randomAngle = angle + (Math.random() - 0.5) * 0.5;

          return {
            ...p,
            velocityX: Math.cos(randomAngle) * speed,
            velocityY: Math.sin(randomAngle) * speed,
          };
        });

        particles.value = updated;
        // Timing animation - duration from config (default 600ms)
        revealProgress.value = withTiming(1, {
          duration: config.revealDuration,
          easing: Easing.out(Easing.quad),
        });
      })();
    },
    [config, particles, revealProgress],
  );

  /**
   * Trigger hide animation.
   * Resets reveal progress (particles reform).
   */
  const triggerHide = useCallback(() => {
    runOnUI(() => {
      'worklet';

      // Reset velocities
      const updated = particles.value.map(p => ({
        ...p,
        velocityX: 0,
        velocityY: 0,
      }));

      particles.value = updated;
      // Timing animation - duration from config
      revealProgress.value = withTiming(0, {
        duration: config.revealDuration,
        easing: Easing.out(Easing.quad),
      });
    })();
  }, [config, particles, revealProgress]);

  return {
    particles,
    revealProgress,
    initParticles,
    triggerReveal,
    triggerHide,
  };
}
