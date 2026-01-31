# Token Extraction Upgrade - Architecture Plan

**Created:** 2026-01-31
**Status:** In Progress
**Objective:** Extract all hardcoded values from shadcn-inspired components into CSS variables in styles.css

---

## Context

Following a comprehensive code review, multiple hardcoded values were identified across components. This upgrade aims to achieve **100% token coverage** for complete theme customization via `styles.css`.

**Current Token Coverage:** ~65%
**Target Token Coverage:** 100%

---

## Architecture Design

### Token Categories

1. **Component Sizing Tokens** - Dimensions for badges, cards, checkboxes, switches
2. **Component Spacing Tokens** - Padding for form components, alerts, cards
3. **Animation Tokens** - Duration and easing for transitions
4. **Z-Index Tokens** - Layering for overlays and modals
5. **Icon Sizing Tokens** - Consistent icon sizes across components

### Token Naming Convention

Follow shadcn/ui convention:
```css
--{component}-{property}-{variant}: value;
```

Examples:
- `--switch-width-sm`, `--switch-width-md`
- `--card-padding`, `--card-padding-sm`
- `--sheet-transition-duration`
- `--icon-size-sm`

---

## Task List

### ✅ Task 1: Add Comprehensive Tokens to styles.css
**Priority:** HIGH

**Add to `@theme inline` section:**

```css
/* === Component Sizing Tokens === */

/* Badge */
--badge-padding-x: 0.5rem;   /* 8px */
--badge-padding-y: 0.125rem; /* 2px */
--badge-radius: 9999px;

/* Card */
--card-padding: 1.5rem;      /* 24px */
--card-padding-sm: 1rem;     /* 16px */

/* Checkbox */
--checkbox-size: 1rem;              /* 16px */
--checkbox-icon-size: 0.875rem;     /* 14px */
--checkbox-border-radius: 4px;

/* Icon sizing */
--icon-size-xs: 0.75rem;     /* 12px */
--icon-size-sm: 0.875rem;    /* 14px */
--icon-size-md: 1rem;        /* 16px */

/* Input */
--input-padding-x: 0.75rem;  /* 12px */
--input-padding-y: 0.25rem;  /* 4px */

/* Alert */
--alert-padding-x: 1rem;     /* 16px */
--alert-padding-y: 0.75rem;  /* 12px */
--alert-radius: var(--radius-lg);

/* Switch */
--switch-width-sm: 1.5rem;         /* 24px */
--switch-height-sm: 0.875rem;      /* 14px */
--switch-width-md: 2rem;           /* 32px */
--switch-height-md: 1.125rem;      /* 18px */
--switch-thumb-size-sm: 0.75rem;   /* 12px */
--switch-thumb-size-md: 1rem;      /* 16px */
--switch-thumb-translate: calc(100% - 2px);

/* Tabs */
--tabs-list-height: 2.25rem;         /* 36px */
--tabs-trigger-padding-x: 0.5rem;   /* 8px */
--tabs-trigger-padding-y: 0.25rem;  /* 4px */
--tabs-trigger-inset: 1px;

/* Sheet */
--sheet-transition-duration: 300ms;
--sheet-transition-easing: ease-out;
--sheet-overlay-bg: oklch(0 0 0 / 80%);
--sheet-padding: 1.5rem;       /* 24px */
--sheet-z-overlay: 50;
--sheet-z-content: 50;
--sheet-max-width: 28rem;      /* 448px */

/* Animation durations (reusable) */
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

**Verification:**
- [ ] All tokens added to `@theme inline` section
- [ ] No syntax errors in CSS
- [ ] Token naming follows convention

---

### ✅ Task 2: Refactor Switch Component
**File:** `src/app/shared/ui/switch/switch.component.ts`
**File:** `src/app/shared/ui/switch/switch.component.css`

**Changes:**

1. **TypeScript** - Replace hardcoded sizes:
```typescript
// OLD:
const sizeClasses = size === 'sm'
  ? 'h-3.5 w-6'
  : 'h-[1.15rem] w-8';

// NEW: Use computed styles
protected buttonStyle = computed(() => {
  const size = this.size();
  return {
    height: size === 'sm' ? 'var(--switch-height-sm)' : 'var(--switch-height-md)',
    width: size === 'sm' ? 'var(--switch-width-sm)' : 'var(--switch-width-md)',
  };
});
```

2. **CSS** - Replace all hardcoded values:
```css
/* OLD */
:host([data-size="default"]) .switch-thumb {
  width: 1rem;
  height: 1rem;
}

/* NEW */
:host([data-size="default"]) .switch-thumb {
  width: var(--switch-thumb-size-md);
  height: var(--switch-thumb-size-md);
}

:host([data-size="sm"]) .switch-thumb {
  width: var(--switch-thumb-size-sm);
  height: var(--switch-thumb-size-sm);
}

/* Transform also uses token */
:host([data-size="default"][data-state="checked"]) .switch-thumb,
:host([data-size="sm"][data-state="checked"]) .switch-thumb {
  transform: translateX(var(--switch-thumb-translate));
}
```

**Verification:**
- [ ] No hardcoded pixel/rem values in TypeScript
- [ ] No hardcoded pixel/rem values in CSS (except colors)
- [ ] Component visually unchanged after refactor

---

### ✅ Task 3: Refactor Checkbox Component
**File:** `src/app/shared/ui/checkbox/checkbox.component.ts`

**Changes:**

Replace inline styles with tokens:

```typescript
// OLD:
styles: [`
  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
  }
  input[type="checkbox"]:checked {
    background-size: 0.875rem;
  }
`]

