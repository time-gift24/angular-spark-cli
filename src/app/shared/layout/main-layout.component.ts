import { Component, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './nav.component';
import { FooterComponent } from './footer.component';

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
  imports: [RouterOutlet, NavComponent, FooterComponent],
  template: `
    <div class="min-h-screen bg-background flex flex-col">
      @if (showHeader()) {
        <header class="border-b">
          <!-- Navigation -->
          <app-nav />
        </header>
      }

      <main class="flex-1">
        <router-outlet />
      </main>

      @if (showFooter()) {
        <footer class="border-t">
          <!-- Footer content -->
          <app-footer />
        </footer>
      }
    </div>
  `
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
