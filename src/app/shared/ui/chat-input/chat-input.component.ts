import { Component, EventEmitter, Input, Output, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.css'],
})
export class ChatInputComponent {
  @Input() inputValue: Signal<string> = signal('');
  @Input() canSend: Signal<boolean> = signal(false);
  @Output() inputChange = new EventEmitter<string>();
  @Output() messageSend = new EventEmitter<void>();

  readonly MAX_HEIGHT = 120; // 5 lines max
  readonly MIN_HEIGHT = 24; // 1 line min

  textareaHeight = signal<number>(this.MIN_HEIGHT);
  isFocused = signal<boolean>(false);

  /**
   * Handle textarea input changes
   * Updates the textarea model and emits the inputChange event
   */
  handleInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    this.inputChange.emit(value);
  }

  /**
   * Handle keyboard events
   * Send message on Enter (without Shift), allow newline with Shift+Enter
   */
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Send message if input is valid
   */
  sendMessage(): void {
    if (this.canSend()) {
      this.messageSend.emit();
    }
  }

  /**
   * Handle textarea focus
   */
  handleFocus(): void {
    this.isFocused.set(true);
  }

  /**
   * Handle textarea blur
   */
  handleBlur(): void {
    this.isFocused.set(false);
  }
}
