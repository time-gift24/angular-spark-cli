import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RadioGroupComponent, type RadioOption } from '@app/shared/ui/radio-group';

/**
 * RadioGroup Demo Component
 *
 * 展示 RadioGroup 组件的各种用法和样式
 */
@Component({
  selector: 'app-radio-group-demo',
  imports: [RadioGroupComponent],
  templateUrl: './radio-group-demo.component.html',
  styleUrl: './radio-group-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class RadioGroupDemoComponent {
  // 示例选项数据
  readonly sizes: RadioOption[] = [
    { value: 'small', label: '小 (S)' },
    { value: 'medium', label: '中 (M)' },
    { value: 'large', label: '大 (L)' },
    { value: 'xlarge', label: '超大 (XL)' },
  ];

  readonly colors: RadioOption[] = [
    { value: 'red', label: '红色' },
    { value: 'blue', label: '蓝色' },
    { value: 'green', label: '绿色' },
    { value: 'yellow', label: '黄色' },
  ];

  readonly shippingOptions: RadioOption[] = [
    {
      value: 'standard',
      label: '标准配送',
    },
    {
      value: 'express',
      label: '快速配送',
    },
    {
      value: 'same-day',
      label: '当日达',
    },
  ];

  readonly notifications: RadioOption[] = [
    { value: 'all', label: '接收所有通知' },
    { value: 'mentions', label: '仅提及我时' },
    { value: 'none', label: '不接收通知' },
  ];

  // 交互式演示状态
  readonly selectedSize = signal('medium');
  readonly selectedColor = signal('');
  readonly selectedShipping = signal('standard');
  readonly selectedNotification = signal('all');

  /**
   * 处理尺寸变化
   */
  onSizeChange(value: string): void {
    console.log('Selected size:', value);
  }

  /**
   * 获取选中项标签
   */
  getSelectedLabel(options: RadioOption[], value: string): string {
    if (!value) return '未选择';
    return options.find(opt => opt.value === value)?.label || '未知';
  }

  /**
   * 重置选择
   */
  resetSelections(): void {
    this.selectedSize.set('medium');
    this.selectedColor.set('');
    this.selectedShipping.set('standard');
    this.selectedNotification.set('all');
  }

  /**
   * 提交表单
   */
  submitForm(): void {
    console.log({
      size: this.selectedSize(),
      color: this.selectedColor(),
      shipping: this.selectedShipping(),
      notification: this.selectedNotification(),
    });
    alert('表单数据已提交到控制台');
  }
}
