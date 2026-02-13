import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { InputOtpComponent } from '@app/shared/ui/input-otp';

/**
 * InputOTP Demo Component
 *
 * 展示 InputOTP 组件的各种用法和样式
 */
@Component({
  selector: 'app-input-otp-demo',
  imports: [InputOtpComponent],
  templateUrl: './input-otp-demo.component.html',
  styleUrl: './input-otp-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class InputOtpDemoComponent {
  // 交互式演示状态
  readonly otp = signal('');
  readonly pin = signal('');
  readonly alphanumeric = signal('');
  readonly isComplete = signal(false);

  /**
   * 处理 OTP 完成
   */
  onOtpComplete(value: string): void {
    this.isComplete.set(value.length === 6);
    if (value.length === 6) {
      console.log('OTP complete:', value);
    }
  }

  /**
   * 处理值变化
   */
  onOtpChange(value: string): void {
    console.log('OTP changed:', value);
  }

  /**
   * 获取 OTP 值
   */
  getOtpString(value: string): string {
    return value || '(空)';
  }

  /**
   * 清空输入
   */
  clear(field: 'otp' | 'pin' | 'alphanumeric'): void {
    switch (field) {
      case 'otp':
        this.otp.set('');
        break;
      case 'pin':
        this.pin.set('');
        break;
      case 'alphanumeric':
        this.alphanumeric.set('');
        break;
    }
    this.isComplete.set(false);
  }

  /**
   * 验证 OTP
   */
  verifyOtp(): void {
    const code = this.otp();
    console.log('Verifying OTP:', code);
    if (code === '123456') {
      alert('验证码正确！');
    } else {
      alert('验证码错误，请重试');
      this.otp.set('');
    }
  }

  /**
   * 提交 PIN
  */
  submitPin(): void {
    const code = this.pin();
    console.log('Submitted PIN:', code);
    alert(`PIN ${code} 已提交`);
  }
}
