# Liquid-Glass Input Border Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align liquid-glass directive's border visual behavior with the input component for design system consistency.

**Architecture:** Modify the `updateBorderColor()` method in the liquid-glass directive to use primary colors in normal state and add a focus ring in activated state, following the exact pattern used by the input component.

**Tech Stack:** Angular 20+, TypeScript 5.9, OKLCH color space, CSS variables

---

## Task 1: Write Failing Tests for New Border Behavior

**Files:**
- Modify: `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.spec.ts`

**Context:** We're following TDD. First write tests that verify the new behavior, then implement the code to make them pass.

**Step 1: Add test for normal state using --primary**

Add this test case to the `describe('LiquidGlassDirective', ...)` block:

```typescript
it('should use --primary in normal state when lgBorder not provided', () => {
  // Arrange
  fixture = TestBed.createComponent(TestComponent);
  directive = fixture.debugElement.query(By.directive(LiquidGlassDirective)).injector.get(LiquidGlassDirective);
  fixture.detectChanges(); // Trigger ngOnInit

  // Act - ensure normal state (not hovered, not focused)
  directive['isHovered'] = false;
  directive['isFocused'] = false;
  directive['updateBorderColor']();

  // Assert
  const borderLayer = directive['borderLayer'];
  expect(borderLayer).toBeTruthy();
  expect(borderLayer.style.borderColor).toBe('var(--primary)');
});
```

**Step 2: Add test for activated state with focus ring**

```typescript
it('should apply focus ring in activated state', () => {
  // Arrange
  fixture = TestBed.createComponent(TestComponent);
  directive = fixture.debugElement.query(By.directive(LiquidGlassDirective)).injector.get(LiquidGlassDirective);
  fixture.detectChanges();

  // Act - activate by hovering
  directive['isHovered'] = true;
  directive['updateBorderColor']();

  // Assert
  const borderLayer = directive['borderLayer'];
  const boxShadow = borderLayer.style.boxShadow;

  // Should contain the focus ring
  expect(boxShadow).toContain('0 0 0 3px');
  expect(boxShadow).toContain('oklch(from var(--primary)');
  expect(boxShadow).toContain('calc(l + 0.15)');
});
```

**Step 3: Add test for custom lgBorder preservation**

```typescript
it('should preserve lgBorder in normal state', () => {
  // Arrange
  fixture = TestBed.createComponent(TestComponent);
  const element = fixture.debugElement.query(By.directive(LiquidGlassDirective)).nativeElement;
  element.setAttribute('lgBorder', 'red');

  directive = fixture.debugElement.query(By.directive(LiquidGlassDirective)).injector.get(LiquidGlassDirective);
  directive.lgBorder = 'red';
  fixture.detectChanges();

  // Act
  directive['isFocused'] = false;
  directive['updateBorderColor']();

  // Assert
  expect(directive['borderLayer'].style.borderColor).toBe('red');
});
```

**Step 4: Add test for activated state ignoring custom lgBorder for focus ring**

```typescript
it('should use primary focus ring even with custom lgBorder', () => {
  // Arrange
  fixture = TestBed.createComponent(TestComponent);
  const element = fixture.debugElement.query(By.directive(LiquidGlassDirective)).nativeElement;
  element.setAttribute('lgBorder', 'blue');

  directive = fixture.debugElement.query(By.directive(LiquidGlassDirective)).injector.get(LiquidGlassDirective);
  directive.lgBorder = 'blue';
  fixture.detectChanges();

  // Act - activate
  directive['isHovered'] = true;
  directive['updateBorderColor']();

  // Assert - border keeps custom color, but focus ring uses primary
  expect(directive['borderLayer'].style.borderColor).toBe('blue');

  const boxShadow = directive['borderLayer'].style.boxShadow;
  expect(boxShadow).toContain('var(--primary)'); // Focus ring uses primary
});
```

**Step 5: Run tests to verify they fail**

```bash
cd .worktrees/liquid-glass-border
npm test -- --test-name-pattern="should use --primary in normal state|should apply focus ring|should preserve lgBorder|should use primary focus ring" --watch=false
```

Expected: Tests FAIL with "Expected 'var(--accent)' but got 'var(--primary)'" and similar errors

**Step 6: Commit the failing tests**

