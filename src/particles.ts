import { MAX_PARTICLE_COUNT } from './config';
import type { SpoilerConfig } from './types';

export function resolveParticleCount(
  config: SpoilerConfig,
  width: number,
  height: number,
): number {
  return Math.min(
    MAX_PARTICLE_COUNT,
    config.particleDensity === undefined
      ? config.particleCount
      : Math.min(
          config.particleCount,
          Math.round(config.particleDensity * width * height),
        ),
  );
}
