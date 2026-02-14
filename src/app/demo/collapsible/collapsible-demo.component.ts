import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CollapsibleComponent,
  CollapsibleTriggerComponent,
  CollapsibleContentComponent,
} from '@app/shared/ui/collapsible';
import { ButtonComponent } from '@app/shared/ui/button';
import { CardComponents } from '@app/shared/ui/card/card.component';

@Component({
  selector: 'app-collapsible-demo',
  imports: [
    CommonModule,
    CollapsibleComponent,
    CollapsibleTriggerComponent,
    CollapsibleContentComponent,
    ButtonComponent,
    CardComponents,
  ],
  templateUrl: './collapsible-demo.component.html',
  styleUrls: ['./collapsible-demo.component.css'],
  host: {
    style: 'display: block; width: 100%;',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsibleDemoComponent {
  // Basic collapsible state
  readonly basicOpen = signal(false);

  // Controlled collapsible state
  readonly controlledOpen = signal(false);

  // Multiple collapsibles
  readonly section1Open = signal(false);
  readonly section2Open = signal(false);
  readonly section3Open = signal(true);

  // Disabled collapsible
  readonly disabledOpen = signal(true);
  readonly collapsibleDisabled = signal(true);

  // Accordion-style collapsibles (only one open at a time)
  readonly accordionOpen1 = signal(true);
  readonly accordionOpen2 = signal(false);
  readonly accordionOpen3 = signal(false);

  // Toggle methods
  toggleBasic(): void {
    this.basicOpen.update((v) => !v);
  }

  expandControlled(): void {
    this.controlledOpen.set(true);
  }

  collapseControlled(): void {
    this.controlledOpen.set(false);
  }

  toggleControlled(): void {
    this.controlledOpen.update((v) => !v);
  }

  // Accordion-style: close all except the clicked one
  openAccordion1(): void {
    this.accordionOpen1.set(true);
    this.accordionOpen2.set(false);
    this.accordionOpen3.set(false);
  }

  openAccordion2(): void {
    this.accordionOpen1.set(false);
    this.accordionOpen2.set(true);
    this.accordionOpen3.set(false);
  }

  openAccordion3(): void {
    this.accordionOpen1.set(false);
    this.accordionOpen2.set(false);
    this.accordionOpen3.set(true);
  }

  // Toggle disabled state
  toggleDisabled(): void {
    this.collapsibleDisabled.update((v) => !v);
  }
}
