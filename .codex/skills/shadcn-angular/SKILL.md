---
name: shadcn-angular
description: Use when implementing shadcn/ui-inspired components in Angular 20+ with Tailwind CSS v4, specifically when needing to convert React component patterns to Angular standalone components with Signals, when setting up a token-driven design system using @theme directive, or when creating UI components where ALL styles must use CSS variables (no hardcoded values)
---

# Angular shadcn Components

## Overview

Implement shadcn/ui-inspired components in Angular 20+ using Tailwind CSS v4's `@theme` directive for token-driven styling. Use shadcn MCP to reference designs, then build from scratch using Angular-native patterns.

**Core principle:** Reference, don't translate. Analyze React patterns, then implement idiomatic Angular.

**Iron Rule:** ALL component styles MUST use CSS variables. NO hardcoded values allowed.

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

## Iron Rule: CSS Variables Only

**THE MOST IMPORTANT RULE:** ALL component styles MUST use CSS variables. NO hardcoded pixel/rem/em values in components.

### Token Hierarchy (Follow This Order)

```
1. Global Tokens (Use First)
   --spacing-*, --radius-*, --color-*, --font-*
   ↓
2. Component-Specific Tokens (Define in styles.css)
   --{component}-padding, --{component}-height, etc.
   ↓
3. Component Variations (Reference #1 or #2)
   --{component}-padding-sm: var(--spacing-md)
```

### Mandatory Token Usage Patterns

**✅ GOOD: Using CSS variables**
```typescript
// In component
protected buttonStyle = computed(() => {
  return {
    'height': 'var(--button-height-md)',
    'padding': 'var(--button-padding-x-md)',
    'border-radius': 'var(--radius-md)',
  };
});
```

**❌ BAD: Hardcoded values**
```typescript
// NEVER do this!
protected buttonStyle = computed(() => ({
  'height': '40px',
  'padding': '12px',
  'border-radius': '4px',
}));
```

### Defining Component Tokens

When global tokens don't fit, define component-specific tokens in `styles.css`:

```css
/* src/styles.css - @theme inline section */

/* === Button === */
--button-height-sm: 1.625rem;   /* 26px */
--button-height-md: 1.875rem;   /* 30px */
--button-height-lg: 2.125rem;   /* 34px */

/* Reference global tokens where possible */
--button-padding-x-sm: var(--spacing-md);     /* 8px */
--button-padding-x-md: calc(var(--spacing-md) + var(--spacing-sm)); /* 10px */
--button-padding-x-lg: var(--spacing-lg);     /* 12px */

/* Component-specific values (when global doesn't exist) */
--button-padding-y: 0.375rem;    /* 6px */
```

### Token Selection Decision Tree

```
Need to add a style value?
│
├─ Does a global token exist?
│  ├─ Yes → Use var(--global-token)
│  └─ No → Continue
│
├─ Does a component token exist?
│  ├─ Yes → Use var(--component-token)
│  └─ No → Continue
│
└─ Create new component token in styles.css
   - Reference global token as base: --my-var: var(--spacing-md)
   - OR define new value: --my-var: 0.5rem
```

### Allowed Values (Exceptions)

These values DON'T need CSS variables:
- Unitless ratios: `1.5`, `0.5`, `2`
- Percentages: `50%`, `100%`
- calc() expressions: `calc(var(--spacing-md) * 2)`
- Time values: `200ms`, `0.3s`

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
  /* Reference global tokens where possible */
  --button-padding: var(--spacing-md);

  /* Define component-specific tokens */
  --button-height-sm: 1.625rem;  /* 26px */
  --button-height-md: 1.875rem;  /* 30px */
  --button-height-lg: 2.125rem;  /* 34px */
}
```

**CRITICAL:** All component sizing MUST use tokens from `styles.css`.

### 3. Create Standalone Component
```bash
ng g c shared/ui/button --standalone
```

### 4. Implement with Signals
- Use `input()` for props
- Use `computed()` for variants
- Use new control flow (`@if`, `@for`)
- **ALL styles via CSS variables only**

```typescript
@Component({
  selector: 'button[spark-button]',
  standalone: true,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'buttonStyle()',  // For CSS variables
  },
})
export class ButtonComponent {
  // ✅ GOOD: Using CSS variables
  protected buttonStyle = computed(() => ({
    'height': 'var(--button-height-md)',
  }));

