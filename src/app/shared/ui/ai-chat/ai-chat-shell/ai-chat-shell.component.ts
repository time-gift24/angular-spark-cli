import {
  Component,
  computed,
  inject,
  signal,
  computed as computedFn,
  ElementRef,
  ViewChild,
  AfterViewInit,
  DestroyRef,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AiChatStateService } from '../services';
import { SessionStateService } from '@app/shared/services';
import { AiChatPanelComponent } from '../ai-chat-panel';
import { SessionChatContainerComponent } from '../session-chat-container';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog';

const PANEL_MIN_WIDTH = 300;
const PANEL_MAX_WIDTH = 800;

@Component({
  selector: 'ai-chat-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AiChatPanelComponent,
    SessionChatContainerComponent,
    DeleteConfirmDialogComponent,
  ],
  templateUrl: './ai-chat-shell.component.html',
})
export class AiChatShellComponent implements AfterViewInit {
  private chatState = inject(AiChatStateService);
  private sessionState = inject(SessionStateService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('mainContent', { static: true })
  private mainContentRef!: ElementRef<HTMLElement>;

  private resizeObserver: ResizeObserver | null = null;

  // Track main content bounds for positioning calculations
  readonly mainContentRect = signal<{ left: number; width: number }>({
    left: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  });

  // Wrap ComputedSignal as Signal for compatibility
  readonly panelOpen = computedFn(() => this.chatState.panelOpen());
  readonly panelWidth = computedFn(() => this.chatState.panelWidth());
  readonly panelPreviewWidth = signal<number | null>(null);

  // Effective panel width (preview takes precedence)
  readonly effectivePanelWidth = computed(() => {
    const width = this.panelPreviewWidth() ?? this.panelWidth();
    return this.clampPanelWidth(width);
  });

  // Calculate session container position in pixels (center of main content area)
  readonly sessionContainerLeftPx = computed(() => {
    const rect = this.mainContentRect();
    const width = rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    const left = rect.width ? rect.left : 0;
    return left + width / 2;
  });

  // Calculate session container width in pixels (40% of main content area)
  readonly sessionContainerWidthPx = computed(() => {
    const rect = this.mainContentRect();
    const width = rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    return width * 0.4;
  });

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const updateBounds = () => this.updateMainBounds();
    updateBounds();

    window.addEventListener('resize', updateBounds);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => updateBounds());
      this.resizeObserver.observe(this.mainContentRef.nativeElement);
    }

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', updateBounds);
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    });
  }

  // Connect SessionState to AiChatState
  readonly sessions = this.sessionState.sessions;
  readonly activeSessionId = this.sessionState.activeSessionId;
  readonly activeSession = this.sessionState.activeSession;
  readonly currentInputValue = this.sessionState.activeInputValue;

  // Delete dialog state
  readonly deleteDialogOpen = signal(false);
  readonly sessionToDelete = signal<string | null>(null);
  readonly sessionToDeleteName = computed(() => {
    const id = this.sessionToDelete();
    return id ? this.sessions().get(id)?.name ?? '' : '';
  });

  // Event handlers
  onNewChat(): void {
    this.sessionState.createSession();
    this.chatState.openPanel();
  }

  onSessionSelect(sessionId: string): void {
    this.sessionState.switchSession(sessionId);
    if (!this.panelOpen()) {
      this.chatState.openPanel();
    }
  }

  onSessionToggle(): void {
    this.panelPreviewWidth.set(null);
    this.chatState.togglePanel();
  }

  onSend(message: string): void {
    const sessionId = this.activeSessionId();
    if (sessionId) {
      this.sessionState.addMessage(sessionId, {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: Date.now()
      });
      // TODO: Send to AI service
    }
  }

  onInputChange(value: string): void {
    this.sessionState.updateInputValue(value);
  }

  onRename(data: { sessionId: string; name: string }): void {
    this.sessionState.renameSession(data.sessionId, data.name);
  }

  onDelete(sessionId: string): void {
    const session = this.sessions().get(sessionId);
    if (session) {
      this.sessionToDelete.set(sessionId);
      this.deleteDialogOpen.set(true);
    }
  }

  onConfirmDelete(): void {
    const sessionId = this.sessionToDelete();
    if (sessionId) {
      this.sessionState.deleteSession(sessionId);
      if (!this.activeSession()) {
        this.chatState.closePanel();
      }
    }
    this.deleteDialogOpen.set(false);
    this.sessionToDelete.set(null);
  }

  onCancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.sessionToDelete.set(null);
  }

  onClosePanel(): void {
    this.panelPreviewWidth.set(null);
    this.chatState.closePanel();
  }

  onResizePreview(width: number): void {
    if (!Number.isFinite(width)) return;
    this.panelPreviewWidth.set(this.clampPanelWidth(width));
  }

  onResizeCommit(width: number): void {
    if (!Number.isFinite(width)) return;
    this.panelPreviewWidth.set(null);
    this.chatState.setPanelWidth(width);
  }

  private updateMainBounds(): void {
    const el = this.mainContentRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.mainContentRect.set({ left: rect.left, width: rect.width });
  }

  private clampPanelWidth(width: number): number {
    return Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, width));
  }

  onSessionColorChange(event: { sessionId: string; color: string }): void {
    this.sessionState.updateSessionColor(event.sessionId, event.color);
  }
}
