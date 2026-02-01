import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Signal } from '@angular/core';
import { PanelSize, PanelPosition } from '../models';

/**
 * Resize mode for different handle positions.
 *
 * - 'bottom-right': Fixed top-left corner, adjusts width and height (default)
 * - 'top-right': Fixed bottom-left corner, adjusts width, top, and height
 */
export type ResizeMode = 'bottom-right' | 'top-right';

/**
 * Resize handle directive for making elements resizable.
 *
 * This directive attaches to any element (typically a resize handle) and enables
 * resize functionality. It tracks mouse movements and updates the panel size
 * in real-time, emitting size changes that parent components can handle.
 *
 * Key features:
 * - Mouse-based resize functionality with mousedown, mousemove, mouseup
 * - Real-time size updates via Signal integration
 * - Resize lifecycle events (resizeStart, resizeEnd, sizeChange)
 * - Min/max size constraints enforcement
 * - Multiple resize modes for different handle positions
 * - Automatic cleanup on destroy
 * - requestAnimationFrame throttling for optimal performance
 *
 * Resize Modes:
 *
 * This directive supports two resize modes via the [resizeMode] input:
 *
 * 1. 'bottom-right' (default):
 *    - Fixed top-left corner
 *    - Adjusts width and height by expanding from top-left
 *    - Use for handles in the bottom-right corner
 *
 * 2. 'top-right':
 *    - Fixed bottom-left corner
 *    - Adjusts width, top position, and height by expanding from bottom-left
 *    - Use for handles in the top-right corner
 *    - Emits both sizeChange and positionChange events
 *
 * Transition Handling:
 *
 * This directive provides lifecycle events that parent components should use to
 * disable CSS transitions during resize operations. This prevents laggy/jerky
 * behavior that occurs when CSS transitions conflict with JavaScript-driven size
 * updates.
 *
 * The directive emits two events for transition management:
 * - (resizeStart): Fired when resize begins - use to disable CSS transitions
 * - (resizeEnd): Fired when resize ends - use to re-enable CSS transitions
 *
 * Example implementation in parent component:
 * ```typescript
 * @Component({ ... })
 * class MyComponent {
 *   isResizing = false;
 *
 *   onResizeStart() {
 *     this.isResizing = true;
 *   }
 *
 *   onResizeEnd() {
 *     this.isResizing = false;
 *   }
 * }
 * ```
 *
 * And in the template:
 * ```html
 * <div [style.transition]="isResizing ? 'none' : 'all 0.2s'"
 *      [appResizeHandle]="size"
 *      [resizeMode]="'top-right'"
 *      [position]="position"
 *      (sizeChange)="onSizeChange($event)"
 *      (positionChange)="onPositionChange($event)"
 *      (resizeStart)="onResizeStart()"
 *      (resizeEnd)="onResizeEnd()">
 *   Resize me!
 * </div>
 * ```
 *
 * Known limitations:
 * - TODO: Keyboard accessibility not implemented (future enhancement)
 * - TODO: Touch event support not implemented (future enhancement)
 *
 * Usage:
 * ```html
 * <!-- Bottom-right handle (default mode) -->
 * <div [appResizeHandle]="size"
 *      [minSize]="{ width: 300, height: 200 }"
 *      [maxSize]="{ width: 1200, height: 800 }"
 *      (sizeChange)="onSizeChange($event)">
 *   Resize me!
 * </div>
 *
 * <!-- Top-right handle (fixed bottom mode) -->
 * <div [appResizeHandle]="size"
 *      [resizeMode]="'top-right'"
 *      [position]="position"
 *      (sizeChange)="onSizeChange($event)"
 *      (positionChange)="onPositionChange($event)">
 *   Resize me!
 * </div>
 * ```
 */
@Directive({
  selector: '[appResizeHandle]',
  standalone: true,
})
export class ResizeHandleDirective implements OnInit, OnDestroy {
  /**
   * Current size signal from parent component.
   * Required input that provides the initial and current size.
   */
  @Input({ required: true, alias: 'appResizeHandle' }) size!: Signal<PanelSize>;

  /**
   * Current position signal from parent component.
   * Required for 'top-right' resize mode to calculate position changes.
   */
  @Input() position!: Signal<PanelPosition>;

  /**
   * Resize mode determines which corner is fixed during resize.
   * - 'bottom-right' (default): Fixed top-left corner
   * - 'top-right': Fixed bottom-left corner, also emits positionChange
   */
  @Input() resizeMode: ResizeMode = 'bottom-right';

  /**
   * Minimum size constraints.
   * Panel will not resize smaller than these dimensions.
   * Defaults to { width: 300, height: 200 }.
   */
  @Input() minSize: PanelSize = { width: 300, height: 200 };

  /**
   * Maximum size constraints.
   * Panel will not resize larger than these dimensions.
   * Defaults to 90% of viewport width and 70% of viewport height.
   */
  @Input() maxSize: PanelSize = {
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.7,
  };

  /**
   * Emits when size changes during resize.
   * Parent components should update their size state when this fires.
   */
  @Output() sizeChange = new EventEmitter<PanelSize>();

  /**
   * Emits when position changes during resize (only for 'top-right' mode).
   * Parent components should update their position state when this fires.
   */
  @Output() positionChange = new EventEmitter<PanelPosition>();

  /**
   * Emits when resize operation starts (mousedown).
   * Useful for disabling transitions or changing cursor.
   */
  @Output() resizeStart = new EventEmitter<void>();

  /**
   * Emits when resize operation ends (mouseup).
   * Useful for re-enabling transitions or restoring cursor.
   */
  @Output() resizeEnd = new EventEmitter<void>();

