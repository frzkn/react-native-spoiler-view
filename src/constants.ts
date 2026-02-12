import type { SpoilerConfig } from './types';

/**
 * Alpha tiers for particle depth (matches Telegram Android's ALPHAS array)
 */
export const ALPHA_TIERS = [0.3, 0.6, 1.0] as const;

/**
 * Default configuration for the spoiler effect.
 * Based on Telegram/spoiled research - small particles, tight drift.
 */
export const DEFAULT_CONFIG: SpoilerConfig = {
  /** Number of particles - higher count with smaller particles */
  particleCount: 200,

  /** Particle size range - very small like Telegram */
  particleSizeRange: [0.4, 0.9],

  /** Particle color - alpha tiers (0.3, 0.6, 1.0) applied internally for depth */
  particleColor: 'rgba(80, 80, 80, 1)',

  /** Overlay color - transparent by default, particles do the work */
  overlayColor: 'transparent',

  /** Speed of noise field evolution (subtle shimmer) */
  noiseSpeed: 0.3,

  /** Pixels of organic drift - very subtle */
  driftAmount: 1,

  /** Duration of reveal/hide animation in ms (Telegram: ~1000ms, spoilerjs: 300ms) */
  revealDuration: 600,

  /** Speed of particle burst on reveal - moderate for natural disperse (pixels per second) */
  burstSpeed: 150,
};
