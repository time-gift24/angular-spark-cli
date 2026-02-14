import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/ui/button';
import {
  PopoverRootComponent,
  PopoverTriggerComponent,
  PopoverContentComponent,
  type PopoverContentAlign,
  type PopoverContentSide,
} from '@app/shared/ui/popover';

@Component({
  selector: 'app-popover-demo',
  imports: [CommonModule, ButtonComponent, PopoverRootComponent, PopoverTriggerComponent, PopoverContentComponent],
  templateUrl: './popover-demo.html',
  styleUrl: '../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverDemoComponent {
  readonly isOpen = signal<boolean>(false);
  readonly isTopOpen = signal<boolean>(false);
  readonly isLeftOpen = signal<boolean>(false);
  readonly isRightOpen = signal<boolean>(false);
  readonly isWithHeaderOpen = signal<boolean>(false);
  readonly isLongContentOpen = signal<boolean>(false);

  onOpenChange(open: boolean): void {
    console.log('Popover open changed:', open);
  }
}
