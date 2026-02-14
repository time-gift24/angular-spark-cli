import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ButtonComponent } from '@app/shared/ui/button';
import * as Drawer from '@app/shared/ui/drawer';
import * as Sheet from '@app/shared/ui/sheet';

@Component({
  selector: 'app-drawer-demo',
  imports: [
    CommonModule,
    TitleCasePipe,
    ButtonComponent,
    Drawer.DrawerTriggerComponent,
    Drawer.DrawerOverlayComponent,
    Drawer.DrawerContentComponent,
    Drawer.DrawerHeaderComponent,
    Drawer.DrawerTitleComponent,
    Drawer.DrawerDescriptionComponent,
    Drawer.DrawerFooterComponent,
    Drawer.DrawerHandleComponent,
    Drawer.DrawerCloseComponent,
    Sheet.SheetTriggerComponent,
    Sheet.SheetOverlayComponent,
    Sheet.SheetContentComponent,
    Sheet.SheetHeaderComponent,
    Sheet.SheetTitleComponent,
    Sheet.SheetDescriptionComponent,
    Sheet.SheetFooterComponent,
    Sheet.SheetCloseComponent,
  ],
  templateUrl: './drawer-demo.component.html',
  styleUrls: ['./drawer-demo.component.css'],
  host: {
    style: 'display: block; width: 100%;',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerDemoComponent {
  readonly drawerSide = signal<Drawer.DrawerSide>('right');
  readonly drawerOpen = signal<boolean>(false);

  readonly sheetSide = signal<Sheet.SheetSide>('right');
  readonly sheetOpen = signal<boolean>(false);

  openDrawer(side: Drawer.DrawerSide): void {
    this.drawerSide.set(side);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  openSheet(side: Sheet.SheetSide): void {
    this.sheetSide.set(side);
    this.sheetOpen.set(true);
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
  }

  readonly sideOptions: { label: string; value: Drawer.DrawerSide }[] = [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
  ];
}
