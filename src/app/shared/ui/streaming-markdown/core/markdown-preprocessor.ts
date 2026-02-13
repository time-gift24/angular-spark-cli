/**
 * Markdown Preprocessor Service
 *
 * Handler-based architecture aligned with remend for self-healing syntax correction.
 * Each handler has a priority and processes text independently, with code-block
 * awareness to avoid corrupting fenced content.
 *
 * @module StreamingMarkdown.Core
 */

import { Injectable } from '@angular/core';

/**
 * Represents a detected markdown marker with its position and closure state
 */
export interface MarkerMatch {
  marker: string;
  startIndex: number;
  endIndex: number;
  isClosed: boolean;
}

export type MarkerType =
  | 'code_block'
  | 'math_block'
  | 'link'
  | 'bold'
  | 'italic'
  | 'strikethrough';

export interface MarkerRule {
  type: MarkerType;
  opening: string;
  closing: string;
  priority: number;
}

export const MARKER_RULES: readonly MarkerRule[] = [
  { type: 'code_block', opening: '```', closing: '```', priority: 0 },
  { type: 'math_block', opening: '$$', closing: '$$', priority: 10 },
  { type: 'link', opening: '[', closing: ']', priority: 100 },
  { type: 'bold', opening: '**', closing: '**', priority: 200 },
  { type: 'italic', opening: '*', closing: '*', priority: 300 },
  { type: 'strikethrough', opening: '~~', closing: '~~', priority: 400 },
] as const;

export interface IMarkerDetector {
  detectUnclosedMarkers(text: string): MarkerMatch[];
  closeMarkers(text: string, matches: MarkerMatch[]): string;
}

export interface IMarkdownPreprocessor {
  process(text: string): string;
}

/** A single preprocessing handler with a priority */
interface PreprocessorHandler {
  name: string;
  priority: number;
  handle: (text: string, codeBlockRanges: [number, number][]) => string;
}

/**
 * Finds all code block ranges (``` ... ```) in text.
 * Returns array of [start, end] index pairs.
 */
function findCodeBlockRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const fence = '```';
  let pos = 0;
  while (pos < text.length) {
    const openIdx = text.indexOf(fence, pos);
    if (openIdx === -1) break;
    // Find end of opening fence line
    const lineEnd = text.indexOf('\n', openIdx);
    const searchFrom = lineEnd === -1 ? openIdx + fence.length : lineEnd + 1;
    const closeIdx = text.indexOf(fence, searchFrom);
    if (closeIdx === -1) {
      // Unclosed code block — everything from openIdx to end is "inside"
      ranges.push([openIdx, text.length]);
      break;
    }
    ranges.push([openIdx, closeIdx + fence.length]);
    pos = closeIdx + fence.length;
  }
  return ranges;
}

/** Check if a position is inside any code block range */
function isWithinCodeBlock(pos: number, ranges: [number, number][]): boolean {
  for (const [start, end] of ranges) {
    if (pos >= start && pos < end) return true;
  }
  return false;
}

// ─── Handlers ────────────────────────────────────────────────

/** Priority 0: Prevent setext heading misparse — `---` after a paragraph line */
function sextetHeadingHandler(text: string, _ranges: [number, number][]): string {
  // If text ends with a line that is only dashes (potential setext heading marker)
  // and the previous line has content, the parser may interpret it as an h2.
  // We only intervene if the `---` line is at the very end and looks incomplete.
  // This is a lightweight guard — only triggers on trailing `---` without a blank line before.
  // Note: ranges parameter is unused but kept for interface consistency
  const lines = text.split('\n');
  if (lines.length < 2) return text;
  const lastLine = lines[lines.length - 1];
  if (/^-{3,}\s*$/.test(lastLine)) {
    const prevLine = lines[lines.length - 2];
    // If previous line is non-empty text (not a heading, not blank), this could be
    // misinterpreted as setext heading. Insert a blank line to force thematic break.
    if (prevLine.trim().length > 0 && !/^#{1,6}\s/.test(prevLine) && !/^[-*_]{3,}\s*$/.test(prevLine)) {
      lines.splice(lines.length - 1, 0, '');
      return lines.join('\n');
    }
  }
  return text;
}

/** Priority 10: Fix incomplete links — `[text](url` → `[text](url)` */
function incompleteLinkHandler(text: string, ranges: [number, number][]): string {
  // Match `[...](url` where url is not closed with `)`
  return text.replace(/\[([^\]]*)\]\(([^)\s]*?)$/gm, (match, linkText, url, offset) => {
    if (isWithinCodeBlock(offset, ranges)) return match;
    return `[${linkText}](${url})`;
  });
}

