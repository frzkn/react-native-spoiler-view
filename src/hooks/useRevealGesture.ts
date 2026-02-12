import { useMemo, useEffect } from 'react';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { runOnJS, type SharedValue } from 'react-native-reanimated';

import type { ParticleSystemState } from '../types';

interface UseRevealGestureOptions {
  /** Particle system state and controls */
  particleSystem: ParticleSystemState;
  /** Controlled reveal state (optional) */
  controlledRevealed?: boolean;
  /** Enable gesture (default: true) */
  enabled?: boolean;
  /** View dimensions for controlled mode center burst */
  dimensions?: { width: number; height: number };
  /** Callback when revealed */
  onReveal?: () => void;
  /** Callback when hidden */
  onHide?: () => void;
}

interface UseRevealGestureReturn {
  /** Tap gesture to attach to GestureDetector */
  gesture: GestureType;
  /** Current reveal state */
  isRevealed: SharedValue<number>;
}

/**
 * Manages tap gesture for revealing/hiding spoiler content.
 * Supports both controlled and uncontrolled modes.
 */
export function useRevealGesture({
  particleSystem,
  controlledRevealed,
  enabled = true,
  dimensions,
  onReveal,
  onHide,
}: UseRevealGestureOptions): UseRevealGestureReturn {
  const { revealProgress, triggerReveal, triggerHide } = particleSystem;

  // Sync with controlled state if provided (fallback for external state changes)
  useEffect(() => {
    if (controlledRevealed !== undefined) {
      if (controlledRevealed && revealProgress.value < 0.1) {
        // Only trigger if not already animating (tap gesture may have started it)
        // Use center as fallback when controlled externally (not by tap)
        const centerX = dimensions?.width ? dimensions.width / 2 : 0;
        const centerY = dimensions?.height ? dimensions.height / 2 : 0;
        triggerReveal(centerX, centerY);
      } else if (!controlledRevealed && revealProgress.value > 0.5) {
        triggerHide();
      }
    }
  }, [controlledRevealed, revealProgress, triggerReveal, triggerHide, dimensions]);

  const gesture = useMemo(() => {
    if (!enabled) {
      return Gesture.Tap().enabled(false);
    }

    return Gesture.Tap().onEnd(event => {
      'worklet';

      // Controlled mode - trigger animation from tap point, then call callback
      if (controlledRevealed !== undefined) {
        if (revealProgress.value < 0.5) {
          // Reveal from tap location (not center!)
          runOnJS(triggerReveal)(event.x, event.y);
          if (onReveal) {
            runOnJS(onReveal)();
          }
        } else if (revealProgress.value >= 0.5) {
          runOnJS(triggerHide)();
          if (onHide) {
            runOnJS(onHide)();
          }
        }
        return;
      }

      // Uncontrolled mode - toggle internally
      // IMPORTANT: Must use runOnJS because triggerReveal/triggerHide
      // use runOnUI internally - calling from worklet causes thread conflict
      const isCurrentlyRevealed = revealProgress.value > 0.5;

      if (isCurrentlyRevealed) {
        // Hide
        runOnJS(triggerHide)();
        if (onHide) {
          runOnJS(onHide)();
        }
      } else {
        // Reveal from tap location
        runOnJS(triggerReveal)(event.x, event.y);
        if (onReveal) {
          runOnJS(onReveal)();
        }
      }
    });
  }, [enabled, controlledRevealed, revealProgress, triggerReveal, triggerHide, onReveal, onHide]);

  return {
    gesture,
    isRevealed: revealProgress,
  };
}
