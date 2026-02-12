import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';

import { ParticleCanvas } from './components/ParticleCanvas';
import { useParticleSystem } from './hooks/useParticleSystem';
import { useRevealGesture } from './hooks/useRevealGesture';
import { DEFAULT_CONFIG } from './constants';
import type { SpoilerConfig, SpoilerViewProps } from './types';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

/**
 * SpoilerView - Telegram-style spoiler effect component.
 *
 * Hides content behind animated particles with an opaque overlay.
 * Tap to reveal content with particle burst animation.
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
}: SpoilerViewProps) {
  // Merge config with defaults
  const config = useMemo<SpoilerConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...partialConfig,
    }),
    [partialConfig],
  );

  // Track layout dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize particle system
  const particleSystem = useParticleSystem(config);

  // Setup tap gesture
  const { gesture, isRevealed } = useRevealGesture({
    particleSystem,
    controlledRevealed,
    enabled,
    dimensions,
    onReveal,
    onHide,
  });

  // Handle layout changes - simplified (no InteractionManager)
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      if (Math.abs(width - dimensions.width) > 1 || Math.abs(height - dimensions.height) > 1) {
        setDimensions({ width, height });
        particleSystem.initParticles(width, height);
      }
    },
    [dimensions, particleSystem],
  );

  // Content opacity - delayed fade in (particles burst first, then content appears)
  const contentAnimatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Content starts fading in after 30% of reveal progress
    const opacity = interpolate(isRevealed.value, [0, 0.3, 1], [0, 0, 1], Extrapolation.CLAMP);

    return { opacity };
  });

  // Overlay opacity - fades out as spoiler reveals
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';

    return {
      opacity: 1 - isRevealed.value,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.container, style]} onLayout={handleLayout}>
        {/* Actual content - visible when revealed */}
        <Animated.View style={contentAnimatedStyle}>{children}</Animated.View>

        {/* Particle overlay - visible when hidden */}
        {dimensions.width > 0 && dimensions.height > 0 && (
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]} pointerEvents="none">
            <ParticleCanvas
              particles={particleSystem.particles}
              config={config}
              width={dimensions.width}
              height={dimensions.height}
              revealProgress={particleSystem.revealProgress}
            />
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}
