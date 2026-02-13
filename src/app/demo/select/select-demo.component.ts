import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SelectComponent, type SelectOption } from '@app/shared/ui/select';

/**
 * Select Demo Component
 *
 * 展示 Select 组件的各种用法和样式
 */
@Component({
  selector: 'app-select-demo',
  imports: [SelectComponent],
  templateUrl: './select-demo.component.html',
  styleUrl: './select-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class SelectDemoComponent {
  // 示例选项数据
  readonly fruits: SelectOption[] = [
    { value: 'apple', label: '苹果' },
    { value: 'banana', label: '香蕉' },
    { value: 'orange', label: '橙子' },
    { value: 'grape', label: '葡萄' },
    { value: 'watermelon', label: '西瓜' },
  ];

  readonly cities: SelectOption[] = [
    { value: 'beijing', label: '北京' },
    { value: 'shanghai', label: '上海' },
    { value: 'guangzhou', label: '广州' },
    { value: 'shenzhen', label: '深圳' },
    { value: 'hangzhou', label: '杭州' },
  ];

  readonly users: SelectOption[] = [
    { value: 'alice', label: 'Alice', disabled: true },
    { value: 'bob', label: 'Bob' },
    { value: 'charlie', label: 'Charlie' },
    { value: 'diana', label: 'Diana' },
  ];

  readonly priorities: SelectOption[] = [
    { value: 'low', label: '低优先级' },
    { value: 'medium', label: '中优先级' },
    { value: 'high', label: '高优先级' },
  ];

  // 交互式演示状态
  readonly selectedFruit = signal('');
  readonly selectedCity = signal('');
  readonly selectedUser = signal('');
  readonly selectedPriority = signal('');

  /**
   * 处理选项变化
   */
  onFruitChange(value: string): void {
    console.log('Selected fruit:', value);
  }

  /**
   * 获取选中项标签
   */
  getSelectedLabel(options: SelectOption[], value: string): string {
    if (!value) return '未选择';
    return options.find(opt => opt.value === value)?.label || '未知';
  }

  /**
   * 重置选择
   */
  resetSelections(): void {
    this.selectedFruit.set('');
    this.selectedCity.set('');
    this.selectedUser.set('');
    this.selectedPriority.set('');
  }

  /**
   * 提交表单
   */
  submitForm(): void {
    console.log({
      fruit: this.selectedFruit(),
      city: this.selectedCity(),
      user: this.selectedUser(),
      priority: this.selectedPriority(),
    });
    alert('表单数据已提交到控制台');
  }
}
