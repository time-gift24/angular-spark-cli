import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { ChatMessage } from '@app/shared/models';
import { MessageBubbleComponent } from '../message-bubble';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ai-message-list',
  imports: [CommonModule, MessageBubbleComponent],
  templateUrl: './message-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent implements AfterViewChecked {
  readonly messages = input.required<ChatMessage[]>();
  readonly streamingContent = input('');
  readonly maxHeight = input('calc(100vh - 200px)');

  readonly scrollChange = output<boolean>();

  @ViewChild('scrollContainer', { static: false })
  scrollContainer!: ElementRef<HTMLDivElement>;

  private isNearBottom = true;
  private readonly BOTTOM_THRESHOLD = 100;

  ngAfterViewChecked(): void {
    if (!this.scrollContainer?.nativeElement) return;

    const el = this.scrollContainer.nativeElement;
    const wasNearBottom = this.isNearBottom;

    // Check if near bottom
    this.isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < this.BOTTOM_THRESHOLD;

    // Emit if state changed
    if (wasNearBottom !== this.isNearBottom) {
      this.scrollChange.emit(!this.isNearBottom);
    }

    // Auto-scroll if near bottom
    if (this.isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
