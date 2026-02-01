# Code Highlighting Feature Design Document

**Date:** 2025-01-31
**Project:** Angular Spark CLI - Streaming Markdown Component
**Feature:** Code Highlighting with IDE Experience (Shini Integration)
**Status:** Design Complete, Ready for Implementation

---

## Executive Summary

This document outlines the design for adding professional code highlighting and IDE-like features to the streaming markdown component. The implementation uses **Shini** (VSCode's highlighter) for professional-grade syntax highlighting with full IDE experience including line numbers, copy button, and language tags.

**Scope:** MVP - Core highlighting with essential IDE features, theme integration, and performance optimization.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Design](#component-design)
3. [Theme Integration](#theme-integration)
4. [Data Flow](#data-flow)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Phases](#implementation-phases)

---

## Architecture Overview

### Component Hierarchy

```
streaming-markdown/
├── core/
│   ├── models.ts (existing)
│   ├── markdown-preprocessor.ts (existing)
│   ├── block-parser.ts (existing)
│   └── shini-highlighter.ts (NEW)
│
├── renderers/
│   ├── markdown-formatter.service.ts (MODIFIED)
│   ├── block-renderer.component.ts (MODIFIED)
│   └── code-block-wrapper.component.ts (NEW)
│
└── streaming-markdown.component.ts (MODIFIED)
```

### Technology Stack

- **Shini** 0.14.x - VSCode-grade syntax highlighter
- **Angular Signals** - Reactive theme management
- **CSS Variables** - "矿物与时光" theme integration
- **Clipboard API** - Copy functionality

---

## Component Design

### 1. ShiniHighlighter Service

**Responsibility:** Manage Shini WASM instance, language loading, and highlighting.

**Interface (Logic):**

```
interface IShiniHighlighter {
  // Initialize (called once at app startup)
  initialize(): Promise<void>
    → Load Shini WASM
    → Preload 5-8 common languages
    → Initialize light and dark themes

  // Highlight code (synchronous after initialization)
  highlight(
    code: string,
    language: string,
    theme: 'light' | 'dark'
  ): string
    → Check if language is loaded
    → If not loaded, return escaped plain text (fallback)
    → If loaded, call Shini to highlight
    → Return HTML with token classes
}
```

**Preloaded Languages (MVP):**

1. TypeScript / JavaScript
2. Python
3. HTML
4. CSS
5. JSON
6. Bash
7. SQL

**State Management:**

```
class ShiniHighlighterImpl {
  private shiki: ShikiInstance | null = null
  private loadedLanguages: Set<string>
  private loadedThemes: Set<string>
  private ready: Signal<boolean>

  async initialize() {
    try:
      shiki = await loadShiki()

      for lang in PRELOAD_LANGUAGES:
        shiki.loadLanguage(lang)
        loadedLanguages.add(lang)

      shiki.loadTheme('light-theme')
      shiki.loadTheme('dark-theme')

      ready.set(true)

    catch error:
      // Handle initialization failure
      ready.set(false)
      log error
  }

  highlight(code, language, theme) {
    if (!shiki || !loadedLanguages.has(language)) {
      return escapeHtml(code)  // Fallback
    }

    return shiki.codeToHtml(code, {
      lang: language,
      theme: theme
    })
  }
}
```

**Lazy Initialization:**

```
Strategy: Initialize in background, don't block app startup

App Startup Flow:
  1. Bootstrap Angular app immediately
  2. Start Shini initialization asynchronously
  3. App is usable (code blocks show as plain text)
  4. When Shini ready, code blocks auto-update with highlighting

Implementation:
MarkdownFormatterService {
  private shiniReady = signal(false)

  constructor() {
    // Non-blocking initialization
    this.shiniHighlighter.initialize().then(() => {
      this.shiniReady.set(true)
    })
  }

  format(block) {
    if (!this.shiniReady() && block.type === CODE_BLOCK) {
      return this.placeholderHtml(block)  // Temporary placeholder
    }
    // Normal highlighting...
  }
}
```

---

### 2. CodeBlockWrapper Component

**Responsibility:** Wrap Shini-generated HTML with IDE features.

**Component Structure:**

```
┌─────────────────────────────────────┐
│ [Language Tag]        [Copy Button] │ ← Toolbar
├────┬──────────────────────────────┤
│ 1  │ highlighted code line 1      │ ← Code Area
│ 2  │ highlighted code line 2      │   (with line numbers)
│ 3  │ highlighted code line 3      │
└────┴──────────────────────────────┘
```

**Inputs:**

```
@Input() highlightedHtml: string    // Shini-generated HTML
@Input() language: string            // Language name (e.g., "TypeScript")
@Input() showLineNumbers: boolean     // Default: true
```

**Sub-Features:**

**a) Line Number Generator**

```
Logic:
  function generateLineNumbers(code: string): string {
    lines = code.split('\n')
    return lines
      .map((_, index) => index + 1)
      .join('\n')
  }

CSS Binding:
  - Fixed width left column (50px)
  - Right aligned text
  - Color: var(--code-line-number)
  - Font-size: inherit (matches code)
```

**b) Copy Button**

```
Logic:
  function copyToClipboard(code: string): void {
    if (!navigator.clipboard) {
      // Fallback or hide button
      return
    }

    navigator.clipboard.writeText(code)
      .then(() => {
        showFeedback("已复制")
        setTimeout(() => hideFeedback(), 2000)
      })
      .catch(() => {
        showFeedback("复制失败")
      })
  }

States:
  - Default: Show "Copy" icon
  - Hover: Highlight
  - Clicked: Show "已复制" (2 seconds)
  - Error: Show "复制失败"

Position:
  - Top-right corner
  - Absolute positioning
  - Padding: 2px
```

**c) Language Tag**

