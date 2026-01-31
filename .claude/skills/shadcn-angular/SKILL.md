---
name: shadcn-angular
description: Use when implementing shadcn/ui-inspired components in Angular 20+ with Tailwind CSS v4, specifically when needing to convert React component patterns to Angular standalone components with Signals, or when setting up a token-driven design system using @theme directive
---

# Angular shadcn Components

## Overview

Implement shadcn/ui-inspired components in Angular 20+ using Tailwind CSS v4's `@theme` directive for token-driven styling. Use shadcn MCP to reference designs, then build from scratch using Angular-native patterns.

**Core principle:** Reference, don't translate. Analyze React patterns, then implement idiomatic Angular.

**Complete workflow:** Component → Demo Page → Route → Navigation (ALL required)

## When to Use

✅ Building shadcn-inspired Angular components with Tailwind v4
✅ Converting React patterns to Angular Signals
✅ Creating token-driven design system

❌ Existing Angular UI library (Material, NG-ZORRO) fits
❌ Project doesn't use Tailwind CSS

## Core Pattern: @theme + Signals

**Tailwind CSS v4 tokens:**
```css
/* src/styles.css */
@import "tailwindcss";

@theme {
  --color-primary-500: hsl(210 100% 50%);
  --color-primary-hover: hsl(210 100% 45%);
  --spacing-4: 1rem;
  --radius-md: 0.375rem;
}
```

**Angular variant management:**
```typescript
@Component({
  selector: 'ui-button',
  standalone: true,
  host: { '[class]': 'classes()' }
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary'>('primary');
  classes = computed(() => `${baseClasses} ${variantClasses()}`);
}
```

**NO React libraries** - computed() replaces CVA, clsx, tailwind-merge.

## MCP Workflow

1. **Init:** `npx shadcn mcp init`
2. **Query:** `"使用 shadcn MCP 查看 [component]"`
3. **Map:** Props→input(), Events→@Output(), Hooks→Signals
4. **Extract:** Hardcoded values→@theme tokens

## React → Angular Mapping

| React | Angular | Example |
|-------|---------|---------|
| `useState` | `signal()` | State |
| `useMemo` | `computed()` | Derived state |
| `Props` | `@Input()` + `input()` | Inputs |
| `onClick` | `@Output() click` | Events |
| `{condition && <X/>}` | `@if (condition) { <X /> }` | Conditional |
| `{items.map()}` | `@for (item of items; trackBy: id)` | Lists |
| `className` | `[class]` | Dynamic classes |
| `children` | `<ng-content />` | Projection |

## Implementation Steps

**Complete workflow from component to demo page:**

### 1. Use MCP to Reference Design
```
"Use shadcn MCP to view [component-name]"
```

### 2. Define Tokens in @theme
Extract colors, spacing, variants to `src/styles.css`:
```css
@theme {
  --color-primary-500: hsl(210 100% 50%);
  --spacing-4: 1rem;
  --radius-md: 0.375rem;
}
```

### 3. Create Standalone Component
```bash
ng g c shared/ui/button --standalone
```

### 4. Implement with Signals
- Use `input()` for props
- Use `computed()` for variants
- Use new control flow (`@if`, `@for`)

### 5. **Create Demo Page** (REQUIRED - Don't Skip!)
```bash
ng g c demo/button --standalone
```

**Demo page structure:**
```
src/app/demo/button/
├── button-demo.component.ts      # Demo logic + examples config
├── button-demo.component.html    # Showcase all variants
├── button-demo.component.css     # Demo-specific styles
├── types/
│   └── button-demo.types.ts      # TypeScript interfaces
└── examples/
    └── button-examples.ts        # Example configurations
```

**Demo page pattern:**
```typescript
@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [ButtonComponent], // Import UI component
  template: `
    <h1>Button</h1>
    @for (variant of buttonVariants; track variant.label) {
      <ui-button [variant]="variant.variant">
        {{ variant.label }}
      </ui-button>
    }
  `
})
export class ButtonDemoComponent {
  readonly buttonVariants = [/* example configs */];
}
```

### 6. **Add Route** (REQUIRED - Don't Skip!)
Add to `src/app/app.routes.ts`:
```typescript
{
  path: 'demo',
  loadComponent: () => import('./shared/layout/main-layout.component')
    .then(m => m.MainLayoutComponent),
  children: [
    {
      path: 'button',  // ← Add this
      loadComponent: () => import('./demo/button/button-demo.component')
        .then(m => m.ButtonDemoComponent)
    },
    // ... other demo routes
  ]
}
```

### 7. **Add Navigation Link** (REQUIRED - Don't Skip!)
Add to `src/app/shared/layout/nav.component.ts`:
```typescript
<a
  routerLink="/demo/button"
  routerLinkActive="text-primary font-medium"
  [routerLinkActiveOptions]="{ exact: true }"
  class="transition-colors hover:text-primary text-muted-foreground">
  Button
</a>
```

**Keep links alphabetically sorted** for consistency.

## Common Mistakes

❌ **Tailwind v3 config** - Use `@theme`, not `tailwind.config.ts`
❌ **React libraries** - No CVA, clsx, tailwind-merge (use computed())
❌ **CSS variables** - Use `@theme`, not `:root`
❌ **React patterns** - Use Signals, not setter-based @Input
❌ **Skipping demo page** - Component exists but no way to see it
❌ **Forgetting route** - Demo page created but 404 when accessed
❌ **Missing nav link** - Route exists but users can't find it
❌ **Hardcoding nav links** - Should follow alphabetical order pattern

## Red Flags - STOP When You See These

- Creating `tailwind.config.ts` with `module.exports`
- Installing `class-variance-authority`, `clsx`, `tailwind-merge`
- Writing `:root { --var: value; }` instead of `@theme`
- Using `@Input() set` setters for variants
- Converting React code line-by-line
- Not using shadcn MCP to reference implementation
- **Creating component WITHOUT demo page** - Every component needs a demo!
- **Creating demo page WITHOUT adding route** - Route is required for access!
- **Adding route WITHOUT navigation link** - Users can't find your demo!
- **Thinking "I'll add demo later"** - Do it now, or it won't happen

**All of these mean: Stop. Re-read this skill. Start over.**

## Quick Reference

**Component Creation:**
- **UI Component:** `ng g c shared/ui/button --standalone`
- **Demo Page:** `ng g c demo/button --standalone`
- **MCP Query:** `"使用 shadcn MCP 查看 [component]"`

**Routing & Navigation:**
- **Route:** Add to `app.routes.ts` under `demo` children
- **Nav Link:** Add to `nav.component.ts` (alphabetically sorted)
- **Pattern:** Load component with `loadComponent()` + dynamic import

**Styling:**
- **Token:** `@theme { --token-name: value; }`
- **Use:** `<div class="bg-token-name">Content</div>`
- **Variants:** `computed(() => baseClasses + variantClasses())`

**Angular Patterns:**
- **Inputs:** `variant = input<Type>('default')`
- **Outputs:** `@Output() click = new EventEmitter<void>()`
- **Lists:** `@for (item of items; trackBy: id) { ... }`
- **Conditionals:** `@if (condition) { ... }`