// NEW:
styles: [`
  input[type="checkbox"] {
    width: var(--checkbox-size);
    height: var(--checkbox-size);
    border-radius: var(--checkbox-border-radius);
  }
  input[type="checkbox"]:checked {
    background-size: var(--checkbox-icon-size);
  }
`]
```

**Verification:**
- [ ] No hardcoded sizes
- [ ] Checkbox renders correctly

---

### ✅ Task 4: Refactor Card Component
**File:** `src/app/shared/ui/card/card.component.ts`

**Changes:**

Replace hardcoded padding:

```typescript
// CardHeaderComponent
// OLD: 'flex flex-col space-y-1.5 p-6'
// NEW: Add host binding for padding
host: {
  '[class]': 'computedClass()',
  '[style.padding]': 'var(--card-padding)',
}

// CardContentComponent
// OLD: 'p-6 pt-0'
// NEW: Use computed style
protected cardStyle = computed(() => ({
  padding: 'var(--card-padding)',
  paddingTop: '0',
}));
```

**Verification:**
- [ ] All padding uses tokens
- [ ] Card layout unchanged

---

### ✅ Task 5: Refactor Badge Component
**File:** `src/app/shared/ui/badge/badge.component.ts`

**Changes:**

```typescript
// OLD: 'px-2 py-0.5'
// NEW: Use computed style
protected badgeStyle = computed(() => ({
  paddingX: 'var(--badge-padding-x)',
  paddingY: 'var(--badge-padding-y)',
}));
```

**Verification:**
- [ ] Padding uses tokens
- [ ] Badge size unchanged

---

### ✅ Task 6: Refactor Alert Component
**File:** `src/app/shared/ui/alert/alert.component.ts`

**Changes:**

Update base variant classes:

```typescript
const alertVariants = cva(
  // OLD: 'px-4 py-3'
  // NEW: Remove px/py, add to host style
  'relative w-full rounded-lg border text-sm grid...',
  {
    // Add style binding to component
  }
);

// In component:
host: {
  '[class]': 'computedClass()',
  '[style.padding]': 'var(--alert-padding-y) var(--alert-padding-x)',
}
```

**Verification:**
- [ ] Padding uses tokens

---

### ✅ Task 7: Refactor Input Component
**File:** `src/app/shared/ui/input/input.component.ts`

**Changes:**

```typescript
// OLD: 'px-3 py-1'
// NEW: Use computed style
protected inputStyle = computed(() => ({
  paddingX: 'var(--input-padding-x)',
  paddingY: 'var(--input-padding-y)',
}));
```

**Verification:**
- [ ] Padding uses tokens
- [ ] Input height unchanged

---

### ✅ Task 8: Refactor Tabs Component
**File:** `src/app/shared/ui/tabs/tabs.component.ts`

**Changes:**

1. Replace hardcoded height in tabsListVariants:

```typescript
// OLD: 'group-data-[orientation=horizontal]/tabs:h-9'
// NEW: Use style binding
```

2. Add host style binding for tabs list:

```typescript
@Component({
  selector: 'ui-tabs-list',
  host: {
    '[class]': 'computedClass()',
    '[style.height]': 'var(--tabs-list-height)',
  },
})
```

**Verification:**
- [ ] Height uses token
- [ ] Tabs render correctly

---

### ✅ Task 9: Refactor Sheet Component
**File:** `src/app/shared/ui/sheet/sheet.component.ts`

**Changes:**

1. **SheetOverlayComponent:**
```typescript
// OLD: '[style.transition]': '"opacity 300ms ease-in-out"'
// NEW: '[style.transition]': '"opacity var(--sheet-transition-duration) var(--sheet-transition-easing)"'

// OLD: 'bg-black/80'
// NEW: 'bg-[var(--sheet-overlay-bg)]'
```

2. **SheetContentComponent:**
```typescript
// OLD: '[style.transition]': '"transform 300ms ease-out, opacity 300ms ease-out"'
// NEW: Use token

// OLD: 'z-50'
// NEW: Add host binding for z-index
host: {
  '[class]': 'computedClass()',
  '[style.zIndex]': 'var(--sheet-z-content)',
}
```

3. **Sheet header/content padding:**
```typescript
// OLD: 'p-6'
// NEW: '[style.padding]': 'var(--sheet-padding)'
```

**Verification:**
- [ ] All animations use tokens
- [ ] All z-index values use tokens
- [ ] Sheet transitions work correctly

---

### ✅ Task 10: Final Code Review
**Tool:** codex-code-review

Run comprehensive review on all changes:
- Verify 100% token coverage for sizing/spacing
- Check for any remaining hardcoded values
- Validate component functionality
- Ensure no visual regressions

**Success Criteria:**
- [ ] Zero hardcoded sizing values (except 0/1 for borders)
- [ ] Zero hardcoded spacing values
- [ ] All component dimensions customizable via styles.css
- [ ] All animation durations customizable via styles.css
- [ ] All components visually unchanged
- [ ] Code review passes with no issues

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-31 | Initial plan created | System |

---

## Definition of Done

- [x] All tasks completed
- [ ] Code review passes (codex-code-review)
- [ ] No hardcoded values in components (except colors which use semantic tokens)
- [ ] All tokens documented in styles.css with comments
- [ ] Visual regression test passed (components look identical)
- [ ] Token coverage reaches 100% for sizing/spacing/animations
