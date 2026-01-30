import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { SeparatorComponent } from '@app/shared/ui/separator/separator.component';
import { SwitchComponent } from '@app/shared/ui/switch/switch.component';
import { CardComponents } from '@app/shared/ui/card/card.component';
import {
  SheetTriggerComponent,
  SheetOverlayComponent,
  SheetContentComponent,
  SheetHeaderComponent,
  SheetTitleComponent,
  SheetDescriptionComponent,
  SheetFooterComponent,
  SheetCloseComponent,
} from '@app/shared/ui/sheet';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    SeparatorComponent,
    SwitchComponent,
    ...CardComponents,
    SheetTriggerComponent,
    SheetOverlayComponent,
    SheetContentComponent,
    SheetHeaderComponent,
    SheetTitleComponent,
    SheetDescriptionComponent,
    SheetFooterComponent,
    SheetCloseComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-spark-cli');

  // Sheet states for each component
  protected readonly buttonSheetOpen = signal(false);
  protected readonly inputSheetOpen = signal(false);
  protected readonly cardSheetOpen = signal(false);
  protected readonly badgeSheetOpen = signal(false);
  protected readonly separatorSheetOpen = signal(false);
  protected readonly switchSheetOpen = signal(false);

  protected openSheet(component: string): void {
    switch (component) {
      case 'button': this.buttonSheetOpen.set(true); break;
      case 'input': this.inputSheetOpen.set(true); break;
      case 'card': this.cardSheetOpen.set(true); break;
      case 'badge': this.badgeSheetOpen.set(true); break;
      case 'separator': this.separatorSheetOpen.set(true); break;
      case 'switch': this.switchSheetOpen.set(true); break;
    }
  }
}
