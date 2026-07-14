import { useCallback } from 'react';
import {
  Easing,
  runOnJS,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { SpoilerConfig } from '../types';

interface ParticleAnimationState {
  revealOriginX: SharedValue<number>;
  revealOriginY: SharedValue<number>;
  revealProgress: SharedValue<number>;
  triggerReveal: (
    touchX: number,
    touchY: number,
    onComplete?: () => void,
  ) => void;
  triggerHide: () => void;
}

/** Keeps only the small set of uniforms that change during reveal/hide. */
export function useParticleSystem(
  config: SpoilerConfig,
): ParticleAnimationState {
  const reduceMotion = useReducedMotion();
  const revealOriginX = useSharedValue(0);
  const revealOriginY = useSharedValue(0);
  const revealProgress = useSharedValue(0);
  const duration = reduceMotion ? 0 : config.revealDuration;

  const triggerReveal = useCallback(
    (touchX: number, touchY: number, onComplete?: () => void) => {
      revealOriginX.value = touchX;
      revealOriginY.value = touchY;
      revealProgress.value = withTiming(
        1,
        {
          duration,
          easing: Easing.out(Easing.quad),
        },
        (finished) => {
          if (finished && onComplete) runOnJS(onComplete)();
        },
      );
    },
    [duration, revealOriginX, revealOriginY, revealProgress],
  );

  const triggerHide = useCallback(() => {
    revealProgress.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [duration, revealProgress]);

  return {
    revealOriginX,
    revealOriginY,
    revealProgress,
    triggerReveal,
    triggerHide,
  };
}