  // ❌ BAD: Hardcoded values
  // protected buttonStyle = computed(() => ({
  //   'height': '40px',
  // }));
}
```

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

### 8. **Verify CSS Variable Usage** (REQUIRED - Don't Skip!)

After creating the component, verify NO hardcoded values exist:

```bash
# Check for hardcoded pixel values in component
grep -n "px\|rem\|em" src/app/shared/ui/button/button.component.ts \
  | grep -v "var(" \
  | grep -v "calc(" \
  | grep -v "//"
```

**Expected output:** Empty (no matches found)

**If matches found:** Replace with CSS variables from `styles.css`

**Pre-commit checklist:**
- [ ] All styles use `var(--token-name)` or `calc(var(--token))`
- [ ] No hardcoded `px`, `rem`, `em` values in component
- [ ] Component tokens defined in `styles.css` @theme inline
- [ ] Tokens reference global tokens where possible
- [ ] Demo page created with types/ and examples/
- [ ] Route added to app.routes.ts
- [ ] Navigation link added to nav.component.ts

## Common Mistakes

❌ **Tailwind v3 config** - Use `@theme`, not `tailwind.config.ts`
❌ **React libraries** - No CVA, clsx, tailwind-merge (use computed())
❌ **CSS variables** - Use `@theme`, not `:root`
❌ **React patterns** - Use Signals, not setter-based @Input
❌ **Skipping demo page** - Component exists but no way to see it
❌ **Forgetting route** - Demo page created but 404 when accessed
❌ **Missing nav link** - Route exists but users can't find it
❌ **Hardcoding nav links** - Should follow alphabetical order pattern
❌ **HARDCODED VALUES** - NEVER use `px`, `rem`, `em` directly in components
❌ **Not defining component tokens** - All component-specific values belong in `styles.css`
❌ **Defining tokens inline** - Component tokens go in `styles.css`, not in component files

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
- **Writing hardcoded values in components** - `height: '40px'`, `padding: '12px'`
- **Defining component tokens in component files** - Tokens belong in `styles.css`
- **Using Tailwind classes with hardcoded sizes** - `px-3`, `py-2` (use `var()` instead)
- **Thinking "this is just a quick value"** - ALL values need tokens

**All of these mean: Stop. Re-read this skill. Start over.**

## Quick Reference

**Component Creation:**
- **UI Component:** `ng g c shared/ui/button --standalone`
- **Demo Page:** `ng g c demo/button --standalone`
- **MCP Query:** `"使用 shadcn MCP 查看 [component]"`

**CSS Variables (CRITICAL):**
- **Define in:** `src/styles.css` @theme inline section
- **Use in components:** `var(--token-name)`
- **Global tokens:** `--spacing-*`, `--radius-*`, `--color-*`
- **Component tokens:** `--{component}-{property}-{variant}`
- **Verification:** `grep -n "px\|rem\|em" file.ts | grep -v "var("`

**Routing & Navigation:**
- **Route:** Add to `app.routes.ts` under `demo` children
- **Nav Link:** Add to `nav.component.ts` (alphabetically sorted)
- **Pattern:** Load component with `loadComponent()` + dynamic import

**Styling:**
- **Token:** `@theme { --token-name: value; }`
- **Use:** `<div class="bg-token-name">Content</div>`
- **Variants:** `computed(() => baseClasses + variantClasses())`
- **Dynamic styles:** `style['height'] = 'var(--button-height-md)'`

**Angular Patterns:**
- **Inputs:** `variant = input<Type>('default')`
- **Outputs:** `@Output() click = new EventEmitter<void>()`
- **Lists:** `@for (item of items; trackBy: id) { ... }`
- **Conditionals:** `@if (condition) { ... }`
