import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-button-examples',
  imports: [ButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="examples-container">
      <div class="header">
        <h1>Button Component Examples</h1>
        <p>Comprehensive examples of the Button component with various configurations</p>
      </div>

      <!-- Variants Section -->
      <section class="section">
        <h2>Variants</h2>
        <p class="section-description">Different visual styles for different contexts</p>
        <div class="button-group">
          <button spark-button variant="default">Default</button>
          <button spark-button variant="secondary">Secondary</button>
          <button spark-button variant="destructive">Destructive</button>
          <button spark-button variant="outline">Outline</button>
          <button spark-button variant="ghost">Ghost</button>
          <button spark-button variant="link">Link</button>
        </div>
      </section>

      <!-- Sizes Section -->
      <section class="section">
        <h2>Sizes</h2>
        <p class="section-description">Different sizes for different use cases</p>
        <div class="button-group">
          <button spark-button size="sm">Small</button>
          <button spark-button size="default">Default</button>
          <button spark-button size="lg">Large</button>
          <button spark-button size="icon">
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      <!-- Icon Buttons Section -->
      <section class="section">
        <h2>Icon Buttons</h2>
        <p class="section-description">Buttons with icons for visual enhancement</p>
        <div class="button-group">
          <button spark-button size="icon">
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
          <button spark-button variant="secondary" size="icon">
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
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
          <button spark-button variant="destructive" size="icon">
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
          </button>
        </div>
      </section>

      <!-- Buttons with Icons and Text -->
      <section class="section">
        <h2>Buttons with Icons and Text</h2>
        <p class="section-description">Combining icons with text for better UX</p>
        <div class="button-group">
          <button spark-button>
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
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Sign Up
          </button>
          <button spark-button variant="outline">
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
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            Toggle Theme
          </button>
          <button spark-button variant="secondary">
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
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
            Login
          </button>
        </div>
      </section>

      <!-- Disabled State -->
      <section class="section">
        <h2>Disabled State</h2>
        <p class="section-description">Buttons in disabled state</p>
        <div class="button-group">
          <button spark-button disabled>Default</button>
          <button spark-button variant="secondary" disabled>Secondary</button>
          <button spark-button variant="outline" disabled>Outline</button>
          <button spark-button variant="ghost" disabled>Ghost</button>
        </div>
      </section>

      <!-- Link as Button -->
      <section class="section">
        <h2>Link as Button</h2>
        <p class="section-description">Using anchor tags with button styling</p>
        <div class="button-group">
          <a spark-button routerLink="/" variant="default">Home</a>
          <a spark-button routerLink="/about" variant="outline">About</a>
          <a spark-button routerLink="/contact" variant="ghost">Contact</a>
        </div>
      </section>

      <!-- Custom Classes -->
      <section class="section">
        <h2>Custom Classes</h2>
        <p class="section-description">Adding custom classes for additional styling</p>
        <div class="button-group">
          <button spark-button class="w-full">Full Width</button>
          <button spark-button class="gap-4">Extra Gap</button>
          <button spark-button class="rounded-full">Rounded Full</button>
        </div>
      </section>

      <!-- With Click Handler -->
      <section class="section">
        <h2>Interactive Buttons</h2>
        <p class="section-description">Buttons with click event handlers</p>
        <div class="button-group">
          <button spark-button (click)="handleClick($event)">Click Me</button>
          <button spark-button variant="outline" (click)="handleClick($event)">Handle Click</button>
        </div>
      </section>

      <!-- All Combinations -->
      <section class="section">
        <h2>All Variant & Size Combinations</h2>
        <p class="section-description">Every variant in every size</p>
        <div class="combinations-grid">
          @for (variant of variants; track variant) {
            <div class="combination-group">
              <h3>{{ variant }}</h3>
              @for (size of sizes; track size) {
                <button spark-button [variant]="variant" [size]="size">
                  {{ size }}
                </button>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .examples-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    .header {
      margin-bottom: 3rem;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: var(--foreground);
    }

    .header p {
      font-size: 1.125rem;
      color: var(--muted-foreground);
      margin: 0;
    }

    .section {
      margin-bottom: 3rem;
      padding: 2rem;
      background: var(--card);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
    }

    .section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: var(--foreground);
    }

    .section-description {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin: 0 0 1.5rem 0;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .combinations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .combination-group {
      padding: 1rem;
      background: var(--background);
      border-radius: 0.5rem;
      border: 1px solid var(--border);
    }

    .combination-group h3 {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: capitalize;
      margin: 0 0 0.75rem 0;
      color: var(--muted-foreground);
    }

    .combination-group button {
      display: block;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    @media (max-width: 640px) {
      .examples-container {
        padding: 1rem;
      }

      .section {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .combinations-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ButtonExamplesComponent {
  variants: Array<'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'> = [
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
  ];

  sizes: Array<'default' | 'sm' | 'lg'> = ['sm', 'default', 'lg'];

  handleClick(event: MouseEvent): void {
    console.log('Button clicked!', event);
    alert('Button was clicked!');
  }
}
