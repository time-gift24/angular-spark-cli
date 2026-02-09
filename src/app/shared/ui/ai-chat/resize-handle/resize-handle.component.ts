import {
  Component,
  Output,
  EventEmitter,
  ElementRef,
  inject,
  DestroyRef,
  afterNextRender,
  signal,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ai-resize-handle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resize-handle.component.html',
})
export class ResizeHandleComponent {
  @Input() minWidth = 300;
  @Input() maxWidth = 800;

  @Output() resizePreview = new EventEmitter<number>();
  @Output() resizeCommit = new EventEmitter<number>();

  private el = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  isDragging = false;
  startX = 0;
  startWidth = 0;

  readonly previewWidth = signal<number | null>(null);
  readonly dragX = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      this.setupDragListeners();
    });
  }

  private setupDragListeners(): void {
    // Global mouse move and up listeners
    const onMove = (event: MouseEvent) => this.onMouseMove(event);
    const onUp = (event: MouseEvent) => this.onMouseUp(event);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    });

    this.windowMouseMove = onMove;
    this.windowMouseUp = onUp;
  }

  private windowMouseMove!: (event: MouseEvent) => void;
  private windowMouseUp!: (event: MouseEvent) => void;

  startDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.startWidth = this.getWidth();
    this.previewWidth.set(this.startWidth);
    this.dragX.set(event.clientX);

    window.addEventListener('mousemove', this.windowMouseMove);
    window.addEventListener('mouseup', this.windowMouseUp);
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = this.startX - event.clientX;
    const newWidth = this.clampWidth(this.startWidth + deltaX);

    // Emit preview (clamped to valid range)
    this.previewWidth.set(newWidth);
    this.dragX.set(event.clientX);
    this.resizePreview.emit(newWidth);
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = this.startX - event.clientX;
    const newWidth = this.clampWidth(this.startWidth + deltaX);

    this.isDragging = false;
    this.previewWidth.set(null);
    this.dragX.set(null);
    window.removeEventListener('mousemove', this.windowMouseMove);
    window.removeEventListener('mouseup', this.windowMouseUp);

    this.resizeCommit.emit(newWidth);
  }

  private getWidth(): number {
    return this.el.nativeElement.parentElement?.offsetWidth || 500;
  }

  private clampWidth(width: number): number {
    return Math.max(this.minWidth, Math.min(this.maxWidth, width));
  }

  protected onMousedown(event: MouseEvent): void {
    this.startDrag(event);
  }
}
