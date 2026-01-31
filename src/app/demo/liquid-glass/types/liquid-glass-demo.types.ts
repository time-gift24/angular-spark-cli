import { LiquidGlassTheme, LiquidGlassRefractionMode } from '../../../shared/ui/liquid-glass';

/**
 * Liquid Glass 示例配置
 */
export interface LiquidGlassExample {
  /** 示例标题 */
  readonly title: string;
  /** 示例描述 */
  readonly description: string;
  /** 主题类型 */
  readonly theme: LiquidGlassTheme;
  /** 折射模式 */
  readonly mode: LiquidGlassRefractionMode;
  /** 折射强度 */
  readonly displacementScale: number;
  /** 模糊程度 */
  readonly blurAmount: number;
  /** 饱和度 */
  readonly saturation: number;
  /** 弹性系数 */
  readonly elasticity: number;
  /** 色散强度 */
  readonly aberrationIntensity: number;
  /** 自定义圆角 */
  readonly cornerRadius?: string;
  /** 代码示例 */
  readonly code?: string;
}

/**
 * Liquid Glass 演示分区
 */
export interface LiquidGlassDemoSection {
  /** 分区标题 */
  readonly title: string;
  /** 分区描述 */
  readonly description: string;
  /** 示例列表 */
  readonly examples: readonly LiquidGlassExample[];
}
