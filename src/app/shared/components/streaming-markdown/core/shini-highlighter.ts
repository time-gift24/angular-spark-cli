import { Injectable, signal, Signal } from '@angular/core'
import { codeToHtml } from 'shiki'
import {
  IShiniHighlighter,
  ShiniInitializationState,
  PRELOAD_LANGUAGES,
  SHINI_THEME_MAP
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

  /**
   * Promise that resolves when initialization completes
   */
  private initPromise: Promise<void> | null = null

  constructor() {
    this.state = this._state.asReadonly()
  }

  /**
   * Initialize Shini WASM and preload languages
   *
   * @returns Promise that resolves when initialization completes
   *
   * @remarks
   * Lazy initialization implementation - runs asynchronously in background.
   * Preloads common languages and themes for optimal performance.
   */
  async initialize(): Promise<void> {
    // Store the promise for whenReady()
    this.initPromise = (async () => {
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
    })()

    return this.initPromise
  }

  /**
   * Load Shini WASM module
   *
   * @returns Promise that resolves to Shiki instance
   *
   * @remarks
   * Initializes real Shiki WASM for syntax highlighting.
   * Preloads the WASM module by triggering an initial highlight.
   */
  private async loadShikiWasm(): Promise<any> {
    try {
      console.log('[ShiniHighlighter] Loading Shiki WASM...')

      // Preload Shiki WASM by triggering an initial highlight
      // This initializes the WASM module and loads bundled languages
      await codeToHtml('console.log("test")', {
        lang: 'javascript',
        theme: 'github-light'
      })

      console.log('[ShiniHighlighter] Shiki loaded successfully')

      // Return object that mimics the Shini interface
      // Shiki bundles all languages, so loadLanguage is a no-op
      return {
        loadLanguage: async (lang: string) => {
          console.log(`[ShiniHighlighter] Language requested: ${lang}`)
          // Languages are already bundled, just log for debugging
          return Promise.resolve()
        },
        loadTheme: async (theme: string) => {
          console.log(`[ShiniHighlighter] Theme requested: ${theme}`)
          // Themes are loaded on-demand by codeToHtml
          return Promise.resolve()
        },
        codeToHtml: codeToHtml
      }
    } catch (error) {
      console.error('[ShiniHighlighter] Failed to load Shiki:', error)
      throw error
    }
  }

  /**
   * Highlight code with syntax highlighting
   *
   * @param code - Raw code string to highlight
   * @param language - Programming language identifier (e.g., 'typescript', 'python')
   * @param theme - Theme name ('light' or 'dark')
   * @returns HTML string with syntax highlighting, or original code as fallback
   *
   * @remarks
   * Uses Shiki's codeToHtml for actual syntax highlighting.
   * Falls back to original code if Shiki is not ready or highlighting fails.
   */
  async highlight(
    code: string,
    language: string,
    theme: 'light' | 'dark'
  ): Promise<string> {
    console.log(`[ShiniHighlighter] highlight() called with:`, {
      language,
      theme,
      codeLength: code.length,
      isReady: this.isReady(),
      state: this.state()
    });

    if (!this.isReady()) {
      console.warn('[ShiniHighlighter] Not ready, returning plain code');
      return code;
    }

    try {
      console.log(`[ShiniHighlighter] About to call codeToHtml for ${language}`);

      // Map theme names to Shiki theme identifiers
      const themeMap = {
        'light': 'github-light',
        'dark': 'dark-plus'
      };

      // Split code into lines
      const lines = code.split('\n');

      // Highlight each line individually
      const highlightedLines = await Promise.all(
        lines.map(async (line) => {
          const html = await codeToHtml(line || ' ', { // Use space for empty lines
            lang: language,
            theme: themeMap[theme]
          });
          // Remove <pre> wrapper from each line
          return html.replace(/^<pre[^>]*><code>(.*)<\/code><\/pre>$/, '$1');
        })
      );

      // Build final HTML with line numbers
      const linesHtml = highlightedLines.map((highlightedLine, index) => {
        const lineNum = index + 1;
        const originalLine = lines[index];
        const isEmpty = !originalLine.trim();

        // For empty lines, use just &nbsp; without any highlighted HTML
        const lineContent = isEmpty ? '&nbsp;' : highlightedLine;

        // Important: No newlines or spaces in template string to avoid text nodes
        return `<div class="line"><span class="line-number">${lineNum}</span>${lineContent}</div>`;
      }).join('\n');

      return linesHtml;
    } catch (error) {
      console.error('[ShiniHighlighter] Highlighting failed:', error);
      return code;
    }
  }

  /**
   * Check if Shini is ready for highlighting
   *
   * @returns true if initialization completed successfully
   */
  isReady(): boolean {
    return this.state().initialized && this.state().success
  }

  /**
   * Wait for Shini to be ready
   * Returns a promise that resolves when Shini is initialized successfully
   * If already ready, resolves immediately
   *
   * @returns Promise that resolves when Shini is ready
   */
  async whenReady(): Promise<void> {
    // If already ready, return immediately
    if (this.isReady()) {
      return
    }

    // If initialization was never called, call it
    if (!this.initPromise) {
      await this.initialize()
      return
    }

    // Wait for existing initialization to complete
    await this.initPromise

    // If initialization failed, throw error
    if (!this.isReady()) {
      throw new Error('Shini initialization failed')
    }
  }
}
