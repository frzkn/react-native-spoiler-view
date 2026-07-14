import { MAX_PARTICLE_COUNT, normalizeSpoilerConfig } from '../config';
import { DEFAULT_CONFIG } from '../constants';

describe('normalizeSpoilerConfig', () => {
  it('returns defaults when no overrides are provided', () => {
    expect(normalizeSpoilerConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('uses an explicit count instead of the canonical density', () => {
    const config = normalizeSpoilerConfig({ particleCount: 72 });

    expect(config.particleCount).toBe(72);
    expect(config.particleDensity).toBeUndefined();
  });

  it('caps work that could freeze the render loop', () => {
    const config = normalizeSpoilerConfig({
      particleCount: Number.POSITIVE_INFINITY,
      particleDensity: Number.POSITIVE_INFINITY,
    });

    expect(config.particleCount).toBe(DEFAULT_CONFIG.particleCount);
    expect(config.particleDensity).toBe(0);
  });

  it('caps finite particle counts at the public maximum', () => {
    expect(normalizeSpoilerConfig({ particleCount: 100_000 }).particleCount).toBe(
      MAX_PARTICLE_COUNT,
    );
  });

  it('sorts and clamps particle size ranges', () => {
    expect(normalizeSpoilerConfig({ particleSizeRange: [100, -4] }).particleSizeRange).toEqual([
      0,
      50,
    ]);
  });

  it('preserves zero density as an explicit override', () => {
    expect(normalizeSpoilerConfig({ particleDensity: 0 }).particleDensity).toBe(0);
  });

  it('falls back before invalid colors reach the native bridge', () => {
    expect(
      normalizeSpoilerConfig({
        overlayColor: 'not a color',
        particleColor: '',
      }),
    ).toMatchObject({
      overlayColor: DEFAULT_CONFIG.overlayColor,
      particleColor: DEFAULT_CONFIG.particleColor,
    });
  });
});
