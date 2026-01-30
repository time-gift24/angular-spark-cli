import { type ButtonVariant, type ButtonSize } from '@app/shared/ui/button';

/**
 * 按钮示例配置类型
 */
export interface ComponentTemplate {
  /** 按钮显示文本 */
  label: string;
  /** 按钮变体类型 */
  variant?: ButtonVariant | undefined;
  /** 按钮尺寸 */
  size?: ButtonSize | undefined;
  /** 是否禁用 */
  disabled?: boolean | undefined;
  /** 图标名称 */
  icon?: string | undefined;
  /** 按钮描述 */
  description?: string | undefined;
}

/**
 * 按钮点击事件统计
 */
export interface ButtonClickStats {
  /** 点击次数 */
  count: number;
  /** 最后点击时间 */
  lastClickTime: Date | null;
}

/**
 * 示例分组类型
 */
export interface ExampleGroup {
  /** 分组标题 */
  title: string;
  /** 分组描述 */
  description?: string;
  /** 示例列表 */
  examples: ComponentTemplate[];
}
