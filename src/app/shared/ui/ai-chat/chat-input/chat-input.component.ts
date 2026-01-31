/**
 * Chat Input Component
 * Auto-expanding textarea with toolbar
 * Mineral & Time Theme - Angular 20+
 */

import {
  Component,
  signal,
  computed,
  Output,
  Input,
  ViewChild,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { EventEmitter } from '@angular/core';

/**
 * Chat input component
 * Auto-expanding textarea with send button and tool buttons
 */
@Component({
  selector: 'ai-chat-input',
  standalone: true,
  template: `
    <div class="input-container">
      <div class="input-wrapper" [class.focus-within]="isFocused()">
        <!-- Input Area -->
        <div class="input-area">
          <textarea
            #textarea
            class="input-field"
            [placeholder]="placeholder"
            [value]="value"
            (input)="onInput($event)"
            (keydown)="onKeyDown($event)"
            (focus)="isFocused.set(true)"
            (blur)="isFocused.set(false)"
            [disabled]="disabled"
            [attr.aria-label]="placeholder"
            [attr.rows]="1"
          ></textarea>
        </div>

        <!-- Toolbar -->
        <div class="input-toolbar">
          <!-- Tool Buttons -->
          <div class="tool-buttons">
            <button
              type="button"
              class="tool-button"
              title="Add file"
              (click)="onFileClick()"
              [attr.aria-label]="'Add file'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <button
              type="button"
              class="tool-button"
              title="Add image"
              (click)="onImageClick()"
              [attr.aria-label]="'Add image'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>

            <button
              type="button"
              class="tool-button"
              title="Voice input"
              (click)="onVoiceClick()"
              [attr.aria-label]="'Voice input'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
          </div>

          <!-- Send Button -->
          <button
            type="button"
            class="send-button"
            [disabled]="!canSend()"
            (click)="onSend()"
            [attr.aria-label]="'Send message'"
          >
            <span>Send</span>
            <span class="send-icon">↑</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .input-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        transition: all var(--duration-normal) ease;
        animation: slideUp 0.4s ease-out 0.2s both;
      }

      .input-wrapper {
        background: oklch(0.91 0.015 85 / 95%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 12px;
        border: 1px solid oklch(0.48 0.07 195 / 25%);
        box-shadow: 0 -2px 12px oklch(0.28 0.03 185 / 10%);
        overflow: hidden;
        transition: all var(--duration-fast) ease;
      }

      .input-wrapper.focus-within {
        border-color: oklch(0.48 0.07 195 / 50%);
        box-shadow:
          0 0 0 3px oklch(0.48 0.07 195 / 10%),
          0 -4px 16px oklch(0.28 0.03 185 / 15%);
      }

      /* Input Area */
      .input-area {
        padding: 12px 16px;
        border-bottom: 1px solid oklch(0.48 0.07 195 / 10%);
      }

      .input-field {
        width: 100%;
        min-height: 24px;
        max-height: 120px;
        background: transparent;
        border: none;
        font-family: var(--font-sans);
        font-size: 13px;
        color: oklch(0.28 0.03 185);
        outline: none;
        resize: none;
        line-height: 1.5;
        overflow-y: auto;
      }

      .input-field::placeholder {
        color: oklch(0.50 0.02 185);
      }

      /* Scrollbar styles */
      .input-field::-webkit-scrollbar {
        width: 4px;
      }

      .input-field::-webkit-scrollbar-track {
        background: transparent;
      }

      .input-field::-webkit-scrollbar-thumb {
        background: oklch(0.85 0.015 85);
        border-radius: 2px;
      }

      /* Toolbar */
      .input-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        gap: 8px;
      }

      /* Tool Buttons */
      .tool-buttons {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .tool-button {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: oklch(0.50 0.02 185);
        transition: all var(--duration-fast) ease;
        padding: 0;
      }

      .tool-button:hover {
        background: oklch(0.48 0.07 195 / 10%);
        color: oklch(0.48 0.07 195);
      }

      .tool-button:focus-visible {
        outline: 2px solid oklch(0.48 0.07 195);
        outline-offset: 2px;
      }

      /* Send Button */
      .send-button {
        padding: 0 12px;
        height: 28px;
        border-radius: 6px;
        background: oklch(0.48 0.07 195);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: all var(--duration-fast) ease;
        color: oklch(1 0 0);
        font-family: var(--font-sans);
        font-size: 12px;
        font-weight: 500;
      }

      .send-button:hover:not(:disabled) {
        background: oklch(0.42 0.08 195);
        transform: scale(1.02);
      }

      .send-button:active:not(:disabled) {
        transform: scale(0.98);
      }

      .send-button:disabled {
        background: oklch(0.88 0.015 85);
        color: oklch(0.60 0.02 185);
        cursor: not-allowed;
        transform: none;
      }

      .send-button:focus-visible {
        outline: 2px solid oklch(0.48 0.07 195);
        outline-offset: 2px;
      }

      .send-icon {
        font-size: 14px;
        font-weight: 600;
      }

      /* Animations */
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .input-container {
          max-width: 100%;
        }

        .input-wrapper {
          border-radius: 12px;
        }
      }
    `,
  ],
})
export class ChatInputComponent {
  @ViewChild('textarea', { static: true })
  textareaRef!: ElementRef<HTMLTextAreaElement>;

  /**
   * Input value (two-way binding)
   */
  @Input()
  value!: string;

  /**
   * Input placeholder text
   */
  @Input()
  placeholder = 'Ask AI anything...';

  /**
   * Disabled state
   */
  @Input()
  disabled = false;

  /**
   * Emit when user sends message
   */
  @Output()
  readonly send = new EventEmitter<string>();

  /**
   * Emit when file button clicked
   */
  @Output()
  readonly fileClick = new EventEmitter<void>();

  /**
   * Emit when image button clicked
   */
  @Output()
  readonly imageClick = new EventEmitter<void>();

  /**
   * Emit when voice button clicked
   */
  @Output()
  readonly voiceClick = new EventEmitter<void>();

  /**
   * Input focus state
   */
  readonly isFocused = signal(false);

  /**
   * Can send (has input)
   */
  readonly canSend = computed(() => this.value?.trim().length > 0);

  constructor() {
    afterNextRender(() => {
      // Auto-resize on init
      this.adjustTextareaHeight();
    });
  }

  /**
   * Handle input changes
   */
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this.adjustTextareaHeight();
  }

  /**
   * Handle keyboard events
   */
  onKeyDown(event: KeyboardEvent): void {
    // Enter to send, Shift+Enter for new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSend()) {
        this.onSend();
      }
    }
  }

  /**
   * Handle send button click
   */
  onSend(): void {
    if (!this.canSend()) return;

    const message = this.value?.trim();
    if (!message) return;

    this.send.emit(message);

    // Clear input
    this.value = '';

    // Reset textarea height
    if (this.textareaRef) {
      const textarea = this.textareaRef.nativeElement;
      textarea.value = '';
      textarea.style.height = 'auto';
    }
  }

  /**
   * Handle file button click
   */
  onFileClick(): void {
    this.fileClick.emit();
  }

  /**
   * Handle image button click
   */
  onImageClick(): void {
    this.imageClick.emit();
  }

  /**
   * Handle voice button click
   */
  onVoiceClick(): void {
    this.voiceClick.emit();
  }

  /**
   * Auto-adjust textarea height
   */
  private adjustTextareaHeight(): void {
    if (!this.textareaRef) return;

    const textarea = this.textareaRef.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
}
