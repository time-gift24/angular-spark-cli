# Streaming Markdown Component Design Document

**Date:** 2025-01-30
**Project:** Angular Spark CLI - Streaming Markdown Component
**Goal:** Replicate StreamDown's perfect streaming rendering using Angular CDK + Tailwind CSS

---

## Executive Summary

This document outlines the design for a block-based streaming markdown renderer component for Angular 20+, inspired by the StreamDown React library. The component supports real-time AI API streaming with perfect formatting and smooth UX.

**Scope:** Phase 1 MVP - Core streaming engine with basic markdown support.

---

## Architecture Overview

### Component Hierarchy

```
angular-spark-cli/
└── src/
    ├── app/
    │   ├── shared/
    │   │   └── components/
    │   │       └── streaming-markdown/           # Reusable component
    │   │           ├── streaming-markdown.component.ts
    │   │           ├── streaming-markdown.component.html
    │   │           ├── core/                      # Core logic
    │   │           │   ├── markdown-preprocessor.ts    # remend-style self-healing
    │   │           │   ├── block-parser.ts             # Block parser
    │   │           │   └── models.ts                  # Type definitions
    │   │           └── renderers/                 # Renderers
    │   │               ├── block-renderer.component.ts
    │   │               └── markdown-formatter.service.ts
    │   ├── test/                                 # /test route page
    │   │   ├── test.routes.ts
    │   │   ├── test.component.ts
    │   │   └── test.component.html
    │   └── app.routes.ts                         # Root routes
```

### Data Flow Architecture

```
AI API Stream (Observable<string>)
    ↓
StreamingMarkdownComponent (@Input stream)
    ↓
RxJS Stream Processing
    ↓
MarkdownPreprocessor (remend-style self-healing)
    ↓
BlockParser (Block splitting)
    ↓
toSignal() → Signals State Management
    ↓
BlockRendererComponent (*ngFor) ← OnPush Change Detection
    ↓
MarkdownFormatterService (HTML generation)
    ↓
Tailwind CSS Styles
```

---

## Part 1: Routing Configuration

### Route Structure

```typescript
// app.routes.ts (Root routes)
{
  path: 'test',
  loadComponent: () => import('./test/test.component').then(m => m.TestComponent)
}

// Access path: http://localhost:4200/test
```

**Design Decision:**
- Lazy load test component for better performance
- Simple routing structure for easy access during development

---

## Part 2: Core Logic Layer

### Data Models

```typescript
interface MarkdownBlock {
  id: string;              // Unique identifier
  type: BlockType;         // Block type
  content: string;         // Block content
  isComplete: boolean;     // Completion status (non-streaming state)
  position: number;        // Position in document
}

enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  CODE_BLOCK = 'code',
  LIST = 'list',
  BLOCKQUOTE = 'blockquote',
  THEMATIC_BREAK = 'hr',
  HTML = 'html'            // HTML blocks stay intact
}

interface StreamingState {
  blocks: MarkdownBlock[];           // Completed blocks
  currentBlock: MarkdownBlock | null; // Current streaming block
  rawContent: string;                // Raw markdown text
}
```

### MarkdownPreprocessor (remend-like)

**Responsibility:** Fix incomplete markdown syntax during streaming

**Algorithm:**
```
Input: Incomplete markdown text
  ↓
Detect unclosed markers:
  - **bold** (missing closing **)
  - *italic* (missing closing *)
  - `inline code` (missing closing `)
  - [link](url) (missing closing ))
  - ~~strikethrough~~ (missing closing ~~)
  - $$math$$ (missing closing $$)
  ↓
