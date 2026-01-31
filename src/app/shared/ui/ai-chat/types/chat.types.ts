/**
 * AI Chat Panel Type Definitions
 * Mineral & Time Theme - Angular 20+
 */

import { ModelSignal } from '@angular/core';

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message interface
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  actions?: MessageAction[];
}

/**
 * Message action button (in AI responses)
 */
export interface MessageAction {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
}

/**
 * Badge type for status indicators
 */
export type BadgeType = 'thinking' | 'typing' | 'done' | 'error';

/**
 * Badge data
 */
export interface StatusBadge {
  id: string;
  type: BadgeType;
  text?: string;
}

/**
 * Panel position
 */
export interface PanelPosition {
  x: number;
  y: number;
}

/**
 * Panel size
 */
export interface PanelSize {
  width: number;
  height: number;
}

/**
 * User preferences for AI chat panel
 */
export interface AiChatPanelPreferences {
  position: PanelPosition;
  size: PanelSize;
  isCollapsed: boolean;
  sessionId: string;
}

/**
 * Panel state interface
 */
export interface AiChatPanelState {
  isCollapsed: boolean;
  isDragging: boolean;
  isResizing: boolean;
  position: PanelPosition;
  size: PanelSize;
  messages: ChatMessage[];
  currentBadge: StatusBadge | null;
  inputValue: string;
  isInputFocused: boolean;
}

/**
 * Drag state
 */
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialPosition: PanelPosition;
}

/**
 * Resize state
 */
export interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  initialSize: PanelSize;
}

/**
 * Local storage key
 */
export const AI_CHAT_STORAGE_KEY = 'ai-chat-panel-preferences';

/**
 * Default panel position (bottom center)
 */
export const DEFAULT_PANEL_POSITION: PanelPosition = {
  x: window.innerWidth / 2 - 300, // Center horizontally
  y: window.innerHeight - 500,    // 500px from bottom
};

/**
 * Default panel size
 */
export const DEFAULT_PANEL_SIZE: PanelSize = {
  width: 600,
  height: 400,
};

/**
 * Minimum panel size
 */
export const MIN_PANEL_SIZE: PanelSize = {
  width: 300,
  height: 200,
};

/**
 * Maximum panel size (responsive)
 */
export const MAX_PANEL_SIZE: PanelSize = {
  width: Math.min(900, window.innerWidth * 0.9),
  height: Math.min(700, window.innerHeight * 0.7),
};