```bash
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.spec.ts
git commit -m "test(lg): add failing tests for input border alignment

- Test normal state uses --primary instead of --accent
- Test activated state adds focus ring
- Test custom lgBorder preservation
- Test focus ring uses primary even with custom border"
```

---

## Task 2: Implement Normal State Primary Color

**Files:**
- Modify: `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts:699-724`

**Context:** The `updateBorderColor()` method currently uses `var(--accent)` for normal state. We need to change it to `var(--primary)`.

**Step 1: Update normal state border color**

Find line 702 in `updateBorderColor()`:
```typescript
const baseColor = this.lgBorder || 'var(--accent)';
```

Change to:
```typescript
const baseColor = this.lgBorder || 'var(--primary)';
```

**Step 2: Run the normal state test**

```bash
npm test -- --test-name-pattern="should use --primary in normal state" --watch=false
```

Expected: PASS

**Step 3: Run the lgBorder preservation test**

```bash
npm test -- --test-name-pattern="should preserve lgBorder in normal state" --watch=false
```

Expected: PASS

**Step 4: Commit the normal state change**

```bash
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts
git commit -m "feat(lg): use --primary for normal state border

Changed default border color from --accent (Gold) to --primary (Malachite)
to align with input component and establish design system consistency.

Custom lgBorder input is still respected for backward compatibility."
```

---

## Task 3: Implement Activated State Focus Ring

**Files:**
- Modify: `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts:699-724`

**Context:** The activated state currently uses a 4-layer shadow. We need to simplify to 3 layers and add the focus ring matching input's pattern.

**Step 1: Define new shadow constants**

Add these constants at the beginning of `updateBorderColor()` method (around line 700):

```typescript
// Shadow constants
const baseShadow = '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)';
const focusRing = '0 0 0 3px oklch(from var(--primary) calc(l + 0.15) c h / 0.25)';
const activatedShadow = '0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25), ' + focusRing;
```

**Step 2: Update activated state shadow application**

Find the activated state block (around line 705-713):
```typescript
if (this.isActivated()) {
  // Activated state: deeper red-gold border, thicker, enhanced glow
  this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidthActive}px`);
  this.r.setStyle(this.borderLayer, 'border-color', activeColor);
  this.r.setStyle(
    this.borderLayer,
    'box-shadow',
    '0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 1px var(--accent), 0 0 12px var(--accent-active)',
  );
}
```

Replace with:
```typescript
if (this.isActivated()) {
  // Activated state: keep border color, add focus ring
  this.r.setStyle(this.borderLayer, 'border-color', baseColor);
  this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidthActive}px`);
  this.r.setStyle(this.borderLayer, 'box-shadow', activatedShadow);
}
```

**Step 3: Update normal state shadow application**

Find the normal state block (around line 715-722):
```typescript
else {
  // Default state: normal border with subtle shadow
  this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidth}px`);
  this.r.setStyle(this.borderLayer, 'border-color', baseColor);
  this.r.setStyle(
    this.borderLayer,
    'box-shadow',
    '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
  );
}
```

Replace with:
```typescript
else {
  // Normal state: use primary/base color
  this.r.setStyle(this.borderLayer, 'border-color', baseColor);
  this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidth}px`);
  this.r.setStyle(this.borderLayer, 'box-shadow', baseShadow);
}
```

**Step 4: Remove unused activeColor variable**

Find line 703:
```typescript
const activeColor = 'var(--accent-active)';
```

Delete this line (no longer needed).

**Step 5: Run the focus ring test**

```bash
npm test -- --test-name-pattern="should apply focus ring in activated state" --watch=false
```

Expected: PASS

**Step 6: Run the custom border focus ring test**

```bash
npm test -- --test-name-pattern="should use primary focus ring even with custom lgBorder" --watch=false
```

Expected: PASS

**Step 7: Run all liquid-glass tests**

```bash
npm test -- --test-path-pattern="liquid-glass" --watch=false 2>&1 | grep -A 5 "specs\|passed\|failed"
```

Expected: All liquid-glass related tests PASS

**Step 8: Commit the activated state implementation**

```bash
git add src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts
git commit -m "feat(lg): add focus ring to activated state

Added external focus ring (0 0 0 3px) matching input component pattern.
Simplified shadow layers from 4 to 3 for better performance.

Focus ring uses calc(l + 0.15) on primary color for 25% opacity glow.
Preserves depth shadow and inner highlight for liquid glass effect."
```

---

