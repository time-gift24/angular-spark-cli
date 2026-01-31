/**
 * Panel constraint constants
 *
 * Defines shared constraints for panel sizing and positioning.
 * Used by DragHandleDirective, ResizeHandleDirective, and panel components.
 */
export const PANEL_CONSTRAINTS = {
  /** Minimum panel width in pixels */
  MIN_WIDTH: 300,

  /** Minimum panel height in pixels */
  MIN_HEIGHT: 200,

  /** Maximum panel width as ratio of viewport width (0-1) */
  MAX_WIDTH_RATIO: 0.9,

  /** Maximum panel height as ratio of viewport height (0-1) */
  MAX_HEIGHT_RATIO: 0.7,

  /** Default panel size when created */
  DEFAULT_SIZE: {
    width: 600,
    height: 400,
  },

  /** Default panel position when created */
  DEFAULT_POSITION: {
    x: 0,
    y: 0,
  },
} as const;
