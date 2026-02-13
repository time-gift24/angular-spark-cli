/**
 * Streaming Markdown - Marked.js Token Types
 *
 * Type-safe definitions for marked.js token structure.
 * These types represent the tokens produced by marked.lexer() and used throughout
 * the block parser and inline parser.
 */

/**
 * Base interface for all marked tokens.
 */
export interface MarkedTokenBase {
  type: string;
  raw?: string;
  text?: string;
}

/**
 * Marked.js inline token types - used within block tokens
 */
export interface MarkedInlineToken {
  type: string;
  raw?: string;
  text?: string;
  href?: string;
  title?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Strong (bold) inline token
 */
export interface MarkedStrongToken extends MarkedInlineToken {
  type: 'strong';
  text?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Emphasis (italic) inline token
 */
export interface MarkedEmToken extends MarkedInlineToken {
  type: 'em';
  text?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Strikethrough inline token
 */
export interface MarkedDelToken extends MarkedInlineToken {
  type: 'del';
  text?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Codespan inline token
 */
export interface MarkedCodespanToken extends MarkedInlineToken {
  type: 'codespan';
  text?: string;
}

/**
 * Link inline token
 */
export interface MarkedLinkToken extends MarkedInlineToken {
  type: 'link';
  href?: string;
  title?: string;
  text?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Image inline token
 */
export interface MarkedImageToken extends MarkedInlineToken {
  type: 'image';
  href?: string;
  title?: string;
  text?: string;
}

/**
 * Line break inline token
 */
export interface MarkedBrToken extends MarkedInlineToken {
  type: 'br';
}

/**
 * HTML inline token
 */
export interface MarkedHtmlInlineToken extends MarkedInlineToken {
  type: 'html';
  raw?: string;
  text?: string;
}

/**
 * Text inline token
 */
export interface MarkedTextToken extends MarkedInlineToken {
  type: 'text';
  text?: string;
  raw?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Union type for all marked inline tokens
 */
export type MarkedAnyInlineToken =
  | MarkedStrongToken
  | MarkedEmToken
  | MarkedDelToken
  | MarkedCodespanToken
  | MarkedLinkToken
  | MarkedImageToken
  | MarkedBrToken
  | MarkedHtmlInlineToken
  | MarkedTextToken;

/**
 * Heading block token
 */
export interface MarkedHeadingToken extends MarkedTokenBase {
  type: 'heading';
  depth: number;
  text?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Paragraph block token
 */
export interface MarkedParagraphToken extends MarkedTokenBase {
  type: 'paragraph';
  text?: string;
  tokens?: MarkedInlineToken[];
  raw?: string;
}

/**
 * Code block token
 */
export interface MarkedCodeToken extends MarkedTokenBase {
  type: 'code';
  text?: string;
  lang?: string;
  raw?: string;
}

/**
 * List item token (nested within list)
 */
export interface MarkedListItemToken {
  type?: 'list_item';
  text?: string;
  tokens?: MarkedToken[];
  task?: boolean;
  checked?: boolean;
  loose?: boolean;
}

/**
 * List block token
 */
export interface MarkedListToken extends MarkedTokenBase {
  type: 'list';
  ordered: boolean;
  start?: number;
  items: MarkedListItemToken[];
  raw?: string;
}

/**
 * Blockquote block token
 */
export interface MarkedBlockquoteToken extends MarkedTokenBase {
  type: 'blockquote';
  tokens?: MarkedToken[];
  text?: string;
  raw?: string;
}

/**
 * Horizontal rule block token
 */
export interface MarkedHrToken extends MarkedTokenBase {
  type: 'hr';
  raw?: string;
}

/**
 * Space block token
 */
export interface MarkedSpaceToken extends MarkedTokenBase {
  type: 'space';
  raw?: string;
}

/**
 * HTML block token
 */
export interface MarkedHtmlBlockToken extends MarkedTokenBase {
  type: 'html';
  raw?: string;
  text?: string;
  pre?: boolean;
}

/**
 * Table cell token
 */
export interface MarkedTableCellToken {
  text?: string;
  tokens?: MarkedInlineToken[];
}

/**
 * Table block token
 */
export interface MarkedTableToken extends MarkedTokenBase {
  type: 'table';
  header: MarkedTableCellToken[];
  rows: MarkedTableCellToken[][];
  align: ('left' | 'center' | 'right' | null)[];
}

/**
 * Union type for all marked block tokens
 */
export type MarkedToken =
  | MarkedHeadingToken
  | MarkedParagraphToken
  | MarkedCodeToken
  | MarkedListToken
  | MarkedBlockquoteToken
  | MarkedHrToken
  | MarkedSpaceToken
  | MarkedHtmlBlockToken
  | MarkedTableToken
  | MarkedTokenBase;

/**
 * Type guard to check if a token is a heading token
 */
export function isMarkedHeadingToken(token: MarkedToken): token is MarkedHeadingToken {
  return token.type === 'heading';
}

/**
 * Type guard to check if a token is a paragraph token
 */
export function isMarkedParagraphToken(token: MarkedToken): token is MarkedParagraphToken {
  return token.type === 'paragraph';
}

/**
 * Type guard to check if a token is a code token
 */
export function isMarkedCodeToken(token: MarkedToken): token is MarkedCodeToken {
  return token.type === 'code';
}

/**
 * Type guard to check if a token is a list token
 */
export function isMarkedListToken(token: MarkedToken): token is MarkedListToken {
  return token.type === 'list';
}

/**
 * Type guard to check if a token is a blockquote token
 */
export function isMarkedBlockquoteToken(token: MarkedToken): token is MarkedBlockquoteToken {
  return token.type === 'blockquote';
}

/**
 * Type guard to check if a token is an HTML block token
 */
export function isMarkedHtmlBlockToken(token: MarkedToken): token is MarkedHtmlBlockToken {
  return token.type === 'html';
}

/**
 * Type guard to check if a token is a table token
 */
export function isMarkedTableToken(token: MarkedToken): token is MarkedTableToken {
  return token.type === 'table';
}
