# Code Highlighting - Architectural Implementation Plan

**Goal:** Add professional code highlighting with IDE experience to streaming markdown component
**Architecture:** Service-Oriented with Reactive State Management (Angular Signals + RxJS)

---

## Master Status Tracker

| Phase | Independence | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| **P1: ShiniHighlighter Domain Models** | High | None | 🔴 To Do |
| **P2: CodeBlockWrapper Domain Models** | High | None | 🔴 To Do |
| **P3: MarkdownFormatterService Extensions** | Medium | P1 | 🔴 To Do |
| **P4: ThemeService Integration Types** | Medium | None | 🔴 To Do |
| **P5: CSS Variables System** | High | None | 🔴 To Do |
| **P6: Error Handling Models** | High | None | 🔴 To Do |
| **P7: ShiniHighlighter Service Implementation** | Low | P1, P6 | 🔴 To Do |
| **P8: CodeBlockWrapper Component Implementation** | Low | P2, P5 | 🔴 To Do |
| **P9: MarkdownFormatterService Integration** | Low | P1, P3, P4 | 🔴 To Do |
| **P10: Styling Implementation** | Low | P5 | 🔴 To Do |
| **P11: Testing Infrastructure** | Medium | All | 🔴 To Do |

> **Status Legend:** 🔴 To Do, 🟡 In Progress, 🟢 Done

---

## Parallel Execution Opportunities

**Can be built simultaneously (High Independence):**
- P1 (ShiniHighlighter Models) + P2 (CodeBlockWrapper Models) + P4 (ThemeService Types) + P5 (CSS Variables) + P6 (Error Models) → Start these together

**Sequential execution required (Low Independence):**
- P7 → P8 → P9 → P10 → P11 (Must wait for dependencies)

---

## Phase 1: ShiniHighlighter Domain Models

**Independence:** High (Can start immediately)
**Goal:** Define all types, interfaces, and state structures for Shini integration

### Task 1.1: Define Core Interfaces

**Output:** `src/app/shared/components/streaming-markdown/core/shini-types.ts`

```typescript
/**
 * Shini highlighter service interface
 * Manages Shini WASM instance initialization and code highlighting
 */
export interface IShiniHighlighter {
  /**
   * Initialize Shini WASM and preload common languages
   * Called once at app startup, runs asynchronously
   *
   * @returns Promise that resolves when initialization completes
   */
  initialize(): Promise<void>

  /**
   * Highlight code with syntax highlighting
   * Synchronous operation after initialization completes
   *
   * @param code - Raw code string to highlight
   * @param language - Programming language identifier (e.g., 'typescript', 'python')
   * @param theme - Theme name ('light' or 'dark')
   * @returns HTML string with token classes, or escaped plain text as fallback
   */
  highlight(code: string, language: string, theme: 'light' | 'dark'): string

  /**
   * Check if Shini is ready for highlighting
   *
   * @returns true if initialization completed successfully
   */
  isReady(): boolean
}

/**
 * Initialization state for Shini highlighter
 */
export interface ShiniInitializationState {
  /** Whether initialization has completed */
  initialized: boolean

  /** Whether initialization succeeded */
  success: boolean

  /** Error message if initialization failed */
  error?: string

  /** Number of languages loaded */
  languagesLoaded: number

  /** Themes loaded */
  themesLoaded: string[]
}
```

**Checkpoint:** File compiles with all interfaces exported

---

### Task 1.2: Define Language Configuration

**Output:** Extend `shini-types.ts`

