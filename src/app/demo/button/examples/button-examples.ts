import { ComponentTemplate } from '../types/button-demo.types';

/**
 * Button 变体示例配置
 */
export const buttonVariants: ComponentTemplate[] = [
  { label: 'Default', variant: 'default' as const, description: '默认主按钮' },
  { label: 'Secondary', variant: 'secondary' as const, description: '次要按钮' },
  { label: 'Destructive', variant: 'destructive' as const, description: '危险操作按钮' },
  { label: 'Outline', variant: 'outline' as const, description: '轮廓按钮' },
  { label: 'Ghost', variant: 'ghost' as const, description: '幽灵按钮' },
  { label: 'Link', variant: 'link' as const, description: '链接按钮' },
];

/**
 * Button 尺寸示例配置
 */
export const buttonSizes: ComponentTemplate[] = [
  { label: 'Small', size: 'sm' as const, description: '小尺寸按钮' },
  { label: 'Default', size: 'default' as const, description: '默认尺寸按钮' },
  { label: 'Large', size: 'lg' as const, description: '大尺寸按钮' },
];

/**
 * Button 状态示例配置
 */
export const buttonStates: ComponentTemplate[] = [
  {
    label: 'Disabled',
    variant: 'default' as const,
    disabled: true,
    description: '禁用状态',
  },
  {
    label: 'Disabled Outline',
    variant: 'outline' as const,
    disabled: true,
    description: '禁用轮廓按钮',
  },
  {
    label: 'Disabled Secondary',
    variant: 'secondary' as const,
    disabled: true,
    description: '禁用次要按钮',
  },
];

/**
 * 带图标的按钮示例
 */
export const buttonWithIcons: ComponentTemplate[] = [
  {
    label: 'Sign Up',
    variant: 'default' as const,
    icon: 'user',
    description: '用户注册按钮',
  },
  {
    label: 'Theme',
    variant: 'outline' as const,
    icon: 'theme',
    description: '主题切换按钮',
  },
  {
    label: 'Clock',
    variant: 'secondary' as const,
    icon: 'clock',
    description: '时钟按钮',
  },
];

/**
 * 图标 SVG 路径配置
 */
export const iconPaths: Record<string, { path: string; viewBox: string }> = {
  user: {
    path: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    viewBox: '0 0 24 24',
  },
  theme: {
    path: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    viewBox: '0 0 24 24',
  },
  clock: {
    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-8h3v2h-5V7h2v5z',
    viewBox: '0 0 24 24',
  },
  arrow: {
    path: 'M5 12h14M12 5l7 7-7 7',
    viewBox: '0 0 24 24',
  },
};

/**
 * 获取图标的 SVG 内容
 */
export function getIconSvg(iconName: string): string {
  const icon = iconPaths[iconName];
  if (!icon) return '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="${icon.path}"/>
  </svg>`;
}
