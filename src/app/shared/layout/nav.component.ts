import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * NavComponent - Navigation header for demo pages
 *
 * Provides consistent navigation across all demo pages with:
 * - Logo/title link to home
 * - Navigation links to demo pages
 * - Styled with "矿物与时光" theme
 *
 * @selector app-nav
 * @standalone true
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center px-4">
        <a
          routerLink="/"
          class="mr-6 flex items-center space-x-2"
          aria-label="Return to landing page">
          <span class="text-base font-semibold text-foreground">Angular Spark</span>
        </a>

        <nav class="flex items-center gap-6 text-sm font-medium">
          <a
            routerLink="/demo/button"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Button
          </a>
          <a
            routerLink="/demo/input"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Input
          </a>
          <a
            routerLink="/demo/card"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Card
          </a>
          <a
            routerLink="/demo/badge"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Badge
          </a>
          <a
            routerLink="/demo/separator"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Separator
          </a>
          <a
            routerLink="/demo/switch"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Switch
          </a>
          <a
            routerLink="/demo/sheet"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Sheet
          </a>
          <a
            routerLink="/demo/checkbox"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Checkbox
          </a>
          <a
            routerLink="/demo/alert"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Alert
          </a>
          <a
            routerLink="/demo/tabs"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Tabs
          </a>
          <a
            routerLink="/demo/avatar"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Avatar
          </a>
          <a
            routerLink="/demo/progress"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Progress
          </a>
          <a
            routerLink="/demo/skeleton"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Skeleton
          </a>
          <a
            routerLink="/demo/table"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Table
          </a>
          <a
            routerLink="/demo/slider"
            routerLinkActive="text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            class="transition-colors hover:text-primary text-muted-foreground">
            Slider
          </a>
        </nav>
      </div>
    </nav>
  `
})
export class NavComponent {}
