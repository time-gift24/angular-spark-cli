import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  InputGroupComponent,
  InputGroupButtonComponent,
  InputGroupTextComponent,
  InputGroupInputComponent,
  InputGroupTextareaComponent,
} from '@app/shared/ui/input-group';

@Component({
  selector: 'app-input-group-demo',
  imports: [
    InputGroupComponent,
    InputGroupButtonComponent,
    InputGroupTextComponent,
    InputGroupInputComponent,
    InputGroupTextareaComponent,
  ],
  templateUrl: './input-group-demo.component.html',
  styleUrl: './input-group-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class InputGroupDemoComponent {
  readonly searchValue = signal('');
  readonly urlValue = signal('https://example.com');
  readonly messageValue = signal('');

  onSearch(): void {
    console.log('Searching for:', this.searchValue());
  }

  onClear(): void {
    this.searchValue.set('');
  }

  onCopy(): void {
    navigator.clipboard.writeText(this.urlValue());
    console.log('Copied to clipboard');
  }

  onSend(): void {
    console.log('Sending message:', this.messageValue());
    this.messageValue.set('');
  }
}
