import { Component, Input, computed, signal, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import {
  CodeBlockWrapperInputs,
  CopyButtonState,
  CopyButtonFeedback,
  DEFAULT_COPY_FEEDBACK,
  LineNumbers,
  LineNumberOptions
} from './code-block-wrapper.types'

/**
 * Code Block Wrapper Component
 *
 * Displays highlighted code with IDE features (line numbers, copy button, language tag).
 *
 * @remarks
 * Implementation Note: This component uses a simplified state structure compared to the
 * original architecture plan:
 * - Uses `copyButtonState: Signal<CopyButtonState>` (flat) instead of nested toolbar state
 * - Uses `lineNumberOptions: computed<LineNumberOptions>` matching Phase 2 type definitions
 * - Adds customizable button text inputs for better UX
 *
 * This adaptation aligns with the actual Phase 2 type definitions (`CopyButtonState`,
 * `LineNumberOptions`) rather than the placeholder types referenced in the original plan.
 *
 * See architecture plan revision history (2025-02-01) for details.
 *
 * Phase 8.1: Create component skeleton with input bindings and state management
 * Phase 8.2: Implement copy button logic with error handling and user feedback
 */
@Component({
  selector: 'app-code-block-wrapper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-block-wrapper.component.html',
  styleUrls: ['./code-block-wrapper.component.css']
})
export class CodeBlockWrapperComponent {
  private destroyRef = inject(DestroyRef)
  private sanitizer = inject(DomSanitizer)

  /**
   * Internal signal for sanitized HTML
   * Uses SafeHtml to preserve inline styles from Shiki
   */
  protected readonly safeHighlightedHtml = signal<SafeHtml | null>(null)

  /**
   * Highlighted HTML from Shini
   * Automatically bypasses Angular's sanitization to preserve inline styles
   */
  @Input({ required: true })
  set highlightedHtml(value: string) {
    console.log('[CodeBlockWrapper] Received HTML:', {
      length: value?.length,
      hasStyle: value?.includes('style='),
      preview: value?.substring(0, 200)
    })
    // Bypass Angular's sanitization to preserve Shiki's inline styles
    this.safeHighlightedHtml.set(this.sanitizer.bypassSecurityTrustHtml(value))
  }

  /**
   * Programming language identifier
   */
  @Input()
  language: string = 'text'

  /**
   * Original code for copy functionality
   */
  @Input({ required: true })
  code!: string

  /**
   * Current theme
   */
  @Input()
  theme: 'light' | 'dark' = 'light'

  /**
   * Show line numbers
   */
  @Input()
  showLineNumbers: boolean = true

  /**
   * Show copy button
   */
  @Input()
  showCopyButton: boolean = true

  /**
   * Show language tag
   */
  @Input()
  showLanguageTag: boolean = true

  /**
   * Copy button text
   */
  @Input()
  copyButtonText: string = DEFAULT_COPY_FEEDBACK.defaultText

  /**
   * Text to show after successful copy
   */
  @Input()
  copySuccessText: string = DEFAULT_COPY_FEEDBACK.successText

  /**
   * Copy button state (public for testing)
   */
  readonly copyButtonState = signal<CopyButtonState>({ type: 'default' })

  /**
   * Copy button feedback configuration (public for testing)
   */
  readonly copyFeedback = computed<CopyButtonFeedback>(() => ({
    defaultText: this.copyButtonText,
    successText: this.copySuccessText,
    errorText: DEFAULT_COPY_FEEDBACK.errorText,
    successDuration: DEFAULT_COPY_FEEDBACK.successDuration
  }))

  /**
   * Line number options (public for testing)
   */
  readonly lineNumberOptions = computed<LineNumberOptions>(() => ({
    startFrom: 1,
    format: 'decimal'
  }))

  /**
   * Get copy button text based on current state
   */
  protected getCopyButtonText(): string {
    const state = this.copyButtonState()
    const feedback = this.copyFeedback()

    switch (state.type) {
      case 'default':
        return feedback.defaultText
      case 'copied':
        return feedback.successText
      case 'error':
        return feedback.errorText
      case 'unavailable':
        return 'N/A'
    }
  }

  /**
   * Get accessible label for copy button
   */
  protected getCopyButtonAriaLabel(): string {
    const state = this.copyButtonState()
    const feedback = this.copyFeedback()

    switch (state.type) {
      case 'default':
        return feedback.defaultText
      case 'copied':
        return feedback.successText
      case 'error':
        return `Error: ${state.message}`
      case 'unavailable':
        return 'Copy not available'
    }
  }

  /**
   * Copy code to clipboard
   *
   * Phase 8.2: Implement copy button logic with error handling and user feedback.
   */
  protected copyToClipboard(): void {
    // Check if Clipboard API is available
    if (!navigator.clipboard) {
      this.copyButtonState.set({ type: 'unavailable' })
      return
    }

    // Copy code to clipboard
    navigator.clipboard.writeText(this.code)
      .then(() => {
        // Show "copied" feedback
        this.copyButtonState.set({ type: 'copied' })

        // Reset after 2 seconds
        const timerId = setTimeout(() => {
          this.copyButtonState.set({ type: 'default' })
        }, this.copyFeedback().successDuration)

        // Clean up timer on component destroy
        this.destroyRef.onDestroy(() => clearTimeout(timerId))
      })
      .catch((error: unknown) => {
        // Show error feedback
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.copyButtonState.set({
          type: 'error',
          message
        })
      })
  }
}
