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
  StatusBadge,
  BadgeType,
} from '../types/chat.types';

/**
 * AI Chat Panel Component
 * Complete chat interface with fixed position on right side
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
        <!-- Chat Messages Card -->
        <ai-chat-messages-card
          [messages]="messages()"
          [isCollapsed]="isCollapsed()"
          (collapseToggle)="toggleCollapse()"
        />

        <!-- Status Badges -->
        <ai-status-badges
          [badge]="currentBadge()"
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

      /* Responsive */
      @media (max-width: 768px) {
        .input-wrapper {
          bottom: 16px;
          left: 0;
          right: 0;
          transform: none;
          padding: 0 16px;
        }
      }
    `,
  ],
})
export class AiChatPanelComponent {
  private readonly storageService = inject(AiChatStorageService);

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
