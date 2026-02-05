# Liquid Glass Activation State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add visual activation state to liquid-glass directive with brighter border and enhanced glow on hover/focus

**Architecture:** Separate border layer (already exists) gets style updates based on OR-combined hover/focus state. New CSS variable `--accent-hover` provides theme-aware brighter color.

**Tech Stack:** Angular 20+, TypeScript, CSS custom properties, Renderer2 API

---

## Task 1: Add CSS Variable --accent-hover

**Files:**
- Modify: `src/styles.css`

**Step 1: Add --accent-hover to :root (light mode)**

In the `:root` section (around line 214), add after `--accent`:

```css
/* Accent - 泥金 (Gold): #C8A051 - 极少使用,边框/icon/悬停效果 */
--accent: oklch(0.7 0.12 75);
--accent-foreground: oklch(0.98 0.01 85);
--accent-hover: oklch(0.8 0.15 75); /* Brighter, more saturated */
```

**Step 2: Add --accent-hover to .dark mode**

In the `.dark` section (around line 273), add after `--accent`:

```css
/* Accent - 亮泥金: 暗夜中的金色点缀 */
--accent: oklch(0.75 0.14 75);
--accent-foreground: oklch(0.2 0.04 230);
--accent-hover: oklch(0.82 0.16 75); /* Brighter, more saturated */
```

**Step 3: Verify syntax**

Run: `npm start` and check browser console for CSS parsing errors
Expected: No errors, app loads successfully

**Step 4: Commit**

```bash
git add src/styles.css
git commit -m "feat(styles): add --accent-hover color variable for activation states

Light mode: oklch(0.8 0.15 75) - brighter gold
Dark mode: oklch(0.82 0.16 75) - enhanced golden glow

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add isFocused State Property

**Files:**
- Modify: `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts`

**Step 1: Add isFocused property**

In the "Hover State" section (around line 302), add after `isHovered`:

```typescript
// ----- Hover State -----

/** Whether the mouse is hovering over the element */
private isHovered = false;

/** Whether the element has keyboard focus */
private isFocused = false;
```

**Step 2: Add isActivated() method**

After the hover state section (around line 306), add:

```typescript
// ----- Hover State -----

/** Whether the mouse is hovering over the element */
private isHovered = false;

/** Whether the element has keyboard focus */
private isFocused = false;

/**
 * Check if element is in activated state
 *
 * Element is activated when EITHER hovered OR focused
 *
 * @returns true if element should show activation styling
 */
