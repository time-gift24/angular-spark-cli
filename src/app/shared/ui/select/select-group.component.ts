import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'div[spark-select-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'p-1',
    '[attr.role]': '"group"',
  },
  template: '<ng-content />',
})
export class SelectGroupComponent {}
