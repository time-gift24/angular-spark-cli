import { Component, EventEmitter, Input, Output, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassDirective } from '../liquid-glass';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, LiquidGlassDirective],
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
   * Also adjusts textarea height based on content
   */
  handleInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    this.inputChange.emit(value);

    // Adjust height after emitting the input change
    this.adjustHeight(textarea);
  }

  /**
   * Handle keyboard events
   * Send message on Enter (without Shift), allow newline with Shift+Enter
   */
  handleKeydown(event: KeyboardEvent): void {
    if (this.isSendKey(event)) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Check if the key combination should trigger message send
   * Returns true for Enter key without Shift modifier
   */
  private isSendKey(event: KeyboardEvent): boolean {
    return event.key === 'Enter' && !event.shiftKey;
  }

  /**
   * Calculate the appropriate textarea height based on scroll height
   * Enforces MIN_HEIGHT and MAX_HEIGHT constraints
   */
  private calculateTextareaHeight(scrollHeight: number): number {
    // Reset to MIN_HEIGHT if input is empty
    if (scrollHeight <= this.MIN_HEIGHT) {
      return this.MIN_HEIGHT;
    }

    // Enforce MAX_HEIGHT constraint
    if (scrollHeight > this.MAX_HEIGHT) {
      return this.MAX_HEIGHT;
    }

    return scrollHeight;
  }

  /**
   * Adjust textarea height based on its content
   * Called after input changes to auto-expand the textarea
   */
  private adjustHeight(element: HTMLTextAreaElement): void {
    const newHeight = this.calculateTextareaHeight(element.scrollHeight);
    this.textareaHeight.set(newHeight);
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
