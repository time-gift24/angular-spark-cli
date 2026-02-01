/**
 * Liquid Glass Animation State Machine
 *
 * Manages the animation state for smooth cursor tracking with exponential smoothing.
 * This service is tree-shakeable and provided in root for singleton behavior.
 *
 * State Transitions:
 * - 'idle' → 'tracking': When cursor enters element
 * - 'tracking' → 'resetting': When cursor leaves element
 * - 'resetting' → 'idle': When animation completes
 */

import { inject, Injectable } from '@angular/core';
import {
  LiquidGlassPosition,
  LiquidGlassAnimationState,
} from '@app/shared/ui/liquid-glass/types/liquid-glass.types';

/**
 * Animation state machine for liquid glass cursor tracking
 *
 * Uses exponential smoothing to create smooth, natural cursor following
 * animations. The state machine tracks three positions:
 * - Target: Where the cursor currently is (where we want to be)
 * - Current: Where the effect is currently displayed (actual position)
 * - Center: The rest position (0.5, 0.5)
 *
 * @example
 * ```ts
 * const machine = inject(LiquidGlassAnimationStateMachine);
 * machine.setTarget({ x: 0.7, y: 0.3 });
 *
 * // In animation loop
 * const { position, isAnimating } = machine.tick();
 * if (isAnimating) {
 *   // Continue animation
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LiquidGlassAnimationStateMachine {
  /**
   * Current animation state
   *
   * Tracks whether the system is idle, tracking cursor, or resetting.
   */
  private currentState: LiquidGlassAnimationState = 'idle';

  /**
   * Target position for cursor tracking
   *
   * This represents where the cursor currently is (normalized 0-1).
   * The current position will smoothly interpolate toward this target.
   *
   * Uses mutable internal state for efficient animation updates.
   */
  private targetPosition: { x: number; y: number } = { x: 0.5, y: 0.5 };

  /**
   * Current displayed position
   *
   * This is the actual position used for rendering. It follows the target
   * position with exponential smoothing for smooth animations.
   *
   * Uses mutable internal state for efficient animation updates.
   */
  private currentPosition: { x: number; y: number } = { x: 0.5, y: 0.5 };

  /**
   * Elasticity factor for animation smoothing
   *
   * Range: 0-0.6
   * - Lower values: Slower, smoother animations
   * - Higher values: Faster, more responsive animations
   * - Default: 0.25 (balanced for most use cases)
   *
   * The actual interpolation factor k is calculated as:
   * k = 1 - (1 - elasticity)^2
   *
   * This non-linear mapping provides more control at lower values.
   */
  private elasticity = 0.25;

  /**
   * Threshold for considering animation complete
   *
   * When the distance between current and target position is below this
   * value (in both axes), the animation is considered complete.
   *
   * Value: 0.001 (0.1% of element size)
   */
  private readonly ANIMATION_THRESHOLD = 0.001;

  /**
   * Transition to a new animation state
   *
   * Updates the internal state machine state. Valid transitions are:
   * - 'idle' → 'tracking': Cursor entered element
   * - 'tracking' → 'resetting': Cursor left element
   * - 'resetting' → 'idle': Animation completed (automatic)
   *
   * @param newState - The new state to transition to
   *
   * @example
   * ```ts
   * machine.transition('tracking');
   * ```
   */
  transition(newState: LiquidGlassAnimationState): void {
    this.currentState = newState;
  }

  /**
   * Update target cursor position
   *
   * Sets the new target position for the animation. If currently idle,
   * automatically transitions to tracking state.
   *
   * @param position - New target position (normalized 0-1)
   *
   * @example
   * ```ts
   * // Cursor at 70% right, 30% down
   * machine.setTarget({ x: 0.7, y: 0.3 });
   * ```
   */
  setTarget(position: LiquidGlassPosition): void {
    this.targetPosition = position;
    if (this.currentState === 'idle') {
      this.transition('tracking');
    }
  }

  /**
   * Reset animation to center position
   *
   * Sets the target to center (0.5, 0.5) and transitions to resetting state.
   * Call this when the cursor leaves the element.
   *
   * @example
   * ```ts
   * // Cursor left element
   * machine.reset();
   * ```
   */
  reset(): void {
    this.targetPosition = { x: 0.5, y: 0.5 };
    this.transition('resetting');
  }

  /**
   * Get current animation state
   *
   * Returns the current state of the state machine. Useful for debugging
   * or conditional logic based on animation state.
   *
   * @returns Current animation state ('idle' | 'tracking' | 'resetting')
   *
   * @example
   * ```ts
   * if (machine.getState() === 'tracking') {
   *   // Update UI
   * }
   * ```
   */
  getState(): LiquidGlassAnimationState {
    return this.currentState;
  }

  /**
   * Calculate next animation frame
   *
   * Performs one step of exponential smoothing toward the target position.
   * This should be called on each animation frame (typically via requestAnimationFrame).
   *
   * Mathematical model:
   * - Interpolation factor: k = 1 - (1 - elasticity)^2
   * - Position update: current += (target - current) * k
   *
   * The function returns:
   * - position: The new current position for rendering
   * - isAnimating: Whether animation should continue
   *
   * When the distance to target is below threshold (0.001):
   * - If resetting: Transitions to 'idle' state
   * - Sets isAnimating to false to stop animation loop
   *
   * @returns Object containing position and animation status
   *
   * @example
   * ```ts
   * const animate = () => {
   *   const { position, isAnimating } = machine.tick();
   *
   *   // Update visual effect with position
   *   updateEffect(position);
   *
   *   if (isAnimating) {
   *     requestAnimationFrame(animate);
   *   }
   * };
   *
   * requestAnimationFrame(animate);
   * ```
   */
  tick(): { position: LiquidGlassPosition; isAnimating: boolean } {
    // Calculate interpolation factor using elasticity formula
    // k = 1 - (1 - elasticity)^2
    // This provides non-linear mapping for better control
    const k = 1 - Math.pow(1 - this.elasticity, 2);

    // Apply exponential smoothing to both axes
    // current += (target - current) * k
    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * k;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * k;

    // Check if close enough to target to consider animation complete
    const dx = Math.abs(this.targetPosition.x - this.currentPosition.x);
    const dy = Math.abs(this.targetPosition.y - this.currentPosition.y);

    if (dx < this.ANIMATION_THRESHOLD && dy < this.ANIMATION_THRESHOLD) {
      // Animation complete
      if (this.currentState === 'resetting') {
        // Auto-transition to idle when reset completes
        this.transition('idle');
      }
      // Return immutable position object
      return {
        position: { x: this.currentPosition.x, y: this.currentPosition.y },
        isAnimating: false,
      };
    }

    // Animation still in progress
    // Return immutable position object
    return {
      position: { x: this.currentPosition.x, y: this.currentPosition.y },
      isAnimating: true,
    };
  }

  /**
   * Set elasticity factor for animation smoothing
   *
   * The elasticity value is clamped to the valid range [0, 0.6].
   * Higher values produce faster, more responsive animations.
   *
   * @param value - New elasticity value (will be clamped to 0-0.6)
   *
   * @example
   * ```ts
   * // Faster response
   * machine.setElasticity(0.4);
   *
   * // Slower, smoother
   * machine.setElasticity(0.15);
   *
   * // Values outside range are clamped
   * machine.setElasticity(1.0); // Actually set to 0.6
   * ```
   */
  setElasticity(value: number): void {
    // Clamp value to valid range [0, 0.6]
    this.elasticity = Math.max(0, Math.min(0.6, value));
  }
}
