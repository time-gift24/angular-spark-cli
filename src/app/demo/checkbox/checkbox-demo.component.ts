import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxComponent } from '../../shared/ui/checkbox/checkbox.component';
import { LabelComponent } from '../../shared/ui/label/label.component';

@Component({
  selector: 'app-checkbox-demo',
  standalone: true,
  imports: [CommonModule, CheckboxComponent, LabelComponent],
  templateUrl: './checkbox-demo.component.html',
  styleUrls: ['./checkbox-demo.component.css'],
})
export class CheckboxDemoComponent {
  acceptTerms = false;
  enableNotifications = false;
  primaryCheckbox = true;

  onAcceptTermsChange(checked: boolean): void {
    this.acceptTerms = checked;
    console.log('Accept terms:', checked);
  }

  onNotificationsChange(checked: boolean): void {
    this.enableNotifications = checked;
    console.log('Enable notifications:', checked);
  }

  onPrimaryChange(checked: boolean): void {
    this.primaryCheckbox = checked;
  }
}
