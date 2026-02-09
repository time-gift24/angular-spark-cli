import { Component, Input, Output, EventEmitter, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ai-panel-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-header.component.html',
})
export class PanelHeaderComponent {
  @Input({ required: true }) sessionName!: Signal<string>;
  @Input() hasNewMessages = false;
  @Input() isEditing = false;

  @Output() rename = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  readonly isEditingName = signal(false);
  readonly editValue = signal('');

  protected readonly isNewMessageIndicatorVisible = computed(() => this.hasNewMessages);

  startEditing(): void {
    this.isEditingName.set(true);
    this.editValue.set(this.sessionName());
  }

  cancelEdit(): void {
    this.isEditingName.set(false);
    this.editValue.set('');
  }

  onNameEditComplete(newName: string): void {
    if (newName.trim() && newName.trim() !== this.sessionName()) {
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
