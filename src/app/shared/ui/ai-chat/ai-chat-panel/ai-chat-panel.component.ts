import { Component, Input, Signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionData, ChatMessage } from '@app/shared/models';
import { PanelHeaderComponent } from '../panel-header';
import { MessageBubbleComponent } from '../message-bubble';
import { ResizeHandleComponent } from '../resize-handle';
import { StreamingMarkdownComponent } from '@app/shared/components/streaming-markdown';
import { of } from 'rxjs';

@Component({
  selector: 'ai-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    PanelHeaderComponent,
    MessageBubbleComponent,
    ResizeHandleComponent,
    StreamingMarkdownComponent,
  ],
  templateUrl: './ai-chat-panel.component.html',
})
export class AiChatPanelComponent {
  @Input({ required: true }) activeSession!: Signal<SessionData | null | undefined>;
  @Input() streamingContent = '';
  @Input() previewWidth: number | null = null;
  @Input() panelWidth = 500;

  @Output() rename = new EventEmitter<{ sessionId: string; name: string }>();
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() resizeCommit = new EventEmitter<number>();

  protected readonly sessionName = computed(() => this.activeSession()?.name ?? '');
  protected readonly messages = computed(() => this.activeSession()?.messages ?? []);
  protected readonly sessionId = computed(() => this.activeSession()?.id ?? '');
  protected readonly of = of;

  onRename(newName: string): void {
    const id = this.sessionId();
    if (id) {
      this.rename.emit({ sessionId: id, name: newName });
    }
  }

  onDelete(): void {
    const id = this.sessionId();
    if (id) {
      this.delete.emit(id);
    }
  }
}
