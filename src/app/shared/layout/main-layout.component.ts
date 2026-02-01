import { Component, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './nav.component';

/**
 * MainLayoutComponent - Reusable layout wrapper for demo pages
 *
 * This component provides a consistent layout structure for all demo pages,
 * including optional header navigation, main content area with router outlet,
 * and optional footer.
 *
 * @selector app-main-layout
 * @standalone true
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  template: `
    <div class="min-h-screen bg-background flex flex-col md:flex-row">
      @if (showHeader()) {
        <aside
          class="w-full md:w-64 md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <!-- Sidebar Navigation -->
          <app-nav />
        </aside>
      }

      <main class="flex-1 overflow-auto p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class MainLayoutComponent {
  /**
   * Whether to show the header navigation
   * @default true
   */
  readonly showHeader = input(true);

  /**
   * Whether to show the footer
   * @default true
   */
  readonly showFooter = input(true);

  /**
   * Optional page title
   */
  readonly title = input<string | undefined>(undefined);
}
