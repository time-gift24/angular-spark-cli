/**
 * Shini Highlighter - Domain Types and Interfaces
 *
 * This module defines all TypeScript types and interfaces for integrating
 * Shini (VSCode's syntax highlighter) with the streaming markdown component.
 *
 * Phase 1, Task 1.1: Define Core Interfaces
 */

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
  initialize(): Promise<void>;

  /**
   * Highlight code with syntax highlighting
   * Async operation using Shiki's codeToHtml
   *
   * @param code - Raw code string to highlight
   * @param language - Programming language identifier (e.g., 'typescript', 'python')
   * @param theme - Theme name ('light' or 'dark')
   * @returns HTML string with syntax highlighting, or escaped plain text as fallback
   */
  highlight(code: string, language: string, theme: 'light' | 'dark'): Promise<string>;

  /**
   * Check if Shini is ready for highlighting
   *
   * @returns true if initialization completed successfully
   */
  isReady(): boolean;
}

/**
 * Initialization state for Shini highlighter
 */
export interface ShiniInitializationState {
  /** Whether initialization has completed */
  initialized: boolean;

  /** Whether initialization succeeded */
  success: boolean;

  /** Error message if initialization failed */
  error?: string;

  /** Number of languages loaded */
  languagesLoaded: number;

  /** Themes loaded */
  themesLoaded: string[];
}

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
  | 'text';

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
} as const;

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
] as const;

/**
 * Theme identifier for Shini highlighting
 */
export type ShiniTheme = 'light' | 'dark';

/**
 * Shini theme configuration mapping
 */
export const SHINI_THEME_MAP: Readonly<Record<ShiniTheme, string>> = {
  'light': 'github-light',
  'dark': 'dark-plus'
} as const;

/**
 * Result of a code highlighting operation
 * Contains both the HTML output and metadata about the operation
 */
export interface HighlightResult {
  /** Highlighted HTML string with token classes */
  html: string;

  /** Whether highlighting succeeded */
  success: boolean;

  /** Language identifier used for highlighting */
  language: string;

  /** Theme name used for highlighting */
  theme: string;

  /** Error message if highlighting failed */
  error?: string;

  /** Whether result is fallback (plain text) rather than actual highlighting */
  isFallback: boolean;
}

/**
 * Fallback highlight result for when Shini is unavailable
 * Provides HTML-escaped plain text as a safe fallback
 */
export interface FallbackHighlightResult extends HighlightResult {
  /** Always true for fallback results */
  isFallback: true;

  /** Reason for fallback (e.g., 'not_initialized', 'unsupported_language') */
  fallbackReason: 'not_initialized' | 'unsupported_language' | 'highlight_error';

  /** HTML-escaped plain text */
  html: string;
}
