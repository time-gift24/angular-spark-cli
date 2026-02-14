import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NavMenuRootComponent,
  NavMenuTriggerComponent,
  NavMenuContentComponent,
  NavMenuItemComponent,
  NavMenuLabelComponent,
  NavMenuSeparatorComponent,
  NavMenuLinkComponent,
  NavMenuIndicatorComponent,
  NavMenuViewportComponent,
} from '@app/shared/ui';

@Component({
  selector: 'app-navmenu-demo',
  imports: [
    NavMenuRootComponent,
    NavMenuTriggerComponent,
    NavMenuContentComponent,
    NavMenuItemComponent,
    NavMenuLabelComponent,
    NavMenuSeparatorComponent,
    NavMenuLinkComponent,
    NavMenuIndicatorComponent,
    NavMenuViewportComponent,
  ],
  templateUrl: './navmenu-demo.component.html',
  styleUrls: ['./navmenu-demo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class NavmenuDemoComponent {
  readonly horizontalOpen = signal(false);
  readonly verticalOpen = signal(false);
  readonly linkMenuOpen = signal(false);

  reset(): void {
    this.horizontalOpen.set(false);
    this.verticalOpen.set(false);
    this.linkMenuOpen.set(false);
  }
}
