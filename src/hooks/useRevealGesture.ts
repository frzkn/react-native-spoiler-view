import { useMemo } from 'react';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface UseRevealGestureOptions {
  /** Enable gesture (default: true) */
  enabled?: boolean;
  /** Handle a completed tap on the JavaScript thread */
  onPress: (x: number, y: number) => void;
}

interface UseRevealGestureReturn {
  /** Tap gesture to attach to GestureDetector */
  gesture: GestureType;
}

/**
 * Manages tap gesture for revealing/hiding spoiler content.
 * Supports both controlled and uncontrolled modes.
 */
export function useRevealGesture({
  enabled = true,
  onPress,
}: UseRevealGestureOptions): UseRevealGestureReturn {
  const gesture = useMemo(() => {
    return Gesture.Tap()
      .enabled(enabled)
      .onEnd((event, success) => {
        'worklet';
        if (success) {
          runOnJS(onPress)(event.x, event.y);
        }
      });
  }, [enabled, onPress]);

  return {
    gesture,
  };
}
