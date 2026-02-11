import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

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
      html = `<code>${this.escapeHtml(source)}</code>`;
    }

    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    if (this.cache.size > 512) {
      this.cache.clear();
    }
    this.cache.set(cacheKey, safeHtml);
    return safeHtml;
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