```
Logic:
  function getDisplayName(language: string): string {
    const mapping = {
      'ts': 'TypeScript',
      'js': 'JavaScript',
      'py': 'Python',
      'rs': 'Rust',
      // ...
    }
    return mapping[language] || language.toUpperCase()
  }

Display:
  - Top-right corner (below copy button)
  - Small text
  - Background: var(--code-language-tag)
  - Rounded corners
  - Padding: 2px 8px
```

---

### 3. MarkdownFormatterService Integration

**Modified Flow:**

```
format(block: MarkdownBlock, theme?: 'light' | 'dark'): string
  ↓
Check block.type
  ↓
if block.type === CODE_BLOCK:

  Step 1: Extract code info
    language = block.language || 'text'
    code = block.content

  Step 2: Call ShiniHighlighter
    try:
      currentTheme = theme || this.themeService.theme()
      highlightedHtml = this.shiniHighlighter.highlight(
        code,
        language,
        currentTheme
      )
    catch error:
      // Fallback: return escaped plain text
      highlightedHtml = escapeHtml(code)
      log error

  Step 3: Wrap with IDE features
    finalHtml = this.wrapWithToolbar(highlightedHtml, language)
    finalHtml = this.addLineNumbers(finalHtml)

  Step 4: Return
    return finalHtml

else:  // Other block types
  // Existing logic (marked + DOMPurify)
  return marked(block.content)
```

---

## Theme Integration

### Using Project CSS Tokens

**New CSS Variables** (add to `styles.css` `@theme inline`):

```
/* Code block variables - using project token system */
--code-background: var(--muted);                  /* Light mode */
--code-foreground: var(--foreground);             /* Primary text */

/* Code decorations */
--code-border: var(--border);                     /* Border color */
--code-line-number: var(--muted-foreground);       /* Line numbers */

/* Code toolbar */
--code-toolbar-bg: oklch(0.95 0.01 85);            /* Toolbar background */
--code-language-tag: var(--primary);              /* Language tag: Malachite */

/* Copy button states */
--code-copy-hover: var(--accent);                 /* Hover: Gold */
--code-copy-active: var(--primary);               /* Click: Malachite */

.dark {
  --code-background: oklch(0.25 0.04 230);         /* Dark Qing variant */
  --code-foreground: var(--foreground);
  --code-line-number: oklch(0.60 0.03 230);        /* Light Qing variant */
  --code-toolbar-bg: oklch(0.30 0.04 230);
}
```

