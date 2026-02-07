# Angular Spark CLI - Development Guidelines

## Architecture Principles

**Theme System**: All visual styling is defined in `src/styles.css` using CSS custom properties. We support multiple themes - the current "Mineral & Time" theme is just one of many possible themes. **Do NOT hardcode theme values** in components.

**Component Philosophy**:
- **Base components** (Button, Input, etc.) use shadcn/ui as reference, implemented with Angular + Tailwind
- **Complex components** (ai-chat, etc.) are compositions of base components
- Custom styles are the exception, not the rule

---

## Development Commands

### Searching shadcn Registry

```bash
# Use the MCP tool to search for components
# See: mcp__shadcn__search_items_in_registries
# Available registries: @shadcn, @acme, etc.
```

### Component Development Workflow

1. **Search shadcn** for the component you need
2. **Use MCP** to get examples and implementation details
3. **Adapt to Angular** - convert React patterns to Angular Signals + Standalone Components
4. **Use Tailwind only** - no custom CSS unless absolutely necessary

---

## STYLES - STRICT RULES

### ✅ RECOMMENDED

| Practice | Example |
|----------|---------|
| Use Tailwind utility classes | `class="bg-primary text-foreground rounded-md"` |
| Use CSS variables from styles.css | `style="color: var(--foreground)"` |
| Use `@apply` for repeated patterns | `@apply bg-muted hover:bg-muted/50` |
| Use existing component tokens | `height: var(--button-height-md)` |
| Copy from shadcn via MCP | `mcp__shadcn__view_items_in_registries` |

### ❌ FORBIDDEN

| Practice | Why |
|----------|-----|
| Hardcoded colors | Breaks theming |
| Custom `.css` files for styling | Use Tailwind instead |
| Magic numbers | Use CSS variables |
| Copy-pasting old code | May contain deprecated patterns |
| Creating new design tokens | Add to styles.css, not inline |

---

## Component Structure

### Base UI Components

```
src/app/shared/ui/{component-name}/
└── {component-name}.component.ts  # Standalone, no .css files
```

**Example**:
```typescript
@Component({
  selector: 'spk-button',
  standalone: true,
  // NO styleUrls or styles! Use Tailwind classes
  template: `
    <button [class]="classes()" (click)="clicked.emit()">
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly clicked = new EventEmitter<void>();
  readonly classes = computed(() =>
    cn(
      'inline-flex items-center justify-center rounded-md text-sm',
      'transition-colors focus-visible:outline-none focus-visible:ring-2',
      'disabled:pointer-events-none disabled:opacity-50',
      this.variant(),
      this.size()
    )
  );
}
```

### Demo Pages

```
src/app/demo/{component-name}/
├── types/           # TypeScript interfaces
├── examples/        # Example configurations
└── *.component.ts   # Demo component
```

---

## Angular Patterns

### Use Signals

```typescript
export class MyComponent {
  readonly state = signal<State>({...});
  readonly derived = computed(() => /* ... */);
  readonly effect = effect(() => /* ... */);
}
```

### Standalone Components

```typescript
@Component({
  selector: 'spk-my-component',
  standalone: true,
  imports: [CommonModule, /* ... */],
})
export class MyComponent {}
```

### Content Projection

```html
<!-- Single slot -->
<ng-content />

<!-- Named slots -->
<ng-content select="[prefix]" />
<ng-content />
<ng-content select="[suffix]" />
```

---

## Available CSS Variables (Reference)

All defined in `src/styles.css`. Use these, not hardcoded values.

### Colors
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### Spacing
- `--spacing-xs`: 2px
- `--spacing-sm`: 4px
- `--spacing-md`: 8px
- `--spacing-lg`: 12px
- `--spacing-xl`: 16px

### Radius
- `--radius`: base (4px)
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`

### Component Sizes (examples)
- `--button-height-md`: 30px
- `--input-height`: 40px
- `--avatar-size-md`: 40px

### Animations
- `--ease-spring-smooth`, `--ease-spring-bounce`, `--ease-spring-snappy`
- `--duration-spring-fast`, `--duration-spring-normal`

---

## shadcn MCP Usage

### Search for Components

```
Tool: mcp__shadcn__search_items_in_registries
Parameters:
  - registries: ["@shadcn"]
  - query: "button" or "card" or "dialog"
```

### View Implementation Details

```
Tool: mcp__shadcn__view_items_in_registries
Parameters:
  - items: ["@shadcn/button", "@shadcn/card"]
```

### Get Examples

```
Tool: mcp__shadcn__get_item_examples_from_registries
Parameters:
  - registries: ["@shadcn"]
  - query: "button-demo" or "card-example"
```

---

## Custom Styles - When to Use

### Valid Cases for Custom CSS

1. **Component-specific animations** defined in styles.css keyframes
2. **Complex selectors** not expressible with Tailwind classes
3. **Third-party library overrides** (isolated scoping)

### Process for Custom CSS

1. **Ask user first** - "This requires custom CSS for X reason. Proceed?"
2. **Use `:host` selector** for component scoping
3. **Keep it minimal** - only what Tailwind cannot do
4. **Document why** - add comment explaining the necessity

---

## Tech Stack

- **Framework**: Angular 20+
- **Styling**: Tailwind CSS v4 (NO custom CSS)
- **State**: Angular Signals
- **Language**: TypeScript 5.9
- **Components**: shadcn/ui patterns (via MCP)
- **Font**: Figtree (defined in styles.css)

---

## File Organization

```
src/
├── app/
│   ├── shared/
│   │   └── ui/              # Base components - use Tailwind only
│   ├── demo/                # Component showcase pages
│   └── app.routes.ts        # Route definitions
└── styles.css               # ALL theme variables, keyframes, base styles
```

---

## Common Patterns

### Variant Classes

```typescript
type Variant = 'default' | 'destructive' | 'outline' | 'ghost';

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};
```

### Size Classes

```typescript
type Size = 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  sm: 'h-[var(--button-height-sm)] px-2 text-xs',
  md: 'h-[var(--button-height-md)] px-2.5 text-sm',
  lg: 'h-[var(--button-height-lg)] px-3 text-base',
};
```

### Disabled State

```html
<button
  [disabled]="disabled()"
  [class.opacity-50]="disabled()"
  [class.pointer-events-none]="disabled()"
>
```

---

## Testing

- Unit tests: `*.component.spec.ts`
- Integration tests: `*.integration.spec.ts`
- Use `TestBed` with standalone components

---

## Summary

| Rule | Action |
|------|--------|
| Need a new component? | Search shadcn MCP first |
| Need styling? | Use Tailwind classes |
| Need a color? | Use CSS variable from styles.css |
| Need animation? | Use keyframes from styles.css |
| Building complex feature? | Compose base components |
| Want custom CSS? | Ask user first |