```typescript
/**
 * Supported programming language identifier
 */
export type ShiniLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'bash'
  | 'sql'
  | 'go'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'text'

/**
 * Language display name mapping
 * Maps language codes to human-readable names
 */
export const LANGUAGE_DISPLAY_NAMES: Readonly<Record<ShiniLanguage, string>> = {
  'typescript': 'TypeScript',
  'javascript': 'JavaScript',
  'python': 'Python',
  'html': 'HTML',
  'css': 'CSS',
  'json': 'JSON',
  'bash': 'Bash',
  'sql': 'SQL',
  'go': 'Go',
  'rust': 'Rust',
  'java': 'Java',
  'cpp': 'C++',
  'text': 'Plain Text'
} as const

/**
 * Languages to preload during initialization
 * Optimized for common use cases
 */
export const PRELOAD_LANGUAGES: Readonly<ShiniLanguage[]> = [
  'typescript',
  'javascript',
  'python',
  'html',
  'css',
  'json',
  'bash',
  'sql'
] as const

/**
 * Theme identifier for Shini highlighting
 */
export type ShiniTheme = 'light' | 'dark'

/**
 * Shini theme configuration mapping
 */
export const SHINI_THEME_MAP: Readonly<Record<ShiniTheme, string>> = {
  'light': 'github-light',
  'dark': 'dark-plus'
} as const
```

**Checkpoint:** Types compile, configuration constants defined

---

### Task 1.3: Define Highlight Result Models

**Output:** Extend `shini-types.ts`

```typescript
/**
 * Result of code highlighting operation
 */
export interface HighlightResult {
  /** Highlighted HTML with token classes */
  html: string

  /** Whether highlighting succeeded */
  success: boolean

  /** Language used for highlighting */
  language: string

  /** Theme used for highlighting */
  theme: string

  /** Error message if highlighting failed */
  error?: string

  /** Whether result is a fallback (plain text) */
  isFallback: boolean
}

/**
 * Fallback result when highlighting is unavailable
 */
export interface FallbackHighlightResult extends HighlightResult {
  success: false
  isFallback: true
  html: string  // Escaped plain text
}
```

**Checkpoint:** Result models defined and type-safe

---

## Phase 2: CodeBlockWrapper Domain Models

**Independence:** High (Can start immediately)
**Goal:** Define component interfaces and IDE feature state structures

### Task 2.1: Define Component Interfaces

**Output:** `src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.types.ts`

```typescript
import { ShiniLanguage, ShiniTheme } from '../core/shini-types'

/**
 * Input interface for CodeBlockWrapper component
 */
export interface CodeBlockWrapperInput {
  /** Highlighted HTML from Shini */
  highlightedHtml: string

  /** Programming language identifier */
  language: ShiniLanguage

  /** Original code for copy functionality */
  code: string

  /** Current theme */
  theme: ShiniTheme

  /** Whether to show line numbers (default: true) */
  showLineNumbers?: boolean

  /** Whether to show copy button (default: true) */
  showCopyButton?: boolean

  /** Whether to show language tag (default: true) */
  showLanguageTag?: boolean
}

/**
 * Toolbar state for IDE features
 */
export interface CodeBlockToolbarState {
  /** Copy button state */
  copyButton: CopyButtonState

  /** Whether toolbar is visible */
  visible: boolean
}

/**
 * Copy button states
 */
export type CopyButtonState =
  | { type: 'default' }
  | { type: 'hover' }
  | { type: 'copied'; remainingMs: number }
  | { type: 'error'; message: string }
  | { type: 'unavailable' }

/**
 * Line number configuration
 */
export interface LineNumberConfig {
  /** Whether line numbers are enabled */
  enabled: boolean

  /** Starting line number (default: 1) */
  startFrom: number

  /** Width of line number column in pixels */
  columnWidth: string
}
```

**Checkpoint:** Component interfaces defined and type-safe

---

### Task 2.2: Define Component Output Models

**Output:** Extend `code-block-wrapper.types.ts`

```typescript
/**
 * Rendered code block structure
 */
export interface RenderedCodeBlock {
  /** Complete HTML string with toolbar and code */
  html: string

  /** Number of lines in code */
  lineCount: number

  /** Whether line numbers are included */
  hasLineNumbers: boolean

  /** Whether copy button is included */
  hasCopyButton: boolean

  /** Language display name */
  languageDisplayName: string
}
```

**Checkpoint:** Output models defined

---

## Phase 3: MarkdownFormatterService Extensions

**Independence:** Medium (Depends on P1 for Shini types)
**Goal:** Extend existing service interface to support code highlighting

