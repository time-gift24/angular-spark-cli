import { Component, EventEmitter, Input, Output, signal, Signal, booleanAttribute, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassDirective } from '../liquid-glass';

/**
 * AI Chat Input Component - 矿物与时光主题
 *
 * 可自适应高度的 AI 聊天输入框，支持 liquid-glass 效果。
 *
 * 特性：
 * - Liquid glass 视觉效果（可选）
 * - 自适应高度（1-5行）
 * - 工具栏按钮（文件、图片、语音）
 * - 发送按钮（启用时高亮）
 * - 键盘快捷键（Enter 发送，Shift+Enter 换行）
 *
 * @example
 * ```html
 * <!-- 默认启用 liquid glass 效果 -->
 * <app-chat-input
 *   [inputValue]="inputSignal"
 *   [canSend]="canSendSignal"
 *   (inputChange)="onInputChange($event)"
 *   (messageSend)="sendMessage()"
 * />
 *
 * <!-- 禁用 liquid glass 效果以提升性能 -->
 * <app-chat-input
 *   [enableLiquidGlass]="false"
 *   [inputValue]="inputSignal"
 *   [canSend]="canSendSignal"
 *   (inputChange)="onInputChange($event)"
 *   (messageSend)="sendMessage()"
 * />
 * ```
 */
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

  /**
   * 启用或禁用 liquid glass 视觉效果
   *
   * 默认启用。设置为 false 可以提升性能。
   *
   * @default true
   */
  @Input({ transform: booleanAttribute }) enableLiquidGlass = true;

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
