import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  output,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

const tabsListVariants = cva(
  'rounded-lg p-[3px] data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type TabsVariant = VariantProps<typeof tabsListVariants>['variant'];

@Component({
  selector: 'ui-tabs',
  standalone: true,
  template: `
    <div [class]="computedClass()" [attr.data-orientation]="orientation()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  readonly class = input('');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly variant = input<TabsVariant>('default');

  protected computedClass = computed(() => {
    return cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', this.class());
  });
}

@Component({
  selector: 'ui-tabs-list',
  standalone: true,
  template: `
    <div [class]="computedClass()" [attr.data-variant]="variant()" role="tablist">
      <ng-content />
    </div>
  `,
  host: {
    '[class]': 'computedClass()',
    '[style]': '"height: var(--tabs-list-height)"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsListComponent {
  readonly class = input('');
  readonly variant = input<TabsVariant>('default');

  protected computedClass = computed(() => {
    return cn(tabsListVariants({ variant: this.variant() }), this.class());
  });
}

@Component({
  selector: 'ui-tabs-trigger',
  standalone: true,
  template: `
    <button
      [class]="computedClass()"
      [id]="id()"
      [attr.role]="role()"
      [attr.aria-selected]="active()"
      [attr.aria-controls]="ariaControls()"
      [disabled]="disabled()"
      (click)="onClick()"
      type="button"
    >
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsTriggerComponent {
  readonly class = input('');
  readonly value = input.required<string>();
  readonly disabled = input(false);
  readonly id = input(() => `tabs-trigger-${Math.random().toString(36).substr(2, 9)}`);

  // Get state from parent tabs content
  readonly active = input(false);
  readonly role = input<'tab'>('tab');

  // Outputs
  readonly selectTab = output<string>();

  protected ariaControls = computed(() => {
    return `tabs-content-${this.value()}`;
  });

  protected computedClass = computed(() => {
    return cn(
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-var(--tabs-trigger-inset))] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
      'data-[state=active]:bg-background dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 data-[state=active]:text-foreground',
      'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
      this.active() ? 'data-[state=active]' : '',
      this.class(),
    );
  });

  protected onClick(): void {
    if (!this.disabled()) {
      this.selectTab.emit(this.value());
    }
  }
}

@Component({
  selector: 'ui-tabs-content',
  standalone: true,
  template: `
    <div
      [class]="computedClass()"
      [id]="id()"
      [attr.role]="role()"
      [attr.aria-labelledby]="ariaLabelledby()"
      [hidden]="!active()"
    >
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsContentComponent {
  readonly class = input('');
  readonly value = input.required<string>();
  readonly active = input(false);
  readonly role = input<'tabpanel'>('tabpanel');

  protected id = computed(() => {
    return `tabs-content-${this.value()}`;
  });

  protected ariaLabelledby = computed(() => {
    return `tabs-trigger-${this.value()}`;
  });

  protected computedClass = computed(() => {
    return cn('flex-1 outline-none', this.class());
  });
}
