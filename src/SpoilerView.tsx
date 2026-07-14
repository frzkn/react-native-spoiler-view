import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { RevealView } from './components/NativeRevealView';
import { ParticleCanvas } from './components/ParticleCanvas';
import { useParticleSystem } from './hooks/useParticleSystem';
import { useRevealGesture } from './hooks/useRevealGesture';
import { normalizeSpoilerConfig } from './config';
import type { SpoilerConfig, SpoilerViewProps } from './types';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  hiddenParticles: {
    opacity: 0,
  },
});

const captureTouch = () => true;

/**
 * SpoilerView - Telegram-style spoiler effect component.
 *
 * Hides content behind animated particles with an opaque overlay.
 * Tap to reveal content with a touch-origin circular animation.
 *
 * @example
 * // Basic usage
 * <SpoilerView>
 *   <Text>Secret message!</Text>
 * </SpoilerView>
 *
 * @example
 * // Controlled mode
 * <SpoilerView
 *   revealed={isRevealed}
 *   onReveal={() => setIsRevealed(true)}
 * >
 *   <Image source={secretImage} />
 * </SpoilerView>
 */
export function SpoilerView({
  children,
  revealed: controlledRevealed,
  config: partialConfig,
  onReveal,
  onHide,
  enabled = true,
  style,
  accessibilityRevealLabel = 'Hidden content',
  accessibilityRevealHint = 'Double tap to reveal',
}: SpoilerViewProps) {
  const config = useMemo<SpoilerConfig>(
    () => normalizeSpoilerConfig(partialConfig),
    [
      partialConfig?.driftAmount,
      partialConfig?.noiseSpeed,
      partialConfig?.overlayColor,
      partialConfig?.particleColor,
      partialConfig?.particleCount,
      partialConfig?.particleDensity,
      partialConfig?.particleSizeRange?.[0],
      partialConfig?.particleSizeRange?.[1],
      partialConfig?.revealDuration,
    ],
  );

  // Track layout dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [contentInteractive, setContentInteractive] = useState(false);
  const [internalRevealed, setInternalRevealed] = useState(false);
  const [particlesVisible, setParticlesVisible] = useState(true);
  const pendingRevealPoint = useRef<{ x: number; y: number }>();
  const isControlled = controlledRevealed !== undefined;
  const isRevealed = controlledRevealed ?? internalRevealed;

  const particleSystem = useParticleSystem(config);
  const { revealProgress, triggerHide, triggerReveal } = particleSystem;

  const handlePress = useCallback(
    (x: number, y: number) => {
      if (isControlled) {
        if (controlledRevealed) {
          onHide?.();
        } else {
          pendingRevealPoint.current = { x, y };
          onReveal?.();
        }
        return;
      }

      if (internalRevealed) {
        onHide?.();
      } else {
        pendingRevealPoint.current = { x, y };
        onReveal?.();
      }
      setInternalRevealed(!internalRevealed);
    },
    [controlledRevealed, internalRevealed, isControlled, onHide, onReveal],
  );

  const { gesture } = useRevealGesture({ enabled, onPress: handlePress });

  useEffect(() => {
    if (isRevealed) {
      const revealPoint = pendingRevealPoint.current ?? {
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };
      pendingRevealPoint.current = undefined;
      triggerReveal(revealPoint.x, revealPoint.y, () => {
        setContentInteractive(true);
        setParticlesVisible(false);
      });
    } else {
      pendingRevealPoint.current = undefined;
      triggerHide();
    }
  }, [
    dimensions.height,
    dimensions.width,
    isRevealed,
    triggerHide,
    triggerReveal,
  ]);

  useLayoutEffect(() => {
    if (!isRevealed) {
      setContentInteractive(false);
      setParticlesVisible(true);
    }
  }, [isRevealed]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      if (
        Math.abs(width - dimensions.width) > 1 ||
        Math.abs(height - dimensions.height) > 1
      ) {
        setDimensions({ width, height });
      }
    },
    [dimensions],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.container, style]}
        onLayout={handleLayout}
        accessible={!isRevealed}
        accessibilityRole={!isRevealed ? 'button' : undefined}
        accessibilityLabel={!isRevealed ? accessibilityRevealLabel : ''}
        accessibilityHint={!isRevealed ? accessibilityRevealHint : ''}
        accessibilityState={
          !isRevealed ? { expanded: false, disabled: !enabled } : undefined
        }
        onAccessibilityTap={
          enabled && !isRevealed
            ? () => handlePress(dimensions.width / 2, dimensions.height / 2)
            : undefined
        }
      >
        {/* Actual content - visible when revealed */}
        <RevealView
          width={dimensions.width}
          height={dimensions.height}
          originX={particleSystem.revealOriginX}
          originY={particleSystem.revealOriginY}
          progress={revealProgress}
          pointerEvents={contentInteractive ? 'auto' : 'none'}
          accessibilityElementsHidden={!isRevealed}
          importantForAccessibility={
            isRevealed ? 'auto' : 'no-hide-descendants'
          }
        >
          {children}
        </RevealView>

        {/* Particle overlay - visible when hidden */}
        {dimensions.width > 0 && dimensions.height > 0 && (
          <View
            style={[
              styles.overlay,
              !particlesVisible && styles.hiddenParticles,
            ]}
            pointerEvents="none"
          >
            <ParticleCanvas
              config={config}
              width={dimensions.width}
              height={dimensions.height}
              revealOriginX={particleSystem.revealOriginX}
              revealOriginY={particleSystem.revealOriginY}
              revealProgress={particleSystem.revealProgress}
            />
          </View>
        )}

        {!contentInteractive && (
          <View
            style={styles.overlay}
            accessible={false}
            importantForAccessibility="no"
            onStartShouldSetResponder={captureTouch}
          />
        )}
      </View>
    </GestureDetector>
  );
}
