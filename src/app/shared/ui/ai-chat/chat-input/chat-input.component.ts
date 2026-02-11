/**
 * Chat Input Component
 * Modern pill-style input with liquid-glass effect
 * Mineral & Time Theme - Angular 20+
 * Inspired by Claude/Gemini design patterns
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { ButtonComponent } from '@app/shared/ui/button';
import {
  inputContainer,
  inputWrapper,
  inputArea,
  inputField,
  toolbar,
  toolButtonsLeft,
  actionButtonsRight,
  toolbarIcon,
  sendIcon,
} from './css';
import { cn } from '@app/shared/utils';

/**
 * Chat input component with modern pill design
 * Single unified rectangle with liquid-glass effect
 * Icon buttons integrated inline
 */
@Component({
  selector: 'ai-chat-input',
  imports: [LiquidGlassDirective, ButtonComponent],
  styleUrls: ['./chat-input.component.css'],
  host: {
    class: 'block',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="inputContainer">
      <div
        liquidGlass
        lgTheme="mineral-light"
        lgCornerRadius="16px"
        [lgBlurAmount]="0.9"
        [lgDisplacementScale]="0"
        lgAriaLabel="AI chat input"
        [class]="inputWrapperClasses()"
      >
        <!-- Input Area (Top) -->
        <div [class]="inputAreaClasses()">
          <textarea
            #textarea
            class="chat-textarea"
            [class]="inputFieldClasses()"
            [placeholder]="placeholder()"
            [value]="internalValue()"
            (input)="onInput($event)"
            (keydown)="onKeyDown($event)"
            (focus)="isFocused.set(true)"
            (blur)="isFocused.set(false)"
            [disabled]="disabled()"
            [attr.aria-label]="placeholder()"
            [attr.rows]="1"
          ></textarea>
        </div>

        <!-- Toolbar (Bottom) -->
        <div [class]="toolbarClasses()">
          <!-- Left Tools -->
          <div [class]="toolButtonsLeftClasses()">
            <button
              spark-button
              variant="ghost"
              size="icon"
              class="chat-toolbar-btn"
              title="Add file"
              (click)="onFileClick()"
              [attr.aria-label]="'Add file'"
            >
              <svg
                [class]="iconClasses()"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                />
              </svg>
            </button>

            <button
              spark-button
              variant="ghost"
              size="icon"
              class="chat-toolbar-btn"
              title="Add image"
              (click)="onImageClick()"
              [attr.aria-label]="'Add image'"
            >
              <svg
                [class]="iconClasses()"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>
          </div>

          <!-- Right Actions -->
          <div [class]="actionButtonsRightClasses()">
            <button
              spark-button
              variant="ghost"
              size="icon"
              class="chat-toolbar-btn chat-voice-btn"
              title="Voice input"
              (click)="onVoiceClick()"
              [attr.aria-label]="'Voice input'"
            >
              <svg
                [class]="iconClasses()"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>

            <!-- Circular Send Button -->
            <button
              spark-button
              [variant]="canSend() ? 'default' : 'ghost'"
              size="icon"
              class="chat-send-btn"
              [disabled]="!canSend()"
              (click)="onSend()"
              [attr.aria-label]="'Send message'"
            >
              <svg
                [class]="sendIconClasses()"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ChatInputComponent {
  @ViewChild('textarea', { static: true })
  textareaRef!: ElementRef<HTMLTextAreaElement>;

  /**
   * Internal value state (for canSend computation)
   * Must be declared before value setter to avoid initialization issues
   */
  protected readonly internalValue = signal('');

  readonly value = input('');

  /**
   * Emit when value changes (for two-way binding)
   */
  readonly valueChange = output<string>();

  /**
   * Input placeholder text
   */
  readonly placeholder = input('Ask AI anything...');

  /**
   * Disabled state
   */
  readonly disabled = input(false);

  /**
   * Emit when user sends message
   */
  readonly send = output<string>();

  /**
   * Emit when file button clicked
   */
  readonly fileClick = output<void>();

  /**
   * Emit when image button clicked
   */
  readonly imageClick = output<void>();

  /**
   * Emit when voice button clicked
   */
  readonly voiceClick = output<void>();

  /**
   * Input focus state
   */
  readonly isFocused = signal(false);

  /**
   * Can send (has input)
   */
  readonly canSend = computed(() => this.internalValue().trim().length > 0);

  // Base styles (constants)
  readonly inputContainer = inputContainer;
  readonly inputWrapper = inputWrapper;
  readonly inputArea = inputArea;
  readonly inputFieldBase = inputField;
  readonly toolbar = toolbar;
  readonly toolButtonsLeft = toolButtonsLeft;
  readonly actionButtonsRight = actionButtonsRight;
  readonly iconBase = toolbarIcon;
  readonly sendIconBase = sendIcon;

  // Computed classes
  protected inputWrapperClasses = computed(() =>
    cn(this.inputWrapper, this.isFocused() ? 'focus-within' : ''),
  );

  protected inputFieldClasses = computed(() => this.inputFieldBase);

  protected inputAreaClasses = computed(() => this.inputArea);

  protected toolbarClasses = computed(() => this.toolbar);

  protected toolButtonsLeftClasses = computed(() => this.toolButtonsLeft);

  protected actionButtonsRightClasses = computed(() => this.actionButtonsRight);

  protected iconClasses = computed(() => this.iconBase);

  protected sendIconClasses = computed(() => this.sendIconBase);

  constructor() {
    effect(() => {
      this.internalValue.set(this.value());
    });

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
    const newValue = textarea.value;
    this.internalValue.set(newValue);
    this.valueChange.emit(newValue);
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

    const message = this.internalValue().trim();
    if (!message) return;

    this.send.emit(message);

    // Clear internal state
    this.internalValue.set('');
    this.valueChange.emit('');

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