## Task 4: Manual Visual Verification

**Files:**
- Access: `src/app/demo/liquid-glass/`
- Access: `src/app/shared/ui/input/`

**Context:** Automated tests verify the logic, but we need to manually verify the visual appearance matches the input component.

**Step 1: Start dev server**

```bash
cd .worktrees/liquid-glass-border
npm start
```

Expected: Dev server starts at http://localhost:4200

**Step 2: Navigate to liquid-glass demo**

Open browser to: http://localhost:4200/demo/liquid-glass

**Step 3: Verify normal state**

1. Locate a liquid-glass card in normal state
2. Check border color is **Malachite green** (not Gold/yellow)
3. Compare with input component on the same page
4. Verify both use same primary color

Expected: Border color matches input's border color (石绿)

**Step 4: Verify activated state (mouse)**

1. Hover over a liquid-glass card
2. Check for external **focus ring glow** appearing
3. Verify focus ring color is **lightened primary** (not accent)
4. Check that depth shadow is preserved

Expected: Focus ring appears, 3px offset, light green glow

**Step 5: Verify activated state (keyboard)**

1. Press Tab to navigate to a liquid-glass element
2. Check focus ring appears (same as mouse hover)
3. Press Tab again to move focus away
4. Check focus ring disappears

Expected: Keyboard focus shows same visual feedback as mouse hover

**Step 6: Test both themes**

1. Toggle to dark mode (if available)
2. Repeat steps 3-5
3. Verify colors work in both light and dark themes

Expected: Focus ring visible and consistent in both themes

**Step 7: Test custom border color**

1. Create test element with `lgBorder="red"`
2. Verify normal state uses red border
3. Verify activated state:
   - Border stays red
   - Focus ring still uses primary (not red)

Expected: Custom border respected, but focus ring uses primary

**Step 8: Document findings**

Create a verification checklist file:

```bash
cat > VISUAL_VERIFICATION.md << 'EOF'
# Visual Verification Checklist

## Date: [Fill in date]

### Normal State
- [ ] Border color is Malachite green (石绿)
- [ ] Matches input component border color
- [ ] Light theme verified
- [ ] Dark theme verified

### Activated State
- [ ] Focus ring appears on hover
- [ ] Focus ring appears on keyboard focus
- [ ] Focus ring color is lightened primary
- [ ] Depth shadow preserved
- [ ] Focus ring disappears on deactivate

### Custom Border
- [ ] lgBorder custom color works in normal state
- [ ] Focus ring uses primary even with custom border

### Consistency
- [ ] Liquid-glass matches input behavior
- [ ] Design system consistency achieved

**Result:** PASS / FAIL
**Notes:** [Any issues or observations]
EOF
```

Fill in the checklist as you verify.

**Step 9: Commit verification documentation**

```bash
git add VISUAL_VERIFICATION.md
git commit -m "docs(lg): add visual verification checklist

Manual testing confirmed alignment with input component:
- Normal state uses --primary (Malachite)
- Activated state shows focus ring
- Both light and dark themes verified
- Custom lgBorder support confirmed"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `src/app/shared/ui/liquid-glass/USAGE.md`
- Modify: `docs/brainstorm/2026-02-05-liquid-glass-input-border-alignment-brainstorm.md`

**Context:** Update usage documentation to reflect the new border behavior.

**Step 1: Update USAGE.md border section**

Open `src/app/shared/ui/liquid-glass/USAGE.md`

Find the section describing border colors and update:

```markdown
## Border Colors

The liquid-glass directive uses the design system's primary color for borders:

- **Normal State**: Uses `--primary` (石绿 Malachite) by default
- **Activated State**: Adds a focus ring with `oklch(from var(--primary) calc(l + 0.15) c h / 0.25)`

This matches the input component's border behavior for design system consistency.

### Custom Border Colors

You can override the border color using the `lgBorder` input:

```html
<div liquidGlass lgBorder="red">
  Custom red border
</div>
```

**Note:** The focus ring in activated state always uses the primary color for consistency, even when `lgBorder` is set.
```

**Step 2: Update design doc with implementation status**

Open `docs/brainstorm/2026-02-05-liquid-glass-input-border-alignment-brainstorm.md`

Find the "Implementation Status" section (or add it at the end) and update:

```markdown
## Implementation Status

**Completed**: 2026-02-05

