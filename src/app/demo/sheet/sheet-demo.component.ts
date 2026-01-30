import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/ui/button';
import * as Sheet from '../../shared/ui/sheet';

@Component({
  selector: 'app-sheet-demo',
  standalone: true,
  imports: [CommonModule, ButtonComponent, Sheet.SheetTriggerComponent, Sheet.SheetOverlayComponent, Sheet.SheetContentComponent, Sheet.SheetHeaderComponent, Sheet.SheetTitleComponent, Sheet.SheetDescriptionComponent, Sheet.SheetFooterComponent, Sheet.SheetCloseComponent],
  templateUrl: './sheet-demo.component.html',
  styleUrls: ['./sheet-demo.component.css'],
})
export class SheetDemoComponent {
  readonly side = signal<Sheet.SheetSide>('right');
  readonly open = signal<boolean>(false);

  openSheet(sheetSide: Sheet.SheetSide): void {
    this.side.set(sheetSide);
    this.open.set(true);
  }

  closeSheet(): void {
    this.open.set(false);
  }
}
