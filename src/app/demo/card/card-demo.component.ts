import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponents } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { LabelComponent } from '../../shared/ui/label/label.component';

@Component({
  selector: 'app-card-demo',
  standalone: true,
  imports: [CommonModule, CardComponents, ButtonComponent, InputComponent, LabelComponent],
  templateUrl: './card-demo.component.html',
  styleUrls: ['./card-demo.component.css'],
  host: {
    'style': 'display: block; width: 100%;'
  }
})
export class CardDemoComponent {}
