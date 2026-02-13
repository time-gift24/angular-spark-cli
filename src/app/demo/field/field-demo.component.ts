import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FieldComponent, InputComponent, LabelComponent } from '@app/shared/ui';

/**
 * Field Demo Component
 *
 * 展示 Field 组件的各种用法和样式
 */
@Component({
  selector: 'app-field-demo',
  imports: [FieldComponent, InputComponent, LabelComponent],
  templateUrl: './field-demo.component.html',
  styleUrl: './field-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class FieldDemoComponent {
  // 表单数据
  readonly username = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly phone = signal('');
  readonly website = signal('');

  // 错误状态
  readonly usernameError = signal('');
  readonly emailError = signal('');
  readonly passwordError = signal('');
  readonly phoneError = signal('');
  readonly websiteError = signal('');

  /**
   * 验证用户名
   */
  validateUsername(value: string): void {
    this.username.set(value);
    if (!value) {
      this.usernameError.set('请输入用户名');
    } else if (value.length < 3) {
      this.usernameError.set('用户名至少需要 3 个字符');
    } else {
      this.usernameError.set('');
    }
  }

  /**
   * 验证邮箱
   */
  validateEmail(value: string): void {
    this.email.set(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      this.emailError.set('请输入邮箱地址');
    } else if (!emailRegex.test(value)) {
      this.emailError.set('请输入有效的邮箱地址');
    } else {
      this.emailError.set('');
    }
  }

  /**
   * 验证密码
   */
  validatePassword(value: string): void {
    this.password.set(value);
    if (!value) {
      this.passwordError.set('请输入密码');
    } else if (value.length < 8) {
      this.passwordError.set('密码至少需要 8 个字符');
    } else {
      this.passwordError.set('');
    }
  }

  /**
   * 验证手机号
   */
  validatePhone(value: string): void {
    this.phone.set(value);
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!value) {
      this.phoneError.set('请输入手机号');
    } else if (!phoneRegex.test(value)) {
      this.phoneError.set('请输入有效的手机号');
    } else {
      this.phoneError.set('');
    }
  }

  /**
   * 验证网址
   */
  validateWebsite(value: string): void {
    this.website.set(value);
    if (value && !value.startsWith('http')) {
      this.websiteError.set('网址必须以 http:// 或 https:// 开头');
    } else {
      this.websiteError.set('');
    }
  }

  /**
   * 提交表单
   */
  submitForm(): void {
    const hasErrors =
      this.usernameError() ||
      this.emailError() ||
      this.passwordError() ||
      this.phoneError() ||
      this.websiteError();

    if (hasErrors) {
      alert('请修正表单中的错误');
      return;
    }

    console.log({
      username: this.username(),
      email: this.email(),
      password: this.password(),
      phone: this.phone(),
      website: this.website(),
    });
    alert('表单数据已提交到控制台');
  }

  /**
   * 重置表单
   */
  resetForm(): void {
    this.username.set('');
    this.email.set('');
    this.password.set('');
    this.phone.set('');
    this.website.set('');
    this.usernameError.set('');
    this.emailError.set('');
    this.passwordError.set('');
    this.phoneError.set('');
    this.websiteError.set('');
  }
}
