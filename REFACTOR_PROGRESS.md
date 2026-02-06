# Streaming Markdown Plugin Architecture Refactor - Progress

## Overview
Refactor streaming-markdown from hardcoded @switch routing to Registry + NgComponentOutlet plugin architecture, and replace innerHTML-based code highlighting with token-based rendering.

## Progress Tracker

| Step | Description | Status |
|------|-------------|--------|
| 1 | Define plugin interfaces & DI tokens (`core/plugin.ts`, `core/provide-streaming-markdown.ts`) | pending |
| 2 | Create builtin plugin (`plugins/builtin-plugin.ts`) | pending |
| 3a | Migrate heading component to BlockRenderer interface | pending |
| 3b | Migrate paragraph component to BlockRenderer interface | pending |
| 3c | Migrate code component to BlockRenderer interface | pending |
| 3d | Migrate list component to BlockRenderer interface | pending |
| 3e | Migrate blockquote component to BlockRenderer interface | pending |
| 4a | Update `core/models.ts` - SyntaxToken, CodeLine | pending |
| 4b | Update `core/shini-highlighter.ts` - add highlightToTokens() | pending |
| 4c | Rewrite code component template (token-based, no innerHTML) | pending |
| 4d | Update code component CSS (remove ::ng-deep, add .italic/.bold) | pending |
| 5 | Rewrite block-router with NgComponentOutlet + Registry | pending |
| 6a | Update `app.config.ts` with provideStreamingMarkdown() | pending |
| 6b | Update `core/block-parser.ts` - remove providedIn: 'root' | pending |
| 6c | Update `core/index.ts` - add new exports | pending |
| 7 | Cleanup: remove old interfaces, deprecated methods, DomSanitizer | pending |
| 8 | Build verification (`ng build`) | pending |

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
| MODIFY | `blocks/heading/heading.component.ts` | 3a |
| MODIFY | `blocks/paragraph/paragraph.component.ts` | 3b |
| MODIFY | `blocks/code/code.component.ts` | 3c, 4c |
| MODIFY | `blocks/code/code.component.css` | 4d |
| MODIFY | `blocks/list/list.component.ts` | 3d |
| MODIFY | `blocks/blockquote/blockquote.component.ts` | 3e |
| MODIFY | `app.config.ts` | 6a |
| DELETE (content) | `core/component-interfaces.ts` | 7 |
