import { Injectable, signal, Signal } from '@angular/core'
import { codeToHtml, codeToTokensBase, type ThemedToken } from 'shiki'
import {
  IShiniHighlighter,
  ShiniInitializationState,
  PRELOAD_LANGUAGES,
  SHINI_THEME_MAP
} from './shini-types'
import { CodeLine, SyntaxToken } from './models'

/** Map app theme names to Shiki theme identifiers */
const THEME_MAP: Record<string, string> = {
  'light': 'github-light',
  'dark': 'dark-plus'
}

/**
 * Shini highlighter service implementation
 * Manages Shini WASM instance for code highlighting
 */
@Injectable({ providedIn: 'root' })
export class ShiniHighlighter implements IShiniHighlighter {
  readonly state: Signal<ShiniInitializationState>

  private _state = signal<ShiniInitializationState>({
    initialized: false,
    success: false,
    languagesLoaded: 0,
    themesLoaded: []
  })

  private initPromise: Promise<void> | null = null

  constructor() {
    this.state = this._state.asReadonly()
  }

  async initialize(): Promise<void> {
    this.initPromise = (async () => {
      try {
        const shiki = await this.loadShikiWasm()

        for (const lang of PRELOAD_LANGUAGES) {
          await shiki.loadLanguage(lang)
        }

        await shiki.loadTheme(SHINI_THEME_MAP.light)
        await shiki.loadTheme(SHINI_THEME_MAP.dark)

        this._state.set({
          initialized: true,
          success: true,
          languagesLoaded: PRELOAD_LANGUAGES.length,
          themesLoaded: [SHINI_THEME_MAP.light, SHINI_THEME_MAP.dark]
        })
      } catch (error) {
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

  private async loadShikiWasm(): Promise<any> {
    try {
      // Preload Shiki WASM by triggering an initial tokenization
      await codeToTokensBase('console.log("test")', {
        lang: 'javascript',
        theme: 'github-light'
      })

      return {
        loadLanguage: async (_lang: string) => Promise.resolve(),
        loadTheme: async (_theme: string) => Promise.resolve(),
      }
    } catch (error) {
      console.error('[ShiniHighlighter] Failed to load Shiki:', error)
      throw error
    }
  }

  /**
   * Highlight code and return structured token lines.
   * This is the primary API — no innerHTML needed.
   */
  async highlightToTokens(
    code: string,
    language: string,
    theme: 'light' | 'dark'
  ): Promise<CodeLine[]> {
    if (!this.isReady()) {
      return this.plainTextFallback(code)
    }

    try {
      const shikiTheme = THEME_MAP[theme] || THEME_MAP['light']
      const tokenLines: ThemedToken[][] = await codeToTokensBase(code, {
        lang: language as any,
        theme: shikiTheme as any
      })

      return tokenLines.map((lineTokens, index) => ({
        lineNumber: index + 1,
        tokens: lineTokens.map((token): SyntaxToken => ({
          content: token.content,
          color: token.color || undefined,
          fontStyle: token.fontStyle || undefined
        }))
      }))
    } catch (error) {
      console.error('[ShiniHighlighter] Token highlighting failed:', error)
      return this.plainTextFallback(code)
    }
  }

  /**
   * Plain text fallback when highlighting is unavailable or fails.
   */
  plainTextFallback(code: string): CodeLine[] {
    return code.split('\n').map((line, index) => ({
      lineNumber: index + 1,
      tokens: [{ content: line || ' ' }]
    }))
  }

  /**
   * @deprecated Use highlightToTokens() instead. Will be removed in next major version.
   */
  async highlight(
    code: string,
    language: string,
    theme: 'light' | 'dark'
  ): Promise<string> {
    if (!this.isReady()) {
      return code
    }

    try {
      const shikiTheme = THEME_MAP[theme] || THEME_MAP['light']
      const lines = code.split('\n')

      const highlightedLines = await Promise.all(
        lines.map(async (line) => {
          const html = await codeToHtml(line || ' ', {
            lang: language,
            theme: shikiTheme
          })
          return html.replace(/^<pre[^>]*><code>(.*)<\/code><\/pre>$/, '$1')
        })
      )

      return highlightedLines.map((highlightedLine, index) => {
        const lineNum = index + 1
        const originalLine = lines[index]
        const isEmpty = !originalLine.trim()
        const lineContent = isEmpty ? '&nbsp;' : highlightedLine
        return `<span class="code-line"><span class="line-number">${lineNum}</span><span class="line-content">${lineContent}</span></span>`
      }).join('')
    } catch (error) {
      console.error('[ShiniHighlighter] Highlighting failed:', error)
      return code
    }
  }

  isReady(): boolean {
    return this.state().initialized && this.state().success
  }

  async whenReady(): Promise<void> {
    if (this.isReady()) {
      return
    }

    if (!this.initPromise) {
      await this.initialize()
      return
    }

    await this.initPromise

    if (!this.isReady()) {
      throw new Error('Shini initialization failed')
    }
  }
}