**Shini Token to CSS Variable Mapping:**

```
Approach: Override Shini's default colors with project tokens

.token.keyword   { color: var(--primary); }     /* Malachite */
.token.string    { color: var(--accent); }      /* Gold */
.token.comment   { color: var(--muted-foreground); opacity: 0.7; }
.token.function  { color: var(--foreground); }
```

**Code Block Container Styles:**

```
.block-code {
  background: var(--code-background);
  color: var(--code-foreground);
  border: 1px solid var(--code-border);

  /* Use existing spacing and radius tokens */
  padding: var(--spacing-lg);                    /* 12px */
  border-radius: var(--radius-md);               /* 4px */

  /* Keep existing styles */
  font-family: 'Figtree', ui-sans-serif;
  font-size: var(--font-size-sm);                /* 12px */
  line-height: 1.6;

  /* Grid layout for line numbers */
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: var(--spacing-md);                         /* 8px */
}
```

---

## Data Flow

### Complete Flow Diagram

```
AI API Stream (Observable<string>)
  ↓
RxJS scan (accumulate chunks)
  ↓
MarkdownPreprocessor (fix incomplete syntax)
  ↓
BlockParser (split to MarkdownBlock[])
  ↓
toSignal() → Signals State Management
  ↓
StreamingMarkdownComponent
  ├─ Reads theme from ThemeService
  └─ Passes to MarkdownFormatterService
  ↓
MarkdownFormatterService.format(block, theme)
  ↓
  if block.type === CODE_BLOCK:
    ├─ Extract code + language
    ├─ ShiniHighlighter.highlight(code, lang, theme)
    ├─ CodeBlockWrapper wrapping
    │  ├─ Add line numbers
    │  ├─ Add copy button
    │  └─ Add language tag
    └─ Return highlighted HTML
  else:
    └─ Existing marked + DOMPurify flow
  ↓
BlockRendererComponent (render)
  ↓
DOM (with reactive theme updates)
```

### Reactive Theme Switching

**Approach A: Integration with Global Theme Service**

```
ThemeService (Global Singleton):
  - Manages current theme state
  - Provides theme toggle methods
  - Notifies theme changes

interface ThemeService {
  readonly theme: Signal<'light' | 'dark'>
  toggleTheme(): void
  setTheme(theme: 'light' | 'dark'): void
}

MarkdownFormatterService Integration:

constructor(
  private themeService: ThemeService,
  private shiniHighlighter: ShiniHighlighter
) {}

format(block: MarkdownBlock): string {
  if (block.type === CODE_BLOCK) {
    // Read current theme from service
    currentTheme = this.themeService.theme()

    highlightedHtml = this.shiniHighlighter.highlight(
      block.content,
      block.language || 'text',
      currentTheme
    )

    return this.wrapWithIdeFeatures(highlightedHtml, block.language)
  }
  // Other block types...
}

StreamingMarkdownComponent Reactive Updates:

readonly theme = this.themeService.theme

readonly blocks = computed(() => {
  // Theme change triggers recomputation
  // formatter.format() uses new theme
  return this.processedBlocks$().blocks.map(block => ({
    ...block,
    html: this.formatter.format(block, this.theme())
  }))
})
```

---

## Error Handling

### Error Scenarios & Fallback Strategies

**1. Shini Initialization Failure**

```
Causes:
  - WASM loading failure (network, browser unsupported)
  - Syntax file loading failure

Behavior:
  - Show loading state (optional)
  - Timeout after 3 seconds → enable fallback mode
  - Code blocks display as plain text (HTML escaped)
  - IDE features remain functional (line numbers, copy button)
  - Console warning log

Fallback UI:
┌─────────────────────────┐
│ code                    │ ← Plain text, monospace
│ example();              │
└─────────────────────────┘
```

