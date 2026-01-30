import { Component, signal } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-demo-button-page',
  standalone: true,
  imports: [ButtonComponent, DatePipe],
  template: `
    <div class="min-h-screen bg-background p-6">
      <div class="mx-auto max-w-4xl space-y-6">
        <div class="space-y-2">
          <h1>Button Component</h1>
          <p class="text-muted-foreground">
            A flexible and accessible button component built with Angular 20+ and Tailwind CSS v4
          </p>
        </div>

        <!-- Variants Section -->
        <div class="space-y-3 rounded-md border bg-card p-4">
          <h2>Variants</h2>
          <div class="flex flex-wrap items-center gap-3">
            <button spark-button>Default</button>
            <button spark-button variant="secondary">Secondary</button>
            <button spark-button variant="destructive">Destructive</button>
            <button spark-button variant="outline">Outline</button>
            <button spark-button variant="ghost">Ghost</button>
            <button spark-button variant="link">Link</button>
          </div>
        </div>

        <!-- Sizes Section -->
        <div class="space-y-3 rounded-md border bg-card p-4">
          <h2>Sizes</h2>
          <div class="flex flex-wrap items-center gap-3">
            <button spark-button size="sm">Small</button>
            <button spark-button size="default">Default</button>
            <button spark-button size="lg">Large</button>
            <button spark-button size="icon" class="rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Disabled State Section -->
        <div class="space-y-3 rounded-md border bg-card p-4">
          <h2>Disabled State</h2>
          <div class="flex flex-wrap items-center gap-3">
            <button spark-button disabled>Disabled</button>
            <button spark-button variant="outline" disabled>Disabled Outline</button>
            <button spark-button variant="secondary" disabled>Disabled Secondary</button>
          </div>
        </div>

        <!-- With Icons Section -->
        <div class="space-y-3 rounded-md border bg-card p-4">
          <h2>With Icons</h2>
          <div class="flex flex-wrap items-center gap-3">
            <button spark-button>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              Login
            </button>
            <button spark-button variant="outline">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Theme
            </button>
            <button spark-button variant="secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Clock
            </button>
          </div>
        </div>

        <!-- Interactive Demo Section -->
        <div class="space-y-3 rounded-md border bg-card p-4">
          <h2>Interactive Demo</h2>
          <p class="text-muted-foreground">Click the button to see the event handler in action:</p>
          <div class="flex flex-wrap items-center gap-3">
            <button spark-button (click)="handleClick()">
              Click Me ({{ clickCount() }} clicks)
            </button>
            <button spark-button variant="outline" (click)="resetCount()">
              Reset Counter
            </button>
          </div>
          @if (lastClickTime()) {
            <p class="text-xs text-muted-foreground">
              Last clicked: {{ lastClickTime() | date:'medium' }}
            </p>
          }
        </div>

        <!-- Dark Mode Preview Section -->
        <div class="space-y-3 rounded-md border bg-card p-4">
          <h2>Dark Mode Preview</h2>
          <p class="text-muted-foreground">Preview buttons in dark mode:</p>
          <div class="dark rounded-md border bg-background p-4">
            <div class="flex flex-wrap items-center gap-3">
              <button spark-button>Default</button>
              <button spark-button variant="secondary">Secondary</button>
              <button spark-button variant="outline">Outline</button>
              <button spark-button variant="ghost">Ghost</button>
              <button spark-button variant="link">Link</button>
            </div>
          </div>
        </div>

        <!-- Usage Example Section -->
        <div class="space-y-3 rounded-md border bg-card p-4">
          <h2>Usage Example</h2>
          <div class="space-y-2">
            <p class="text-xs font-semibold">See the README.md file for usage examples</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DemoButtonPageComponent {
  readonly clickCount = signal(0);
  readonly lastClickTime = signal<Date | null>(null);

  handleClick(): void {
    this.clickCount.update(count => count + 1);
    this.lastClickTime.set(new Date());
    console.log(`Button clicked! Total clicks: ${this.clickCount()}`);
  }

  resetCount(): void {
    this.clickCount.set(0);
    this.lastClickTime.set(null);
    console.log('Counter reset!');
  }
}