  /**
   * Tracks whether a resize operation is currently in progress.
   */
  private isResizing = false;

  /**
   * Stores the initial size when resize starts.
   * Used to calculate size deltas during resize.
   */
  private startSize!: PanelSize;

  /**
   * Stores the initial position when resize starts (for 'top-right' mode).
   * Used to calculate position changes during resize.
   */
  private startPosition!: PanelPosition;

  /**
   * Stores the initial mouse position when resize starts.
   * Used to calculate how far the mouse has moved.
   */
  private startMousePosition!: { x: number; y: number };

  /**
   * Bound mouse move handler for efficient addEventListener/removeEventListener.
   * Created in ngOnInit to maintain consistent function reference.
   */
  private boundMouseMove?: (event: MouseEvent) => void;

  /**
   * Bound mouse up handler for efficient addEventListener/removeEventListener.
   * Created in ngOnInit to maintain consistent function reference.
   */
  private boundMouseUp?: () => void;

  /**
   * RequestAnimationFrame ID for throttling size updates.
   * Ensures size changes only emit once per frame for optimal performance.
   */
  private rafId?: number;

  ngOnInit(): void {
    // Create bound handlers once for efficient addEventListener/removeEventListener
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
  }

  ngOnDestroy(): void {
    // Clean up event listeners if component is destroyed during resize
    if (this.isResizing) {
      this.removeGlobalListeners();
    }

    // Cancel any pending RAF update
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  /**
   * Handles mousedown event to initiate resize operation.
   * Stores initial size, position, and mouse coordinates for delta calculation.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Only start resize with left mouse button
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    this.isResizing = true;
    this.startSize = { ...this.size() };
    this.startMousePosition = { x: event.clientX, y: event.clientY };

    // Store initial position for 'top-right' mode
    if (this.resizeMode === 'top-right' && this.position) {
      this.startPosition = { ...this.position() };
    }

    this.addGlobalListeners();
    this.resizeStart.emit();
  }

  /**
   * Handles mousemove event during resize.
   * Calculates new size (and position for 'top-right' mode) based on mouse delta.
   *
   * Features:
   * - requestAnimationFrame throttling to prevent excessive re-renders
   * - Min/max size constraints to prevent invalid dimensions
   * - Support for different resize modes
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) {
      return;
    }

    // Cancel any pending RAF update to ensure we only emit once per frame
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
    }

    // Schedule size update for next animation frame
    this.rafId = requestAnimationFrame(() => {
      const deltaX = event.clientX - this.startMousePosition.x;
      const deltaY = event.clientY - this.startMousePosition.y;

      let newSize: PanelSize;
      let newPosition: PanelPosition | undefined;

      if (this.resizeMode === 'top-right') {
        // Fixed bottom-left corner mode
        // Adjusts: width (+deltaX), height (-deltaY), top (+deltaY)

        const newWidth = this.startSize.width + deltaX;
        const newHeight = this.startSize.height - deltaY;
        const newTop = this.startPosition.y + deltaY;

        // Enforce min/max constraints
        const clampedWidth = this.clamp(newWidth, this.minSize.width, this.maxSize.width);
        const clampedHeight = this.clamp(newHeight, this.minSize.height, this.maxSize.height);

        // Calculate actual top position based on clamped height
        // We need to maintain the bottom position, so: newTop = (startTop + startHeight) - newHeight
        const bottomPosition = this.startPosition.y + this.startSize.height;
        const clampedTop = bottomPosition - clampedHeight;

        newSize = {
          width: clampedWidth,
          height: clampedHeight,
        };

        newPosition = {
          x: this.startPosition.x,
          y: clampedTop,
        };
      } else {
        // Default mode: fixed top-left corner
        // Adjusts: width (+deltaX), height (+deltaY)

        const newWidth = this.startSize.width + deltaX;
        const newHeight = this.startSize.height + deltaY;

        // Enforce min/max constraints
        const clampedWidth = this.clamp(newWidth, this.minSize.width, this.maxSize.width);
        const clampedHeight = this.clamp(newHeight, this.minSize.height, this.maxSize.height);

        newSize = {
          width: clampedWidth,
          height: clampedHeight,
        };
      }

      this.sizeChange.emit(newSize);

      // Only emit position change in 'top-right' mode
      if (this.resizeMode === 'top-right' && newPosition) {
        this.positionChange.emit(newPosition);
      }

      this.rafId = undefined;
    });
  }

  /**
   * Handles mouseup event to end resize operation.
   * Cleans up event listeners and emits resizeEnd.
   */
  private onMouseUp(): void {
    if (!this.isResizing) {
      return;
    }

    this.isResizing = false;
    this.removeGlobalListeners();
    this.resizeEnd.emit();
  }

  /**
   * Adds global mouse event listeners for resize tracking.
   * Listeners are attached to window to handle resize outside element bounds.
   */
  private addGlobalListeners(): void {
    if (this.boundMouseMove && this.boundMouseUp) {
      window.addEventListener('mousemove', this.boundMouseMove);
      window.addEventListener('mouseup', this.boundMouseUp);
    }
  }

  /**
   * Removes global mouse event listeners.
   * Called when resize ends or component is destroyed.
   */
  private removeGlobalListeners(): void {
    if (this.boundMouseMove && this.boundMouseUp) {
      window.removeEventListener('mousemove', this.boundMouseMove);
      window.removeEventListener('mouseup', this.boundMouseUp);
    }
  }

  /**
   * Clamps a value between minimum and maximum bounds.
   *
   * @param value - The value to clamp
   * @param min - The minimum allowed value
   * @param max - The maximum allowed value
   * @returns The clamped value within [min, max] range
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }
}
