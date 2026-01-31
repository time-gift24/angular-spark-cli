import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Signal } from '@angular/core';
import { PanelPosition } from '../models';

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
 *
 * Usage:
 * ```html
 * <div [appDragHandle]="position"
 *      (positionChange)="onPositionChange($event)"
 *      (dragStart)="onDragStart()"
 *      (dragEnd)="onDragEnd()">
 *   Drag me!
 * </div>
 * ```
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
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaX = event.clientX - this.startMousePosition.x;
    const deltaY = event.clientY - this.startMousePosition.y;

    const newPosition: PanelPosition = {
      x: this.startPosition.x + deltaX,
      y: this.startPosition.y + deltaY,
    };

    this.positionChange.emit(newPosition);
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
