import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponents } from '@app/shared/ui/card/card.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { LabelComponent } from '@app/shared/ui/label/label.component';

@Component({
  selector: 'app-card-demo',
  imports: [CommonModule, CardComponents, ButtonComponent, InputComponent, LabelComponent],
  templateUrl: './card-demo.component.html',
  styleUrls: ['./card-demo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class CardDemoComponent {}
