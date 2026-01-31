import type { InputTemplate, FormField } from '../types/input-demo.types';

/**
 * 基础输入框示例
 */
export const basicInputs: InputTemplate[] = [
  {
    type: 'text',
    placeholder: '请输入用户名',
    description: '标准文本输入框'
  },
  {
    type: 'email',
    placeholder: 'example@email.com',
    description: '邮箱输入框'
  },
  {
    type: 'password',
    placeholder: '请输入密码',
    description: '密码输入框'
  },
  {
    type: 'number',
    placeholder: '请输入数字',
    description: '数字输入框'
  },
];

/**
 * 状态示例
 */
export const stateInputs: InputTemplate[] = [
  {
    type: 'text',
    placeholder: '禁用状态',
    disabled: true,
    value: '禁用的输入框',
    description: '禁用状态'
  },
  {
    type: 'text',
    placeholder: '无效状态',
    invalid: true,
    description: '无效状态（验证失败）'
  },
];

/**
 * 特殊类型输入框
 */
export const specialInputs: InputTemplate[] = [
  {
    type: 'url',
    placeholder: 'https://example.com',
    description: 'URL 输入框'
  },
  {
    type: 'tel',
    placeholder: '+86 138 0000 0000',
    description: '电话号码输入框'
  },
  {
    type: 'search',
    placeholder: '搜索内容...',
    description: '搜索输入框'
  },
  {
    type: 'date',
    placeholder: '',
    description: '日期输入框'
  },
];

/**
 * 表单示例字段
 */
export const formFields: FormField[] = [
  {
    name: 'username',
    label: '用户名',
    type: 'text',
    placeholder: '请输入用户名',
    required: true
  },
  {
    name: 'email',
    label: '邮箱地址',
    type: 'email',
    placeholder: 'example@email.com',
    required: true
  },
  {
    name: 'password',
    label: '密码',
    type: 'password',
    placeholder: '请输入密码（至少8位）',
    required: true
  },
  {
    name: 'phone',
    label: '手机号码',
    type: 'tel',
    placeholder: '+86 138 0000 0000'
  },
  {
    name: 'website',
    label: '个人网站',
    type: 'url',
    placeholder: 'https://example.com'
  },
];
