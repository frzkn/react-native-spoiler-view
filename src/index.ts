/**
 * react-native-spoiler-view
 *
 * A Telegram-style spoiler particle effect component for React Native.
 * Hides content behind animated particles with tap-to-reveal functionality.
 *
 * @example
 * import { SpoilerView } from 'react-native-spoiler-view';
 *
 * <SpoilerView>
 *   <Text>Secret content</Text>
 * </SpoilerView>
 */

// Main component
export { SpoilerView } from './SpoilerView';

// Types for consumers
export type {
  SpoilerViewProps,
  SpoilerConfig,
  Particle,
  ParticleSystemState,
  AlphaTier,
} from './types';

// Constants for customization reference
export { DEFAULT_CONFIG, ALPHA_TIERS } from './constants';
