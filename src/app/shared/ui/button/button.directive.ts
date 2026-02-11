import { Directive, output } from '@angular/core';

@Directive({
  selector: 'button[spark-button], a[spark-button]',
  host: {
    '(click)': 'handleClick($event)',
  },
})
export class ButtonDirective {
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly click = output<MouseEvent>();

  handleClick(event: MouseEvent): void {
    this.click.emit(event);
  }
}