### Task 3.1: Define Formatter Extensions

**Output:** `src/app/shared/components/streaming-markdown/renderers/formatter-extension.types.ts`

```typescript
import { MarkdownBlock } from '../core/models'
import { ShiniTheme } from '../core/shini-types'

/**
 * Extended formatting options for code blocks
 */
export interface CodeBlockFormatOptions {
  /** Theme to use for highlighting */
  theme: ShiniTheme

  /** Whether to apply IDE features */
  enableIdeFeatures: boolean

  /** Fallback behavior if Shini unavailable */
  fallbackMode: 'plain-text' | 'placeholder'
}

/**
 * Code block formatting result
 */
export interface CodeBlockFormatResult {
  /** Formatted HTML (highlighted or fallback) */
  html: string

  /** Whether highlighting was applied */
  isHighlighted: boolean

  /** Language used for highlighting */
  language: string

  /** Processing time in milliseconds */
  processingTimeMs: number
}
```

**Checkpoint:** Extension interfaces compile

---

### Task 3.2: Define Service Integration Interface

**Output:** Extend `formatter-extension.types.ts`

```typescript
import { IShiniHighlighter } from '../core/shini-types'

/**
 * Extended MarkdownFormatterService interface
 * Adds code highlighting capabilities
 */
export interface IMarkdownFormatterExtended {
  /**
   * Format a code block with syntax highlighting
   *
   * @param block - MarkdownBlock of type CODE_BLOCK
   * @param options - Formatting options including theme
   * @returns Formatted code block result
   */
  formatCodeBlock(
    block: MarkdownBlock,
    options: CodeBlockFormatOptions
  ): CodeBlockFormatResult

  /**
   * Check if Shini highlighter is available
   *
   * @returns true if highlighter is ready
   */
  isHighlighterReady(): boolean
}
```

**Checkpoint:** Service integration interface defined

---

## Phase 4: ThemeService Integration Types

**Independence:** Medium (Can define types independently)
**Goal:** Define theme service integration interfaces

### Task 4.1: Define Theme Service Types

**Output:** `src/app/shared/components/streaming-markdown/core/theme-integration.types.ts`

```typescript
import { Signal } from '@angular/core'

/**
 * Application theme type
 */
export type AppTheme = 'light' | 'dark'

/**
 * Theme service interface
 * Manages application-wide theme state
 */
export interface IThemeService {
  /**
   * Reactive signal of current theme
   */
  readonly theme: Signal<AppTheme>

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void

  /**
   * Set specific theme
   *
   * @param theme - Theme to set
   */
  setTheme(theme: AppTheme): void

  /**
   * Get current theme value
   *
   * @returns Current theme
   */
  getCurrentTheme(): AppTheme
}

/**
 * Theme change event
 * Emitted when theme changes
 */
export interface ThemeChangeEvent {
  /** New theme value */
  theme: AppTheme

  /** Previous theme value */
  previousTheme: AppTheme

  /** Timestamp of change */
  timestamp: number
}
```

**Checkpoint:** Theme service types defined

---

## Phase 5: CSS Variables System

**Independence:** High (Can start immediately)
**Goal:** Define CSS variable structure for code highlighting theme integration

### Task 5.1: Define CSS Variable Schema

**Output:** Documentation in `docs/plans/2025-01-31-code-highlighting-architecture.md`

```css
/* Code highlighting CSS variable schema */
/* To be added to src/styles.css */

:root {
  /* Code block colors - light mode */
  --code-background: var(--muted);
  --code-foreground: var(--foreground);
  --code-border: var(--border);
  --code-line-number: var(--muted-foreground);

  /* Code toolbar */
  --code-toolbar-bg: oklch(0.95 0.01 85);
  --code-language-tag: var(--primary);

  /* Copy button states */
  --code-copy-hover: var(--accent);
  --code-copy-active: var(--primary);

  /* Shini token to project token mapping */
  --token-keyword: var(--primary);
  --token-string: var(--accent);
  --token-comment: var(--muted-foreground);
  --token-function: var(--foreground);
}

.dark {
  --code-background: oklch(0.25 0.04 230);
  --code-foreground: var(--foreground);
  --code-line-number: oklch(0.60 0.03 230);
  --code-toolbar-bg: oklch(0.30 0.04 230);
}

/* Shini token class overrides */
.token.keyword { color: var(--token-keyword); }
.token.string { color: var(--token-string); }
.token.comment { color: var(--token-comment); opacity: 0.7; }
.token.function { color: var(--token-function); }
```

