import { Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import katex from 'katex';

@Pipe({
  name: 'renderMath',
  standalone: true,
  pure: true
})
export class RenderMathPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cache = new Map<string, string>();

  transform(expression: string | null | undefined, displayMode: boolean = false): string {
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

    const sanitizedHtml = this.sanitizer.sanitize(SecurityContext.HTML, html);
    if (!sanitizedHtml) {
      const fallback = this.wrapAsEscapedCode(source);
      this.memoize(cacheKey, fallback);
      return fallback;
    }

    this.memoize(cacheKey, sanitizedHtml);
    return sanitizedHtml;
  }

  private memoize(key: string, html: string): void {
    if (this.cache.size > 512) {
      this.cache.clear();
    }
    this.cache.set(key, html);
  }

  private wrapAsEscapedCode(text: string): string {
    return `<code>${this.escapeHtml(text)}</code>`;
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
