import { Component } from '@angular/core';

/**
 * FooterComponent - Reusable footer component
 *
 * Displays copyright and attribution information.
 * Used in both landing page and demo layouts.
 *
 * @selector app-footer
 * @standalone true
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="w-full border-t border-border bg-background">
      <div class="container mx-auto px-4 py-6 md:py-8">
        <div class="flex flex-col items-center justify-center space-y-3 text-sm">
          <p class="text-muted-foreground text-center">
            矿物与时光 (Mineral & Time) - Design System
          </p>
          <p class="text-muted-foreground text-center">
            Built with Angular 20+ & Tailwind CSS v4
          </p>
          <div class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>&copy; 2026 Angular Spark CLI</span>
            <span>&bull;</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