private isActivated(): boolean {
  return this.isHovered || this.isFocused;
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts
git commit -m "feat(liquid-glass): add focus state tracking

Add isFocused property and isActivated() helper method.
Activation state is logical OR of hover and focus states.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Focus Event Listeners

**Files:**
- Modify: `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts`

**Step 1: Add @HostListener for focus event**

After the `onPointerEnter()` method (around line 588), add:

```typescript
  /**
   * Handle focus event (keyboard navigation)
   *
   * Sets focused state and updates border to show activation
   */
  @HostListener('focus')
  onFocus(): void {
    this.isFocused = true;
    this.updateBorderColor();
  }
```

**Step 2: Add @HostListener for blur event**

After the `onFocus()` method, add:

```typescript
  /**
   * Handle blur event (loss of keyboard focus)
   *
   * Clears focused state and restores normal border if not hovered
   */
  @HostListener('blur')
  onBlur(): void {
    this.isFocused = false;
    this.updateBorderColor();
  }
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts
git commit -m "feat(liquid-glass): add focus/blur event listeners

Support keyboard navigation by tracking focus state.
Focus triggers same activation styling as hover.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update updateBorderColor() to Use Accent-Hover

**Files:**
- Modify: `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts`

**Step 1: Replace updateBorderColor() implementation**

Find the `updateBorderColor()` method (around line 650) and replace entirely with:

```typescript
  /**
   * Update border color based on hover/focus state
   *
   * When activated (hovered OR focused): uses brighter accent color with enhanced glow
   * When not activated: uses normal border color from theme or custom input
   */
  private updateBorderColor(): void {
    if (!this.borderLayer) return;

    const baseColor = this.lgBorder || 'var(--accent)';
    const activeColor = 'var(--accent-hover)';

    if (this.isActivated()) {
      // Activated state: brighter border with enhanced glow
      this.r.setStyle(this.borderLayer, 'border-color', activeColor);
      this.r.setStyle(
        this.borderLayer,
        'box-shadow',
        '0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 1px var(--accent), 0 0 12px var(--accent-hover)',
      );
    } else {
      // Default state: normal border with subtle shadow
      this.r.setStyle(this.borderLayer, 'border-color', baseColor);
      this.r.setStyle(
        this.borderLayer,
        'box-shadow',
        '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
      );
    }
  }
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts
git commit -m "feat(liquid-glass): use --accent-hover for activation state

Replace border color with --accent-hover when activated.
Enhanced box-shadow uses both accent and accent-hover for layered glow.
Activation triggers: hover OR focus (logical OR).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Manual Testing - Visual Verification

**Files:**
- No file changes

**Step 1: Start dev server**

Run: `npm start`
Expected: Server starts at http://localhost:4200/

**Step 2: Open demo page**

Navigate to: http://localhost:4200/demo/liquid-glass

**Step 3: Test mouse hover**

Action: Move mouse over any liquid-glass card
Expected:
- Border color becomes brighter (more vibrant gold)
- Noticeable glow effect appears
- Transition is smooth (0.2s)

**Step 4: Test keyboard focus**

Action: Press Tab key until a liquid-glass card has focus
Expected:
- Same visual activation as hover
- Focus ring may also appear (browser default)

**Step 5: Test state persistence**

Action: Hover over card, then press Tab to move focus away
Expected:
- Border stays activated while hovered
- When mouse leaves, border deactivates

**Step 6: Test combined state**

Action: Click card to focus, keep mouse hovered
Expected:
- Border stays activated
- When mouse leaves, border stays activated (because focused)

**Step 7: Test dark mode**

Action: Toggle dark mode if available, repeat steps 3-6
Expected:
- Same behavior with dark theme colors
- `--accent-hover` is appropriate brightness for dark background

**Step 8: Document results**

If all tests pass: Create note "✅ Manual testing passed - all scenarios verified"
If issues found: Document specific failures for debugging

---

## Task 6: Add Unit Tests for State Logic

**Files:**
- Create: `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.spec.ts`

**Step 1: Create test file structure**

Create the spec file with basic imports and setup:

```typescript
import { Component, ViewChild, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LiquidGlassDirective } from './liquid-glass.directive';

// Test component to host the directive
@Component({
  template: `<div liquidGlass [lgTheme]="'mineral-dark'" class="p-4">Test Content</div>`,
  standalone: true,
  imports: [LiquidGlassDirective],
})
class TestHostComponent {
  @ViewChild(LiquidGlassDirective, { static: true })
  directive!: LiquidGlassDirective;
}

describe('LiquidGlassDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: LiquidGlassDirective;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    directive = fixture.componentInstance.directive;
    element = fixture.nativeElement.querySelector('[liquidGlass]');
  });

  it('should create directive', () => {
    expect(directive).toBeTruthy();
  });

  it('should initialize with isHovered = false', () => {
    expect(directive['isHovered']).toBe(false);
  });

  it('should initialize with isFocused = false', () => {
    expect(directive['isFocused']).toBe(false);
  });

  describe('isActivated', () => {
    it('should return false when neither hovered nor focused', () => {
      directive['isHovered'] = false;
      directive['isFocused'] = false;
      expect(directive['isActivated']()).toBe(false);
    });

    it('should return true when hovered but not focused', () => {
      directive['isHovered'] = true;
      directive['isFocused'] = false;
      expect(directive['isActivated']()).toBe(true);
    });

    it('should return true when focused but not hovered', () => {
      directive['isHovered'] = false;
      directive['isFocused'] = true;
      expect(directive['isActivated']()).toBe(true);
    });

    it('should return true when both hovered and focused', () => {
      directive['isHovered'] = true;
      directive['isFocused'] = true;
      expect(directive['isActivated']()).toBe(true);
    });
  });
});
```

**Step 2: Run tests**

Run: `ng test --include='**/liquid-glass.directive.spec.ts'`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.spec.ts
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts
git commit -m "test(liquid-glass): add unit tests for activation state logic

Test coverage:
- Initial state (isHovered=false, isFocused=false)
- isActivated() returns correct boolean for all state combinations
- OR logic: true if EITHER hover or focus is true

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update Design Document with Implementation Notes

**Files:**
- Modify: `docs/plans/2026-02-04-liquid-glass-activation-state-design.md`

**Step 1: Add implementation completion note**

At the end of the document, add:

```markdown
## Implementation Status

**Completed**: 2026-02-04

All tasks completed successfully:
- [x] CSS variables added to both themes
- [x] State tracking implemented
- [x] Event listeners added
- [x] Border update logic implemented
- [x] Manual testing passed
- [x] Unit tests added

**Test Results**:
- All unit tests passing
- Manual verification completed for hover, focus, and combined states
- Both light and dark themes verified
```

**Step 2: Commit**

```bash
git add docs/plans/2026-02-04-liquid-glass-activation-state-design.md
git commit -m "docs: mark activation state feature as complete

All implementation tasks completed and tested.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Summary

**Total Tasks**: 7
**Estimated Time**: 30-45 minutes
**Commits**: 7 atomic commits

**Testing Strategy**:
1. TDD for state logic (Task 6)
2. Manual visual testing for UI (Task 5)
3. TypeScript compilation checks throughout

**Key Design Decisions**:
- Logical OR for activation (hover OR focus)
- Dedicated CSS variable for theme-aware hover color
- Reuse existing borderLayer (no structural changes)
- Smooth 0.2s transitions (already in place)
