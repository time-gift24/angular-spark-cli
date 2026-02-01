/**
 * Resize Handle Directive
 * Makes an element resizable from a corner handle
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
import { PanelSize, MIN_PANEL_SIZE } from '@app/shared/ui/ai-chat/types/chat.types';

/**
 * Resize handle directive
 * Apply to the resize handle element (bottom-right corner)
 *
 * @example
 * ```html
 * <div resizeHandle [resizeTarget]="cardElement" (resizeEnd)="onResizeEnd($event)">
 *   <!-- Resize handle visual -->
 * </div>
 * ```
 */
@Directive({
  selector: '[resizeHandle]',
  standalone: true,
  host: {
    '[style.cursor]': '"nwse-resize"',
    '[style.touch-action]': '"none"',
  },
})
export class ResizeHandleDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Target element to resize (usually the parent container)
   */
  @Input({ required: true, alias: 'resizeTarget' })
  target!: HTMLElement | ElementRef<HTMLElement>;

  /**
   * Minimum size constraints
   */
  @Input()
  minSize: PanelSize = MIN_PANEL_SIZE;

  /**
   * Maximum size constraints (optional)
   */
  @Input()
  maxSize?: PanelSize;

  /**
   * Emit resize size changes
   */
  @Output()
  readonly resizeMove = new EventEmitter<PanelSize>();

  /**
   * Emit when resize ends
   */
  @Output()
  readonly resizeEnd = new EventEmitter<PanelSize>();

  /**
   * Emit when resize starts
   */
  @Output()
  readonly resizeStart = new EventEmitter<PanelSize>();

  /**
   * Current resize state
   */
  isResizing = false;

  private startSize: PanelSize = { width: 0, height: 0 };
  private startPosition = { x: 0, y: 0 };

  constructor() {
    afterNextRender(() => {
      this.initializeResize();
    });
  }

  private initializeResize(): void {
    const element = this.elementRef.nativeElement;

    // Set initial styles
    element.style.position = 'absolute';
    element.style.bottom = '0';
    element.style.right = '0';
    element.style.width = '16px';
    element.style.height = '16px';
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.2s';
    element.style.zIndex = '10';

    // Show on hover
    const parent = element.parentElement;
    if (parent) {
      parent.addEventListener('mouseenter', () => {
        if (!this.isResizing) {
          element.style.opacity = '0.4';
        }
      });

      parent.addEventListener('mouseleave', () => {
        if (!this.isResizing) {
          element.style.opacity = '0';
        }
      });
    }

    // Hover effect on handle itself
    element.addEventListener('mouseenter', () => {
      element.style.opacity = '0.6';
    });

    element.addEventListener('mouseleave', () => {
      if (!this.isResizing) {
        element.style.opacity = '0';
      }
    });
  }

  /**
   * Mouse down - start resizing
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();

    this.startResize(event.clientX, event.clientY);
  }

  /**
   * Touch start - start resizing (mobile)
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const touch = event.touches[0];
    this.startResize(touch.clientX, touch.clientY);
  }

  /**
   * Initialize resize state
   */
  private startResize(clientX: number, clientY: number): void {
    const targetElement = this.getTargetElement();
    if (!targetElement) return;

    this.isResizing = true;
    this.startPosition = { x: clientX, y: clientY };

    // Get current size
    const rect = targetElement.getBoundingClientRect();
    this.startSize = {
      width: rect.width,
      height: rect.height,
    };

    // Disable transitions during resize for smooth movement
    targetElement.style.transition = 'none';

    // Emit start event
    this.resizeStart.emit({ ...this.startSize });

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

    // Clean up listeners after resize ends
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
   * Mouse move - update size
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    event.preventDefault();

    this.updateSize(event.clientX, event.clientY);
  }

  /**
   * Touch move - update size (mobile)
   */
  private onTouchMove(event: TouchEvent): void {
    if (!this.isResizing) return;
    event.preventDefault();

    const touch = event.touches[0];
    this.updateSize(touch.clientX, touch.clientY);
  }

  /**
   * Update element size
   */
  private updateSize(clientX: number, clientY: number): void {
    const targetElement = this.getTargetElement();
    if (!targetElement) return;

    // Calculate delta
    const deltaX = clientX - this.startPosition.x;
    const deltaY = clientY - this.startPosition.y;

    // Calculate new size
    let newWidth = this.startSize.width + deltaX;
    let newHeight = this.startSize.height + deltaY;

    // Apply min/max constraints
    newWidth = Math.max(this.minSize.width, newWidth);
    newHeight = Math.max(this.minSize.height, newHeight);

    if (this.maxSize) {
      newWidth = Math.min(this.maxSize.width, newWidth);
      newHeight = Math.min(this.maxSize.height, newHeight);
    } else {
      // Default to viewport constraints
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const maxWidth = Math.min(900, windowWidth * 0.9);
      const maxHeight = Math.min(700, windowHeight * 0.7);

      newWidth = Math.min(maxWidth, newWidth);
      newHeight = Math.min(maxHeight, newHeight);
    }

    // Apply size
    targetElement.style.width = `${newWidth}px`;
    targetElement.style.height = `${newHeight}px`;

    // Emit size change
    this.resizeMove.emit({ width: newWidth, height: newHeight });
  }

  /**
   * Mouse up - end resizing
   */
  private onMouseUp(event: MouseEvent): void {
    if (!this.isResizing) return;
    this.endResize();
  }

  /**
   * Touch end - end resizing (mobile)
   */
  private onTouchEnd(event: TouchEvent): void {
    if (!this.isResizing) return;
    this.endResize();
  }

  /**
   * End resizing
   */
  private endResize(): void {
    const targetElement = this.getTargetElement();
    if (!targetElement) return;

    this.isResizing = false;

    // Re-enable transitions
    targetElement.style.transition = '';

    // Get final size
    const rect = targetElement.getBoundingClientRect();
    const finalSize: PanelSize = {
      width: rect.width,
      height: rect.height,
    };

    // Emit end event
    this.resizeEnd.emit(finalSize);

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
