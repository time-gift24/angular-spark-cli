import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/ui/button';
import {
  AvatarComponent,
  AvatarFallbackComponent,
} from '@app/shared/ui/avatar';
import {
  HoverCardRootComponent,
  HoverCardTriggerComponent,
  HoverCardContentComponent,
  type HoverCardContentAlign,
  type HoverCardContentSide,
} from '@app/shared/ui/hover-card';

@Component({
  selector: 'app-hover-card-demo',
  imports: [
    CommonModule,
    ButtonComponent,
    AvatarComponent,
    AvatarFallbackComponent,
    HoverCardRootComponent,
    HoverCardTriggerComponent,
    HoverCardContentComponent,
  ],
  templateUrl: './hover-card-demo.html',
  styleUrl: '../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [],
})
export class HoverCardDemoComponent {
  readonly isOpen = signal<boolean>(false);
}
