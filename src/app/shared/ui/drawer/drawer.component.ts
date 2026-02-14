import {
  Component,
  Directive,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { cn } from '@app/shared';

export type DrawerSide = 'top' | 'right' | 'bottom' | 'left';

@Directive({
  selector: '[spark-drawer-trigger]',
})
export class DrawerTriggerComponent {}

@Component({
  selector: 'div[spark-drawer-overlay]',
  host: {
    '[class]': 'computedClass()',
    '[style]': 'overlayStyles()',
    '(click)': 'close.emit()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DrawerOverlayComponent {
  readonly open = input<boolean>(false);
  readonly close = output<void>();

  protected computedClass = computed(() => {
    return 'fixed inset-0 bg-[var(--drawer-overlay-bg)]';
  });

  protected overlayStyles = computed(() => {
    const open = this.open();
    const opacity = open ? '1' : '0';
    const pointerEvents = open ? 'auto' : 'none';
    return `opacity: ${opacity}; transition: opacity var(--drawer-transition-duration) var(--drawer-transition-easing); pointer-events: ${pointerEvents}; z-index: var(--drawer-z-overlay);`;
  });
}

@Component({
  selector: 'div[spark-drawer-content]',
  host: {
    '[class]': 'computedClass()',
    '[style]': 'drawerStyles()',
    role: 'dialog',
    '[attr.aria-modal]': 'open() ? "true" : null',
    '[attr.aria-hidden]': 'open() ? null : "true"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[attr.aria-describedby]': 'ariaDescribedby()',
    '[attr.tabindex]': '-1',
    '[attr.data-drawer-direction]': 'side()',
    '(keydown.escape)': 'onEscape($event)',
    '(keydown)': 'onKeydown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DrawerContentComponent implements OnDestroy {
  readonly open = input<boolean>(false);
  readonly side = input<DrawerSide>('right');
  readonly ariaLabel = input<string | null>('Drawer dialog');
  readonly ariaLabelledby = input<string | null>(null);
  readonly ariaDescribedby = input<string | null>(null);
  readonly close = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private wasOpen = false;
  private previousActiveElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      if (open && !this.wasOpen) {
        this.wasOpen = true;
        this.previousActiveElement =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        queueMicrotask(() => this.focusInitialElement());
      } else if (!open && this.wasOpen) {
        this.wasOpen = false;
        this.restoreFocus();
      }
    });
  }

  protected computedClass = computed(() => {
    const side = this.side();
    const baseClasses = 'group/drawer-content fixed z-50 flex h-auto bg-background shadow-lg';

    const sideClasses: Record<DrawerSide, string> = {
      top: 'inset-x-0 top-0 border-b rounded-b-lg mx-auto w-full max-h-[var(--drawer-max-height-top)]',
      bottom: 'inset-x-0 bottom-0 border-t rounded-t-lg mx-auto w-full max-h-[var(--drawer-max-height-bottom)]',
      left: 'inset-y-0 left-0 h-full w-full border-r rounded-r-lg max-w-[var(--drawer-max-width-side)]',
      right: 'inset-y-0 right-0 h-full w-full border-l rounded-l-lg max-w-[var(--drawer-max-width-side)]',
    };

    return cn(baseClasses, sideClasses[side] || sideClasses.right);
  });

  protected drawerStyles = computed(() => {
    const open = this.open();
    const side = this.side();

    const transforms: Record<DrawerSide, string> = {
      top: open ? 'translateY(0)' : 'translateY(-100%)',
      bottom: open ? 'translateY(0)' : 'translateY(100%)',
      left: open ? 'translateX(0)' : 'translateX(-100%)',
      right: open ? 'translateX(0)' : 'translateX(100%)',
    };

    const transform = transforms[side] || transforms.right;
    const pointerEvents = open ? 'auto' : 'none';
    const opacity = open ? '1' : '0';

    return `transform: ${transform}; transition: transform var(--drawer-transition-duration) var(--drawer-transition-easing), opacity var(--drawer-transition-duration) var(--drawer-transition-easing); opacity: ${opacity}; pointer-events: ${pointerEvents}; z-index: var(--drawer-z-content); padding: var(--drawer-padding);`;
  });

  protected onEscape(event: KeyboardEvent): void {
    event.stopPropagation();
    this.close.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    if (!this.open()) {
      return;
    }

    const focusables = this.getFocusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      this.host.nativeElement.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  private focusInitialElement(): void {
    const focusables = this.getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
      return;
    }
    this.host.nativeElement.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const root = this.host.nativeElement;
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const elements = Array.from(root.querySelectorAll(focusableSelector));
    return elements.filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && !el.hasAttribute('hidden') && !el.getAttribute('aria-hidden'),
    );
  }

  private restoreFocus(): void {
    if (!this.previousActiveElement) {
      return;
    }
    this.previousActiveElement.focus();
    this.previousActiveElement = null;
  }
}

@Component({
  selector: 'div[spark-drawer-header]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DrawerHeaderComponent {
  protected computedClass = computed(() => {
    return 'flex flex-col gap-[var(--spacing-sm)] p-[var(--drawer-padding)] group-data-[drawer-direction=bottom]/drawer-content:text-center group-data-[drawer-direction=top]/drawer-content:text-center md:gap-[var(--spacing-md)] md:text-left';
  });
}

@Component({
  selector: 'h3[spark-drawer-title]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DrawerTitleComponent {
  protected computedClass = computed(() => {
    return 'text-lg font-semibold text-foreground leading-none tracking-tight';
  });
}

@Component({
  selector: 'p[spark-drawer-description]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DrawerDescriptionComponent {
  protected computedClass = computed(() => {
    return 'text-sm text-muted-foreground';
  });
}

@Component({
  selector: 'div[spark-drawer-footer]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DrawerFooterComponent {
  protected computedClass = computed(() => {
    return 'mt-auto flex flex-col gap-[var(--spacing-sm)] p-[var(--drawer-padding)]';
  });
}

@Component({
  selector: 'div[spark-drawer-handle]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DrawerHandleComponent {
  protected computedClass = computed(() => {
    return 'mx-auto mt-4 hidden h-2 w-[var(--drawer-handle-width)] shrink-0 rounded-full bg-muted group-data-[drawer-direction=bottom]/drawer-content:block';
  });
}

@Directive({
  selector: '[spark-drawer-close]',
  host: {
    '(click)': 'close.emit()',
  },
})
export class DrawerCloseComponent {
  readonly close = output<void>();
}
