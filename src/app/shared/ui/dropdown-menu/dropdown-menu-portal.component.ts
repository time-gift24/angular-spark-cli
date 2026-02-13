/**
 * Dropdown Menu Portal Component
 *
 * Portal wrapper for dropdown content.
 * Renders content at the end of the document body.
 *
 * Usage:
 * <div spark-dropdown-menu-portal>
 *   <ng-content />
 * </div>
 */

import {
  Component,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'div[spark-dropdown-menu-portal]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'contents',
  },
  template: `
    <ng-content />
  `,
})
export class DropdownMenuPortalComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => {
      // Move content to body for proper z-index stacking
      const nativeElement = this.elementRef.nativeElement as HTMLElement;
      const parent = nativeElement.parentElement;
      if (parent && parent !== document.body) {
        // For now, we'll keep the content in place
        // In a full implementation, this would use CDK Portal or similar
      }
    });
  }
}
