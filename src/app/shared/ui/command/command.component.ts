import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  Signal,
} from '@angular/core';
import { cn } from '@app/shared';

/**
 * CommandComponent - Root container for command palette
 *
 * Provides keyboard navigation, filtering, and selection
 * for command-like interfaces (e.g., command palette, menus).
 */
@Component({
  selector: 'div[spark-command]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"listbox"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-orientation]': '"vertical"',
    '[attr.aria-activedescendant]': 'activeDescendant()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: ` <ng-content /> `,
})
export class CommandComponent {
  readonly ariaLabel = input<string>('Command palette');
  readonly class = input<string>('');
  readonly value = model<string>('');

  readonly valueChange = output<string>();
  readonly select = output<CommandEvent>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly items = signal<CommandItemComponent[]>([]);
  private readonly itemIds = signal<string[]>([]);

  private activeIndex = signal<number>(-1);
  private typeaheadQuery = signal<string>('');
  private typeaheadTimeout: ReturnType<typeof setTimeout> | null = null;

  registerItem(item: CommandItemComponent): void {
    this.items.update((items) => [...items, item]);
    this.itemIds.update((ids) => [...ids, item.itemId()]);

    effect(() => {
      item.registerFilter(this.value);
    });

    effect(() => {
      const activeIdx = this.activeIndex();
      const itemId = item.itemId();
      const itemIndex = this.itemIds().indexOf(itemId);
      item.setActive(itemIndex === activeIdx);
    });
  }

  unregisterItem(item: CommandItemComponent): void {
    this.items.update((items) => items.filter((i) => i !== item));
    this.itemIds.update((ids) => ids.filter((id) => id !== item.itemId()));
  }

  getVisibleItems(): CommandItemComponent[] {
    const filterValue = this.value().toLowerCase().trim();
    return this.items().filter((item) => item.shouldShow(filterValue));
  }

  protected hostClass = computed(() => {
    return cn(
      'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
      this.class(),
    );
  });

  protected activeDescendant = computed(() => {
    const index = this.activeIndex();
    const ids = this.itemIds();
    return index >= 0 && index < ids.length ? ids[index] : null;
  });

  protected handleKeydown(event: KeyboardEvent): void {
    const visibleItems = this.getVisibleItems();
    if (visibleItems.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNext(visibleItems);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPrevious(visibleItems);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst(visibleItems);
        break;
      case 'End':
        event.preventDefault();
        this.focusLast(visibleItems);
        break;
      case 'Enter':
        event.preventDefault();
        this.selectActive(visibleItems);
        break;
      case 'Escape':
        event.preventDefault();
        this.value.set('');
        this.activeIndex.set(-1);
        break;
      default:
        this.handleTypeahead(event.key, visibleItems);
        break;
    }
  }

  private focusNext(items: CommandItemComponent[]): void {
    const currentIndex = this.activeIndex();
    const visibleIndices = items
      .map((item) => this.itemIds().indexOf(item.itemId()))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);

    const currentVisibleIndex = visibleIndices.indexOf(currentIndex);
    const nextVisibleIndex =
      currentVisibleIndex < visibleIndices.length - 1
        ? currentVisibleIndex + 1
        : 0;

