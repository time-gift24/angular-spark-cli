/**
 * Card state for EnhancedChatMessagesCard
 *
 * Persists position, size, and window state (minimized/maximized)
 * for each session's chat messages card.
 */
export interface CardState {
  /**
   * Card position in pixels
   */
  position: {
    x: number;
    y: number;
  };

  /**
   * Card size in pixels
   */
  size: {
    width: number;
    height: number;
  };

  /**
   * Whether card is minimized (collapsed to title bar only)
   */
  minimized: boolean;

  /**
   * Whether card is maximized (fills available space)
   */
  maximized: boolean;

  /**
   * Previous state before maximize/minimize (for restore)
   */
  previousState?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    minimized: boolean;
  };
}

/**
 * Default card state
 */
export const DEFAULT_CARD_STATE: CardState = {
  position: { x: 0, y: 0 },  // Will be calculated based on viewport
  size: { width: 600, height: 500 },
  minimized: false,
  maximized: false,
};
