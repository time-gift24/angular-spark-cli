import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DialogComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
  DialogDescriptionComponent,
  DialogFooterComponent,
  DialogCloseDirective,
} from '@app/shared/ui/dialog';
import { ButtonComponent } from '@app/shared/ui/button';

@Component({
  selector: 'app-dialog-demo',
  imports: [
    CommonModule,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    DialogCloseDirective,
    ButtonComponent,
  ],
  templateUrl: './dialog-demo.component.html',
  styleUrl: '../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogDemoComponent {
  // Scene 1: Basic Dialog
  readonly isBasicOpen = signal<boolean>(false);

  // Scene 2: Dialog with description
  readonly isDescriptionOpen = signal<boolean>(false);

  // Scene 3: Dialog without close button
  readonly isNoCloseOpen = signal<boolean>(false);

  // Scene 4: Long content dialog
  readonly isLongContentOpen = signal<boolean>(false);

  onBasicConfirm(): void {
    console.log('Basic dialog confirmed');
    this.isBasicOpen.set(false);
  }

  onBasicCancel(): void {
    console.log('Basic dialog cancelled');
    this.isBasicOpen.set(false);
  }

  onDescriptionConfirm(): void {
    console.log('Description dialog confirmed');
    this.isDescriptionOpen.set(false);
  }

  onDescriptionCancel(): void {
    console.log('Description dialog cancelled');
    this.isDescriptionOpen.set(false);
  }

  onNoCloseConfirm(): void {
    console.log('No close button dialog confirmed');
    this.isNoCloseOpen.set(false);
  }

  onLongContentConfirm(): void {
    console.log('Long content dialog confirmed');
    this.isLongContentOpen.set(false);
  }

  onLongContentCancel(): void {
    console.log('Long content dialog cancelled');
    this.isLongContentOpen.set(false);
  }
}
