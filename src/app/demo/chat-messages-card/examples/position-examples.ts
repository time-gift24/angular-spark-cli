import { PanelPosition, PanelSize } from '../../../shared/models';

/**
 * 面板位置示例
 */
export const positionExamples: Record<string, PanelPosition> = {
  // 居中位置
  centered: {
    x: (window.innerWidth - 500) / 2,
    y: (window.innerHeight - 400) / 2,
  },

  // 左上角
  topLeft: {
    x: 20,
    y: 80,
  },

  // 右上角
  topRight: {
    x: window.innerWidth - 520,
    y: 80,
  },

  // 左下角
  bottomLeft: {
    x: 20,
    y: window.innerHeight - 420,
  },

  // 右下角
  bottomRight: {
    x: window.innerWidth - 520,
    y: window.innerHeight - 420,
  },
};

/**
 * 面板尺寸示例
 */
export const sizeExamples: Record<string, PanelSize> = {
  // 小尺寸
  small: {
    width: 350,
    height: 300,
  },

  // 中等尺寸（默认）
  medium: {
    width: 500,
    height: 400,
  },

  // 大尺寸
  large: {
    width: 700,
    height: 550,
  },

  // 宽屏
  wide: {
    width: 900,
    height: 400,
  },

  // 窄高
  narrow: {
    width: 400,
    height: 600,
  },
};
