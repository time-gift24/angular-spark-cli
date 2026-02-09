/**
 * Displacement Maps Helper Functions
 * Ported from liquid-glass-react/src/utils.ts
 */

import { displacementMap } from './displacement-map';
import { polarDisplacementMap } from './polar-displacement-map';
import { prominentDisplacementMap } from './prominent-displacement-map';

export type DisplacementMapMode = 'standard' | 'polar' | 'prominent' | 'shader';

/**
 * Retrieves the appropriate displacement map based on the mode.
 * If shader mode is specified and a custom URL is provided, returns that URL.
 *
 * @param mode - The displacement map mode to use
 * @param shaderMapUrl - Optional custom shader map URL for shader mode
 * @returns The data URL of the displacement map
 */
export function getDisplacementMap(
  mode: DisplacementMapMode = 'standard',
  shaderMapUrl?: string
): string {
  switch (mode) {
    case 'standard':
      return displacementMap;
    case 'polar':
      return polarDisplacementMap;
    case 'prominent':
      return prominentDisplacementMap;
    case 'shader':
      return shaderMapUrl || displacementMap;
    default:
      return displacementMap;
  }
}
