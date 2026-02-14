import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  type Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CommandComponent,
  CommandItemComponent,
  CommandInputComponent,
  CommandListComponent,
  CommandEmptyComponent,
  CommandGroupComponent,
} from '@app/shared/ui/command';
import * as examples from './examples/command-examples';
import type { CommandItem } from './types/command-demo.types';

/**
 * CommandDemoComponent - Command Palette Demo Page
 */
@Component({
  selector: 'app-command-demo',
  imports: [
    CommonModule,
    CommandComponent,
    CommandItemComponent,
    CommandInputComponent,
    CommandListComponent,
    CommandEmptyComponent,
    CommandGroupComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-container">
      <div class="demo-header">
        <h1>Command</h1>
        <p class="text-muted-foreground">
          Command palette component for fast command access. Supports keyboard navigation,
          filtering, and keyboard shortcuts.
        </p>
      </div>

      <div class="examples-grid">
        <div class="example-card">
          <div class="card-header">
            <h2>Basic Command Palette</h2>
            <p class="text-sm text-muted-foreground">
              Simple command palette with search and keyboard navigation.
            </p>
          </div>
          <div class="card-content">
            <div
              spark-command
              class="border border-border rounded-md bg-popover"
              [(value)]="basicFilter"
            >
              <div spark-command-input [placeholder]="filterPlaceholder()"></div>
              <div spark-command-list>
                @if (filteredBasicItems().length === 0) {
                  <div spark-command-empty>No commands found.</div>
                } @else {
                  @for (item of filteredBasicItems(); track item.value) {
                    <div
                      spark-command-item
                      [label]="item.label"
                      [value]="item.value"
                      [shortcut]="item.shortcut ?? ''"
                    ></div>
                  }
                }
              </div>
            </div>
          </div>
        </div>

        <div class="example-card">
          <div class="card-header">
            <h2>Grouped Commands</h2>
            <p class="text-sm text-muted-foreground">
              Commands organized by groups with visual separators.
            </p>
          </div>
          <div class="card-content">
            <div
              spark-command
              class="border border-border rounded-md bg-popover"
              [(value)]="groupedFilter"
            >
              <div
                spark-command-input
                [placeholder]="filterPlaceholder()"
              ></div>
              <div spark-command-list>
                @if (filteredNavigationItems().length === 0 &&
                filteredActionsItems().length === 0 &&
                filteredSettingsItems().length === 0) {
                  <div spark-command-empty>No commands found.</div>
                } @else {
                  @if (filteredNavigationItems().length > 0) {
                    <div spark-command-group [heading]="'Navigation'">
                      @for (item of filteredNavigationItems(); track item.value) {
                        <div
                          spark-command-item
                          [label]="item.label"
                          [value]="item.value"
                          [shortcut]="item.shortcut ?? ''"
                        ></div>
                      }
                    </div>
                  }
                  @if (filteredActionsItems().length > 0) {
                    <div spark-command-group [heading]="'Actions'">
                      @for (item of filteredActionsItems(); track item.value) {
                        <div
                          spark-command-item
                          [label]="item.label"
                          [value]="item.value"
                          [shortcut]="item.shortcut ?? ''"
                        ></div>
                      }
                    </div>
                  }
                  @if (filteredSettingsItems().length > 0) {
                    <div spark-command-group [heading]="'Settings'">
                      @for (item of filteredSettingsItems(); track item.value) {
                        <div
                          spark-command-item
                          [label]="item.label"
                          [value]="item.value"
                          [shortcut]="item.shortcut ?? ''"
                        ></div>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          </div>
        </div>

        <div class="example-card">
          <div class="card-header">
            <h2>Disabled Items</h2>
            <p class="text-sm text-muted-foreground">
              Commands with disabled state that cannot be selected.
            </p>
          </div>
          <div class="card-content">
            <div
              spark-command
              class="border border-border rounded-md bg-popover"
              [(value)]="disabledFilter"
            >
              <div
                spark-command-input
                [placeholder]="filterPlaceholder()"
              ></div>
              <div spark-command-list>
                @if (filteredDisabledItems().length === 0) {
                  <div spark-command-empty>No commands found.</div>
                } @else {
                  @for (item of filteredDisabledItems(); track item.value) {
                    <div
                      spark-command-item
                      [label]="item.label"
                      [value]="item.value"
                      [shortcut]="item.shortcut ?? ''"
                      [disabled]="item.disabled ?? false"
                    ></div>
                  }
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="shortcuts-reference">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts-grid">
          <div class="shortcut-item">
            <span class="shortcut-key">Arrow Down</span>
            <span class="shortcut-desc">Move to next item</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">Arrow Up</span>
            <span class="shortcut-desc">Move to previous item</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">Home</span>
            <span class="shortcut-desc">Jump to first item</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">End</span>
            <span class="shortcut-desc">Jump to last item</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">Enter</span>
            <span class="shortcut-desc">Select active item</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">Escape</span>
            <span class="shortcut-desc">Close command palette</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">Type</span>
            <span class="shortcut-desc">Filter commands</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-xl);
    }

    .demo-header {
      margin-bottom: var(--spacing-xl);
    }

    .demo-header h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: var(--spacing-md);
    }

    .examples-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }

    .example-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .card-header {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border);
    }

    .card-header h2 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: var(--spacing-sm);
    }

    .card-content {
      padding: var(--spacing-lg);
    }

    .shortcuts-reference {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
    }

    .shortcuts-reference h3 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: var(--spacing-lg);
    }

    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .shortcut-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .shortcut-key {
      font-size: 11px;
      padding: 4px 8px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-family: monospace;
      align-self: flex-start;
    }

    .shortcut-desc {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--muted-foreground);
    }
  `,
})
export class CommandDemoComponent {
  readonly basicItems = examples.basicItems;
  readonly navigationItems = examples.navigationItems;
  readonly actionsItems = examples.actionsItems;
  readonly settingsItems = examples.settingsItems;
  readonly disabledItems = examples.disabledItems;

  readonly basicFilter = signal<string>('');
  readonly groupedFilter = signal<string>('');
  readonly disabledFilter = signal<string>('');

  readonly filterPlaceholder = computed(() => 'Type to filter...');

  readonly filteredBasicItems = computed(() => {
    return this.filterItems(this.basicItems, this.basicFilter);
  });

  readonly filteredNavigationItems = computed(() => {
    return this.filterItems(this.navigationItems, this.groupedFilter);
  });

  readonly filteredActionsItems = computed(() => {
    return this.filterItems(this.actionsItems, this.groupedFilter);
  });

  readonly filteredSettingsItems = computed(() => {
    return this.filterItems(this.settingsItems, this.groupedFilter);
  });

  readonly filteredDisabledItems = computed(() => {
    return this.filterItems(this.disabledItems, this.disabledFilter);
  });

  private filterItems(items: CommandItem[], filterValue: Signal<string>): CommandItem[] {
    const filter = filterValue();
    if (!filter) return items;

    const lowerFilter = filter.toLowerCase().trim();
    return items.filter((item) =>
      item.label.toLowerCase().includes(lowerFilter),
    );
  }
}
