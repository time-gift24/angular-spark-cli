import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared';

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'ng-container[spark-sheet-trigger]',
  standalone: true,
  template: '<ng-content />',
})
export class SheetTriggerComponent {}

@Component({
  selector: 'div[spark-sheet-overlay]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'overlayStyles()',
    '(click)': 'close.emit()',
  },
  template: '',
})
export class SheetOverlayComponent {
  readonly open = input<boolean>(false);
  readonly close = output<void>();

  protected computedClass = computed(() => {
    return 'fixed inset-0 bg-[var(--sheet-overlay-bg)]';
  });

  protected overlayStyles = computed(() => {
    const open = this.open();
    const opacity = open ? '1' : '0';
    const pointerEvents = open ? 'auto' : 'none';
    return `opacity: ${opacity}; transition: opacity var(--sheet-transition-duration) var(--sheet-transition-easing); pointer-events: ${pointerEvents}; z-index: var(--sheet-z-overlay);`;
  });
}

@Component({
  selector: 'div[spark-sheet-content]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'sheetStyles()',
  },
  template: '<ng-content />',
})
export class SheetContentComponent {
  readonly open = input<boolean>(false);
  readonly side = input<SheetSide>('right');

  protected computedClass = computed(() => {
    const side = this.side();
    const sideClasses: Record<SheetSide, string> = {
      top: 'inset-x-0 top-0 border-b rounded-t-lg max-w-2xl mx-auto',
      bottom: 'inset-x-0 bottom-0 border-t rounded-b-lg max-w-2xl mx-auto',
      left: 'inset-y-0 left-0 h-full w-full max-w-2xl border-r rounded-r-lg',
      right: 'inset-y-0 right-0 h-full w-full max-w-2xl border-l rounded-l-lg',
    };

    return cn(
      'fixed gap-4 bg-background shadow-lg overflow-y-auto',
      sideClasses[side] || sideClasses.right,
    );
  });

  protected sheetStyles = computed(() => {
    const open = this.open();
    const side = this.side();

    const transforms: Record<SheetSide, string> = {
      top: open ? 'translateY(0)' : 'translateY(-100%)',
      bottom: open ? 'translateY(0)' : 'translateY(100%)',
      left: open ? 'translateX(0)' : 'translateX(-100%)',
      right: open ? 'translateX(0)' : 'translateX(100%)',
    };

    const transform = transforms[side] || transforms.right;
    const pointerEvents = open ? 'auto' : 'none';
    const opacity = open ? '1' : '0';

    return `transform: ${transform}; transition: transform var(--sheet-transition-duration) var(--sheet-transition-easing), opacity var(--sheet-transition-duration) var(--sheet-transition-easing); opacity: ${opacity}; pointer-events: ${pointerEvents}; z-index: var(--sheet-z-content); padding: var(--sheet-padding);`;
  });
}

@Component({
  selector: 'div[spark-sheet-header]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class SheetHeaderComponent {
  protected computedClass = computed(() => {
    return 'flex flex-col space-y-2 text-center sm:text-left mb-4';
  });
}

@Component({
  selector: 'h3[spark-sheet-title]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class SheetTitleComponent {
  protected computedClass = computed(() => {
    return 'text-lg font-semibold text-foreground leading-none tracking-tight';
  });
}

@Component({
  selector: 'p[spark-sheet-description]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class SheetDescriptionComponent {
  protected computedClass = computed(() => {
    return 'text-sm text-muted-foreground';
  });
}

@Component({
  selector: 'div[spark-sheet-footer]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class SheetFooterComponent {
  protected computedClass = computed(() => {
    return 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4';
  });
}

@Component({
  selector: 'button[spark-sheet-close]',
  standalone: true,
  host: {
    '(click)': 'close.emit()',
  },
  template: '<ng-content />',
})
export class SheetCloseComponent {
  readonly close = output<void>();
}
