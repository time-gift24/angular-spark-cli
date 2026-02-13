/**
 * Dropdown Menu Sub Component
 *
 * Root component for a submenu (nested dropdown menu).
 *
 * Usage:
 * <div spark-dropdown-menu-sub>
 *   <div spark-dropdown-menu-sub-trigger>Submenu</div>
 *   <div spark-dropdown-menu-sub-content>
 *     <div spark-dropdown-menu-item>Sub Item 1</div>
 *   </div>
 * </div>
 */

import {
  Component,
  input,
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
} from './dropdown-menu-root.component';

/** Injection token for dropdown menu sub context */
export const DROPDOWN_MENU_SUB = new InjectionToken<DropdownMenuSubToken>('DROPDOWN_MENU_SUB');

export interface DropdownMenuSubToken {
  readonly isOpen: Signal<boolean>;
  readonly open: () => void;
  readonly close: () => void;
}

@Component({
  selector: 'div[spark-dropdown-menu-sub]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
  },
  template: '<ng-content />',
  providers: [
    {
      provide: DROPDOWN_MENU_SUB,
      useExisting: DropdownMenuSubComponent,
    },
  ],
})
export class DropdownMenuSubComponent implements DropdownMenuSubToken {
  readonly root: DropdownMenuRootToken = inject(DROPDOWN_MENU_ROOT);

  readonly class = input<string>('');

  // Internal state - public for sub-content access
  readonly isOpen: WritableSignal<boolean> = signal(false);

  protected readonly hostClass = computed(() => {
    return cn(this.class());
  });

  readonly open = (): void => {
    this.isOpen.set(true);
  };

  readonly close = (): void => {
    this.isOpen.set(false);
  };
}
