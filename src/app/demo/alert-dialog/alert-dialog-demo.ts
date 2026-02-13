import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AlertDialogComponent,
  type AlertDialogVariant,
} from '@app/shared/ui/alert-dialog';
import { ButtonComponent } from '@app/shared/ui/button';

@Component({
  selector: 'app-alert-dialog-demo',
  imports: [CommonModule, AlertDialogComponent, ButtonComponent],
  templateUrl: './alert-dialog-demo.html',
  styleUrl: '../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertDialogDemoComponent {
  readonly isDefaultOpen = signal<boolean>(false);
  readonly isDestructiveOpen = signal<boolean>(false);

  onDefaultConfirm(): void {
    console.log('Default dialog confirmed');
    this.isDefaultOpen.set(false);
  }

  onDefaultCancel(): void {
    console.log('Default dialog cancelled');
    this.isDefaultOpen.set(false);
  }

  onDestructiveConfirm(): void {
    console.log('Destructive dialog confirmed');
    this.isDestructiveOpen.set(false);
  }

  onDestructiveCancel(): void {
    console.log('Destructive dialog cancelled');
    this.isDestructiveOpen.set(false);
  }
}
