import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TabsComponent,
  TabsListComponent,
  TabsTriggerComponent,
  TabsContentComponent,
} from '@app/shared/ui/tabs/tabs.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponents } from '@app/shared/ui/card/card.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { LabelComponent } from '@app/shared/ui/label/label.component';

@Component({
  selector: 'app-tabs-demo',
  imports: [
    CommonModule,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    ButtonComponent,
    CardComponents,
    InputComponent,
    LabelComponent,
  ],
  templateUrl: './tabs-demo.component.html',
  styleUrls: ['./tabs-demo.component.css'],
  host: {
    style: 'display: block; width: 100%;',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsDemoComponent {
  readonly activeTab = signal('account');

  onSelectTab(value: string): void {
    this.activeTab.set(value);
  }
}
