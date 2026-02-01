/**
 * Drag Handle Directive
 * Makes an element draggable within the viewport
 * Mineral & Time Theme - Angular 20+
 */

import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PanelPosition, MIN_PANEL_SIZE } from '@app/shared/ui/ai-chat/types/chat.types';

/**
 * Drag handle directive
 * Apply to the drag handle element (e.g., the three lines at top)
 *
 * @example
 * ```html
 * <div dragHandle [dragTarget]="cardElement" (dragEnd)="onDragEnd($event)">
 *   <!-- Drag handle visual -->
 * </div>
 * ```
 */
@Directive({
  selector: '[dragHandle]',
  standalone: true,
  host: {
    '[style.cursor]': '"grab"',
    '[style.user-select]': '"none"',
    '[class.dragging]': 'isDragging',
  },
})
export class DragHandleDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Target element to drag (usually the parent container)
   */
  @Input({ required: true, alias: 'dragTarget' })
  target!: HTMLElement | ElementRef<HTMLElement>;

  /**
   * Constraint bounds (optional)
   * If provided, dragging is constrained within this element
   */
  @Input()
  bounds?: HTMLElement | ElementRef<HTMLElement>;

  /**
   * Emit drag position changes
   */
  @Output()
  readonly dragMove = new EventEmitter<PanelPosition>();

  /**
   * Emit when drag ends
   */
  @Output()
  readonly dragEnd = new EventEmitter<PanelPosition>();

  /**
   * Emit when drag starts
   */
  @Output()
  readonly dragStart = new EventEmitter<PanelPosition>();

  /**
   * Current drag state
   */
  isDragging = false;

  private dragOffset = { x: 0, y: 0 };
  private startPosition = { x: 0, y: 0 };

  constructor() {
    afterNextRender(() => {
      this.initializeDrag();
    });
  }

  private initializeDrag(): void {
    const element = this.elementRef.nativeElement;

    // Add hover effect
    element.addEventListener('mouseenter', () => {
      if (!this.isDragging) {
        element.style.opacity = '0.7';
      }
    });

    element.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        element.style.opacity = '';
      }
    });
  }

  /**
   * Mouse down - start dragging
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.startDrag(event.clientX, event.clientY);
  }

  /**
   * Touch start - start dragging (mobile)
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
  }

  /**
   * Initialize drag state
   */
  private startDrag(clientX: number, clientY: number): void {
    const targetElement = this.getTargetElement();
    if (!targetElement) return;

    this.isDragging = true;
    this.startPosition = { x: clientX, y: clientY };

    // Calculate offset from element's top-left corner
    const rect = targetElement.getBoundingClientRect();
    this.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    // Update cursor
    this.elementRef.nativeElement.style.cursor = 'grabbing';
    this.elementRef.nativeElement.style.opacity = '1';

    // Disable transitions during drag for smooth movement
    targetElement.style.transition = 'none';

    // Emit start event
    this.dragStart.emit({
      x: rect.left,
      y: rect.top,
    });

    // Add global event listeners
    this.addGlobalListeners();
  }

  /**
   * Add global mouse/touch event listeners
   */
  private addGlobalListeners(): void {
    const document = this.elementRef.nativeElement.ownerDocument;

    // Mouse move
    const onMouseMove = (event: MouseEvent) => this.onMouseMove(event);
    const onMouseUp = (event: MouseEvent) => this.onMouseUp(event);

    // Touch move
    const onTouchMove = (event: TouchEvent) => this.onTouchMove(event);
    const onTouchEnd = (event: TouchEvent) => this.onTouchEnd(event);

    document.addEventListener('mousemove', onMouseMove, { capture: false });
    document.addEventListener('mouseup', onMouseUp, { capture: false });

    document.addEventListener('touchmove', onTouchMove, { passive: false } as any);
    document.addEventListener('touchend', onTouchEnd, { capture: false });

    // Clean up listeners after drag ends
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove as any);
      document.removeEventListener('touchend', onTouchEnd);
    });

    // Store listeners for removal
    this.removeListeners = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove as any);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }

  private removeListeners: (() => void) | null = null;

  /**
   * Mouse move - update position
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();

    this.updatePosition(event.clientX, event.clientY);
  }

  /**
   * Touch move - update position (mobile)
   */
  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();

    const touch = event.touches[0];
    this.updatePosition(touch.clientX, touch.clientY);
  }

  /**
   * Update element position
   */
  private updatePosition(clientX: number, clientY: number): void {
    const targetElement = this.getTargetElement();
    if (!targetElement) return;

    // Calculate new position
    let newX = clientX - this.dragOffset.x;
    let newY = clientY - this.dragOffset.y;

    // Apply constraints if bounds provided
    if (this.bounds) {
      const boundsElement =
        this.bounds instanceof HTMLElement ? this.bounds : this.bounds.nativeElement;
      const boundsRect = boundsElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      // Constrain within bounds
      newX = Math.max(boundsRect.left, Math.min(newX, boundsRect.right - targetRect.width));
      newY = Math.max(boundsRect.top, Math.min(newY, boundsRect.bottom - targetRect.height));
    } else {
      // Constrain within viewport
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const targetRect = targetElement.getBoundingClientRect();

      newX = Math.max(0, Math.min(newX, windowWidth - targetRect.width));
      newY = Math.max(0, Math.min(newY, windowHeight - targetRect.height));
    }

    // Apply position
    targetElement.style.position = 'fixed';
    targetElement.style.left = `${newX}px`;
    targetElement.style.top = `${newY}px`;
    targetElement.style.bottom = 'auto';
    targetElement.style.right = 'auto';

    // Emit position change
    this.dragMove.emit({ x: newX, y: newY });
  }

  /**
   * Mouse up - end dragging
   */
  private onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.endDrag();
  }

  /**
   * Touch end - end dragging (mobile)
   */
  private onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;
    this.endDrag();
  }

  /**
   * End dragging
   */
  private endDrag(): void {
    const targetElement = this.getTargetElement();
    if (!targetElement) return;

    this.isDragging = false;

    // Reset cursor
    this.elementRef.nativeElement.style.cursor = 'grab';
    this.elementRef.nativeElement.style.opacity = '';

    // Re-enable transitions
    targetElement.style.transition = '';

    // Get final position
    const rect = targetElement.getBoundingClientRect();
    const finalPosition: PanelPosition = {
      x: rect.left,
      y: rect.top,
    };

    // Emit end event
    this.dragEnd.emit(finalPosition);

    // Remove global listeners
    this.removeListeners?.();
    this.removeListeners = null;
  }

  /**
   * Get target element
   */
  private getTargetElement(): HTMLElement | null {
    if (!this.target) return null;

    return this.target instanceof HTMLElement ? this.target : this.target.nativeElement;
  }
}