    this.activeIndex.set(visibleIndices[nextVisibleIndex]);
    this.focusItem(items[nextVisibleIndex]);
  }

  private focusPrevious(items: CommandItemComponent[]): void {
    const currentIndex = this.activeIndex();
    const visibleIndices = items
      .map((item) => this.itemIds().indexOf(item.itemId()))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);

    const currentVisibleIndex = visibleIndices.indexOf(currentIndex);
    const prevVisibleIndex =
      currentVisibleIndex > 0 ? currentVisibleIndex - 1 : visibleIndices.length - 1;

    this.activeIndex.set(visibleIndices[prevVisibleIndex]);
    this.focusItem(items[prevVisibleIndex]);
  }

  private focusFirst(items: CommandItemComponent[]): void {
    if (items.length === 0) return;
    const firstId = items[0].itemId();
    const firstIndex = this.itemIds().indexOf(firstId);
    this.activeIndex.set(firstIndex);
    this.focusItem(items[0]);
  }

  private focusLast(items: CommandItemComponent[]): void {
    if (items.length === 0) return;
    const lastId = items[items.length - 1].itemId();
    const lastIndex = this.itemIds().indexOf(lastId);
    this.activeIndex.set(lastIndex);
    this.focusItem(items[items.length - 1]);
  }

  private selectActive(items: CommandItemComponent[]): void {
    const currentIndex = this.activeIndex();
    const activeItem = items.find(
      (item) => this.itemIds().indexOf(item.itemId()) === currentIndex,
    );

    if (activeItem) {
      this.emitSelection(activeItem);
    }
  }

  setActiveItemById(itemId: string): void {
    const index = this.itemIds().indexOf(itemId);
    if (index >= 0) {
      this.activeIndex.set(index);
    }
  }

  emitSelectForItem(item: CommandItemComponent): void {
    this.emitSelection(item);
  }

  private focusItem(item: CommandItemComponent): void {
    item.focus();
  }

  private handleTypeahead(key: string, items: CommandItemComponent[]): void {
    if (key.length !== 1 || !/^[a-zA-Z0-9]$/.test(key)) {
      return;
    }

    const currentQuery = this.typeaheadQuery();
    const newQuery = currentQuery + key.toLowerCase();
    this.typeaheadQuery.set(newQuery);

    if (this.typeaheadTimeout) {
      clearTimeout(this.typeaheadTimeout);
    }

    this.typeaheadTimeout = setTimeout(() => {
      this.typeaheadQuery.set('');
    }, 500);

    const matchingIndex = items.findIndex((item) =>
      item.label().toLowerCase().startsWith(newQuery),
    );

    if (matchingIndex >= 0) {
      const matchId = items[matchingIndex].itemId();
      const matchIndex = this.itemIds().indexOf(matchId);
      this.activeIndex.set(matchIndex);
      this.focusItem(items[matchingIndex]);
    }
  }

  private emitSelection(item: CommandItemComponent): void {
    if (item.disabled()) {
      return;
    }
    this.select.emit({
      value: item.value(),
      item,
    });
  }
}

/**
 * CommandDirective - Marker for command trigger
 */
@Directive({
  selector: '[spark-command-trigger]',
  host: {
    '(click)': 'onClick.emit()',
  },
})
export class CommandTriggerDirective {
  readonly onClick = output<void>();
}

/**
 * CommandItemComponent - Individual command item
 */
@Component({
  selector: 'div[spark-command-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"option"',
    '[attr.aria-selected]': 'isActive()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-selected]': 'isActive()',
    '[attr.tabindex]': 'isActive() || isTabindexEnabled() ? "0" : "-1"',
    '[id]': 'itemId()',
    '(click)': 'handleClick()',
    '(mouseenter)': 'handleMouseEnter()',
  },
  template: `
    <span class="flex-1 truncate">{{ label() }}</span>
    @if (shortcut()) {
      <span class="ml-auto text-xs tracking-widest text-muted-foreground">
        {{ shortcut() }}
      </span>
    }
  `,
  styles: `
    :host {
      cursor: pointer;
      user-select: none;
    }
    :host[data-disabled='true'] {
      cursor: not-allowed;
      opacity: var(--opacity-disabled);
      pointer-events: none;
    }
  `,
})
export class CommandItemComponent {
  private readonly command = inject(CommandComponent, { optional: true });
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input.required<string>();
  readonly value = input<string>('');
  readonly shortcut = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly icon = input<boolean>(false);
  readonly class = input<string>('');

  readonly itemId = signal<string>(`command-item-${Math.random().toString(36).slice(2, 9)}`);
  readonly isActive = signal<boolean>(false);
  readonly isTabindexEnabled = signal<boolean>(false);
  readonly filter = signal<string>('');

  private _destroyed = false;

  constructor() {
    setTimeout(() => {
      if (!this._destroyed && this.command) {
        this.command.registerItem(this);
      }
    });

    this.elementRef.nativeElement.addEventListener('focus', () => {
      this.isTabindexEnabled.set(true);
    });

    this.elementRef.nativeElement.addEventListener('blur', () => {
      this.isTabindexEnabled.set(false);
    });
  }

  ngOnDestroy(): void {
    this._destroyed = true;
    if (this.command) {
      this.command.unregisterItem(this);
    }
  }

  registerFilter(filter: Signal<string>): void {
    effect(() => {
      this.filter.set(filter());
    });
  }

  shouldShow(filterValue: string): boolean {
    if (!filterValue) return true;
    return this.label().toLowerCase().includes(filterValue.toLowerCase());
  }

  setActive(active: boolean): void {
    this.isActive.set(active);
  }

  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  trigger(): void {
    if (this.disabled()) {
      return;
    }
    this.command?.emitSelectForItem(this);
  }