**Checkpoint:** CSS variable schema documented

---

## Phase 6: Error Handling Models

**Independence:** High (Can start immediately)
**Goal:** Define error types and handling strategies

### Task 6.1: Define Error Types

**Output:** `src/app/shared/components/streaming-markdown/core/error-types.ts`

```typescript
/**
 * Shini-specific error types
 */
export namespace ShiniErrors {
  /**
   * Base error class for Shini-related errors
   */
  export class ShiniError extends Error {
    constructor(message: string, public readonly code: string) {
      super(message)
      this.name = 'ShiniError'
    }
  }

  /**
   * Initialization failure error
   */
  export class InitializationError extends ShiniError {
    constructor(message: string, public readonly cause?: Error) {
      super(message, 'SHINI_INIT_ERROR')
      this.name = 'InitializationError'
    }
  }

  /**
   * Language not loaded error
   */
  export class LanguageNotLoadedError extends ShiniError {
    constructor(
      message: string,
      public readonly language: string
    ) {
      super(message, 'LANGUAGE_NOT_LOADED')
      this.name = 'LanguageNotLoadedError'
    }
  }

  /**
   * Highlight execution error
   */
  export class HighlightError extends ShiniError {
    constructor(
      message: string,
      public readonly code: string,
      public readonly language: string
    ) {
      super(message, 'HIGHLIGHT_ERROR')
      this.name = 'HighlightError'
    }
  }

  /**
   * Theme loading error
   */
  export class ThemeError extends ShiniError {
    constructor(
      message: string,
      public readonly theme: string
    ) {
      super(message, 'THEME_ERROR')
      this.name = 'ThemeError'
    }
  }
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult {
  /** Whether error was recovered */
  recovered: boolean

  /** Fallback value used */
  fallback: string

  /** Error logged */
  errorLogged: boolean
}
```

**Checkpoint:** Error types defined with proper inheritance

---

## Phase 7: ShiniHighlighter Service Implementation

**Independence:** Low (Depends on P1, P6)
**Goal:** Implement Shini service with lazy initialization and caching

### Task 7.1: Create Service Skeleton

**Output:** `src/app/shared/components/streaming-markdown/core/shini-highlighter.ts`

```typescript
import { Injectable, signal, Signal } from '@angular/core'
import {
  IShiniHighlighter,
  ShiniInitializationState,
  ShiniLanguage,
  ShiniTheme,
  SHINI_THEME_MAP,
  PRELOAD_LANGUAGES
} from './shini-types'

/**
 * Shini highlighter service implementation
 * Manages Shini WASM instance for code highlighting
 */
@Injectable({ providedIn: 'root' })
export class ShiniHighlighter implements IShiniHighlighter {
  /**
   * Initialization state signal
   */
  readonly state: Signal<ShiniInitializationState>

  /**
   * Private mutable state for initialization
   */
  private _state = signal<ShiniInitializationState>({
    initialized: false,
    success: false,
    languagesLoaded: 0,
    themesLoaded: []
  })

  constructor() {
    this.state = this._state.asReadonly()
  }

  /**
   * Initialize Shini WASM and preload languages
   * Stub implementation
   */
  async initialize(): Promise<void> {
    // Implementation in next task
    return Promise.resolve()
  }

  /**
   * Highlight code with syntax highlighting
   * Stub implementation
   */
  highlight(code: string, language: string, theme: 'light' | 'dark'): string {
    // Implementation in next task
    return code
  }

  /**
   * Check if Shini is ready
   */
  isReady(): boolean {
    return this.state().initialized && this.state().success
  }
}
```

