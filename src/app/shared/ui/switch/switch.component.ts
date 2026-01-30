import { Component, input, computed, output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '../../utils';

export type SwitchSize = 'sm' | 'default';

@Component({
  selector: 'button[spark-switch]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.role]': '"switch"',
    '[attr.aria-checked]': 'checked()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'checked() ? "checked" : "unchecked"',
    '(click)': 'handleClick($event)',
  },
  template: `
    <span class="switch-thumb" data-slot="switch-thumb"></span>
  `,
  styleUrls: ['./switch.component.css'],
})
export class SwitchComponent {
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });
  readonly size = input<SwitchSize>('default');
  readonly class = input<string>('');

  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly checkedChange = output<boolean>();

  /**
   * Handle click event
   */
  protected handleClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.checkedChange.emit(!this.checked());
  }

  /**
   * Base switch styles - Ultra compact with smooth transitions
   */
  private getBaseClasses(): string {
    return 'peer inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';
  }

  /**
   * Size and state styles using CSS variables
   */
  private getSizeAndStateClasses(): string {
    const size = this.size();
    const checked = this.checked();

    const sizeClasses = size === 'sm'
      ? 'h-3.5 w-6'
      : 'h-[1.15rem] w-8';

    const stateClasses = checked
      ? 'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80'
      : 'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80';

    return `${sizeClasses} ${stateClasses}`;
  }

  /**
   * Computed class for the switch element
   */
  protected computedClass = computed(() => {
    return cn(
      this.getBaseClasses(),
      this.getSizeAndStateClasses(),
      this.class()
    );
  });
}
