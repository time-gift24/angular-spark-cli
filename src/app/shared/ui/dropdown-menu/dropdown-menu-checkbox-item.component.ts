/**
 * Dropdown Menu Checkbox Item Component
 *
 * Checkbox item that can be checked/unchecked.
 *
 * Usage:
 * <div spark-dropdown-menu-checkbox-item [(checked)]="isChecked">
 *   Label
 * </div>
 */

import {
  Component,
  input,
  model,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { cn } from '@app/shared';
import {
  DROPDOWN_MENU_ROOT,
  type DropdownMenuRootToken,
  type DropdownMenuCheckboxItemDef,
} from './dropdown-menu-root.component';

@Component({
  selector: 'div[spark-dropdown-menu-checkbox-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"menuitemcheckbox"',
    '[attr.tabindex]': 'tabindex()',
    '[attr.aria-checked]': 'checked()',
    '[attr.data-inset]': 'inset() ? "" : null',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'toggle()',
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
        [class.opacity]="checked() ? '100' : '0'"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
  `,
})
export class DropdownMenuCheckboxItemComponent {
  private readonly root: DropdownMenuRootToken = inject(DROPDOWN_MENU_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly value = input.required<string>();
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');
  readonly inset = input<boolean>(false);

  // Model for two-way binding
  readonly checked = model<boolean>(false);

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

    // Register this item with root - value will be resolved when accessed via getter
    const itemDef: DropdownMenuCheckboxItemDef = {
      value: '',
      checked: this.checked,
      disabled: disabledValue,
      elementRef: this.elementRef,
    };

    // Update value after component initialization
    afterNextRender(() => {
      itemDef.value = this.value();
    });

    this.root.registerCheckboxItem(itemDef);
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    const newValue = !this.checked();
    this.checked.set(newValue);
  }

  onMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    // Update focused index when hovering
    // Note: Checkbox items are not in the main items list
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggle();
        break;
      case 'Escape':
        this.root.close();
        break;
    }
  }
}
