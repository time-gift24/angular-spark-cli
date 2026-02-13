/**
 * Dropdown Menu Radio Group Component
 *
 * Groups radio items together.
 *
 * Usage:
 * <div spark-dropdown-menu-radio-group [value]="selectedValue">
 *   <div spark-dropdown-menu-radio-item value="option1">Option 1</div>
 *   <div spark-dropdown-menu-radio-item value="option2">Option 2</div>
 * </div>
 */

import {
  Component,
  input,
  model,
  signal,
  inject,
  InjectionToken,
  ChangeDetectionStrategy,
  computed,
  WritableSignal,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { cn } from '@app/shared';
import {
  DROPDOWN_MENU_ROOT,
  type DropdownMenuRootToken,
  type DropdownMenuItemDef,
} from './dropdown-menu-root.component';

/** Injection token for dropdown menu radio group context */
export const DROPDOWN_MENU_RADIO_GROUP = new InjectionToken<DropdownMenuRadioGroupToken>('DROPDOWN_MENU_RADIO_GROUP');

export interface DropdownMenuRadioGroupToken {
  readonly value: Signal<string | null>;
  readonly items: WritableSignal<DropdownMenuItemDef[]>;
  readonly registerItem: (item: DropdownMenuItemDef) => void;
  readonly unregisterItem: (value: string) => void;
  readonly setSelected: (value: string) => void;
}

@Component({
  selector: 'div[spark-dropdown-menu-radio-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"group"',
  },
  template: '<ng-content />',
  providers: [
    {
      provide: DROPDOWN_MENU_RADIO_GROUP,
      useExisting: DropdownMenuRadioGroupComponent,
    },
  ],
})
export class DropdownMenuRadioGroupComponent implements DropdownMenuRadioGroupToken {
  private readonly root: DropdownMenuRootToken = inject(DROPDOWN_MENU_ROOT);

  readonly class = input<string>('');

  // Model for two-way binding
  readonly value = model<string | null>(null);

  // Internal state
  readonly items: WritableSignal<DropdownMenuItemDef[]> = signal([]);

  protected readonly hostClass = computed(() => {
    return cn(this.class());
  });

  readonly setSelected = (value: string): void => {
    this.value.set(value);
  };

  readonly registerItem = (item: DropdownMenuItemDef): void => {
    this.items.set([...this.items(), item]);
  };

  readonly unregisterItem = (value: string): void => {
    this.items.set(this.items().filter((item) => item.value !== value));
  };

  constructor() {
    // Register this radio group with root
    const groupValue = 'radio-group-' + Math.random().toString(36).substring(2, 9);
    this.root.registerRadioGroup(groupValue, {
      value: this.value,
      items: this.items,
      registerItem: this.registerItem,
      unregisterItem: this.unregisterItem,
    });
  }
}
