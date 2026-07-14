import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useRevealGesture } from '../hooks/useRevealGesture';

let mockOnEnd:
  | ((event: { x: number; y: number }, success: boolean) => void)
  | undefined;
interface MockGesture {
  enabled: jest.Mock<MockGesture>;
  onEnd: jest.Mock<MockGesture>;
}

const mockGesture: MockGesture = {
  enabled: jest.fn((): MockGesture => mockGesture),
  onEnd: jest.fn(
    (
      callback: (event: { x: number; y: number }, success: boolean) => void,
    ): MockGesture => {
      mockOnEnd = callback;
      return mockGesture;
    },
  ),
};

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => mockGesture },
}));

jest.mock('react-native-reanimated', () => ({
  runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
}));

function GestureHarness({ onPress }: { onPress: (x: number, y: number) => void }) {
  useRevealGesture({ onPress });
  return null;
}

describe('useRevealGesture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnEnd = undefined;
  });

  it('only handles taps that the recognizer completed successfully', () => {
    const onPress = jest.fn();

    act(() => {
      TestRenderer.create(<GestureHarness onPress={onPress} />);
    });

    act(() => mockOnEnd?.({ x: 12, y: 8 }, false));
    expect(onPress).not.toHaveBeenCalled();

    act(() => mockOnEnd?.({ x: 12, y: 8 }, true));
    expect(onPress).toHaveBeenCalledWith(12, 8);
  });
});
