import { ChangeDetectionStrategy, Component, EventEmitter, signal, computed, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InputComponent } from '@app/shared/ui';
import { basicInputs, stateInputs, specialInputs, formFields } from './examples/input-examples';
import type { InputStats } from './types/input-demo.types';

/**
 * Input Demo Component
 *
 * 展示 Input 组件的各种用法和样式
 */
@Component({
  selector: 'app-input-demo',
  imports: [InputComponent, DatePipe],
  templateUrl: './input-demo.component.html',
  styleUrl: './input-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class InputDemoComponent {
  readonly submitFormEvent = new EventEmitter<void>();
  // 示例配置
  readonly basicInputs = basicInputs;
  readonly stateInputs = stateInputs;
  readonly specialInputs = specialInputs;
  readonly formFields = formFields;

  // 交互式演示状态
  private readonly stats = signal<InputStats>({
    inputCount: 0,
    lastValue: '',
    lastUpdateTime: null,
  });

  // 表单数据模型
  readonly formData = signal<Record<string, string>>({});

  /**
   * 获取输入次数
   */
  readonly inputCount = computed(() => this.stats().inputCount);

  /**
   * 获取最后输入值
   */
  readonly lastValue = computed(() => this.stats().lastValue);

  /**
   * 获取最后更新时间
   */
  readonly lastUpdateTime = computed(() => this.stats().lastUpdateTime);

  /**
   * 处理输入事件
   */
  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.stats.update((current) => ({
      inputCount: current.inputCount + 1,
      lastValue: target.value,
      lastUpdateTime: new Date(),
    }));
  }

  /**
   * 处理表单字段输入
   */
  handleFormFieldInput(fieldName: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.formData.update((current) => ({
      ...current,
      [fieldName]: target.value,
    }));
  }

  /**
   * 获取表单字段值
   */
  getFieldValue(fieldName: string): string {
    return this.formData()[fieldName] || '';
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.stats.set({
      inputCount: 0,
      lastValue: '',
      lastUpdateTime: null,
    });
    this.resetForm();
  }

  /**
   * 提交表单
   */
  submitForm(): void {
    this.submitFormEvent.emit();
    this.resetForm();
  }

  /**
   * 重置表单
   */
  resetForm(): void {
    this.formData.set({});
    console.log('Form reset!');
  }
}
