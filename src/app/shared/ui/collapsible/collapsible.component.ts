import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { cn } from '@app/shared';

/**
 * Collapsible Root Component
 *
 * Manages the collapsible state and coordinates with trigger and content.
 * Provides accessible collapsible functionality using ARIA attributes.
 *
 * @selector div[spark-collapsible]
 * @standalone
 */
@Component({
  selector: 'div[spark-collapsible]',
  host: {
    '[class]': 'computedClass()',
    '[attr.data-state]': 'dataState()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class CollapsibleComponent {
  readonly class = input<string>('');
  readonly contentId = `collapsible-content-${Math.random().toString(36).slice(2, 9)}`;

  /**
   * Controlled open state of the collapsible
   * Can be used as two-way binding with [(open)]
   */
  readonly open = model<boolean>(false);

  /**
   * When true, disables the collapsible interaction
   */
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });

  /**
   * Event emitted when open state changes
   */
  readonly openChange = output<boolean>();

  /**
   * Computed class for the collapsible root
   */
  protected computedClass = computed(() => {
    return cn('block', this.class());
  });

  /**
   * Data state attribute for CSS animations
   * Expose this publicly for child components to access
   */
  readonly dataState = computed(() => {
    return this.open() ? 'open' : 'closed';
  });

  /**
   * Register content element reference for animation coordination
   * @internal
   */
  readonly contentElement = signal<HTMLElement | null>(null);

  /**
   * Register trigger element
   * @internal
   */
  readonly triggerElement = signal<HTMLElement | null>(null);

  /**
   * Toggle the collapsible state
   */
  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.open.update((value) => !value);
    this.openChange.emit(this.open());
  }

  /**
   * Open the collapsible
   */
  expand(): void {
    if (this.disabled() || this.open()) {
      return;
    }
    this.open.set(true);
    this.openChange.emit(true);
  }

  /**
   * Close the collapsible
   */
  collapse(): void {
    if (this.disabled() || !this.open()) {
      return;
    }
    this.open.set(false);
    this.openChange.emit(false);
  }

  /**
   * Register content element from CollapsibleContent
   * @internal
   */
  registerContent(element: HTMLElement): void {
    this.contentElement.set(element);
  }

  /**
   * Register trigger element from CollapsibleTrigger
   * @internal
   */
  registerTrigger(element: HTMLElement): void {
    this.triggerElement.set(element);
  }
}

/**
 * Collapsible Trigger Component
 *
 * Button that toggles the collapsible open/closed state.
 * Automatically wires up to parent CollapsibleComponent.
 *
 * @selector button[spark-collapsible-trigger]
 * @standalone
 */
@Component({
  selector: 'button[spark-collapsible-trigger]',
  host: {
    '[class]': 'computedClass()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.data-state]': 'dataState()',
    '[attr.aria-expanded]': 'open()',
    '[attr.aria-controls]': 'ariaControls()',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class CollapsibleTriggerComponent {
  readonly class = input<string>('');

  /**
   * Get the collapsible root from parent
   * @internal
   */
  private readonly collapsible = inject(CollapsibleComponent, {
    optional: true,
  });
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Open state from parent collapsible
   */
  protected open = computed(() => this.collapsible?.open() ?? false);

  /**
   * Disabled state from parent collapsible
   */
  protected disabled = computed(() => this.collapsible?.disabled() ?? false);

  /**
   * Is this trigger itself disabled
   */
  protected isDisabled = computed(() => {
    return this.disabled();
  });

  /**
   * Data state for CSS styling
   */
  protected dataState = computed(() => {
    return this.open() ? 'open' : 'closed';
  });

  /**
   * ARIA controls reference to content
   */
  protected ariaControls = computed(() => {
    if (!this.collapsible) {
      return '';
    }
    return this.collapsible.contentId;
  });

  /**
   * Computed trigger styles
   */
  protected computedClass = computed(() => {
    return cn(
      'flex flex-1 items-center justify-between whitespace-nowrap rounded-md text-sm font-medium transition-all',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      '[&[data-state=open]>[data-icon]]:rotate-180',
      'hover:underline hover:opacity-80',
      this.class(),
    );
  });

  /**
   * Unique ID for this trigger
   */
  readonly triggerId = computed(() => {
    return `collapsible-trigger-${Math.random().toString(36).slice(2, 9)}`;
  });

  constructor() {
    if (this.collapsible) {
      this.collapsible.registerTrigger(this.elementRef.nativeElement);
    }
  }

  protected onClick(): void {
    this.collapsible?.toggle();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onClick();
    }
  }
}

/**
 * Collapsible Content Component
 *
 * Container for collapsible content with height animation.
 * Automatically wires up to parent CollapsibleComponent.
 *
 * @selector div[spark-collapsible-content]
 * @standalone
 */
@Component({
  selector: 'div[spark-collapsible-content]',
  host: {
    '[class]': 'computedClass()',
    '[attr.id]': 'contentId()',
    '[attr.role]': 'role()',
    '[attr.data-state]': 'dataState()',
    '[style]': 'contentStyles()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div [class]="innerClass()" [style]="innerStyles()"><ng-content /></div>',
})
export class CollapsibleContentComponent {
  readonly class = input<string>('');
  readonly role = input<'region' | ''>('region');

  /**
   * Get the collapsible root from parent
   * @internal
   */
  private readonly collapsible = inject(CollapsibleComponent, {
    optional: true,
  });

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Open state from parent collapsible
   */
  protected open = computed(() => this.collapsible?.open() ?? false);
  protected contentId = computed(() => this.collapsible?.contentId ?? null);

  /**
   * Data state for CSS animations
   */
  protected dataState = computed(() => {
    return this.open() ? 'open' : 'closed';
  });

  /**
   * Computed content styles
   */
  protected computedClass = computed(() => {
    return cn(
      'overflow-hidden',
      'transition-[height] duration-300 ease-in-out',
      'data-[state=closed]:hidden',
      'data-[state=open]:animate-expand',
      'data-[state=closed]:animate-collapse',
      this.class(),
    );
  });

  /**
   * Inner wrapper class
   */
  protected innerClass = computed(() => {
    return cn('rounded-md');
  });

  /**
   * Inline styles for height animation
   */
  protected contentStyles = computed(() => {
    const open = this.open();
    const height = open ? 'var(--radix-collapsible-content-height)' : '0px';

    return {
      height: height,
      'overflow': open ? 'visible' : 'hidden',
    };
  });

  /**
   * Inner wrapper styles
   */
  protected innerStyles = computed(() => {
    return {
      '--radix-collapsible-content-height': 'var(--collapsible-content-height)',
    };
  });

  constructor() {
    effect(() => {
      if (this.collapsible) {
        this.collapsible.registerContent(this.elementRef.nativeElement);
      }
    });

    effect(() => {
      const open = this.open();
      const el = this.elementRef.nativeElement;

      if (open) {
        // Set the height to scrollHeight for animation
        const scrollHeight = el.scrollHeight;
        el.style.setProperty('--collapsible-content-height', `${scrollHeight}px`);
      }
    });
  }
}

/**
 * Collapsible Header Component
 *
 * Optional header component that combines trigger with icon.
 * Provides consistent header structure for collapsible sections.
 *
 * @selector div[spark-collapsible-header]
 * @standalone
 */
@Component({
  selector: 'div[spark-collapsible-header]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class CollapsibleHeaderComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn('flex items-center gap-2', this.class());
  });
}
