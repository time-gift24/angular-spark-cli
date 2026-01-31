/**
 * Alert 示例配置类型
 */
export interface AlertTemplate {
  /** 提示框类型 */
  variant: 'default' | 'destructive';
  /** 标题 */
  title: string;
  /** 描述内容 */
  description: string;
  /** 图标名称 */
  icon?: 'info' | 'success' | 'warning' | 'error' | 'none';
  /** 是否显示完整示例 */
  showFull?: boolean;
  /** 分类标签 */
  category?: string;
}

/**
 * Alert 使用场景类型
 */
export interface AlertUseCase {
  /** 场景名称 */
  name: string;
  /** 场景描述 */
  description: string;
  /** 提示框配置 */
  alert: AlertTemplate;
  /** 是否显示内联 */
  inline?: boolean;
}
