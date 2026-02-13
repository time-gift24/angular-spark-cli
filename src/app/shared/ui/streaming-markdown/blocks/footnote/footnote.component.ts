/**
 * Markdown Footnote Component
 *
 * Renders footnote definitions as an ordered list at the bottom of the document.
 * Each footnote has an anchor ID for back-referencing from footnote refs.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { FootnoteDefBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-footnote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="footnotes-section">
      <hr class="footnotes-separator" />
      <ol class="footnotes-list">
        @for (entry of entries(); track entry.id) {
          <li [id]="'fn-' + entry.id" class="footnote-item">
            <span class="footnote-content">{{ entry.text }}</span>
            <a [href]="'#fnref-' + entry.id" class="footnote-backref" title="Back to reference">\u21A9</a>
          </li>
        }
      </ol>
    </section>
  `,
  styleUrls: ['./footnote.component.css']
})
export class MarkdownFootnoteComponent {
  readonly block = input.required<FootnoteDefBlock>();
  readonly isComplete = input(true);

  protected readonly entries = computed(() => {
    const footnoteDefs = this.block().footnoteDefs;
    if (!footnoteDefs) {
      return [];
    }
    const result: { id: string; text: string }[] = [];
    footnoteDefs.forEach((text, id) => {
      result.push({ id, text });
    });
    return result;
  });
}
