/**
 * Input 示例配置类型
 */
export interface InputTemplate {
  /** 输入框类型 */
  type: 'text' | 'password' | 'email' | 'number' | 'url' | 'tel' | 'search' | 'date';
  /** 占位符文本 */
  placeholder: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否无效 */
  invalid?: boolean;
  /** 默认值 */
  value?: string;
  /** 描述 */
  description?: string;
}

/**
 * 表单字段类型
 */
export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
}

/**
 * 输入框事件统计
 */
export interface InputStats {
  /** 输入次数 */
  inputCount: number;
  /** 最后输入值 */
  lastValue: string;
  /** 最后更新时间 */
  lastUpdateTime: Date | null;
}
