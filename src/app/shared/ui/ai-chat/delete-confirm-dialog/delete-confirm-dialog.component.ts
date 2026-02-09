import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';

@Component({
  selector: 'ai-delete-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LiquidGlassDirective],
  templateUrl: './delete-confirm-dialog.component.html',
})
export class DeleteConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() sessionName = '';

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
