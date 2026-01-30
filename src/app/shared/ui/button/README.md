# Button Component

A flexible and accessible Button component for Angular 20+, inspired by [shadcn/ui](https://ui.shadcn.com/docs/components/button), built with Tailwind CSS v4 and Angular Signals.

## Features

- **Multiple Variants**: default, destructive, outline, secondary, ghost, and link
- **Multiple Sizes**: sm, default, lg, and icon
- **Full TypeScript Support**: Type-safe props with Signals
- **No React Dependencies**: Uses Angular's native `computed()` instead of class-variance-authority
- **Tailwind CSS v4**: Built with `@theme` directive for token-driven styling
- **Accessibility**: Proper ARIA attributes and keyboard navigation
- **Disabled State**: Built-in disabled state handling
- **Customizable**: Easy to override styles with custom classes
- **Works with Buttons and Anchors**: Supports both `<button>` and `<a>` tags

## Architecture

This component follows the **Angular shadcn Components** skill guidelines:

- ✅ Uses Tailwind CSS v4 `@theme` directive for tokens
- ✅ Uses Angular Signals (`input()`, `computed()`) instead of React libraries
- ✅ No `class-variance-authority`, `clsx`, or `tailwind-merge` dependencies
- ✅ Native Angular patterns with standalone components
- ✅ ChangeDetectionStrategy.OnPush for optimal performance

## Installation

The component is already set up in your Angular project. It requires:
- Tailwind CSS v4 (already configured with `@theme` directive)
- Angular 20+ with Signals support

## Usage

### Basic Import

```typescript
import { ButtonComponent } from '@app/shared/ui/button';
```

### Basic Button

```html
<button spark-button>Click me</button>
```

### Variants

```html
<button spark-button>Default</button>
<button spark-button variant="secondary">Secondary</button>
<button spark-button variant="destructive">Destructive</button>
<button spark-button variant="outline">Outline</button>
<button spark-button variant="ghost">Ghost</button>
<button spark-button variant="link">Link</button>
```

### Sizes

```html
<button spark-button size="sm">Small</button>
<button spark-button size="default">Default</button>
<button spark-button size="lg">Large</button>
<button spark-button size="icon">
  <svg><!-- icon --></svg>
</button>
```

### Disabled State

```html
<button spark-button disabled>Disabled</button>
<button spark-button [disabled]="true">Disabled</button>
```

### With Icons

```html
<button spark-button>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
  Login with Email
</button>
```

### As a Link

```html
<a spark-button variant="link" href="/path">Link Button</a>
<a spark-button [routerLink]="['/path']">Router Link</a>
```

### With Click Handler

```typescript
import { Component } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <button spark-button (click)="handleClick($event)">
      Click Me
    </button>
  `,
})
export class ExampleComponent {
  handleClick(event: MouseEvent): void {
    console.log('Button clicked!', event);
  }
}
```

### With Custom Classes

```html
<button spark-button class="w-full rounded-full">Custom Button</button>
```

## API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Size variant |
| `class` | `string` | `''` | Additional CSS classes to apply |
| `disabled` | `boolean` | `false` | Disables the button |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `click` | `EventEmitter<MouseEvent>` | Fired when the button is clicked |

## Styling

The component uses Tailwind CSS v4 with the `@theme` directive for theming. Theme tokens are defined in `src/styles.css`:

```css
@theme {
  /* Primary colors */
  --color-primary: hsl(240 5.9% 10%);
  --color-primary-foreground: hsl(0 0% 98%);

  /* Secondary colors */
  --color-secondary: hsl(240 4.8% 95.9%);
  --color-secondary-foreground: hsl(240 5.9% 10%);

  /* Destructive colors */
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(0 0% 98%);

  /* Accent colors */
  --color-accent: hsl(240 4.8% 95.9%);
  --color-accent-foreground: hsl(240 5.9% 10%);

  /* Radius tokens */
  --radius-md: 0.375rem;

  /* Button-specific tokens */
  --button-radius: var(--radius-md);
  --button-font-size: 0.875rem;
  --button-font-weight: 500;
}
```

### Dark Mode

Dark mode is supported automatically. Add the `dark` class to any parent element to activate dark mode styling:

```html
<div class="dark">
  <button spark-button>Dark Mode Button</button>
</div>
```

## Implementation Details

### Variant Management with Signals

Unlike React implementations that use `class-variance-authority`, this component uses Angular's native `computed()` signals:

```typescript
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');

  protected computedClass = computed(() => {
    return cn(
      this.getBaseClasses(),
      this.getVariantClasses(),
      this.getSizeClasses(),
      this.class()
    );
  });

  private getVariantClasses(): string {
    const variant = this.variant();
    const variantMap: Record<ButtonVariant, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      // ... more variants
    };
    return variantMap[variant] || variantMap.default;
  }
}
```

**Benefits:**
- No React library dependencies
- Better type safety
- Smaller bundle size
- Idiomatic Angular patterns

## Component Structure

```
src/app/shared/ui/button/
├── button.component.ts    # Main button component with Signals
├── button.directive.ts    # Button directive for click handling
├── index.ts              # Public API exports
├── examples.ts           # Comprehensive usage examples
└── README.md             # This file
```

## Dependencies

- **No React libraries** (no class-variance-authority, clsx, tailwind-merge)
- Tailwind CSS v4: For styling with `@theme` directive
- Angular 20+ Signals: For reactive state management

## Migration from React/shadcn

If you're migrating from the React shadcn/ui Button component:

```jsx
// React with CVA
<Button variant="default">Click</Button>

// Angular with Signals
<button spark-button variant="default">Click</button>
```

The API is nearly identical, but the implementation is idiomatic Angular instead of React.

## Migration from Other Angular Button Libraries

```html
<!-- Angular Material -->
<button mat-button>Click</button>

<!-- Spark Button -->
<button spark-button>Click</button>

<!-- ng-bootstrap -->
<button ngbButton>Click</button>

<!-- Spark Button -->
<button spark-button variant="outline">Click</button>
```

## Best Practices

1. **Use Semantic Variants**: Choose variants that match the action's importance
   - Primary actions: `default` variant
   - Secondary actions: `secondary` or `outline` variant
   - Dangerous actions: `destructive` variant
   - Navigation: `link` or `ghost` variant

2. **Icon Buttons**: Use the `icon` size for standalone icon buttons
   ```html
   <button spark-button size="icon" aria-label="Close">
     <svg><!-- close icon --></svg>
   </button>
   ```

3. **Loading State**: Combine with loading spinner
   ```html
   <button spark-button [disabled]="loading()">
     @if (loading()) {
       <span class="spinner"></span>
     }
     {{ loading() ? 'Loading...' : 'Submit' }}
   </button>
   ```

4. **Accessibility**: Always provide meaningful content or aria-labels
   ```html
   <button spark-button aria-label="Save changes">
     <svg><!-- save icon --></svg>
   </button>
   ```

## Examples

Check out `examples.ts` for comprehensive usage examples including:
- All variants and sizes
- Icon buttons
- Disabled states
- Link buttons
- Custom classes
- Click handlers
- All variant/size combinations

## License

MIT
