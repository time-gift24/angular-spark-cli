import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared/utils';

@Component({
  selector: 'input[spark-input]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
  template: '',
  styleUrl: './input.component.css',
})
export class InputComponent {
  readonly type = input<string>('text');
  readonly class = input<string>('');
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });

  /**
   * Base input styles - 矿物与时光主题，更舒适的视觉效果
   */
  private getBaseClasses(): string {
    return 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 rounded-md bg-card text-sm shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';
  }

  /**
   * Focus and validation styles
   */
  private getInteractiveClasses(): string {
    return 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive';
  }

  /**
   * Computed class for the input element
   */
  protected computedClass = computed(() => {
    return cn(this.getBaseClasses(), this.getInteractiveClasses(), this.class());
  });
}