/** Priority 11: Fix incomplete images — `![alt](url` → remove or close */
function incompleteImageHandler(text: string, ranges: [number, number][]): string {
  return text.replace(/!\[([^\]]*)\]\(([^)\s]*?)$/gm, (match, alt, url, offset) => {
    if (isWithinCodeBlock(offset, ranges)) return match;
    if (url.length > 0) {
      return `![${alt}](${url})`;
    }
    // No URL yet — remove the incomplete image syntax
    return '';
  });
}

/** Priority 20: Fix unclosed bold-italic `***text` → `***text***` */
function boldItalicHandler(text: string, ranges: [number, number][]): string {
  const marker = '***';
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf(marker, pos);
    if (openIdx === -1) break;
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + marker.length;
      continue;
    }
    const closeIdx = result.indexOf(marker, openIdx + marker.length);
    if (closeIdx === -1) {
      // Unclosed bold-italic at end
      result = result + marker;
      break;
    }
    pos = closeIdx + marker.length;
  }
  return result;
}

/** Priority 30: Fix unclosed bold `**text` → `**text**` */
function boldHandler(text: string, ranges: [number, number][]): string {
  const marker = '**';
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf(marker, pos);
    if (openIdx === -1) break;
    // Skip if this is actually *** (bold-italic)
    if (result[openIdx + 2] === '*' || (openIdx > 0 && result[openIdx - 1] === '*')) {
      pos = openIdx + marker.length;
      continue;
    }
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + marker.length;
      continue;
    }
    const closeIdx = result.indexOf(marker, openIdx + marker.length);
    if (closeIdx === -1) {
      result = result + marker;
      break;
    }
    pos = closeIdx + marker.length;
  }
  return result;
}

/** Priority 40: Fix unclosed italic with `__text` → `__text__` */
function italicUnderscoreDoubleHandler(text: string, ranges: [number, number][]): string {
  const marker = '__';
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf(marker, pos);
    if (openIdx === -1) break;
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + marker.length;
      continue;
    }
    const closeIdx = result.indexOf(marker, openIdx + marker.length);
    if (closeIdx === -1) {
      result = result + marker;
      break;
    }
    pos = closeIdx + marker.length;
  }
  return result;
}

/** Priority 41: Fix unclosed italic with `*text` → `*text*` */
function italicAsteriskHandler(text: string, ranges: [number, number][]): string {
  const marker = '*';
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf(marker, pos);
    if (openIdx === -1) break;
    // Skip ** and ***
    if (result[openIdx + 1] === '*') {
      pos = openIdx + 2;
      if (result[openIdx + 2] === '*') pos++;
      continue;
    }
    if (openIdx > 0 && result[openIdx - 1] === '*') {
      pos = openIdx + 1;
      continue;
    }
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + marker.length;
      continue;
    }
    const closeIdx = result.indexOf(marker, openIdx + marker.length);
    if (closeIdx === -1) {
      result = result + marker;
      break;
    }
    // Skip if close is part of ** or ***
    if (result[closeIdx + 1] === '*' || (closeIdx > 0 && result[closeIdx - 1] === '*')) {
      pos = closeIdx + 1;
      continue;
    }
    pos = closeIdx + marker.length;
  }
  return result;
}

/** Priority 42: Fix unclosed italic with `_text` → `_text_` */
function italicUnderscoreHandler(text: string, ranges: [number, number][]): string {
  const marker = '_';
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf(marker, pos);
    if (openIdx === -1) break;
    // Skip __
    if (result[openIdx + 1] === '_') {
      pos = openIdx + 2;
      continue;
    }
    if (openIdx > 0 && result[openIdx - 1] === '_') {
      pos = openIdx + 1;
      continue;
    }
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + marker.length;
      continue;
    }
    const closeIdx = result.indexOf(marker, openIdx + marker.length);
    if (closeIdx === -1) {
      result = result + marker;
      break;
    }
    if (result[closeIdx + 1] === '_' || (closeIdx > 0 && result[closeIdx - 1] === '_')) {
      pos = closeIdx + 1;
      continue;
    }
    pos = closeIdx + marker.length;
  }
  return result;
}

