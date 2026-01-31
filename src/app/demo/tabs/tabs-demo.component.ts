import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TabsComponent,
  TabsListComponent,
  TabsTriggerComponent,
  TabsContentComponent,
} from '../../shared/ui/tabs/tabs.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponents } from '../../shared/ui/card/card.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { LabelComponent } from '../../shared/ui/label/label.component';

@Component({
  selector: 'app-tabs-demo',
  standalone: true,
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
})
export class TabsDemoComponent {
  activeTab = 'account';

  onSelectTab(value: string): void {
    this.activeTab = value;
  }
}
