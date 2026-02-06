# Streaming Markdown Plugin Architecture Refactor - Progress

## Overview
Refactor streaming-markdown from hardcoded @switch routing to Registry + NgComponentOutlet plugin architecture, and replace innerHTML-based code highlighting with token-based rendering.

## Progress Tracker

| Step | Description | Status |
|------|-------------|--------|
| 1 | Define plugin interfaces & DI tokens (`core/plugin.ts`, `core/provide-streaming-markdown.ts`) | done |
| 2 | Create builtin plugin (`plugins/builtin-plugin.ts`) | done |
| 3a | Migrate heading component to BlockRenderer interface | done |
| 3b | Migrate paragraph component to BlockRenderer interface | done |
| 3c | Migrate code component to BlockRenderer interface | done |
| 3d | Migrate list component to BlockRenderer interface | done |
| 3e | Migrate blockquote component to BlockRenderer interface | done |
| 4a | Update `core/models.ts` - SyntaxToken, CodeLine | done |
| 4b | Update `core/shini-highlighter.ts` - add highlightToTokens() | done |
| 4c | Rewrite code component template (token-based, no innerHTML) | done |
| 4d | Update code component CSS (remove ::ng-deep, add .italic/.bold) | done |
| 5 | Rewrite block-router with NgComponentOutlet + Registry | done |
| 6a | Update `app.config.ts` with provideStreamingMarkdown() | done |
| 6b | Update `core/block-parser.ts` - remove providedIn: 'root' | done |
| 6c | Update `core/index.ts` - add new exports | done |
| 7 | Cleanup: remove old interfaces, deprecated methods, DomSanitizer | done |
| 8 | Build verification (`ng build`) | done |
| 9 | Update spec files for new BlockRenderer interface | done |
| 10 | Fix angular.json test config (add buildTarget) | done |

## File Change Map

| Action | File | Step |
|--------|------|------|
| NEW | `core/plugin.ts` | 1 |
| NEW | `core/provide-streaming-markdown.ts` | 1 |
| NEW | `plugins/builtin-plugin.ts` | 2 |
| MODIFY | `core/models.ts` | 4a |
| MODIFY | `core/shini-highlighter.ts` | 4b |
| MODIFY | `core/block-parser.ts` | 6b |
| MODIFY | `core/index.ts` | 6c |
| MODIFY | `blocks/block-router/block-router.component.ts` | 5 |
| MODIFY | `blocks/block-router/block-router.component.spec.ts` | 9 |
| MODIFY | `blocks/heading/heading.component.ts` | 3a |
| MODIFY | `blocks/heading/heading.component.spec.ts` | 9 |
| MODIFY | `blocks/paragraph/paragraph.component.ts` | 3b |
| MODIFY | `blocks/paragraph/paragraph.component.spec.ts` | 9 |
| MODIFY | `blocks/code/code.component.ts` | 3c, 4c |
| MODIFY | `blocks/code/code.component.css` | 4d |
| MODIFY | `blocks/code/code.component.spec.ts` | 9 |
| MODIFY | `blocks/list/list.component.ts` | 3d |
| MODIFY | `blocks/list/list.component.spec.ts` | 9 |
| MODIFY | `blocks/blockquote/blockquote.component.ts` | 3e |
| MODIFY | `blocks/blockquote/blockquote.component.spec.ts` | 9 |
| MODIFY | `streaming-markdown.component.css` | 7 |
| MODIFY | `app.config.ts` | 6a |
| MODIFY | `angular.json` | 10 |
| DELETE | `core/component-interfaces.ts` | 7 |

## Verification Results

- `ng build`: passes (no errors, only pre-existing budget warnings)
- `innerHTML` in component .ts files: none (only in comments)
- `DomSanitizer` in component .ts files: none (only in comments)
- `ViewEncapsulation.None`: fully removed
- `@switch` in block-router: fully removed, replaced with NgComponentOutlet
- `::ng-deep` in code.component.css: fully removed
- Plugin registry: working via `provideStreamingMarkdown(builtinPlugin())` in app.config.ts
- All spec files: updated to use `block`/`isComplete` interface
