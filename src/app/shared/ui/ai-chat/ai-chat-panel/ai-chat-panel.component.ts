import { Component, Input, Signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionData } from '@app/shared/models';
import { PanelHeaderComponent } from '../panel-header';
import { MessageBubbleComponent } from '../message-bubble';
import { ResizeHandleComponent } from '../resize-handle';
import { StreamingMarkdownComponent } from '@app/shared/components/streaming-markdown';
import { of, Observable } from 'rxjs';

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
  @Input() streamingContent: Observable<string> | string | null = null;
  @Input() previewWidth: number | null = null;
  @Input() panelWidth = 500;

  @Output() rename = new EventEmitter<{ sessionId: string; name: string }>();
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() resizePreview = new EventEmitter<number>();
  @Output() resizeCommit = new EventEmitter<number>();

  protected readonly sessionName = computed(() => this.activeSession()?.name ?? '');
  protected readonly messages = computed(() => this.activeSession()?.messages ?? []);
  protected readonly sessionId = computed(() => this.activeSession()?.id ?? '');
  protected readonly of = of;

  /** Get the streaming observable for the streaming-content section */
  protected getStreamingStream(): Observable<string> | undefined {
    const content = this.streamingContent;
    if (content instanceof Observable) {
      return content;
    }
    if (typeof content === 'string') {
      return of(content);
    }
    return undefined;
  }

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

  onResizePreview(width: number): void {
    this.resizePreview.emit(width);
  }

  onResizeCommit(width: number): void {
    this.resizeCommit.emit(width);
  }
}
