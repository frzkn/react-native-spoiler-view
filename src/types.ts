import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Alpha tier for particle depth.
 * 0 = light (0.3 opacity), 1 = mid (0.6 opacity), 2 = full (1.0 opacity)
 */
export type AlphaTier = 0 | 1 | 2;

/**
 * Individual particle state
 */
export interface Particle {
  /** Initial X position */
  baseX: number;
  /** Initial Y position */
  baseY: number;
  /** Radius in logical pixels */
  size: number;
  /** Alpha tier for depth effect (0=light, 1=mid, 2=full) */
  alphaTier: AlphaTier;
  /** Unique noise seed for X movement */
  noiseOffsetX: number;
  /** Unique noise seed for Y movement */
  noiseOffsetY: number;
  /** Reveal velocity X retained for compatibility with the legacy Particle shape. */
  velocityX: number;
  /** Reveal velocity Y retained for compatibility with the legacy Particle shape. */
  velocityY: number;
  /** Lifecycle phase offset (for staggered spawning) */
  life: number;
  /** Particle lifetime in seconds */
  lifetime: number;
  /** Drift velocity X (constant direction during life) */
  driftVx: number;
  /** Drift velocity Y (constant direction during life) */
  driftVy: number;
}

/**
 * Configuration options for the spoiler effect
 */
export interface SpoilerConfig {
  /** Target count, or per-view cap when particleDensity is set (default: 180). */
  particleCount: number;
  /** Particles per logical pixel² (default: 0.055), bounded by particleCount. */
  particleDensity?: number;
  /** Min and max particle radius in logical pixels (default: [0.45, 0.8]) */
  particleSizeRange: [number, number];
  /** Particle color - alpha tiers (0.3, 0.6, 1.0) applied internally for depth */
  particleColor: string;
  /** Canvas background color (default: 'transparent') */
  overlayColor: string;
  /** Speed of independent ambient particle motion (default: 0.3) */
  noiseSpeed: number;
  /** Maximum ambient particle drift in logical pixels (default: 1) */
  driftAmount: number;
  /** Duration of reveal animation in ms (default: 500) */
  revealDuration: number;
}

/**
 * Props for the SpoilerView component
 */
export interface SpoilerViewProps {
  /** Content to be hidden behind the spoiler */
  children: ReactNode;
  /** Controlled reveal state (optional) */
  revealed?: boolean;
  /** Partial config to override defaults */
  config?: Partial<SpoilerConfig>;
  /** Callback when spoiler is revealed */
  onReveal?: () => void;
  /** Callback when spoiler is hidden */
  onHide?: () => void;
  /** Enable tap gesture to reveal (default: true) */
  enabled?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Screen-reader label used while the content is hidden */
  accessibilityRevealLabel?: string;
  /** Screen-reader hint used while the content is hidden */
  accessibilityRevealHint?: string;
  /** Screen-reader label for hiding revealed content */
  accessibilityHideLabel?: string;
  /** Screen-reader hint for hiding revealed content */
  accessibilityHideHint?: string;
}

/** @deprecated Particle generation is native as of 0.1.0. */
export interface ParticleSystemState {
  /** All particles as a SharedValue for reactivity */
  particles: SharedValue<Particle[]>;
  /** Reveal animation progress (0 = hidden, 1 = revealed) */
  revealProgress: SharedValue<number>;
  /** Initialize particles for given dimensions */
  initParticles: (width: number, height: number) => void;
  /** Trigger reveal animation from touch point */
  triggerReveal: (touchX: number, touchY: number) => void;
  /** Trigger hide animation */
  triggerHide: () => void;
}
