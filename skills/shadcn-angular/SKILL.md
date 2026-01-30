---
name: angular-shadcn-components
description: Use when implementing shadcn/ui-inspired components in Angular 20+ with Tailwind CSS v4, specifically when needing to convert React component patterns to Angular standalone components with Signals, or when setting up a token-driven design system using @theme directive
---

# Angular shadcn Components

## Overview

Implement shadcn/ui-inspired components in Angular 20+ using Tailwind CSS v4's `@theme` directive for token-driven styling. Use shadcn MCP to reference designs, then build from scratch using Angular-native patterns.

**Core principle:** Reference, don't translate. Analyze React patterns, then implement idiomatic Angular.

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

1. **Use MCP first:** "Use shadcn MCP to view [component]"
2. **Define tokens in @theme:** Extract colors, spacing, variants to `src/styles.css`
3. **Create standalone component:** `ng g c shared/ui/button --standalone`
4. **Use Signals:** `variant = input<Type>('default')`
5. **Template:** New control flow (`@if`, `@for`)

## Common Mistakes

❌ **Tailwind v3 config** - Use `@theme`, not `tailwind.config.ts`
❌ **React libraries** - No CVA, clsx, tailwind-merge (use computed())
❌ **CSS variables** - Use `@theme`, not `:root`
❌ **React patterns** - Use Signals, not setter-based @Input

## Red Flags - STOP When You See These

- Creating `tailwind.config.ts` with `module.exports`
- Installing `class-variance-authority`, `clsx`, `tailwind-merge`
- Writing `:root { --var: value; }` instead of `@theme`
- Using `@Input() set` setters for variants
- Converting React code line-by-line
- Not using shadcn MCP to reference implementation

**All of these mean: Stop. Re-read this skill. Start over.**

## Quick Reference

- **Create:** `ng g c shared/ui/button --standalone`
- **MCP:** `"使用 shadcn MCP 查看 [component]"`
- **Token:** `@theme { --token-name: value; }`
- **Use:** `<div class="bg-token-name">Content</div>`
