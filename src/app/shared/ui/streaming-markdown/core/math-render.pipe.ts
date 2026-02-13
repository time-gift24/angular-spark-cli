import { Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

/**
 * Math Rendering Pipe
 *
 * Safely renders LaTeX/KaTeX expressions to HTML with proper sanitization.
 *
 * SECURITY CONSIDERATIONS:
 * - KaTeX is used with trust: false to prevent arbitrary command execution
 * - All output is sanitized through Angular's DomSanitizer with SecurityContext.HTML
 * - Returns SafeHtml to prevent double-sanitization and ensure innerHTML safety
 * - Cached results store SafeHtml objects to maintain security guarantees
 * - On parsing errors, content is HTML-escaped before rendering
 *
 * @see https://katex.org/docs/options.html#trust - KaTeX trust option documentation
 */
@Pipe({
  name: 'renderMath',
  standalone: true,
  pure: true
})
export class RenderMathPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cache = new Map<string, SafeHtml>();

  transform(expression: string | null | undefined, displayMode: boolean = false): SafeHtml | string {
    const source = typeof expression === 'string' ? expression.trim() : '';
    if (!source) {
      return '';
    }

    const cacheKey = `${displayMode ? 'display' : 'inline'}:${source}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let html = '';
    try {
      html = katex.renderToString(source, {
        displayMode,
        throwOnError: false,
        strict: 'warn',
        trust: false,
        output: 'htmlAndMathml'
      });
    } catch {
      const fallback = this.wrapAsEscapedCode(source);
      this.memoize(cacheKey, fallback);
      return fallback;
    }

    // First sanitize through Angular's HTML security context
    const sanitizedHtml = this.sanitizer.sanitize(SecurityContext.HTML, html);
    if (!sanitizedHtml) {
      const fallback = this.wrapAsEscapedCode(source);
      this.memoize(cacheKey, fallback);
      return fallback;
    }

    // Mark as safe to prevent double-sanitization when used with innerHTML
    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml);
    this.memoize(cacheKey, safeHtml);
    return safeHtml;
  }

  private memoize(key: string, html: SafeHtml | string): void {
    if (this.cache.size > 512) {
      this.cache.clear();
    }
    this.cache.set(key, html);
  }

  private wrapAsEscapedCode(text: string): SafeHtml {
    const escaped = this.escapeHtml(text);
    // Already escaped, mark as safe for innerHTML
    return this.sanitizer.bypassSecurityTrustHtml(`<code>${escaped}</code>`);
  }

  private escapeHtml(text: string): string {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
