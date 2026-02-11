import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';

@Component({
  selector: 'ai-delete-confirm-dialog',
  imports: [CommonModule, LiquidGlassDirective],
  templateUrl: './delete-confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmDialogComponent {
  readonly isOpen = input(false);
  readonly sessionName = input('');

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