Priority-based processing (avoid nesting conflicts):
  1. Code blocks (```) - Highest priority
  2. Math blocks ($$)
  3. Links
  4. Bold/italic/strikethrough
  ↓
Output: Fixed markdown text
```

**Key Design Decisions:**
- Don't modify original input, return fixed copy
- Use string iteration instead of regex (performance optimization)
- Support proper closing of nested markers

### BlockParser

**Responsibility:** Split markdown text into logical blocks

**Parsing Strategy:**
```
Input: Markdown text
  ↓
Tokenize using Marked.js Lexer
  ↓
Intelligently merge related tokens:
  - List items → Merge into single list block
  - Code blocks → Keep intact (include language identifier)
  - HTML blocks → Keep intact
  - Paragraphs → Independent blocks
  ↓
Handle edge cases:
  - Footnote references → Entire document as single block
  - Math blocks → Correctly merge $$ delimiters
  ↓
Output: MarkdownBlock[]
```

**Core Features:**
- **Incremental parsing:** Only parse new content, don't re-parse completed blocks
- **State preservation:** Remember parsing position (avoid re-scanning)
- **Fault tolerance:** Incomplete syntax doesn't crash

---

## Part 3: RxJS Streaming Pipeline

### Pipeline Architecture

```typescript
// streaming-markdown.component.ts (Core logic)

@Input() stream$: Observable<string>;  // Passed from parent component

// RxJS processing pipeline
processedBlocks$ = this.stream$.pipe(
  // 1. Accumulate streaming text
  scan((acc, chunk) => acc + chunk, ''),

  // 2. Preprocess (fix incomplete syntax)
  map(rawText => this.preprocessor.process(rawText)),

  // 3. Parse blocks
  map(processedText => this.blockParser.parse(processedText)),

  // 4. Differential updates (only update changed blocks)
  map((blocks) => this.detectChanges(blocks, this.previousBlocks)),

  // 5. Convert to Signal
  toSignal({ initialValue: emptyState })
);

// State signals (from derived state)
blocks = computed(() => this.processedBlocks$().blocks);
currentBlock = computed(() => this.processedBlocks$().currentBlock);
```

### Change Detection Algorithm

```
Input: newBlocks[], previousBlocks[]
  ↓
Comparison strategy:
  1. Completed blocks (isComplete = true)
     → If id matches and content same → Reuse (no re-render)
     → If id matches but content different → Update
     → If new id → Append

  2. Current streaming block (isComplete = false)
     → Always update (content constantly changing)

  3. Block deletion
     → Remove from list
  ↓
Output: Minimally changed block list
```

**Key Optimizations:**
- Use `id` field for block matching (not position index)
- Completed block references unchanged (triggers Angular OnPush optimization)
- Only current block updates frequently

### Debouncing (Optional Optimization)

```typescript
// If AI API sends chunks too frequently, add throttling
processedBlocks$ = this.stream$.pipe(
  scan((acc, chunk) => acc + chunk, ''),
  debounceTime(30),  // 30ms throttle, avoid over-rendering
  map(rawText => this.preprocessor.process(rawText)),
  // ... subsequent processing
);
```

### Error Handling Strategy

```
Exception handling:
  1. Preprocessor fails
     → Fallback: Use original text

  2. BlockParser fails
     → Fallback: Entire content as single paragraph block

  3. Stream error/complete
     → Mark all blocks as complete

  4. Severe markdown format errors
     → Display original text, don't crash
```

---

## Part 4: Component Layer

### StreamingMarkdownComponent (Main Component)

**Responsibility:** Coordinate streaming processing and block rendering

**Interface Design:**
```typescript
@Component({
  selector: 'app-streaming-markdown',
  standalone: true,
  imports: [BlockRendererComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="streaming-markdown-container">
      <!-- Completed blocks -->
      <app-block-renderer
        *ngFor="let block of blocks(); trackBy: trackById"
        [block]="block"
        [isComplete]="true" />

      <!-- Current streaming block -->
      @if (currentBlock()) {
        <app-block-renderer
          [block]="currentBlock()"
          [isComplete]="false" />
      }
    </div>
  `,
  styles: `...`
})
export class StreamingMarkdownComponent {
  @Input() stream$!: Observable<string>;

  // Signals from RxJS pipeline
  blocks = computed(() => /* ... */);
  currentBlock = computed(() => /* ... */);