**2. Language Not Supported**

```
Behavior:
  - Check if language is loaded
  - If not loaded, attempt async load
  - During load: Show plain text + "Loading highlight..." indicator
  - Load fails: Keep plain text, don't retry
  - Log for future preload list optimization
```

**3. Highlight Execution Error**

```
Behavior:
  - Catch exception from Shini.codeToHtml()
  - Return escaped plain text
  - Don't block streaming rendering
  - Log error (with language + code snippet hash)
  - Continue processing other blocks
```

**4. Copy Function Failure**

```
Behavior:
  - Check if navigator.clipboard exists
  - If not available, hide copy button
  - Or fallback to execCommand('copy') (deprecated but better compatibility)
  - Or show "Select code" hint
```

---

## Performance Optimization

### Optimization Targets

- Initialization time: < 2 seconds (lazy, non-blocking)
- Highlight response: < 10ms (for loaded languages)
- Memory usage: < 50MB (including syntax files)
- Non-blocking streaming

### Optimization Strategies

**1. Lazy Loading Initialization**

```
Current: Initialize Shini at app startup (blocking)

Optimized: Deferred initialization
  - App starts immediately
  - Shini initializes asynchronously in background
  - First code block usage:
    - If ready: Normal highlighting
    - If not ready: Show plain text + "Loading highlight..."
    - When ready: Auto-re-render with highlighting
```

**2. Language Preload Optimization**

```
Strategy: Preload only 5-8 most common languages

Preload List (by usage frequency):
  1. TypeScript/JavaScript
  2. Python
  3. HTML
  4. CSS
  5. JSON
  6. Bash
  7. SQL

Other languages: Load on demand (first use)
```

**3. Highlight Result Caching**

```
Leverage Angular Signals for automatic caching:

StreamingMarkdownComponent {
  // blocks is a computed signal
  // formatter.format() returns same content → cache hit
  readonly blocks = computed(() =>
    this.rawBlocks$.map(block =>
      this.formatter.format(block, this.theme())
    )
  )
}

Properties:
  - Same block + same theme = cache hit
  - Theme switch = auto-rehighlight
  - New block = auto-highlight
```

**4. Virtual Scrolling (Future)**

```
If document has 100+ code blocks:
  - Only render visible code blocks
  - Use Angular CDK Virtual Scrolling
  - On-demand highlighting (highlight when entering viewport)

MVP Stage: Not implemented
Reason: Most documents have < 20 code blocks
```

---

## Testing Strategy

### Test Layers

**1. Unit Tests**

```
ShiniHighlighter Service Tests:
  - Initialization success/failure scenarios
  - highlight() method correctness
    ✓ Common languages (TypeScript, Python)
    ✓ Unsupported language fallback
    ✓ Empty code handling
    ✓ Special character escaping
  - Cache mechanism verification

MarkdownFormatterService Tests:
  - CODE_BLOCK branch logic
  - Theme change triggers re-highlight
  - Non-CODE_BLOCK types unaffected
  - Error handling (Shini failure fallback)

CodeBlockWrapper Component Tests:
  - @Input binding correctness
  - Line number generation logic
  - Copy button click event
  - Language tag display
  - Theme change response
```

**2. Integration Tests**

```
Streaming Rendering Integration Tests:

Scenarios:
  1. Send markdown stream with code blocks
  2. Verify code blocks are correctly highlighted
  3. Verify line numbers, copy button, language tags exist
  4. Switch theme, verify highlighting updates
  5. Send unsupported code block, verify fallback

Test Cases:
  - ✓ Single code block streaming render
  - ✓ Multiple code blocks (different languages)
  - ✓ Code blocks mixed with other block types
  - ✓ Theme switch triggers re-highlight
  - ✓ Shini init failure fallback
```

**3. Visual Regression Tests**

