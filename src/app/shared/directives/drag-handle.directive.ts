import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Signal } from '@angular/core';
import { PanelPosition, PanelSize } from '../models';

/**
 * Drag handle directive for making elements draggable.
 *
 * This directive attaches to any element (typically a drag handle) and enables
 * drag functionality. It tracks mouse movements and updates the panel position
 * in real-time, emitting position changes that parent components can handle.
 *
 * Key features:
 * - Mouse-based drag functionality with mousedown, mousemove, mouseup
 * - Real-time position updates via Signal integration
 * - Drag lifecycle events (dragStart, dragEnd, positionChange)
 * - CSS transition management for smooth UX
 * - Automatic cleanup on destroy
 * - Free-form dragging: panel can be moved anywhere on screen
 *   - Only constraint: at least 50px of the panel must remain visible
 *   - Allows partial off-screen positioning for maximum flexibility
 * - requestAnimationFrame throttling for optimal performance
 *
 * Known limitations:
 * - TODO: Keyboard accessibility not implemented (future enhancement)
 * - TODO: Touch event support not implemented (future enhancement)
 *
 * Usage:
 * ```html
 * <div [appDragHandle]="position"
 *      [dragHandleSize]="size"
 *      (positionChange)="onPositionChange($event)"
 *      (dragStart)="onDragStart()"
 *      (dragEnd)="onDragEnd()">
 *   Drag me!
 * </div>
 * ```
 *
 * Note: The [dragHandleSize] input is optional but recommended for accurate
 * boundary constraints. When provided, the directive ensures at least 50px
 * of the panel remains visible on screen.
 */
@Directive({
  selector: '[appDragHandle]',
  standalone: true,
})
export class DragHandleDirective implements OnInit, OnDestroy {
  /**
   * Current position signal from parent component.
   * Required input that provides the initial and current position.
   */
  @Input({ required: true, alias: 'appDragHandle' }) position!: Signal<PanelPosition>;

  /**
   * Optional size signal from parent component.
   * When provided, enables more accurate boundary constraints by considering
   * panel height when limiting vertical movement.
   */
  @Input() dragHandleSize?: Signal<PanelSize>;

  /**
   * Emits when position changes during drag.
   * Parent components should update their position state when this fires.
   */
  @Output() positionChange = new EventEmitter<PanelPosition>();

  /**
   * Emits when drag operation starts (mousedown).
   * Useful for disabling transitions or changing cursor.
   */
  @Output() dragStart = new EventEmitter<void>();

  /**
   * Emits when drag operation ends (mouseup).
   * Useful for re-enabling transitions or restoring cursor.
   */
  @Output() dragEnd = new EventEmitter<void>();

  /**
   * Tracks whether a drag operation is currently in progress.
   */
  private isDragging = false;

  /**
   * Stores the initial position when drag starts.
   * Used to calculate position deltas during drag.
   */
  private startPosition!: PanelPosition;

  /**
   * Stores the initial mouse position when drag starts.
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
   * RequestAnimationFrame ID for throttling position updates.
   * Ensures position changes only emit once per frame for optimal performance.
   */
  private rafId?: number;

  ngOnInit(): void {
    // Create bound handlers once for efficient addEventListener/removeEventListener
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
  }

  ngOnDestroy(): void {
    // Clean up event listeners if component is destroyed during drag
    if (this.isDragging) {
      this.removeGlobalListeners();
    }

    // Cancel any pending RAF update
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  /**
   * Handles mousedown event to initiate drag operation.
   * Stores initial position and mouse coordinates for delta calculation.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Only start drag with left mouse button
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    this.isDragging = true;
    this.startPosition = { ...this.position() };
    this.startMousePosition = { x: event.clientX, y: event.clientY };

    this.addGlobalListeners();
    this.dragStart.emit();
  }

  /**
   * Handles mousemove event during drag.
   * Calculates new position based on mouse delta and emits positionChange.
   *
   * Features:
   * - requestAnimationFrame throttling to prevent excessive re-renders
   * - Viewport boundary constraints to prevent off-screen dragging
   * - Dynamic bottom boundary calculation based on DOM elements
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    // Cancel any pending RAF update to ensure we only emit once per frame
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
    }

    // Schedule position update for next animation frame
    this.rafId = requestAnimationFrame(() => {
      const deltaX = event.clientX - this.startMousePosition.x;
      const deltaY = event.clientY - this.startMousePosition.y;

      let newX = this.startPosition.x + deltaX;
      let newY = this.startPosition.y + deltaY;

      // Boundary constraint constants
      const minVisibleSize = 50; // Minimum visible portion of panel

      // Get panel dimensions from size input if available
      const panelWidth = this.dragHandleSize?.().width ?? minVisibleSize;
      const panelHeight = this.dragHandleSize?.().height ?? minVisibleSize;

      // X axis constraint: keep at least minVisibleSize visible on screen
      // 允许面板部分移出屏幕，但保持至少 minVisibleSize 可见
      newX = Math.max(minVisibleSize - panelWidth, Math.min(newX, window.innerWidth - minVisibleSize));

      // Y axis constraint: 允许自由拖拽到屏幕任何位置
      // 只要求至少 minVisibleSize 可见
      newY = Math.max(minVisibleSize - panelHeight, Math.min(newY, window.innerHeight - minVisibleSize));

      const newPosition: PanelPosition = {
        x: newX,
        y: newY,
      };

      this.positionChange.emit(newPosition);
      this.rafId = undefined;
    });
  }

  /**
   * Handles mouseup event to end drag operation.
   * Cleans up event listeners and emits dragEnd.
   */
  private onMouseUp(): void {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.removeGlobalListeners();
    this.dragEnd.emit();
  }

  /**
   * Adds global mouse event listeners for drag tracking.
   * Listeners are attached to window to handle drag outside element bounds.
   */
  private addGlobalListeners(): void {
    if (this.boundMouseMove && this.boundMouseUp) {
      window.addEventListener('mousemove', this.boundMouseMove);
      window.addEventListener('mouseup', this.boundMouseUp);
    }
  }

  /**
   * Removes global mouse event listeners.
   * Called when drag ends or component is destroyed.
   */
  private removeGlobalListeners(): void {
    if (this.boundMouseMove && this.boundMouseUp) {
      window.removeEventListener('mousemove', this.boundMouseMove);
      window.removeEventListener('mouseup', this.boundMouseUp);
    }
  }

}
