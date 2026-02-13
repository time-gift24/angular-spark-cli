/**
 * Select Scroll Up Button Component
 *
 * Displays a chevron-up icon when the select content is scrollable.
 * Allows users to scroll up in long select lists.
 *
 * Usage:
 * <div spark-select-scroll-up-button />
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';
import { SELECT_ROOT, type SelectRootToken } from './select-root.component';

@Component({
  selector: 'div[spark-select-scroll-up-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"select-scroll-up-button"',
  },
  template: `
    <svg
      [class]="iconClass()"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  `,
})
export class SelectScrollUpButtonComponent {
  readonly root: SelectRootToken = inject(SELECT_ROOT);

  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'flex',
      'cursor-default',
      'items-center',
      'justify-center',
      'py-1',
      'bg-popover',
      this.class()
    );
  });

  protected readonly iconClass = computed(() => {
    return cn(
      'h-[var(--select-icon-size)]',
      'w-[var(--select-icon-size)]',
      'pointer-events-none'
    );
  });
}
