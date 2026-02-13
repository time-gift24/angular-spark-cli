/**
 * Dropdown Menu Radio Item Component
 *
 * Radio item that is part of a radio group.
 *
 * Usage:
 * <div spark-dropdown-menu-radio-item value="option1">Option 1</div>
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { cn } from '@app/shared';
import { DROPDOWN_MENU_RADIO_GROUP, type DropdownMenuRadioGroupToken } from './dropdown-menu-radio-group.component';
import { DROPDOWN_MENU_ROOT, type DropdownMenuRootToken, type DropdownMenuItemDef } from './dropdown-menu-root.component';

@Component({
  selector: 'div[spark-dropdown-menu-radio-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"menuitemradio"',
    '[attr.tabindex]': 'tabindex()',
    '[attr.aria-checked]': 'isSelected()',
    '[attr.data-inset]': 'inset() ? "" : null',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'select()',
    '(mouseenter)': 'onMouseEnter()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: `
    <ng-content />
    <span class="absolute right-2 flex items-center justify-center pointer-events-none">
      <svg
        class="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        [class.opacity]="isSelected() ? '100' : '0'"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
  `,
})
export class DropdownMenuRadioItemComponent {
  readonly radioGroup = inject(DROPDOWN_MENU_RADIO_GROUP, { optional: true, self: undefined });
  private readonly root: DropdownMenuRootToken = inject(DROPDOWN_MENU_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly value = input.required<string>();
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');
  readonly inset = input<boolean>(false);

  protected readonly isSelected = computed(() => this.radioGroup?.value() === this.value());

  protected readonly tabindex = computed(() => {
    if (this.disabled()) {
      return -1;
    }
    return 0;
  });

  protected readonly hostClass = computed(() => {
    return cn(
      'relative',
      'flex',
      'w-full',
      'cursor-default',
      'select-none',
      'items-center',
      'rounded-md',
      'gap-2',
      'min-h-7',
      'pr-8',
      'pl-2',
      'py-1',
      'text-xs',
      'outline-none',
      'transition-colors',
      // Focus styles
      'focus:bg-accent',
      'focus:text-accent-foreground',
      // Icon styles
      '[&_svg:not([class*=size-])]:size-3.5',
      '[&_svg]:pointer-events-none',
      '[&_svg]:shrink-0',
      // Disabled styles
      this.disabled() && 'pointer-events-none',
      this.disabled() && 'opacity-50',
      // Inset padding
      this.inset() && 'pl-7.5',
      // Custom class
      this.class()
    );
  });

  constructor() {
    // Get the initial disabled value from input
    const disabledValue = this.disabled();

    // Register this item with radio group - value will be resolved when accessed via getter
    const itemDef: DropdownMenuItemDef = {
      value: '',
      disabled: disabledValue,
      elementRef: this.elementRef,
    };

    // Update value after component initialization
    afterNextRender(() => {
      itemDef.value = this.value();
    });

    this.radioGroup?.registerItem(itemDef);
  }

  select(): void {
    if (this.disabled()) {
      return;
    }
    this.radioGroup?.setSelected(this.value());
    this.root.close();
  }

  onMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    // Update focused index when hovering
    // Note: Radio items are not in the main items list
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.select();
        break;
      case 'Escape':
        this.root.close();
        break;
    }
  }
}