```
Screenshot Tests (Optional):
  - Record highlighting results for common code blocks
  - Compare after UI changes
  - Ensure visual consistency after Shini or theme upgrades

Test Cases:
  - TypeScript code (light/dark theme)
  - Python code (light/dark theme)
  - With/without line numbers
  - With IDE features / plain code
```

**4. Performance Tests**

```
Benchmarking:
  - Initialization time
  - Highlight response time (loaded languages)
  - Memory footprint

Tools:
  - performance.mark() / measure()
  - Chrome DevTools Performance
```

---

## Implementation Phases

### Phase 1: ShiniHighlighter Service

**Tasks:**
1. Create `shini-highlighter.ts` service
2. Implement lazy initialization logic
3. Implement `highlight()` method
4. Add error handling and fallback
5. Preload 5-8 common languages
6. Write unit tests

**Checkpoint:** Service can be injected and highlights common languages correctly.

---

### Phase 2: MarkdownFormatterService Integration

**Tasks:**
1. Modify `markdown-formatter.service.ts`
2. Add CODE_BLOCK detection logic
3. Integrate ShiniHighlighter
4. Implement theme integration with ThemeService
5. Add fallback for Shini failures
6. Update unit tests

**Checkpoint:** Code blocks are highlighted with correct theme.

---

### Phase 3: CodeBlockWrapper Component

**Tasks:**
1. Create `code-block-wrapper.component.ts`
2. Implement line number generation
3. Implement copy button with Clipboard API
4. Implement language tag display
5. Add responsive theme support
6. Write component tests

**Checkpoint:** Component renders with all IDE features.

---

### Phase 4: BlockRenderer Integration

**Tasks:**
1. Modify `block-renderer.component.ts`
2. Replace CODE_BLOCK case with CodeBlockWrapper
3. Pass language and highlighted HTML
4. Verify with integration tests

**Checkpoint:** Code blocks render with highlighting in streaming context.

---

### Phase 5: Styling & Theme Integration

**Tasks:**
1. Add CSS variables to `styles.css`
2. Implement Shini token mapping
3. Style toolbar, line numbers, copy button
4. Ensure "矿物与时光" theme consistency
5. Test light/dark mode switching

**Checkpoint:** Visual appearance matches project design system.

---

### Phase 6: Performance Optimization & Testing

**Tasks:**
1. Implement lazy initialization (non-blocking)
2. Add caching mechanism (Signals-based)
3. Write integration tests
4. Run performance benchmarks
5. Optimize based on results

**Checkpoint:** All tests pass, performance targets met.

---

## Future/Divergent Ideas

### Parked for Future Phases

**Enhanced Features:**
- Custom theme system (user-defined themes)
- Language tag i18n (localized names)
- Line highlighting (click code to jump)
- Code folding (collapse code blocks)
- Word highlighting (double-click to highlight all occurrences)
- Line wrap configuration
- Extended language support (200+ languages)

**Advanced IDE Features:**
- Minimap (code preview)
- Breadcrumbs (path display)
- Multiple cursors
- Find and replace in code
- Diff view (before/after)

**Optimization:**
- Virtual scrolling for 100+ code blocks
- Web Worker for highlighting (off main thread)
- Incremental highlighting (highlight as user types)

---

## Design Principles Applied

1. **YAGNI** - MVP focuses on essential highlighting and IDE features
2. **Performance First** - Lazy loading, caching, Signals for efficiency
3. **User Experience** - Non-blocking initialization, graceful fallbacks
4. **Design System Alignment** - Uses project CSS tokens and "矿物与时光" theme
5. **Testability** - Clear separation of concerns, comprehensive test strategy

---

## Conclusion

This design provides professional-grade code highlighting with a complete IDE experience while maintaining the project's design philosophy and performance standards. The lazy loading approach ensures zero impact on app startup time, and the reactive theme integration provides seamless user experience.

The MVP scope is well-defined and achievable, with a clear path for future enhancements when needed.

---

**Design Status:** ✅ Complete
**Ready for Implementation:** Yes
**Estimated Effort:** 3-4 days for MVP
