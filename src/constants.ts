import type { SpoilerConfig } from './types';

/** Opacity tiers used to give the particle field visual depth. */
export const ALPHA_TIERS = [0.3, 0.6, 1.0] as const;

/**
 * Default configuration for the spoiler effect.
 * Fine particles with restrained ambient movement.
 */
export const DEFAULT_CONFIG: SpoilerConfig = {
  /** Canonical per-view target and cap. */
  particleCount: 180,

  /** Canonical dust density. Explicit particleCount values disable adaptive density. */
  particleDensity: 0.055,

  /** Fine speckles rather than visibly circular beads. */
  particleSizeRange: [0.45, 0.8],

  /** Particle color - alpha tiers (0.3, 0.6, 1.0) applied internally for depth */
  particleColor: 'rgba(80, 80, 80, 1)',

  /** Overlay color - transparent by default, particles do the work */
  overlayColor: 'transparent',

  /** Speed of independent ambient particle motion. */
  noiseSpeed: 0.3,

  /** Maximum logical pixels of ambient drift. */
  driftAmount: 1,

  /** Touch-origin reveal duration in ms. */
  revealDuration: 500,
};