/** Priority 50: Fix unclosed inline code `` `code `` → `` `code` `` */
function inlineCodeHandler(text: string, ranges: [number, number][]): string {
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf('`', pos);
    if (openIdx === -1) break;
    // Skip ``` (code block fences)
    if (result[openIdx + 1] === '`' && result[openIdx + 2] === '`') {
      pos = openIdx + 3;
      continue;
    }
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + 1;
      continue;
    }
    const closeIdx = result.indexOf('`', openIdx + 1);
    if (closeIdx === -1) {
      result = result + '`';
      break;
    }
    // Skip ``` at close
    if (result[closeIdx + 1] === '`' && result[closeIdx + 2] === '`') {
      pos = closeIdx + 3;
      continue;
    }
    pos = closeIdx + 1;
  }
  return result;
}

/** Priority 60: Fix unclosed strikethrough `~~text` → `~~text~~` */
function strikethroughHandler(text: string, ranges: [number, number][]): string {
  const marker = '~~';
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf(marker, pos);
    if (openIdx === -1) break;
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + marker.length;
      continue;
    }
    const closeIdx = result.indexOf(marker, openIdx + marker.length);
    if (closeIdx === -1) {
      result = result + marker;
      break;
    }
    pos = closeIdx + marker.length;
  }
  return result;
}

/** Priority 70: Fix unclosed block math `$$equation` → `$$equation$$` */
function blockMathHandler(text: string, ranges: [number, number][]): string {
  const marker = '$$';
  let pos = 0;
  let result = text;
  while (pos < result.length) {
    const openIdx = result.indexOf(marker, pos);
    if (openIdx === -1) break;
    if (isWithinCodeBlock(openIdx, ranges)) {
      pos = openIdx + marker.length;
      continue;
    }
    const closeIdx = result.indexOf(marker, openIdx + marker.length);
    if (closeIdx === -1) {
      const needsNewline = !result.endsWith('\n');
      result = result + (needsNewline ? '\n' : '') + marker;
      break;
    }
    pos = closeIdx + marker.length;
  }
  return result;
}

/** Priority 80: Fix unclosed code blocks ``` → close with newline + ``` */
function codeBlockHandler(text: string, _ranges: [number, number][]): string {
  // Note: ranges parameter is unused because this handler counts fences independently
  const fence = '```';
  let count = 0;
  let pos = 0;
  while (pos < text.length) {
    const idx = text.indexOf(fence, pos);
    if (idx === -1) break;
    count++;
    pos = idx + fence.length;
  }
  if (count % 2 !== 0) {
    const needsNewline = !text.endsWith('\n');
    return text + (needsNewline ? '\n' : '') + fence;
  }
  return text;
}

// ─── Built-in handlers sorted by priority ────────────────────

const BUILTIN_HANDLERS: PreprocessorHandler[] = [
  { name: 'setext-heading', priority: 0, handle: sextetHeadingHandler },
  { name: 'incomplete-link', priority: 10, handle: incompleteLinkHandler },
  { name: 'incomplete-image', priority: 11, handle: incompleteImageHandler },
  { name: 'bold-italic', priority: 20, handle: boldItalicHandler },
  { name: 'bold', priority: 30, handle: boldHandler },
  { name: 'italic-underscore-double', priority: 40, handle: italicUnderscoreDoubleHandler },
  { name: 'italic-asterisk', priority: 41, handle: italicAsteriskHandler },
  { name: 'italic-underscore', priority: 42, handle: italicUnderscoreHandler },
  { name: 'inline-code', priority: 50, handle: inlineCodeHandler },
  { name: 'strikethrough', priority: 60, handle: strikethroughHandler },
  { name: 'block-math', priority: 70, handle: blockMathHandler },
  { name: 'code-block', priority: 80, handle: codeBlockHandler },
].sort((a, b) => a.priority - b.priority);

/**
 * Implementation of the Markdown Preprocessor Service
 *
 * Uses a handler-based pipeline aligned with remend.
 * Each handler runs in priority order, with code-block awareness.
 */
@Injectable({ providedIn: 'root' })
export class MarkdownPreprocessor implements IMarkdownPreprocessor {
  private handlers: PreprocessorHandler[] = [...BUILTIN_HANDLERS];

  process(text: string): string {
    if (!text || text.length === 0) {
      return text;
    }

    // Compute ranges ONCE before the handler loop
    const ranges = findCodeBlockRanges(text);

    let result = text;
    for (const handler of this.handlers) {
      result = handler.handle(result, ranges);
    }
    return result;
  }
}
