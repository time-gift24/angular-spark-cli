import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionData } from '@app/shared/models';
import { PanelHeaderComponent } from '../panel-header';
import { MessageBubbleComponent } from '../message-bubble';
import { ResizeHandleComponent } from '../resize-handle';
import { StreamingMarkdownComponent } from '@app/shared/ui/streaming-markdown';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'ai-chat-panel',
  imports: [
    CommonModule,
    PanelHeaderComponent,
    MessageBubbleComponent,
    ResizeHandleComponent,
    StreamingMarkdownComponent,
  ],
  templateUrl: './ai-chat-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatPanelComponent {
  readonly activeSession = input.required<Signal<SessionData | null | undefined>>();
  readonly streamingContent = input<Observable<string> | string | null>(null);
  readonly previewWidth = input<number | null>(null);
  readonly panelWidth = input(500);

  readonly rename = output<{ sessionId: string; name: string }>();
  readonly delete = output<string>();
  readonly close = output<void>();
  readonly resizePreview = output<number>();
  readonly resizeCommit = output<number>();

  protected readonly sessionName = computed(() => this.activeSession()()?.name ?? '');
  protected readonly messages = computed(() => this.activeSession()()?.messages ?? []);
  protected readonly sessionId = computed(() => this.activeSession()()?.id ?? '');
  protected readonly of = of;

  /** Get the streaming observable for the streaming-content section */
  protected getStreamingStream(): Observable<string> | undefined {
    const content = this.streamingContent();
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