**Checkpoint:** Service compiles, can be injected

---

### Task 7.2: Implement Lazy Initialization

**Output:** Extend `shini-highlighter.ts`

```typescript
/**
 * Lazy initialization implementation
 * Runs asynchronously in background
 */
async initialize(): Promise<void> {
  try {
    // Load Shini WASM
    const shiki = await this.loadShikiWasm()

    // Preload common languages
    for (const lang of PRELOAD_LANGUAGES) {
      await shiki.loadLanguage(lang)
    }

    // Load themes
    await shiki.loadTheme(SHINI_THEME_MAP.light)
    await shiki.loadTheme(SHINI_THEME_MAP.dark)

    // Update state
    this._state.set({
      initialized: true,
      success: true,
      languagesLoaded: PRELOAD_LANGUAGES.length,
      themesLoaded: [SHINI_THEME_MAP.light, SHINI_THEME_MAP.dark]
    })

  } catch (error) {
    // Handle initialization failure
    this._state.set({
      initialized: true,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      languagesLoaded: 0,
      themesLoaded: []
    })
  }
}

/**
 * Load Shini WASM module
 * Stub implementation
 */
private async loadShiniWasm(): Promise<any> {
  // Implementation with actual Shini import
  return Promise.resolve({})
}
```

**Checkpoint:** Initialization logic defined

---

## Phase 8: CodeBlockWrapper Component Implementation

**Independence:** Low (Depends on P2, P5)
**Goal:** Implement component with IDE features

### Task 8.1: Create Component Skeleton

**Output:** `src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.component.ts`

> **Implementation Note (2025-02-01):** The actual implementation adapted to use existing Phase 2 types (`CopyButtonState`, `LineNumberOptions`) rather than the placeholder types referenced in the original plan. The state structure is simplified: flat `copyButtonState` instead of nested `toolbarState`, and `lineNumberOptions` matches Phase 2 definitions.

```typescript
import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  CodeBlockWrapperInputs,
  CopyButtonState,
  CopyButtonFeedback,
  DEFAULT_COPY_FEEDBACK,
  LineNumbers,
  LineNumberOptions
} from './code-block-wrapper.types'

/**
 * Code block wrapper component
 * Displays highlighted code with IDE features (line numbers, copy button, language tag)
 */
@Component({
  selector: 'app-code-block-wrapper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Template implementation in next task -->
    <div class="code-block-wrapper">
      Code block placeholder
    </div>
  `
})
export class CodeBlockWrapperComponent {
  /**
   * Highlighted HTML from Shini
   */
  @Input({ required: true })
  highlightedHtml!: string

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
   * Copy button text (extra feature for UI customization)
   */
  @Input()
  copyButtonText: string = DEFAULT_COPY_FEEDBACK.defaultText

  /**
   * Text to show after successful copy (extra feature for UI customization)
   */
  @Input()
  copySuccessText: string = DEFAULT_COPY_FEEDBACK.successText

  /**
   * Copy button state (public for testing)
   */
  readonly copyButtonState = signal<CopyButtonState>('default')

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
}
```

**Checkpoint:** Component compiles, can be used in templates

---

### Task 8.2: Implement Copy Logic

**Output:** Extend `code-block-wrapper.component.ts`

```typescript
/**
 * Copy code to clipboard
 */
