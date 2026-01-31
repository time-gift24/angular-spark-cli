import type { AlertTemplate, AlertUseCase } from '../types/alert-demo.types';

/**
 * 基础提示框示例
 */
export const basicAlerts: AlertTemplate[] = [
  {
    variant: 'default',
    title: '提示信息',
    description: '这是一个默认样式的提示框，用于展示一般信息。',
    icon: 'info',
    category: '基础样式'
  },
  {
    variant: 'destructive',
    title: '错误提示',
    description: '这是一个警告样式的提示框，用于展示错误或危险操作。',
    icon: 'error',
    category: '基础样式'
  }
];

/**
 * 带图标的提示框示例
 */
export const iconAlerts: AlertTemplate[] = [
  {
    variant: 'default',
    title: '成功提示',
    description: '您的更改已成功保存！',
    icon: 'success',
    category: '图标样式'
  },
  {
    variant: 'default',
    title: '警告提示',
    description: '请注意检查您的输入信息，确保所有字段正确。',
    icon: 'warning',
    category: '图标样式'
  },
  {
    variant: 'destructive',
    title: '操作失败',
    description: '无法完成您的请求，请稍后重试。',
    icon: 'error',
    category: '图标样式'
  }
];

/**
 * 实际使用场景示例
 */
export const useCaseAlerts: AlertUseCase[] = [
  {
    name: '表单验证提示',
    description: '在表单提交时验证用户输入',
    alert: {
      variant: 'destructive',
      title: '表单验证失败',
      description: '请检查以下错误：\n• 邮箱格式不正确\n• 密码长度至少8位',
      icon: 'error'
    }
  },
  {
    name: '账户设置提示',
    description: '在设置页面显示重要信息',
    alert: {
      variant: 'default',
      title: '更改将立即生效',
      description: '修改账户设置后，更改将立即应用到您的账户。请确保仔细检查后再保存。',
      icon: 'info'
    },
    inline: true
  },
  {
    name: '支付失败提示',
    description: '支付流程中的错误处理',
    alert: {
      variant: 'destructive',
      title: '支付处理失败',
      description: '无法处理您的支付。请验证您的账单信息并重试。\n\n可能的原因：\n• 卡号输入错误\n• 卡片余额不足\n• 账单地址不匹配',
      icon: 'error',
      showFull: true
    }
  },
  {
    name: '数据保存成功',
    description: '操作成功后的反馈',
    alert: {
      variant: 'default',
      title: '保存成功',
      description: '您的更改已成功保存到系统中。',
      icon: 'success'
    }
  }
];

/**
 * 简洁样式提示框
 */
export const simpleAlerts: AlertTemplate[] = [
  {
    variant: 'default',
    title: '仅标题的提示框',
    description: '',
    icon: 'none',
    category: '简洁样式'
  },
  {
    variant: 'default',
    title: '',
    description: '仅描述内容的提示框，没有标题。',
    icon: 'none',
    category: '简洁样式'
  },
  {
    variant: 'default',
    title: '带图标的无描述提示',
    description: '',
    icon: 'info',
    category: '简洁样式'
  }
];
