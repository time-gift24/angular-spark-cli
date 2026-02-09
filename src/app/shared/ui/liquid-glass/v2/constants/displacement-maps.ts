/**
 * Displacement Maps Constants
 * Ported from liquid-glass-react/src/utils.ts
 *
 * Base64-encoded displacement maps used by the liquid glass effect.
 * These maps define the visual distortion patterns applied to the glass filter.
 *
 * Note: Due to bundle size considerations (~41KB for all maps combined),
 * consider loading these from assets/ in production builds using inject(ASSET_URL).
 */

export { displacementMap } from './displacement-map';
export { polarDisplacementMap } from './polar-displacement-map';
export { prominentDisplacementMap } from './prominent-displacement-map';

export type DisplacementMapType = 'standard' | 'polar' | 'prominent' | 'shader';

export { getDisplacementMap, type DisplacementMapMode } from './displacement-maps.helper';
