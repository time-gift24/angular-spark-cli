import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { SeparatorComponent } from '@app/shared/ui/separator/separator.component';
import { SwitchComponent } from '@app/shared/ui/switch/switch.component';
import { CardComponents } from '@app/shared/ui/card/card.component';
import {
  SheetOverlayComponent,
  SheetContentComponent,
  SheetHeaderComponent,
  SheetTitleComponent,
  SheetDescriptionComponent,
  SheetFooterComponent,
} from '@app/shared/ui/sheet';

/**
 * LandingPageComponent - Standalone landing page with marketing content
 *
 * This component displays the main landing page including:
 * - Hero section
 * - Components preview
 * - Features section
 * - Footer
 *
 * @selector app-landing-page
 * @standalone true
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    RouterLink,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    SeparatorComponent,
    SwitchComponent,
    ...CardComponents,
    SheetOverlayComponent,
    SheetContentComponent,
    SheetHeaderComponent,
    SheetTitleComponent,
    SheetDescriptionComponent,
    SheetFooterComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent {
  /**
   * Controls whether the button sheet modal is open
   */
  readonly buttonSheetOpen = signal(false);

  /**
   * Controls whether the input sheet modal is open
   */
  readonly inputSheetOpen = signal(false);

  /**
   * Controls whether the card sheet modal is open
   */
  readonly cardSheetOpen = signal(false);

  /**
   * Controls whether the badge sheet modal is open
   */
  readonly badgeSheetOpen = signal(false);

  /**
   * Controls whether the separator sheet modal is open
   */
  readonly separatorSheetOpen = signal(false);

  /**
   * Controls whether the switch sheet modal is open
   */
  readonly switchSheetOpen = signal(false);

  /**
   * Opens a component preview sheet modal
   *
   * @param component - The component type to preview
   */
  protected openSheet(component: string): void {
    switch (component) {
      case 'button':
        this.buttonSheetOpen.set(true);
        break;
      case 'input':
        this.inputSheetOpen.set(true);
        break;
      case 'card':
        this.cardSheetOpen.set(true);
        break;
      case 'badge':
        this.badgeSheetOpen.set(true);
        break;
      case 'separator':
        this.separatorSheetOpen.set(true);
        break;
      case 'switch':
        this.switchSheetOpen.set(true);
        break;
    }
  }

  /**
   * Closes all sheet modals
   */
  protected closeAllSheets(): void {
    this.buttonSheetOpen.set(false);
    this.inputSheetOpen.set(false);
    this.cardSheetOpen.set(false);
    this.badgeSheetOpen.set(false);
    this.separatorSheetOpen.set(false);
    this.switchSheetOpen.set(false);
  }
}
