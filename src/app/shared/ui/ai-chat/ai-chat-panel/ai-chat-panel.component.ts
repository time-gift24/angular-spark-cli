/**
 * AI Chat Panel Container Component
 * Main container orchestrating all chat components
 * Mineral & Time Theme - Angular 20+
 */

import {
  Component,
  signal,
  computed,
  output,
  inject,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatMessagesCardComponent } from '../chat-messages-card/chat-messages-card.component';
import { StatusBadgesComponent } from '../status-badges/status-badges.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { SessionToggleComponent } from '../session-toggle-button/session-toggle-button.component';
import { AiChatStorageService } from '../services/ai-chat-storage.service';
import {
  ChatMessage,
  PanelPosition,
  PanelSize,
  StatusBadge,
  DEFAULT_PANEL_POSITION,
  DEFAULT_PANEL_SIZE,
  BadgeType,
} from '../types/chat.types';

/**
 * AI Chat Panel Component
 * Complete floating chat interface with drag/resize/storage
 */
@Component({
  selector: 'ai-chat-panel',
  standalone: true,
  imports: [
    ChatMessagesCardComponent,
    StatusBadgesComponent,
    ChatInputComponent,
    SessionToggleComponent,
  ],
  template: `
    <!-- Session Toggle Button -->
    <ai-session-toggle
      [isOpen]="isPanelOpen()"
      [hasBadge]="hasNotification()"
      (toggle)="togglePanel()"
    />

    <!-- Chat Panel Container -->
    @if (isPanelOpen()) {
      <div class="ai-chat-panel-container">
        <div class="ai-chat-wrapper">
          <!-- Chat Messages Card -->
          <ai-chat-messages-card
            [messages]="messages()"
            [position]="position()"
            [size]="size()"
            [isCollapsed]="isCollapsed()"
            [minSize]="minSize()"
            (positionChange)="onPositionChange($event)"
            (sizeChange)="onSizeChange($event)"
            (dragStart)="onDragStart()"
            (resizeStart)="onResizeStart()"
          />

          <!-- Status Badges -->
          <ai-status-badges
            [badge]="currentBadge()"
            (badgeClick)="toggleCollapse()"
          />

          <!-- Chat Input -->
          <div class="input-wrapper">
            <ai-chat-input
              [value]="inputValue"
              [disabled]="isProcessing()"
              (send)="onSend($event)"
              (fileClick)="onFileClick()"
              (imageClick)="onImageClick()"
              (voiceClick)="onVoiceClick()"
            />
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ai-chat-panel-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        pointer-events: none;
      }

      .ai-chat-wrapper {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: auto;
        transition: all var(--duration-normal) ease;
      }

      .input-wrapper {
        display: flex;
        justify-content: center;
        width: 100%;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .ai-chat-wrapper {
          bottom: 16px;
          left: 8px;
          right: 8px;
          transform: none;
        }
      }
    `,
  ],
})
export class AiChatPanelComponent {
  private readonly storageService = inject(AiChatStorageService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Emit when user sends message
   */
  readonly messageSend = output<string>();

  /**
   * Emit when file upload requested
   */
  readonly fileUpload = output<void>();

  /**
   * Emit when image upload requested
   */
  readonly imageUpload = output<void>();

  /**
   * Emit when voice input requested
   */
  readonly voiceInput = output<void>();

  /**
   * Is panel open
   */
  readonly isPanelOpen = signal(false);

  /**
   * Is card collapsed
   */
  readonly isCollapsed = signal(false);

  /**
   * Panel position
   */
  readonly position = signal<PanelPosition>(DEFAULT_PANEL_POSITION);

  /**
   * Panel size
   */
  readonly size = signal<PanelSize>(DEFAULT_PANEL_SIZE);

  /**
   * Chat messages
   */
  readonly messages = signal<ChatMessage[]>([]);

  /**
   * Current status badge
   */
  readonly currentBadge = signal<StatusBadge | null>(null);

  /**
   * Input value
   */
  inputValue = '';

  /**
   * Is processing (thinking/typing)
   */
  readonly isProcessing = computed(() => {
    const badge = this.currentBadge();
    return badge?.type === 'thinking' || badge?.type === 'typing';
  });

  /**
   * Has notification
   */
  readonly hasNotification = computed(() => this.currentBadge()?.type === 'done');

  /**
   * Minimum panel size
   */
  readonly minSize = computed(() => ({
    width: 300,
    height: 200,
  }));

  constructor() {
    afterNextRender(() => {
      this.loadPreferences();
    });
  }

  /**
   * Load user preferences from storage
   */
  private loadPreferences(): void {
    const preferences = this.storageService.load();
    if (preferences) {
      this.position.set(preferences.position);
      this.size.set(preferences.size);
      this.isCollapsed.set(preferences.isCollapsed);
    }
  }

  /**
   * Toggle panel open/close
   */
  togglePanel(): void {
    const newState = !this.isPanelOpen();
    this.isPanelOpen.set(newState);

    if (newState) {
      // Reset collapse state when opening
      this.isCollapsed.set(false);
    }
  }

  /**
   * Toggle collapse state
   */
  toggleCollapse(): void {
    const newState = !this.isCollapsed();
    this.isCollapsed.set(newState);
    this.storageService.toggleCollapsed();
  }

  /**
   * Handle position change (drag)
   */
  onPositionChange(position: PanelPosition): void {
    this.position.set(position);
    // Don't save on every move - wait for drag end
  }

  /**
   * Handle size change (resize)
   */
  onSizeChange(size: PanelSize): void {
    this.size.set(size);
    // Don't save on every resize - wait for resize end
  }

  /**
   * Handle drag start
   */
  onDragStart(): void {
    // Drag has started, will save on end
  }

  /**
   * Handle resize start
   */
  onResizeStart(): void {
    // Resize has started, will save on end
  }

  /**
   * Send message
   */
  onSend(message: string): void {
    this.messageSend.emit(message);

    // Add user message
    this.addMessage({
      id: this.generateId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    // Show thinking badge
    this.setBadge('thinking', 'Thinking...');
  }

  /**
   * Add message to chat
   */
  addMessage(message: ChatMessage): void {
    this.messages.set([...this.messages(), message]);
  }

  /**
   * Set current status badge
   */
  setBadge(type: BadgeType, text?: string): void {
    this.currentBadge.set({
      id: this.generateId(),
      type,
      text,
    });
  }

  /**
   * Clear current badge
   */
  clearBadge(): void {
    this.currentBadge.set(null);
  }

  /**
   * Handle file click
   */
  onFileClick(): void {
    this.fileUpload.emit();
  }

  /**
   * Handle image click
   */
  onImageClick(): void {
    this.imageUpload.emit();
  }

  /**
   * Handle voice click
   */
  onVoiceClick(): void {
    this.voiceInput.emit();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
