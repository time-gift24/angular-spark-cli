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
    <nav class="flex flex-col h-full">
      <!-- Logo/Header Section -->
      <div class="flex h-14 items-center border-b border-border px-6">
        <a
          routerLink="/"
          class="flex items-center space-x-2"
          aria-label="Return to landing page">
          <span class="text-base font-semibold text-foreground">Angular Spark</span>
        </a>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto py-4 px-3">
        <nav class="space-y-1">
          <a
            routerLink="/demo/button"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Button
          </a>
          <a
            routerLink="/demo/input"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Input
          </a>
          <a
            routerLink="/demo/card"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Card
          </a>
          <a
            routerLink="/demo/badge"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Badge
          </a>
          <a
            routerLink="/demo/separator"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Separator
          </a>
          <a
            routerLink="/demo/switch"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Switch
          </a>
          <a
            routerLink="/demo/sheet"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Sheet
          </a>
          <a
            routerLink="/demo/checkbox"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Checkbox
          </a>
          <a
            routerLink="/demo/context-menu"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Context Menu
          </a>
          <a
            routerLink="/demo/alert"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Alert
          </a>
          <a
            routerLink="/demo/tabs"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Tabs
          </a>
          <a
            routerLink="/demo/tooltip"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Tooltip
          </a>
          <a
            routerLink="/demo/avatar"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Avatar
          </a>
          <a
            routerLink="/demo/progress"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Progress
          </a>
          <a
            routerLink="/demo/skeleton"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Skeleton
          </a>
          <a
            routerLink="/demo/table"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Table
          </a>
          <a
            routerLink="/demo/slider"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Slider
          </a>
          <a
            routerLink="/demo/liquid-glass"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Liquid Glass
          </a>
          <a
            routerLink="/demo/ai-chat-panel"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            AI Chat Panel
          </a>
          <a
            routerLink="/demo/chat-messages-card"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            Chat Messages Card
          </a>
        </nav>
      </div>
    </nav>
  `
})
export class NavComponent {}
