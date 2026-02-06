/**
 * Markdown Thematic Break Component
 *
 * Renders `---` / `***` / `___` as a visual horizontal rule.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MarkdownBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-thematic-break',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hr class="markdown-hr" />`,
  styleUrls: ['./thematic-break.component.css']
})
export class MarkdownThematicBreakComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;
}
