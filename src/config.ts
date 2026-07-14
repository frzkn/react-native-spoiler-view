import { processColor } from 'react-native';

import { DEFAULT_CONFIG } from './constants';
import type { SpoilerConfig } from './types';

export const MAX_PARTICLE_COUNT = 1000;

const MAX_PARTICLE_SIZE = 50;
const MAX_REVEAL_DURATION = 10_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? (value as number) : fallback;
}

function validColor(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && processColor(value) != null
    ? value
    : fallback;
}

/**
 * Converts public configuration into values that are safe to use in render loops.
 * Runtime normalization is necessary because JavaScript consumers are not protected
 * by the TypeScript interface.
 */
export function normalizeSpoilerConfig(partial?: Partial<SpoilerConfig>): SpoilerConfig {
  const requestedSizes = partial?.particleSizeRange ?? DEFAULT_CONFIG.particleSizeRange;
  const firstSize = clamp(
    finiteNumber(requestedSizes[0], DEFAULT_CONFIG.particleSizeRange[0]),
    0,
    MAX_PARTICLE_SIZE,
  );
  const secondSize = clamp(
    finiteNumber(requestedSizes[1], DEFAULT_CONFIG.particleSizeRange[1]),
    0,
    MAX_PARTICLE_SIZE,
  );
  const hasExplicitParticleCount = partial?.particleCount !== undefined;
  const particleDensity =
    partial?.particleDensity ??
    (hasExplicitParticleCount ? undefined : DEFAULT_CONFIG.particleDensity);

  return {
    particleCount: Math.round(
      clamp(
        finiteNumber(partial?.particleCount, DEFAULT_CONFIG.particleCount),
        0,
        MAX_PARTICLE_COUNT,
      ),
    ),
    particleDensity:
      particleDensity === undefined
        ? undefined
        : clamp(finiteNumber(particleDensity, 0), 0, MAX_PARTICLE_COUNT),
    particleSizeRange: [Math.min(firstSize, secondSize), Math.max(firstSize, secondSize)],
    particleColor: validColor(
      partial?.particleColor,
      DEFAULT_CONFIG.particleColor,
    ),
    overlayColor: validColor(
      partial?.overlayColor,
      DEFAULT_CONFIG.overlayColor,
    ),
    noiseSpeed: clamp(
      finiteNumber(partial?.noiseSpeed, DEFAULT_CONFIG.noiseSpeed),
      0,
      10,
    ),
    driftAmount: clamp(
      finiteNumber(partial?.driftAmount, DEFAULT_CONFIG.driftAmount),
      0,
      100,
    ),
    revealDuration: Math.round(
      clamp(
        finiteNumber(partial?.revealDuration, DEFAULT_CONFIG.revealDuration),
        0,
        MAX_REVEAL_DURATION,
      ),
    ),
  };
}