protected copyToClipboard(): void {
  // Check if Clipboard API is available
  if (!navigator.clipboard) {
    this.toolbarState.update(state => ({
      ...state,
      copyButton: { type: 'unavailable' }
    }))
    return
  }

  // Copy code to clipboard
  navigator.clipboard.writeText(this.code)
    .then(() => {
      // Show "copied" feedback
      this.toolbarState.update(state => ({
        ...state,
        copyButton: { type: 'copied', remainingMs: 2000 }
      }))

      // Reset after 2 seconds
      setTimeout(() => {
        this.toolbarState.update(state => ({
          ...state,
          copyButton: { type: 'default' }
        }))
      }, 2000)
    })
    .catch((error: Error) => {
      // Show error feedback
      this.toolbarState.update(state => ({
        ...state,
        copyButton: { type: 'error', message: error.message }
      }))
    })
}
```

**Checkpoint:** Copy logic defined

---

## Phase 9: MarkdownFormatterService Integration

**Independence:** Low (Depends on P1, P3, P4)
**Goal:** Integrate ShiniHighlighter into existing formatter service

### Task 9.1: Extend MarkdownFormatterService

**Output:** Modify `src/app/shared/components/streaming-markdown/renderers/markdown-formatter.service.ts`

```typescript
import { Injectable, inject } from '@angular/core'
import { IShiniHighlighter } from '../core/shini-types'
import { IThemeService } from '../core/theme-integration.types'
import { MarkdownFormatterService } from './markdown-formatter.service'

/**
 * Extended MarkdownFormatterService with code highlighting
 * Adds Shini integration to existing service
 */
@Injectable({ providedIn: 'root' })
export class MarkdownFormatterServiceExtended extends MarkdownFormatterService {
  /**
   * Shini highlighter service
   */
  private shini = inject(IShiniHighlighter)

  /**
   * Theme service
   */
  private themeService = inject(IThemeService)

  /**
   * Format code block with highlighting
   * Integration point for Shini
   */
  formatCodeBlock(block: MarkdownBlock): string {
    // Implementation in next task
    return ''
  }
}
```

**Checkpoint:** Service extension compiles

---

### Task 9.2: Implement Highlighting Logic

**Output:** Extend service implementation

```typescript
formatCodeBlock(block: MarkdownBlock): string {
  // Extract code info
  const language = block.language || 'text'
  const code = block.content
  const theme = this.themeService.getCurrentTheme()

  // Check if Shini is ready
  if (!this.shini.isReady()) {
    // Fallback: return escaped plain text
    return this.escapeHtml(code)
  }

  try {
    // Highlight code
    const highlightedHtml = this.shini.highlight(code, language, theme)

    // Wrap with IDE features
    return this.wrapWithIdeFeatures(highlightedHtml, language)

  } catch (error) {
    // Error handling: fallback to plain text
    console.error('[MarkdownFormatterService] Highlight error:', error)
    return this.escapeHtml(code)
  }
}

/**
 * Escape HTML for fallback rendering
 */
