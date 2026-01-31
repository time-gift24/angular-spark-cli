/**
 * AI Chat Panel Storage Service
 * Handles persistent storage of user preferences
 * Mineral & Time Theme - Angular 20+
 */

import { inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  AiChatPanelPreferences,
  PanelPosition,
  PanelSize,
  DEFAULT_PANEL_POSITION,
  DEFAULT_PANEL_SIZE,
  MIN_PANEL_SIZE,
  AI_CHAT_STORAGE_KEY,
} from '../types/chat.types';

/**
 * Storage service for AI chat panel preferences
 * Uses localStorage with automatic save/load
 */
@Injectable({ providedIn: 'root' })
export class AiChatStorageService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = this.document.defaultView?.localStorage;

  /**
   * Current preferences signal (reactive)
   */
  readonly preferences = signal<AiChatPanelPreferences | null>(null);

  /**
   * Load preferences from localStorage
   * @returns Preferences object or null if not found
   */
  load(): AiChatPanelPreferences | null {
    if (!this.storage) {
      console.warn('[AiChatStorage] localStorage not available');
      return null;
    }

    try {
      const data = this.storage.getItem(AI_CHAT_STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data) as AiChatPanelPreferences;

      // Validate and sanitize values
      const sanitized = this.sanitizePreferences(parsed);
      this.preferences.set(sanitized);

      return sanitized;
    } catch (error) {
      console.error('[AiChatStorage] Failed to load preferences:', error);
      return null;
    }
  }

  /**
   * Save preferences to localStorage
   * @param preferences - Preferences to save
   */
  save(preferences: AiChatPanelPreferences): void {
    if (!this.storage) {
      console.warn('[AiChatStorage] localStorage not available');
      return;
    }

    try {
      const sanitized = this.sanitizePreferences(preferences);
      this.storage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(sanitized));
      this.preferences.set(sanitized);
    } catch (error) {
      console.error('[AiChatStorage] Failed to save preferences:', error);
    }
  }

  /**
   * Update specific preference fields
   * @param updates - Partial preferences to update
   */
  update(updates: Partial<AiChatPanelPreferences>): void {
    const current = this.preferences() || this.getDefaultPreferences();
    const updated = { ...current, ...updates };
    this.save(updated);
  }

  /**
   * Save position only
   * @param position - New position
   */
  savePosition(position: PanelPosition): void {
    const current = this.preferences() || this.getDefaultPreferences();
    this.save({ ...current, position });
  }

  /**
   * Save size only
   * @param size - New size
   */
  saveSize(size: PanelSize): void {
    const current = this.preferences() || this.getDefaultPreferences();
    this.save({ ...current, size });
  }

  /**
   * Toggle collapsed state
   */
  toggleCollapsed(): void {
    const current = this.preferences() || this.getDefaultPreferences();
    this.save({ ...current, isCollapsed: !current.isCollapsed });
  }

  /**
   * Set current session ID
   * @param sessionId - Session identifier
   */
  setSessionId(sessionId: string): void {
    const current = this.preferences() || this.getDefaultPreferences();
    this.save({ ...current, sessionId });
  }

  /**
   * Clear all preferences
   */
  clear(): void {
    if (!this.storage) return;

    try {
      this.storage.removeItem(AI_CHAT_STORAGE_KEY);
      this.preferences.set(null);
    } catch (error) {
      console.error('[AiChatStorage] Failed to clear preferences:', error);
    }
  }

  /**
   * Get default preferences
   * @returns Default preferences object
   */
  private getDefaultPreferences(): AiChatPanelPreferences {
    return {
      position: DEFAULT_PANEL_POSITION,
      size: DEFAULT_PANEL_SIZE,
      isCollapsed: false,
      sessionId: this.generateSessionId(),
    };
  }

  /**
   * Sanitize and validate preferences
   * Ensures values are within acceptable ranges
   * @param preferences - Preferences to sanitize
   * @returns Sanitized preferences
   */
  private sanitizePreferences(preferences: AiChatPanelPreferences): AiChatPanelPreferences {
    const windowWidth = this.document.defaultView?.innerWidth || 1200;
    const windowHeight = this.document.defaultView?.innerHeight || 800;

    // Sanitize position (keep within viewport)
    const maxX = windowWidth - 100;
    const maxY = windowHeight - 100;

    const position: PanelPosition = {
      x: Math.max(0, Math.min(maxX, preferences.position.x)),
      y: Math.max(0, Math.min(maxY, preferences.position.y)),
    };

    // Sanitize size (respect min/max constraints)
    const maxSize = {
      width: Math.min(900, windowWidth * 0.9),
      height: Math.min(700, windowHeight * 0.7),
    };

    const size: PanelSize = {
      width: Math.max(MIN_PANEL_SIZE.width, Math.min(maxSize.width, preferences.size.width)),
      height: Math.max(MIN_PANEL_SIZE.height, Math.min(maxSize.height, preferences.size.height)),
    };

    return {
      position,
      size,
      isCollapsed: Boolean(preferences.isCollapsed),
      sessionId: preferences.sessionId || this.generateSessionId(),
    };
  }

  /**
   * Generate unique session ID
   * @returns Session identifier
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
