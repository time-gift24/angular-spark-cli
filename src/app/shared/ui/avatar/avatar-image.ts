import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'img[ui-avatar-image]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'aspect-square h-full w-full object-cover',
    '[attr.src]': 'src()',
    '[attr.alt]': 'alt()',
    '(load)': 'onLoad()',
    '(error)': 'onError()',
  },
  template: '',
})
export class AvatarImageComponent {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly imageLoad = output<void>();
  readonly imageError = output<void>();

  onLoad() {
    this.imageLoad.emit();
  }

  onError() {
    this.imageError.emit();
  }
}
