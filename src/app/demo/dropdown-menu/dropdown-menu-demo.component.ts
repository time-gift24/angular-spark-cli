import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DropdownMenuRootComponent,
  DropdownMenuTriggerComponent,
  DropdownMenuContentComponent,
  DropdownMenuItemComponent,
  DropdownMenuLabelComponent,
  DropdownMenuSeparatorComponent,
  DropdownMenuCheckboxItemComponent,
  DropdownMenuRadioGroupComponent,
  DropdownMenuRadioItemComponent,
} from '@app/shared/ui/dropdown-menu';

@Component({
  selector: 'app-dropdown-menu-demo',
  imports: [
    DropdownMenuRootComponent,
    DropdownMenuTriggerComponent,
    DropdownMenuContentComponent,
    DropdownMenuItemComponent,
    DropdownMenuLabelComponent,
    DropdownMenuSeparatorComponent,
    DropdownMenuCheckboxItemComponent,
    DropdownMenuRadioGroupComponent,
    DropdownMenuRadioItemComponent,
  ],
  templateUrl: './dropdown-menu-demo.component.html',
  styleUrl: './dropdown-menu-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class DropdownMenuDemoComponent {
  readonly boldChecked = signal(false);
  readonly italicChecked = signal(true);
  readonly underlineChecked = signal(false);
  readonly alignment = signal<'left' | 'center' | 'right'>('left');

  onItemSelected(value: string): void {
    console.log('Selected item:', value);
  }

  onToggleChanged(item: string, checked: boolean): void {
    console.log(`${item} toggled:`, checked);
  }
}
