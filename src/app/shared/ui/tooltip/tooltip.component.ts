import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  signal,
} from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: '[ui-tooltip-trigger]',
  standalone: true,
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipTriggerComponent {}

@Component({
  selector: '[ui-tooltip-content]',
  standalone: true,
  template: `
    <div
      [class]="computedClass()"
      [attr.data-state]="isVisible() ? 'open' : 'closed'"
      role="tooltip"
    >
      <ng-content />
    </div>
  `,
  host: {
    '[class]': 'hostClasses()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipContentComponent {
  readonly class = input<string>('');
  readonly side = input<'top' | 'right' | 'bottom' | 'left'>('top');
  readonly align = input<'start' | 'center' | 'end'>('center');
  readonly avoidCollisions = input<boolean>(true);

  isVisible = signal(false);

  protected computedClass = computed(() => {
    return cn(
      'z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
      'whitespace-nowrap',
      'transition-all duration-200',
      this.class(),
    );
  });

  protected hostClasses = computed(() => {
    const sideClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return cn(
      'absolute z-50',
      sideClasses[this.side()],
      this.isVisible() ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
    );
  });
}

@Component({
  selector: 'ui-tooltip',
  standalone: true,
  template: `
    <div
      [class]="'relative inline-flex ' + computedClass()"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent {
  readonly class = input<string>('');
  readonly delayDuration = input<number>(200);

  protected computedClass = computed(() => {
    return this.class();
  });

  readonly trigger = contentChildren(TooltipTriggerComponent);
  readonly content = contentChildren(TooltipContentComponent);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  onMouseEnter(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      const contentComponent = this.content()?.[0] as TooltipContentComponent | undefined;
      contentComponent?.isVisible.set(true);
    }, this.delayDuration());
  }

  onMouseLeave(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    const contentComponent = this.content()?.[0] as TooltipContentComponent | undefined;
    contentComponent?.isVisible.set(false);
  }
}
