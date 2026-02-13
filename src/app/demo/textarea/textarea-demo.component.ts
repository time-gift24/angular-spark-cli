import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TextareaComponent } from '@app/shared/ui/textarea';

/**
 * Textarea Demo Component
 *
 * 展示 Textarea 组件的各种用法和样式
 */
@Component({
  selector: 'app-textarea-demo',
  imports: [TextareaComponent],
  templateUrl: './textarea-demo.component.html',
  styleUrl: './textarea-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class TextareaDemoComponent {
  // 示例配置
  readonly sizes: Array<{ value: 'sm' | 'md' | 'lg'; label: string }> = [
    { value: 'sm', label: '小' },
    { value: 'md', label: '中' },
    { value: 'lg', label: '大' },
  ];

  // 交互式演示状态
  readonly message = signal('');
  readonly bio = signal('');
  readonly feedback = signal('');

  /**
   * 获取字符数
   */
  getCharCount(value: string): number {
    return value.length;
  }

  /**
   * 清空输入
   */
  clear(field: 'message' | 'bio' | 'feedback'): void {
    switch (field) {
      case 'message':
        this.message.set('');
        break;
      case 'bio':
        this.bio.set('');
        break;
      case 'feedback':
        this.feedback.set('');
        break;
    }
  }

  /**
   * 提交表单
   */
  submitForm(): void {
    console.log({
      message: this.message(),
      bio: this.bio(),
      feedback: this.feedback(),
    });
    alert('表单数据已提交到控制台');
  }
}
