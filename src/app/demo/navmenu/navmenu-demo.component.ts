import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NavMenuRootComponent,
  NavMenuTriggerComponent,
  NavMenuContentComponent,
  NavMenuItemComponent,
} from '@app/shared/ui';

@Component({
  selector: 'app-navmenu-demo',
  imports: [
    NavMenuRootComponent,
    NavMenuTriggerComponent,
    NavMenuContentComponent,
    NavMenuItemComponent,
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

  reset(): void {
    this.horizontalOpen.set(false);
    this.verticalOpen.set(false);
  }
}
