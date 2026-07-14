import React from 'react';
import {
  Platform,
  requireNativeComponent,
  UIManager,
  type ViewProps,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

interface NativeRevealProps extends ViewProps {
  originX?: number;
  originY?: number;
  progress?: number;
}

interface RevealViewProps extends ViewProps {
  children: React.ReactNode;
  height: number;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  progress: SharedValue<number>;
  width: number;
}

const componentName = 'RNSpoilerRevealView';
const isNativeRevealAvailable =
  Platform.OS !== 'web' && UIManager.getViewManagerConfig(componentName) != null;
const NativeReveal = isNativeRevealAvailable
  ? Animated.createAnimatedComponent(
      requireNativeComponent<NativeRevealProps>(componentName),
    )
  : null;

export function RevealView({
  children,
  height,
  originX,
  originY,
  progress,
  width,
  ...viewProps
}: RevealViewProps) {
  const animatedProps = useAnimatedProps<NativeRevealProps>(() => ({
    originX: width > 0 ? originX.value / width : 0.5,
    originY: height > 0 ? originY.value / height : 0.5,
    progress: progress.value,
  }));
  const fallbackStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  if (NativeReveal) {
    return (
      <NativeReveal {...viewProps} animatedProps={animatedProps}>
        {children}
      </NativeReveal>
    );
  }

  return (
    <Animated.View {...viewProps} style={[viewProps.style, fallbackStyle]}>
      {children}
    </Animated.View>
  );
}
