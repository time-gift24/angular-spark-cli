/**
 * Markdown Thematic Break Component
 *
 * Renders `---` / `***` / `___` as a visual horizontal rule.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { ThematicBreakBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-thematic-break',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hr class="markdown-hr" />`,
  styleUrls: ['./thematic-break.component.css']
})
export class MarkdownThematicBreakComponent {
  readonly block = input.required<ThematicBreakBlock>();
  readonly isComplete = input(true);
}
