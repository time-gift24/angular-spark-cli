/**
 * Depth Guard - Nesting Depth Control Utility
 *
 * Enforces nesting depth limits for markdown blocks.
 * Only List and Blockquote blocks support nesting, with a configurable maximum depth.
 */

import { MarkdownBlock, isListBlock, isBlockquoteBlock } from './models';

/**
 * Maximum nesting depth allowed for nested blocks (List and Blockquote).
 * - Depth 0: Top-level blocks
 * - Depth 1: First level of nesting
 * - Depth 2: Second level of nesting (maximum allowed with MAX_NEST_DEPTH = 2)
 *
 * This limit prevents excessive nesting complexity and ensures predictable rendering.
 */
export const MAX_NEST_DEPTH = 2;

/**
 * Depth guard utility for controlling block nesting.
 *
 * Enforces two rules:
 * 1. Depth cannot exceed MAX_NEST_DEPTH
 * 2. Only List and Blockquote block types support nesting
 */
export class DepthGuard {
  /**
   * Determines if a block can be nested at the given depth.
   *
   * @param block - The block to check for nesting eligibility
   * @param currentDepth - The current nesting depth (0 = top level)
   * @returns true if the block can be nested at this depth, false otherwise
   */
  static canNest(block: MarkdownBlock, currentDepth: number): boolean {
    // 1. Check depth limit - use > instead of >= to allow one more level
    if (currentDepth > MAX_NEST_DEPTH) {
      return false;
    }

    // 2. Only List and Blockquote support nesting
    return isListBlock(block) || isBlockquoteBlock(block);
  }

  /**
   * Checks if the given depth is at the maximum allowed nesting depth.
   *
   * @param depth - The depth to check
   * @returns true if depth is at or exceeds MAX_NEST_DEPTH
   */
  static isAtMaxDepth(depth: number): boolean {
    return depth >= MAX_NEST_DEPTH;
  }
}