private escapeHtml(code: string): string {
  // Implementation with proper HTML escaping
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Wrap highlighted HTML with IDE features
 */
private wrapWithIdeFeatures(html: string, language: string): string {
  // Implementation in next task
  return html
}
```

**Checkpoint:** Highlighting logic implemented

---

## Phase 10: Styling Implementation

**Independence:** Low (Depends on P5)
**Goal:** Implement CSS variables and component styles

### Task 10.1: Add CSS Variables

**Output:** Modify `src/styles.css`

```css
/* Add to @theme inline section */

/* Code highlighting variables */
--code-background: var(--muted);
--code-foreground: var(--foreground);
--code-border: var(--border);
--code-line-number: var(--muted-foreground);
--code-toolbar-bg: oklch(0.95 0.01 85);
--code-language-tag: var(--primary);
--code-copy-hover: var(--accent);
--code-copy-active: var(--primary);

/* Shini token mapping */
--token-keyword: var(--primary);
--token-string: var(--accent);
--token-comment: var(--muted-foreground);
--token-function: var(--foreground);

.dark {
  --code-background: oklch(0.25 0.04 230);
  --code-foreground: var(--foreground);
  --code-line-number: oklch(0.60 0.03 230);
  --code-toolbar-bg: oklch(0.30 0.04 230);
}
```

**Checkpoint:** CSS variables defined

---

### Task 10.2: Implement Component Styles

**Output:** `src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.component.css`

```css
/* Code block wrapper container */
.code-block-wrapper {
  background: var(--code-background);
  border: 1px solid var(--code-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  position: relative;
  display: grid;
  grid-template-columns: var(--line-number-column-width, 1fr);
  gap: var(--spacing-md);
  font-family: 'Figtree', ui-sans-serif, monospace;
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

/* Toolbar styles */
.code-toolbar {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
}

/* Copy button styles */
.copy-button {
  padding: var(--spacing-xs);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 150ms;
}

.copy-button:hover {
  background-color: var(--code-copy-hover);
}

/* Language tag styles */
.language-tag {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  background-color: var(--code-language-tag);
}

/* Shini token overrides */
.token.keyword { color: var(--token-keyword); }
.token.string { color: var(--token-string); }
.token.comment { color: var(--token-comment); opacity: 0.7; }
.token.function { color: var(--token-function); }
```

**Checkpoint:** Styles defined and integrated with design system

---

## Phase 11: Testing Infrastructure

**Independence:** Medium (Depends on all previous)
**Goal:** Define test interfaces and create test scaffolding

### Task 11.1: Define Test Interfaces

**Output:** `src/app/shared/components/streaming-markdown/core/shini-highlighter.spec.ts`

```typescript
import { IShiniHighlighter } from './shini-types'

/**
 * Test case for Shini highlighter
 */
export interface ShiniHighlighterTestCase {
  input: {
    code: string
    language: string
    theme: 'light' | 'dark'
  }
  expected: {
    success: boolean
    containsTokens: string[]
  }
  description: string
}

/**
 * Test suite for ShiniHighlighter
 */
describe('ShiniHighlighter', () => {
  let service: IShiniHighlighter

  beforeEach(() => {
    // Service initialization
  })

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      // Test implementation
    })

    it('should preload common languages', () => {
      // Test implementation
    })
  })

  describe('Highlighting', () => {
    const testCases: ShiniHighlighterTestCase[] = [
      // Test case definitions
    ]

    testCases.forEach((testCase) => {
      it(testCase.description, () => {
        // Test implementation
      })
    })
  })
})
```

**Checkpoint:** Test interfaces defined, test file compiles

---

## Compilation Checkpoints

✅ **After Phase 1:** All Shini types and interfaces compile
✅ **After Phase 2:** CodeBlockWrapper types compile
✅ **After Phase 3:** Formatter extension interfaces compile
✅ **After Phase 4:** Theme service types compile
✅ **After Phase 5:** CSS variables documented
✅ **After Phase 6:** Error types compile
✅ **After Phase 7:** ShiniHighlighter service compiles (stub implementation)
✅ **After Phase 8:** CodeBlockWrapper component compiles (template stub)
✅ **After Phase 9:** MarkdownFormatterService extension compiles
✅ **After Phase 10:** CSS variables and styles defined
✅ **After Phase 11:** Test scaffolding compiles

---

## Implementation Order (Recommended)

**Sprint 1: Foundation (P1-P6)** - Define all types and interfaces
**Sprint 2: Core Services (P7)** - Implement ShiniHighlighter
**Sprint 3: Component Layer (P8-P9)** - Implement CodeBlockWrapper and integration
**Sprint 4: Styling (P10)** - Implement CSS variables and component styles
**Sprint 5: Testing (P11)** - Implement test suites

---

## Revision History

- **2025-01-31**: Initial architecture plan created
- **2025-02-01**: Phase 8.1 implementation adapted to existing Phase 2 types:
  - State structure simplified: `copyButtonState` (flat) instead of `toolbarState` (nested)
  - Line number config uses `lineNumberOptions` with `{ startFrom, format }` instead of `{ enabled, startFrom, columnWidth }`
  - Added extra inputs: `copyButtonText`, `copySuccessText` for UI customization
  - Changed from `protected` to `readonly` for better testability
  - Reason: Phase 2 types use `CopyButtonState` and `LineNumberOptions`, not the types referenced in original spec

---

## Notes

- **No Logic Implementation:** This plan defines interfaces, types, and structures only. Function bodies come during implementation.
- **Compilation-First:** Every task ensures the code compiles, even with stub implementations.
- **Incremental Progress:** Each phase adds buildable, type-safe code.
- **Parallel-Ready:** Phases with High independence can be assigned to concurrent subagents.
