import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import { SpoilerView } from '../SpoilerView';

const mockTriggerHide = jest.fn();
const mockTriggerReveal = jest.fn();
const mockParticleSystem = {
  revealOriginX: { value: 0 },
  revealOriginY: { value: 0 },
  revealProgress: { value: 0 },
  triggerHide: mockTriggerHide,
  triggerReveal: mockTriggerReveal,
};
let mockGesturePress: ((x: number, y: number) => void) | undefined;

jest.mock('../hooks/useParticleSystem', () => ({
  useParticleSystem: () => ({
    ...mockParticleSystem,
    triggerHide: () => mockTriggerHide(),
    triggerReveal: (
      x: number,
      y: number,
      onComplete?: () => void,
    ) => mockTriggerReveal(x, y, onComplete),
  }),
}));

jest.mock('../hooks/useRevealGesture', () => ({
  useRevealGesture: ({
    onPress,
  }: {
    onPress: (x: number, y: number) => void;
  }) => {
    mockGesturePress = onPress;
    return { gesture: {} };
  },
}));

jest.mock('../components/ParticleCanvas', () => ({
  ParticleCanvas: () => null,
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

function secret() {
  return <Text>classified</Text>;
}

function layout(
  renderer: TestRenderer.ReactTestRenderer,
  width = 100,
  height = 40,
) {
  const container = renderer.root.find(
    (node) => typeof node.props.onLayout === 'function',
  );
  act(() => {
    container.props.onLayout({ nativeEvent: { layout: { width, height } } });
  });
}

describe('SpoilerView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGesturePress = undefined;
    mockParticleSystem.revealProgress.value = 0;
  });

  it('does not let a gesture override controlled state', () => {
    const onReveal = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed={false} onReveal={onReveal}>
          {secret()}
        </SpoilerView>,
      );
    });
    mockTriggerReveal.mockClear();

    act(() => mockGesturePress?.(12, 8));

    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(mockTriggerReveal).not.toHaveBeenCalled();
    expect(
      renderer!.root.find(
        (node) => node.props.accessibilityElementsHidden === true,
      ).props.pointerEvents,
    ).toBe('none');
  });

  it('uses the prop transition to animate a controlled reveal from the tap point', () => {
    const onReveal = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed={false} onReveal={onReveal}>
          {secret()}
        </SpoilerView>,
      );
    });
    layout(renderer!);
    act(() => mockGesturePress?.(24, 16));
    mockTriggerReveal.mockClear();

    act(() => {
      renderer!.update(
        <SpoilerView revealed onReveal={onReveal}>
          {secret()}
        </SpoilerView>,
      );
    });

    expect(mockTriggerReveal).toHaveBeenCalledWith(
      24,
      16,
      expect.any(Function),
    );
  });

  it('does not enable child interaction until the reveal animation completes', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed={false}>{secret()}</SpoilerView>,
      );
    });
    layout(renderer!);
    act(() => {
      renderer.update(<SpoilerView revealed>{secret()}</SpoilerView>);
    });

    const completion = mockTriggerReveal.mock.calls.at(-1)?.[2];
    const revealedContent = () =>
      renderer!.root.find(
        (node) => node.props.accessibilityElementsHidden === false,
      );

    expect(revealedContent().props.pointerEvents).toBe('none');
    expect(
      renderer!.root.findAll(
        (node) => typeof node.props.onStartShouldSetResponder === 'function',
      ).length,
    ).toBeGreaterThan(0);

    act(() => completion?.());

    expect(revealedContent().props.pointerEvents).toBe('auto');
    expect(
      renderer!.root.findAll(
        (node) => typeof node.props.onStartShouldSetResponder === 'function',
      ),
    ).toHaveLength(0);
  });

  it('always follows controlled state when a transition is reversed', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed={false}>{secret()}</SpoilerView>,
      );
    });
    layout(renderer!);
    act(() => {
      renderer.update(<SpoilerView revealed>{secret()}</SpoilerView>);
    });
    act(() => {
      renderer.update(<SpoilerView revealed={false}>{secret()}</SpoilerView>);
    });

    expect(mockTriggerReveal).toHaveBeenCalledTimes(1);
    expect(mockTriggerHide).toHaveBeenCalledTimes(2);
  });

  it('starts an initial reveal after layout without restarting on resize', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed>{secret()}</SpoilerView>,
      );
    });

    expect(mockTriggerReveal).not.toHaveBeenCalled();
    layout(renderer!);

    expect(mockTriggerReveal).toHaveBeenCalledWith(
      50,
      20,
      expect.any(Function),
    );

    layout(renderer!, 200, 80);

    expect(mockTriggerReveal).toHaveBeenCalledTimes(1);
  });

  it('owns state internally when the revealed prop is absent', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<SpoilerView>{secret()}</SpoilerView>);
    });
    layout(renderer!);
    mockTriggerReveal.mockClear();

    act(() => mockGesturePress?.(10, 20));

    expect(mockTriggerReveal).toHaveBeenCalledWith(
      10,
      20,
      expect.any(Function),
    );
  });

  it('hides descendants from touch and accessibility until reveal', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed={false}>{secret()}</SpoilerView>,
      );
    });

    const hiddenContent = renderer!.root.find(
      (node) => node.props.importantForAccessibility === 'no-hide-descendants',
    );
    const revealControl = renderer!.root.find(
      (node) => node.props.accessibilityRole === 'button',
    );

    expect(hiddenContent.props.pointerEvents).toBe('none');
    expect(hiddenContent.props.accessibilityElementsHidden).toBe(true);
    expect(revealControl.props.accessibilityLabel).toBe('Hidden content');
    expect(revealControl.props.accessibilityHint).toBe('Double tap to reveal');
  });

  it('clears the reveal label after content is revealed', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed>{secret()}</SpoilerView>,
      );
    });

    const revealedContainer = renderer!.root.find(
      (node) =>
        node.props.accessible === false && node.props.accessibilityLabel === '',
    );

    expect(revealedContainer.props.accessibilityHint).toBe('');
  });

  it('lets screen-reader users hide revealed content', () => {
    const onHide = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <SpoilerView revealed onHide={onHide}>
          {secret()}
        </SpoilerView>,
      );
    });

    const hideControl = renderer!.root.find(
      (node) => node.props.accessibilityLabel === 'Hide content',
    );

    expect(hideControl.props.accessibilityHint).toBe('Double tap to hide');
    expect(hideControl.props.accessibilityActions).toEqual([
      { name: 'activate' },
    ]);

    act(() => {
      hideControl.props.onAccessibilityAction({
        nativeEvent: { actionName: 'activate' },
      });
    });

    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
