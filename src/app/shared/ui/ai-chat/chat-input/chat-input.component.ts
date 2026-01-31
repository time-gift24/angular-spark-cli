/**
 * Chat Input Component
 * Modern pill-style input with liquid-glass effect
 * Mineral & Time Theme - Angular 20+
 * Inspired by Claude/Gemini design patterns
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
import { LiquidGlassDirective } from '../../liquid-glass';

/**
 * Chat input component with modern pill design
 * Single unified rectangle with liquid-glass effect
 * Icon buttons integrated inline
 */
@Component({
  selector: 'ai-chat-input',
  standalone: true,
  imports: [LiquidGlassDirective],
  template: `
    <div class="input-container">
      <div
        liquidGlass
        lgTheme="mineral-light"
        lgCornerRadius="16px"
        [lgBlurAmount]="0.9"
        [lgDisplacementScale]="0"
        lgAriaLabel="AI chat input"
        class="input-wrapper"
        [class.focus-within]="isFocused()"
      >
        <!-- Input Area (Top) -->
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

        <!-- Toolbar (Bottom) -->
        <div class="toolbar">
          <!-- Left Tools -->
          <div class="tool-buttons-left">
            <button
              type="button"
              class="icon-button"
              title="Add file"
              (click)="onFileClick()"
              [attr.aria-label]="'Add file'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <button
              type="button"
              class="icon-button"
              title="Add image"
              (click)="onImageClick()"
              [attr.aria-label]="'Add image'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>
          </div>

          <!-- Right Actions -->
          <div class="action-buttons-right">
            <button
              type="button"
              class="icon-button voice-button"
              title="Voice input"
              (click)="onVoiceClick()"
              [attr.aria-label]="'Voice input'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>

            <!-- Circular Send Button -->
            <button
              type="button"
              class="send-button"
              [class.send-active]="canSend()"
              [disabled]="!canSend()"
              (click)="onSend()"
              [attr.aria-label]="'Send message'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .input-container {
        position: relative;
        width: 100%;
        max-width: 768px;
        margin: 0 auto;
        margin-bottom: 16px;
      }

      .input-wrapper {
        position: relative;
      }

      .input-area {
        padding: 12px 16px;
        padding-bottom: 8px;
      }

      /* Text input */
      .input-field {
        width: 100%;
        min-height: 24px;
        max-height: 120px;
        background: transparent;
        border: none;
        font-family: var(--font-sans);
        font-size: 14px;
        font-weight: 400;
        color: oklch(0.28 0.03 185);
        outline: none;
        resize: none;
        line-height: 1.5;
        overflow-y: auto;
        padding: 0;
      }

      .input-field::placeholder {
        color: oklch(0.55 0.02 185);
      }

      .input-field::-webkit-scrollbar {
        width: 3px;
      }

      .input-field::-webkit-scrollbar-track {
        background: transparent;
      }

      .input-field::-webkit-scrollbar-thumb {
        background: oklch(0.75 0.015 85 / 50%);
        border-radius: 2px;
      }

      /* Toolbar (Bottom) */
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 12px;
        padding-bottom: 10px;
        gap: 8px;
      }

      /* Left tool buttons */
      .tool-buttons-left {
        display: flex;
        gap: 2px;
        align-items: center;
      }

      /* Right action buttons */
      .action-buttons-right {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      /* Icon buttons */
      .icon-button {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: oklch(0.50 0.02 185);
        transition: all var(--duration-instant) ease;
        padding: 0;
      }

      .icon-button svg {
        width: 16px;
        height: 16px;
        stroke-width: 1.75;
      }

      .icon-button:hover {
        background: oklch(0.48 0.07 195 / 8%);
        color: oklch(0.48 0.07 195);
      }

      .icon-button:focus-visible {
        outline: 2px solid oklch(0.48 0.07 195 / 50%);
        outline-offset: 1px;
      }

      /* Voice button special style */
      .voice-button:hover {
        background: oklch(0.70 0.12 75 / 10%);
        color: oklch(0.70 0.12 75);
      }

      /* Circular send button */
      .send-button {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: oklch(0.85 0.015 85);
        border: 1px solid oklch(0.48 0.07 195 / 15%);
        cursor: not-allowed;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--duration-fast) ease;
        color: oklch(0.50 0.02 185);
        padding: 0;
        opacity: 0.5;
      }

      .send-button svg {
        width: 14px;
        height: 14px;
        stroke-width: 2;
        transition: transform var(--duration-fast) ease;
      }

      .send-button.send-active {
        cursor: pointer;
        background: oklch(0.48 0.07 195);
        border-color: oklch(0.48 0.07 195);
        color: oklch(0.98 0.01 85);
        opacity: 1;
      }

      .send-button.send-active:hover {
        background: oklch(0.42 0.08 195);
        transform: scale(1.06);
      }

      .send-button.send-active:active {
        transform: scale(0.96);
      }

      .send-button.send-active svg {
        transform: translateX(1px) translateY(1px);
      }

      .send-button:focus-visible {
        outline: 2px solid oklch(0.48 0.07 195 / 50%);
        outline-offset: 2px;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .input-container {
          margin-bottom: 12px;
        }

        .input-area {
          padding: 10px 12px;
          padding-bottom: 6px;
        }

        .toolbar {
          padding: 4px 10px;
          padding-bottom: 8px;
        }

        .icon-button,
        .send-button {
          width: 28px;
          height: 28px;
        }

        .icon-button svg {
          width: 15px;
          height: 15px;
        }

        .send-button svg {
          width: 13px;
          height: 13px;
        }

        .input-field {
          font-size: 14px;
        }
      }

      /* Dark mode support */
      .dark .input-field {
        color: oklch(0.94 0.015 85);
      }

      .dark .input-field::placeholder {
        color: oklch(0.65 0.035 195);
      }

      .dark .icon-button {
        color: oklch(0.65 0.035 195);
      }

      .dark .icon-button:hover {
        background: oklch(0.62 0.08 195 / 12%);
        color: oklch(0.62 0.08 195);
      }

      .dark .send-button {
        background: oklch(0.30 0.04 230);
        border-color: oklch(0.48 0.07 195 / 12%);
        color: oklch(0.65 0.035 195);
      }

      .dark .send-button.send-active {
        background: oklch(0.62 0.08 195);
        border-color: oklch(0.62 0.08 195);
        color: oklch(0.20 0.04 230);
      }

      .dark .send-button.send-active:hover {
        background: oklch(0.68 0.07 195);
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
