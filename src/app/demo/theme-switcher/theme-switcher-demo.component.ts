import { Component, inject, signal } from '@angular/core';
import { AppThemeService, type AppVisualTheme, type ThemeMode } from '@app/shared/theme';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-theme-switcher-demo',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <header class="mb-6">
        <h1 class="text-xl font-semibold mb-2">Theme Switcher Demo</h1>
        <p class="text-sm text-muted-foreground">
          Test the Theme Runtime API (Task 2) - switches work without page refresh.
        </p>
      </header>

      <section class="space-y-6">
        <!-- Visual Theme Selector -->
        <div class="rounded-md border bg-card p-4 shadow-sm">
          <h2 class="text-base font-medium mb-3">Visual Theme</h2>
          <div class="flex flex-wrap gap-2">
            @for (theme of visualThemes; track theme) {
              <button
                (click)="setVisualTheme(theme)"
                [attr.aria-pressed]="currentTheme() === theme"
                [class]="getThemeButtonClass(theme)"
                type="button"
              >
                {{ themeLabels[theme] }}
              </button>
            }
          </div>
          <p class="mt-3 text-xs text-muted-foreground">
            Current: <code class="px-1 py-0.5 rounded bg-muted">{{ currentTheme() }}</code>
          </p>
        </div>

        <!-- Mode Selector -->
        <div class="rounded-md border bg-card p-4 shadow-sm">
          <h2 class="text-base font-medium mb-3">Color Mode</h2>
          <div class="flex gap-2">
            <button
              (click)="setMode('light')"
              [attr.aria-pressed]="currentMode() === 'light'"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              [class.bg-primary]="currentMode() === 'light'"
              [class.text-primary-foreground]="currentMode() === 'light'"
              type="button"
            >
              Light
            </button>
            <button
              (click)="setMode('dark')"
              [attr.aria-pressed]="currentMode() === 'dark'"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              [class.bg-primary]="currentMode() === 'dark'"
              [class.text-primary-foreground]="currentMode() === 'dark'"
              type="button"
            >
              Dark
            </button>
            <button
              (click)="toggleMode()"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              type="button"
            >
              Toggle
            </button>
          </div>
          <p class="mt-3 text-xs text-muted-foreground">
            Current: <code class="px-1 py-0.5 rounded bg-muted">{{ currentMode() }}</code>
            <span class="ml-2">isDark: <code>{{ isDark() }}</code></span>
          </p>
        </div>

        <!-- Demo Components to Show Theme Effect -->
        <div class="rounded-md border bg-card p-4 shadow-sm">
          <h2 class="text-base font-medium mb-3">Theme Preview</h2>
          <div class="flex flex-wrap gap-3">
            <button class="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 px-2.5 py-1.5">
              Primary Button
            </button>
            <button class="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground px-2.5 py-1.5">
              Outline Button
            </button>
            <button class="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 px-2.5 py-1.5">
              Destructive
            </button>
          </div>
          <div class="mt-4 p-3 rounded-md border border-border bg-muted text-muted-foreground text-sm">
            This is a muted card component. Observe how colors change when switching themes.
          </div>
        </div>

        <!-- HTML Class Display -->
        <div class="rounded-md border bg-card p-4 shadow-sm">
          <h2 class="text-base font-medium mb-2">HTML Element Classes</h2>
          <code class="text-xs block p-2 rounded bg-muted break-all">{{ htmlClasses() }}</code>
        </div>
      </section>

      <nav class="mt-8 pt-4 border-t border-border">
        <a routerLink="/.." class="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Demo Home
        </a>
      </nav>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ThemeSwitcherDemoComponent {
  private readonly theme = inject(AppThemeService);

  readonly visualThemes: AppVisualTheme[] = ['mira', 'mineral', 'tiny3'];
  readonly themeLabels: Record<AppVisualTheme, string> = {
    mira: 'Mira (Default)',
    mineral: 'Mineral (岩彩)',
    tiny3: 'Tiny3 (Blue/Red)',
  };

  // Use signals directly from service
  readonly currentTheme = this.theme.theme;
  readonly currentMode = this.theme.mode;
  readonly isDark = this.theme.isDark;
  readonly htmlClasses = signal<string>(document.documentElement.className);

  setVisualTheme(value: AppVisualTheme): void {
    this.theme.setVisualTheme(value);
    this.htmlClasses.set(document.documentElement.className);
  }

  setMode(value: ThemeMode): void {
    this.theme.setMode(value);
    this.htmlClasses.set(document.documentElement.className);
  }

  toggleMode(): void {
    this.theme.toggleMode();
    this.htmlClasses.set(document.documentElement.className);
  }

  getThemeButtonClass(theme: AppVisualTheme): string {
    const isActive = this.currentTheme() === theme;
    const base = 'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-input hover:bg-accent hover:text-accent-foreground';
    return isActive
      ? `${base} bg-primary text-primary-foreground border-primary`
      : `${base} bg-background`;
  }
}