All tasks completed successfully:
- [x] Unit tests added and passing
- [x] Normal state uses --primary
- [x] Activated state adds focus ring
- [x] Shadow layers simplified from 4 to 3
- [x] Backward compatibility maintained (lgBorder support)
- [x] Manual visual verification completed
- [x] Documentation updated

**Test Results**:
- All new unit tests passing
- Manual verification confirmed design system alignment
- Both light and dark themes verified

**Breaking Changes**: None
```

**Step 3: Run final test suite**

```bash
npm test -- --test-path-pattern="liquid-glass" --watch=false 2>&1 | tail -20
```

Expected: All liquid-glass tests pass

**Step 4: Commit documentation updates**

```bash
git add src/app/shared/ui/liquid-glass/USAGE.md
git add docs/brainstorm/2026-02-05-liquid-glass-input-border-alignment-brainstorm.md
git commit -m "docs(lg): update documentation for primary border alignment

- Updated USAGE.md with new border color behavior
- Documented focus ring implementation
- Noted focus ring always uses primary for consistency
- Marked implementation complete in design doc"
```

---

## Task 6: Final Integration Check

**Files:**
- All modified files

**Context:** Final verification that all changes work together and the feature is complete.

**Step 1: Build the project**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 2: Check git status**

```bash
git status
```

Expected: Clean working tree (all changes committed)

**Step 3: Review all commits**

```bash
git log --oneline --graph -10
```

Expected: See the following commit sequence:
1. Test commit (failing tests)
2. Normal state implementation
3. Activated state implementation
4. Visual verification documentation
5. Documentation updates

**Step 4: Create summary of changes**

Create a file `IMPLEMENTATION_SUMMARY.md`:

```markdown
# Implementation Summary

## Feature: Liquid-Glass Input Border Alignment

### Changes Made

1. **Normal State Border Color** (`liquid-glass.directive.ts:702`)
   - Changed from `var(--accent)` to `var(--primary)`
   - Aligns with input component default border

2. **Activated State Shadow** (`liquid-glass.directive.ts:705-722`)
   - Added focus ring: `0 0 0 3px oklch(from var(--primary) calc(l + 0.15) c h / 0.25)`
   - Simplified from 4 shadow layers to 3
   - Matches input component's focus ring pattern

3. **Backward Compatibility**
   - `lgBorder` input still respected for custom border colors
   - Focus ring always uses primary for design consistency

4. **Tests** (`liquid-glass.directive.spec.ts`)
   - Added 4 new test cases
   - All tests passing

### Files Modified
- `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts`
- `src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.spec.ts`
- `src/app/shared/ui/liquid-glass/USAGE.md`
- `docs/brainstorm/2026-02-05-liquid-glass-input-border-alignment-brainstorm.md`

### Design System Impact
- ✅ Establishes consistency between liquid-glass and input components
- ✅ Uses mineral theme primary color (石绿 Malachite)
- ✅ Maintains accessibility with clear focus indication
- ✅ No breaking changes to existing API
```

**Step 5: Final commit**

```bash
git add IMPLEMENTATION_SUMMARY.md
git commit -m "docs(lg): add implementation summary

Complete summary of liquid-glass input border alignment feature."
```

**Step 6: Push to remote (if ready)**

Optional - if you want to push this branch:

```bash
git push -u origin feature/liquid-glass-input-border-alignment
```

---

## Completion Criteria

✅ **All Tasks Complete When:**
- [ ] All unit tests passing
- [ ] Visual verification checklist filled and passed
- [ ] Documentation updated
- [ ] Build succeeds
- [ ] Implementation summary written
- [ ] Git history shows clean, logical commits

✅ **Feature Requirements Met:**
- [ ] Normal state uses `--primary` color
- [ ] Activated state shows focus ring
- [ ] Focus ring matches input component pattern
- [ ] Custom lgBorder still works
- [ ] Design system consistency achieved

---

## Notes for Implementation

- **Follow TDD**: Write test → See it fail → Implement → See it pass → Commit
- **Keep commits small**: One logical change per commit
- **Test frequently**: Run tests after each change
- **Document as you go**: Don't leave documentation for the end
- **Manual verification required**: Automated tests verify logic, but you must manually verify visual appearance

## Relevant Skills

- Testing: @superpowers:test-driven-development
- Code review: @superpowers:code-reviewer
- Git worktree cleanup: @superpowers:finishing-a-development-branch
