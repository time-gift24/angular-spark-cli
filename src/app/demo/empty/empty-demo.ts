import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyComponent } from '@app/shared/ui/empty';

@Component({
  selector: 'app-empty-demo',
  imports: [EmptyComponent],
  templateUrl: './empty-demo.html',
  styleUrl: '../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyDemoComponent {
  onActionClick(): void {
    console.log('Empty action clicked');
  }
}
