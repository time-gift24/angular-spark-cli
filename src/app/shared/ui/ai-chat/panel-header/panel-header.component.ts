import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ai-panel-header',
  imports: [CommonModule],
  templateUrl: './panel-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelHeaderComponent {
  readonly sessionName = input.required<Signal<string>>();
  readonly hasNewMessages = input(false);
  readonly isEditing = input(false);

  readonly rename = output<string>();
  readonly delete = output<void>();
  readonly close = output<void>();

  readonly isEditingName = signal(false);
  readonly editValue = signal('');

  protected readonly isNewMessageIndicatorVisible = computed(() => this.hasNewMessages());

  startEditing(): void {
    this.isEditingName.set(true);
    this.editValue.set(this.sessionName()());
  }

  cancelEdit(): void {
    this.isEditingName.set(false);
    this.editValue.set('');
  }

  onNameEditComplete(newName: string): void {
    if (newName.trim() && newName.trim() !== this.sessionName()()) {
      this.rename.emit(newName.trim());
    }
    this.isEditingName.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onNameEditComplete(this.editValue());
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }
}
