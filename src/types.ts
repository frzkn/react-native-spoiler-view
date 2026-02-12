import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Alpha tier for particle depth (matches Telegram's approach)
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
  /** Radius in pixels (1.5-3) */
  size: number;
  /** Alpha tier for depth effect (0=light, 1=mid, 2=full) */
  alphaTier: AlphaTier;
  /** Unique noise seed for X movement */
  noiseOffsetX: number;
  /** Unique noise seed for Y movement */
  noiseOffsetY: number;
  /** Burst velocity X (set during reveal) */
  velocityX: number;
  /** Burst velocity Y (set during reveal) */
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
  /** Number of particles to render (default: 200). Ignored if density is set. */
  particleCount: number;
  /** Particles per pixel² (e.g., 0.08). If set, overrides particleCount. */
  particleDensity?: number;
  /** Min and max particle radius in pixels (default: [1.5, 3]) */
  particleSizeRange: [number, number];
  /** Particle color - alpha tiers (0.3, 0.6, 1.0) applied internally for depth */
  particleColor: string;
  /** Overlay color - opaque to hide content (default: 'rgba(180, 180, 180, 0.92)') */
  overlayColor: string;
  /** Speed of noise evolution (default: 0.3) */
  noiseSpeed: number;
  /** Pixels of noise-based drift (default: 6) */
  driftAmount: number;
  /** Duration of reveal animation in ms (default: 350) */
  revealDuration: number;
  /** Speed of particle burst on reveal (default: 180) */
  burstSpeed: number;
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
  style?: ViewStyle;
}

/**
 * Internal state managed by useParticleSystem
 */
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
