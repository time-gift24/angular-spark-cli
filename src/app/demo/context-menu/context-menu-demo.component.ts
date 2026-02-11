import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuTriggerDirective } from '@app/shared/ui/context-menu/index';
import * as examples from './examples/context-menu-examples';

/**
 * ContextMenuDemoComponent - Context Menu Demo Page
 *
 * Showcases various context menu configurations:
 * - Basic menu with shortcuts
 * - Destructive actions
 * - Icons
 * - Disabled items
 *
 * @selector app-context-menu-demo
 */
@Component({
  selector: 'app-context-menu-demo',
  imports: [CommonModule, ContextMenuTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-container">
      <!-- Header -->
      <div class="demo-header">
        <h1>Context Menu</h1>
        <p class="text-muted-foreground">
          Right-click on any area below to see the context menu in action.
        </p>
      </div>

      <!-- Examples Grid -->
      <div class="examples-grid">
        <!-- Basic Context Menu -->
        <div class="example-card">
          <div class="card-header">
            <h2>Basic Context Menu</h2>
            <p class="text-sm text-muted-foreground">
              A simple context menu with shortcuts and icons.
            </p>
          </div>
          <div class="card-content">
            <div class="context-trigger-area" [uiContextMenuTrigger]="basicMenuItems">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Right click here</span>
            </div>
          </div>
        </div>

        <!-- Destructive Actions -->
        <div class="example-card">
          <div class="card-header">
            <h2>Destructive Actions</h2>
            <p class="text-sm text-muted-foreground">
              Context menu with destructive (danger) actions.
            </p>
          </div>
          <div class="card-content">
            <div class="context-trigger-area" [uiContextMenuTrigger]="destructiveMenuItems">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Right click here</span>
            </div>
          </div>
        </div>

        <!-- Icons Only -->
        <div class="example-card">
          <div class="card-header">
            <h2>With Icons</h2>
            <p class="text-sm text-muted-foreground">
              Context menu with various icons for visual clarity.
            </p>
          </div>
          <div class="card-content">
            <div class="context-trigger-area" [uiContextMenuTrigger]="iconsMenuItems">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <span>Right click here</span>
            </div>
          </div>
        </div>

        <!-- Disabled Items -->
        <div class="example-card">
          <div class="card-header">
            <h2>Disabled Items</h2>
            <p class="text-sm text-muted-foreground">
              Context menu with disabled (non-interactive) items.
            </p>
          </div>
          <div class="card-content">
            <div class="context-trigger-area" [uiContextMenuTrigger]="disabledMenuItems">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span>Right click here</span>
            </div>
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

    .context-trigger-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      height: 150px;
      border: 2px dashed var(--border);
      border-radius: var(--radius-md);
      cursor: context-menu;
      transition: border-color var(--duration-fast, 150ms) var(--ease-out);
    }

    .context-trigger-area:hover {
      border-color: var(--accent);
    }

    .context-trigger-area svg {
      width: 24px;
      height: 24px;
      color: var(--muted-foreground);
    }

    .context-trigger-area:hover svg {
      color: var(--foreground);
    }

    .context-trigger-area span {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--muted-foreground);
    }
  `,
})
export class ContextMenuDemoComponent {
  readonly basicMenuItems = examples.basicMenuItems;
  readonly destructiveMenuItems = examples.destructiveMenuItems;
  readonly iconsMenuItems = examples.iconsMenuItems;
  readonly disabledMenuItems = examples.disabledMenuItems;
}