  protected hostClass = computed(() => {
    const disabled = this.disabled();
    const active = this.isActive();

    return cn(
      'command-item relative flex gap-2 rounded-md text-sm outline-none',
      'transition-colors duration-150 ease-out',
      'data-[selected="true"]:bg-accent data-[selected="true"]:text-accent-foreground',
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:bg-accent focus-visible:text-accent-foreground',
      'data-[disabled="true"]:pointer-events-none data-[disabled="true"]:opacity-50',
      disabled
        ? 'opacity-[var(--opacity-disabled)] pointer-events-none cursor-not-allowed'
        : 'cursor-pointer',
      'px-[var(--command-item-padding-x)] py-[var(--command-item-padding-y)]',
      this.class(),
    );
  });

  protected handleClick(): void {
    if (this.disabled()) return;
    this.trigger();
  }

  protected handleMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    this.command?.setActiveItemById(this.itemId());
  }
}

/**
 * CommandInputComponent - Search input for command palette
 */
@Component({
  selector: 'div[spark-command-input]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="shrink-0 opacity-50"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      [attr.placeholder]="placeholder()"
      [value]="value()"
      (input)="handleInput($event)"
      class="flex w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      style="height: var(--command-input-height);"
    />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      border-bottom: 1px solid var(--border);
      padding: 0 var(--command-padding-x);
    }
  `,
})
export class CommandInputComponent {
  readonly placeholder = input<string>('Type a command or search...');
  readonly value = model<string>('');

  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
  }

  protected hostClass = computed(() => {
    return 'flex items-center gap-2 border-b';
  });
}

/**
 * CommandListComponent - Scrollable list container for command items
 */
@Component({
  selector: 'div[spark-command-list]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"listbox"',
  },
  template: ` <ng-content /> `,
  styles: `
    :host {
      overflow-x: hidden;
      overflow-y: auto;
    }
  `,
})
export class CommandListComponent {
  readonly class = input<string>('');

  protected hostClass = computed(() => {
    return cn(
      'max-h-[var(--command-list-max-height)] overflow-x-hidden overflow-y-auto scroll-py-1',
      this.class(),
    );
  });
}

/**
 * CommandEmptyComponent - Empty state for command list
 */
@Component({
  selector: 'div[spark-command-empty]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"status"',
    '[attr.aria-live]': '"polite"',
  },
  template: ` <ng-content /> `,
})
export class CommandEmptyComponent {
  readonly class = input<string>('');

  protected hostClass = computed(() => {
    return cn('py-6 text-center text-sm text-muted-foreground', this.class());
  });
}

/**
 * CommandGroupComponent - Groups related command items
 */
@Component({
  selector: 'div[spark-command-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"group"',
    '[attr.aria-label]': 'heading()',
  },
  template: `
    @if (heading()) {
      <div
        class="px-[var(--command-group-heading-padding-x)] py-[var(--command-group-heading-padding-y)] text-xs font-medium text-muted-foreground"
      >
        {{ heading() }}
      </div>
    }
    <ng-content />
  `,
  styles: `
    :host {
      overflow: hidden;
      padding: var(--command-group-padding-x);
    }
  `,
})
export class CommandGroupComponent {
  readonly heading = input<string>('');
  readonly class = input<string>('');

  protected hostClass = computed(() => {
    return cn('text-foreground overflow-hidden', this.class());
  });
}

/**
 * CommandSeparatorComponent - Visual separator between command groups
 */
@Component({
  selector: 'div[spark-command-separator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"separator"',
    '[attr.aria-orientation]': '"horizontal"',
  },
  template: '',
  styles: `
    :host {
      margin-left: calc(var(--command-group-padding-x) * -1);
      margin-right: calc(var(--command-group-padding-x) * -1);
    }
  `,
})
export class CommandSeparatorComponent {
  readonly class = input<string>('');

  protected hostClass = computed(() => {
    return cn('bg-border -mx-1 h-px', this.class());
  });
}

/**
 * CommandShortcutComponent - Keyboard shortcut display
 */
@Component({
  selector: 'span[spark-command-shortcut]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
  template: ` <ng-content /> `,
})
export class CommandShortcutComponent {
  readonly class = input<string>('');

  protected hostClass = computed(() => {
    return cn(
      'ml-auto text-xs tracking-widest text-muted-foreground',
      this.class(),
    );
  });
}

export interface CommandEvent {
  value: string;
  item: CommandItemComponent;
}

export type CommandShortcut = string;

export type CommandValue = string;
