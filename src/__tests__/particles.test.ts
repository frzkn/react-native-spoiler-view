import { DEFAULT_CONFIG } from '../constants';
import { resolveParticleCount } from '../particles';

describe('resolveParticleCount', () => {
  it('scales canonical dust density with the covered area', () => {
    expect(resolveParticleCount(DEFAULT_CONFIG, 100, 20)).toBe(110);
    expect(resolveParticleCount(DEFAULT_CONFIG, 200, 20)).toBe(180);
  });

  it('honors an explicit fixed count', () => {
    const config = {
      ...DEFAULT_CONFIG,
      particleCount: 37,
      particleDensity: undefined,
    };

    expect(resolveParticleCount(config, 320, 80)).toBe(37);
  });
});