  // Track by for performance
  trackById(index: number, block: MarkdownBlock): string {
    return block.id;
  }
}
```

### BlockRendererComponent (Block Renderer)

**Responsibility:** Render single markdown block

**Design:**
```typescript
@Component({
  selector: 'app-block-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses" [attr.data-block-type]="block.type">
      @switch (block.type) {
        @case (BlockType.PARAGRAPH) {
          <p [innerHTML]="formattedContent"></p>
        }
        @case (BlockType.HEADING) {
          <h[level] [innerHTML]="formattedContent"></h[level]>
        }
        @case (BlockType.CODE_BLOCK) {
          <pre><code [innerHTML]="formattedContent"></code></pre>
        }
        @case (BlockType.LIST) {
          <ul [innerHTML]="formattedContent"></ul>
        }
        @case (BlockType.BLOCKQUOTE) {
          <blockquote [innerHTML]="formattedContent"></blockquote>
        }
        @case (BlockType.THEMATIC_BREAK) {
          <hr />
        }
        @case (BlockType.HTML) {
          <div [innerHTML]="formattedContent" class="html-block"></div>
        }
      }
    </div>
  `
})
export class BlockRendererComponent {
  @Input() block!: MarkdownBlock;
  @Input() isComplete: boolean = false;

  // Generate HTML using MarkdownFormatterService
  formattedContent = computed(() =>
    this.formatter.format(this.block())
  );

  // Apply Tailwind classes based on block type
  containerClasses = computed(() =>
    this.getClassesForBlockType(this.block().type)
  );
}
```

### MarkdownFormatterService (Formatting Service)

**Responsibility:** Convert markdown text to HTML

**Strategy:**
```
Phase 1 (MVP):
  - Use lightweight markdown library
  - Recommended: marked (simple, fast)
  - Or: Custom simple parser (only MVP features)

Phase 2+ (Future):
  - Migrate to unified/remark/rehype ecosystem
  - Stronger plugin support
```

**Security Considerations:**
- Output must be sanitized
- Prevent XSS attacks
- Use DOMPurify or similar library

### TestComponent (Test Page)

**Responsibility:** Demonstrate and test StreamingMarkdownComponent

**Design:**
```typescript
@Component({
  selector: 'app-test',
  standalone: true,
  imports: [StreamingMarkdownComponent, CommonModule],
  template: `
    <div class="test-container">
      <h1>Streaming Markdown Demo</h1>

      <!-- Control panel -->
      <div class="controls">
        <button (click)="startStreaming()">Start Streaming</button>
        <button (click)="stopStreaming()">Stop</button>
        <button (click)="reset()">Reset</button>
      </div>

      <!-- Streaming markdown component -->
      <app-streaming-markdown [stream$]="aiStream$"></app-streaming-markdown>
    </div>
  `
})
export class TestComponent {
  aiStream$ = new Observable<string>();  // Simulate AI API

  startStreaming() {
    // Simulate streaming markdown
    this.aiStream$ = this.mockAIApi.streamMarkdown();
  }
}
```

---

## Part 5: Styling (Tailwind CSS - PC Optimized)

### Styling Architecture Principles

1. **Utility-First** - Use Tailwind utility classes
2. **Semantic class names** - Custom classes for special effects
3. **PC-first** - No mobile responsive needed
4. **Clear visual hierarchy** - Content readability

### Container Styles

```css
/* StreamingMarkdownComponent main container */
.streaming-markdown-container {
  @apply prose prose-slate max-w-none; /* Typography plugin */
  @apply space-y-4; /* Block spacing */
  @apply p-8; /* PC padding */
  @apply text-slate-900; /* Default text color */
  @apply bg-white; /* Background color */
  @apply rounded-lg; /* Border radius */
  @apply shadow-sm; /* Light shadow */
  @apply min-h-[200px]; /* Minimum height */
}

/* Streaming cursor effect */
.streaming-cursor {
  @apply inline-block w-0.5 h-5 bg-slate-900;
  @apply animate-pulse; /* Blink animation */
}
```

### Block Type Styles

```css
/* Paragraph */
.block-paragraph {
  @apply leading-7; /* Comfortable line height */
  @apply text-base; /* Standard font size */
}

/* Headings */
.block-heading {
  @apply font-bold;
  @apply tracking-tight;
}

.block-heading[data-level="1"] { @apply text-3xl mt-8 mb-4; }
.block-heading[data-level="2"] { @apply text-2xl mt-6 mb-3; }
.block-heading[data-level="3"] { @apply text-xl mt-4 mb-2; }

/* Code blocks */
.block-code {
  @apply bg-slate-100;
  @apply rounded-md;
  @apply p-4;
  @apply font-mono;
  @apply text-sm;
  @apply overflow-x-auto; /* Horizontal scroll for long code */
  @apply border border-slate-200;
}

/* Inline code */
code.inline {
  @apply bg-slate-100;
  @apply px-1.5 py-0.5;
  @apply rounded;
  @apply font-mono;
  @apply text-sm;
  @apply text-red-600;
  @apply border border-slate-200;
}

/* Lists */
.block-list {
  @apply ml-6;
  @apply list-disc;
  @apply space-y-1;
}

/* Blockquotes */
.block-blockquote {
  @apply border-l-4 border-slate-300;
  @apply pl-4;
  @apply italic;
  @apply text-slate-600;
}

/* Horizontal rules */
.block-hr {
  @apply border-t border-slate-200;
  @apply my-6;
}

/* HTML blocks */
.html-block {
  @apply bg-amber-50;
  @apply border border-amber-200;
  @apply p-4;
  @apply rounded;
}
```

### Streaming State Styles

```css
/* Streaming block (incomplete) */
.block-streaming {
  @apply opacity-90; /* Slightly transparent, indicating updating */
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // Typography plugin
  ],
};
```

### Style Loading Strategy

1. **Global styles:** `src/styles.css` - Tailwind base
2. **Component styles:** Each component's `styles: []` metadata
3. **Utility classes:** Mainly use Tailwind built-in classes
4. **Custom classes:** Only for special effects like streaming cursor

---

## Part 6: Dependencies and Tool Selection

### Core Dependencies (Need to Install)

```json
{
  "dependencies": {
    // Markdown parsing
    "marked": "^12.0.0",           // Lightweight markdown parser

    // HTML security (prevent XSS)
    "dompurify": "^3.0.0",         // HTML sanitization

    // Block parsing
    "marked": "^12.0.0"            // Already included, used for Lexer
  },
  "devDependencies": {
    // Tailwind CSS and plugins
    "@tailwindcss/typography": "^0.5.10",  // Typography plugin

    // Type definitions
    "@types/dompurify": "^3.0.0"
  }
}
```

### Dependency Selection Rationale

**marked vs unified/remark:**
- ✅ **MVP chooses marked**: Simple, fast, zero configuration
- 📌 Phase 2+ can upgrade to unified/remark ecosystem (stronger plugin support)

**DOMPurify:**
- Essential: Prevent XSS attacks
- User-input markdown may contain malicious scripts

**@tailwindcss/typography:**
- Provides `prose` class, auto-handles article typography
- Avoids writing lots of style classes manually

### Optional Dependencies (Future Phases)

```
Phase 2 (Code Highlighting):
  - shiki or prismjs

Phase 3 (Advanced Features):
  - katex (math)
  - mermaid (diagrams)
  - unified/remark/rehype (more powerful markdown ecosystem)
```

---

## Part 7: Error Handling and Edge Cases

### Error Handling Strategy

```
1. Preprocessor errors
   → Fallback: Use original text
   → Log error to console
   → Don't interrupt streaming rendering

2. BlockParser errors
   → Fallback: Entire content as single paragraph block
   → Show warning UI (optional)

3. Stream errors/disconnection
   → Mark all blocks as complete
   → Stop receiving new data
   → Show error state

4. Markdown format errors
   → Try to fix (preprocessor)
   → If unfixable, display original text
   → Don't crash
```

### Edge Case Handling

```
1. Empty input
   → Display placeholder or empty state

2. Only newlines
   → Ignore, don't create empty blocks

3. Very long lines (no breaks)
   → Code blocks: horizontal scroll
   → Other blocks: normal line wrapping

4. Special characters (HTML tags)
   → Escape or preserve (depending on context)
   → DOMPurify sanitize

5. Nested structures (lists in lists)
   → Recursive processing
   → Maintain indentation

6. Streaming interruption (network errors)
   → Already rendered content preserved
   → Show retry button (optional)
```

---

## Part 8: Testing Strategy

### Testing Layers

```
1. Unit Tests
   → MarkdownPreprocessor: Various incomplete syntax fixes
   → BlockParser: Block splitting for different markdown structures
   → MarkdownFormatterService: markdown → HTML conversion

2. Integration Tests
   → StreamingMarkdownComponent: Complete streaming flow
   → RxJS pipeline: State transition correctness

3. E2E Tests (Optional)
   → TestComponent: User interaction flow
```

### Test Case Examples

```
Preprocessor tests:
  - "**bold" → "**bold**"
  - "`code" → "`code`"
  - "**bold *italic**" → "**bold *italic***"
  - Proper fixing of nested incomplete markers

BlockParser tests:
  - Single paragraph → 1 block
  - Heading + paragraph → 2 blocks
  - Code block → Keep intact
  - List items → Merge into 1 list block

Streaming tests:
  - Simulate AI API streaming
  - Verify incremental block rendering
  - Verify completed blocks don't re-render
```

---

## Part 9: Implementation Steps (High Level)

```
Phase 1: Project Infrastructure
  1. Install dependencies
  2. Configure routes (/test)
  3. Configure Tailwind CSS (Typography plugin)

Phase 2: Core Logic Layer
  1. Implement data models
  2. Implement MarkdownPreprocessor (simplified remend)
  3. Implement BlockParser (based on Marked.js Lexer)

Phase 3: Services and Components
  1. Implement MarkdownFormatterService (marked + DOMPurify)
  2. Implement BlockRendererComponent
  3. Implement StreamingMarkdownComponent (RxJS pipeline)

Phase 4: Test Page
  1. Create TestComponent
  2. Mock AI API streaming
  3. Verify functionality

Phase 5: Optimization and Testing
  1. Performance optimization (OnPush, trackBy)
  2. Unit tests
  3. Integration tests
```

---

## Design Summary

### Core Architecture Decisions

1. ✅ Block-based streaming (block-level streaming rendering)
2. ✅ RxJS + Signals hybrid (stream processing + state management)
3. ✅ Standalone Components (Angular v20+)
4. ✅ OnPush Change Detection (performance optimization)
5. ✅ Tailwind CSS (styling)
6. ✅ marked + DOMPurify (markdown parsing + security)

### MVP Scope (Phase 1)

- ✅ Core streaming engine
- ✅ Basic markdown rendering (bold, italic, headings, lists, code, links)
- ✅ `/test` route test page
- ✅ PC-optimized

### Future Phases

- Phase 2: Code highlighting
- Phase 3: Math + diagrams

---

## Design Principles

1. **YAGNI (You Aren't Gonna Need It)** - Only implement what's needed for MVP
2. **Performance First** - OnPush, trackBy, Signals for fine-grained updates
3. **Security Conscious** - DOMPurify sanitization, XSS prevention
4. **Developer Experience** - Standalone components, clear separation of concerns
5. **Incremental Development** - Phases allow for iterative enhancement

---

## Conclusion

This design provides a robust, performant solution for streaming AI-generated markdown with perfect formatting and smooth UX. The block-based approach ensures completed content never re-renders, while the RxJS + Signals hybrid offers both powerful stream processing and efficient state management.

The MVP focuses on core functionality with a clear path for future enhancements (code highlighting, math, diagrams). The architecture is maintainable, testable, and follows Angular 20+ best practices.
