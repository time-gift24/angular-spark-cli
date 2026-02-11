import { Injectable, signal, Signal } from '@angular/core'
import { codeToTokensBase, type ThemedToken } from 'shiki'
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
 * Map common aliases and normalize unknown streaming language values.
 */
const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  js: 'javascript',
  cjs: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  yml: 'yaml',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  csharp: 'c#',
  'c++': 'cpp',
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
    if (this.initPromise) {
      return this.initPromise
    }

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
      const shikiLanguage = this.normalizeLanguage(language)
      const tokenLines: ThemedToken[][] = await codeToTokensBase(code, {
        lang: shikiLanguage as any,
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
      // Streaming can temporarily produce malformed/unknown language identifiers.
      // Fallback to plain text without noisy error logs.
      return this.plainTextFallback(code)
    }
  }

  private normalizeLanguage(language: string): string {
    const normalized = (language || '').trim().toLowerCase()
    if (!normalized) {
      return 'text'
    }

    const firstToken = normalized.split(/[\s|,:;]+/)[0] || ''
    const cleaned = firstToken.replace(/[^a-z0-9+#._-]/g, '')
    if (!cleaned) {
      return 'text'
    }

    return LANGUAGE_ALIAS_MAP[cleaned] || cleaned
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
