import { Directive, HostListener, output } from '@angular/core';

@Directive({
  selector: 'button[spark-button], a[spark-button]',
  standalone: true,
})
export class ButtonDirective {
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly click = output<MouseEvent>();

  @HostListener('click', ['$event'])
  handleClick(event: MouseEvent): void {
    this.click.emit(event);
  }
}
