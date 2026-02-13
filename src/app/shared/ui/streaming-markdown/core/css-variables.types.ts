/**
 * CSS Variables System
 *
 * This module defines the CSS variable system for code blocks,
 * integrating with the "矿物与时光" (Mineral & Time) design system.
 *
 * Phase 5, Task 5.1: Define CSS Variable Names
 */

/**
 * CSS variable names for code block styling
 * All variables use CSS custom property syntax (--variable-name)
 */
export const CODE_CSS_VARIABLES = {
  // Code block container
  CODE_BACKGROUND: '--code-background',
  CODE_FOREGROUND: '--code-foreground',

  // Code decorations
  CODE_BORDER: '--code-border',
  CODE_LINE_NUMBER: '--code-line-number',

  // Code toolbar
  CODE_TOOLBAR_BG: '--code-toolbar-bg',
  CODE_LANGUAGE_TAG: '--code-language-tag',

  // Copy button states
  CODE_COPY_HOVER: '--code-copy-hover',
  CODE_COPY_ACTIVE: '--code-copy-active',
} as const;

/**
 * Phase 5, Task 5.2: Define Shini Token Mappings
 */

/**
 * Mapping from Shini token classes to CSS variables
 * Connects Shini's output classes to project design tokens
 */
export const SHINI_TOKEN_MAPPING = {
  TOKEN_KEYWORD: 'color: var(--primary);',
  TOKEN_STRING: 'color: var(--accent);',
  TOKEN_COMMENT: 'color: var(--muted-foreground); opacity: 0.7;',
  TOKEN_FUNCTION: 'color: var(--foreground);',
  TOKEN_NUMBER: 'color: var(--accent);',
  TOKEN_OPERATOR: 'color: var(--foreground);',
  TOKEN_CLASS: 'color: var(--primary);',
  TOKEN_VARIABLE: 'color: var(--foreground);',
  TOKEN_PARAMETER: 'color: var(--foreground);',
  TOKEN_PROPERTY: 'color: var(--foreground);',
  TOKEN_TAG: 'color: var(--primary);',
  TOKEN_ATTRIBUTE: 'color: var(--accent);',
  TOKEN_PUNCTUATION: 'color: var(--muted-foreground);',
} as const;

/**
 * Shini token class names
 * Corresponds to token types emitted by Shini
 */
export type ShiniTokenClass =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'function'
  | 'number'
  | 'operator'
  | 'class-name'
  | 'variable'
  | 'parameter'
  | 'property'
  | 'tag'
  | 'attribute'
  | 'punctuation';

/**
 * Phase 5, Task 5.3: Define CSS Variable Values (Light Mode)
 */

/**
 * CSS variable values for light mode
 * Based on "矿物与时光" light theme
 */
export const LIGHT_MODE_VALUES = {
  CODE_BACKGROUND: 'oklch(0.95 0.01 85)', // Muted background
  CODE_FOREGROUND: 'oklch(0.28 0.03 185)', // Deep gray
  CODE_BORDER: 'var(--border)', // Deep silk yellow
  CODE_LINE_NUMBER: 'var(--muted-foreground)', // Muted text
  CODE_TOOLBAR_BG: 'oklch(0.95 0.015 85)', // Light silk
  CODE_LANGUAGE_TAG: 'var(--primary)', // Malachite (石绿)
  CODE_COPY_HOVER: 'var(--accent)', // Gold (泥金)
  CODE_COPY_ACTIVE: 'var(--primary)', // Malachite (石绿)
} as const;

/**
 * Phase 5, Task 5.4: Define CSS Variable Values (Dark Mode)
 */

/**
 * CSS variable values for dark mode
 * Based on "矿物与时光" dark theme
 */
export const DARK_MODE_VALUES = {
  CODE_BACKGROUND: 'oklch(0.25 0.04 230)', // Dark Qing variant
  CODE_FOREGROUND: 'oklch(0.94 0.015 85)', // Light silk yellow
  CODE_BORDER: 'oklch(0.35 0.04 230 / 50%)', // Semi-transparent Qing
  CODE_LINE_NUMBER: 'oklch(0.60 0.03 230)', // Light Qing variant
  CODE_TOOLBAR_BG: 'oklch(0.30 0.04 230)', // Dark Qing
  CODE_LANGUAGE_TAG: 'oklch(0.62 0.08 195)', // Light Malachite
  CODE_COPY_HOVER: 'oklch(0.75 0.14 75)', // Bright Gold
  CODE_COPY_ACTIVE: 'oklch(0.62 0.08 195)', // Light Malachite
} as const;

/**
 * Phase 5, Task 5.5: Define CSS Injection Types
 */

/**
 * CSS rule for injection into component styles
 */
export interface CssRule {
  /** Selector (e.g., '.token.keyword') */
  selector: string;

  /** CSS declarations */
  declarations: string;
}

/**
 * CSS stylesheet for code highlighting
 * Complete set of rules to inject
 */
export interface CodeHighlightStylesheet {
  /** Shini token rules */
  tokenRules: CssRule[];

  /** Code block container rules */
  containerRules: CssRule[];

  /** Toolbar rules */
  toolbarRules: CssRule[];

  /** Line number rules */
  lineNumberRules: CssRule[];

  /** Dark mode overrides */
  darkModeOverrides: CssRule[];
}

/**
 * Phase 5, Task 5.6: Define Dynamic CSS Utilities
 */

/**
 * CSS variable setter options
 */
export interface CssVariableSetterOptions {
  /** Target element (default: document.documentElement) */
  target?: HTMLElement;

  /** Whether to use !important flag */
  important?: boolean;
}

/**
 * CSS variable utility functions interface
 */
export interface ICssVariableUtils {
  /**
   * Set a CSS variable value.
   * @param name - Variable name (e.g., '--code-background')
   * @param value - CSS value
   * @param options - Optional settings
   */
  setVariable(name: string, value: string, options?: CssVariableSetterOptions): void;

  /**
   * Get a CSS variable value.
   * @param name - Variable name
   * @param target - Target element (default: document.documentElement)
   * @returns Current value or empty string if not set
   */
  getVariable(name: string, target?: HTMLElement): string;

  /**
   * Set all code block CSS variables for a theme.
   * @param theme - 'light' or 'dark'
   * @param options - Optional settings
   */
  setCodeThemeVariables(
    theme: 'light' | 'dark',
    options?: CssVariableSetterOptions
  ): void;
}
