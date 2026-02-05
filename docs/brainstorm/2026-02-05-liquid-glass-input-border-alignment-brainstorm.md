# Liquid-Glass Input Border Alignment Design

**Date**: 2026-02-05
**Status**: Approved
**Related Component**: `liquid-glass.directive.ts`

## Overview

Align the liquid-glass directive's border visual behavior with the input component, establishing design system consistency. Normal state uses primary color, and activated state adds an external focus ring shadow.

## Original Intent

> "liquid-glass 的外边框效果应该和 input 的效果一致 —— 普通状态下为 primary，激活状态为在外部加阴影"

## Problem Statement

Currently, liquid-glass uses `var(--accent)` (Gold) for normal state border color, while input uses `var(--primary)` (Malachite). This creates visual inconsistency across the design system. Additionally, the activated state shadow differs significantly from input's focus ring pattern.

## Requirements

### Functional Requirements

1. **Normal State**: Border color should use `--primary` (Malachite) by default
2. **Activated State**: Add external focus ring shadow similar to input component
3. **Backward Compatibility**: Preserve `lgBorder` custom color support
4. **State Management**: Keep existing `isHovered` / `isFocused` OR logic

### Non-Functional Requirements

- **Design Consistency**: Match input component's visual feedback pattern
- **Performance**: Minimal impact on rendering performance
- **Accessibility**: Maintain keyboard focus visibility
- **Simplicity**: Single method change, no API additions

## Design

### Architecture

**Core Change Location**: `updateBorderColor()` method in `liquid-glass.directive.ts` (lines 699-724)

**Before**:
```
updateBorderColor()
  ├─ Normal: lgBorder || var(--accent)
  └─ Activated: var(--accent-active) + complex 4-layer shadow
```

**After**:
```
updateBorderColor()
  ├─ Normal: lgBorder || var(--primary)           ← Change 1
  └─ Activated:
      ├─ Preserve depth shadow layers
      ├─ Add focus ring: 0 0 0 3px oklch(...)      ← Change 2
      └─ Use primary color series                  ← Change 3
```

**No Changes Needed**:
- State management logic (`isHovered`, `isFocused`, `isActivated()`)
- Event listeners (`pointerenter`, `pointerleave`, `focus`, `blur`)
- Animation and initialization logic

### Color Strategy

#### Normal State

**Logic**:
```
if (lgBorder is provided):
  → use lgBorder (custom color takes priority)
else:
  → use var(--primary) (Malachite oklch(0.48 0.07 195))
```

**Rationale**: Preserve `lgBorder` for special states (warnings, etc.) while defaulting to primary for consistency.

#### Activated State

**Focus Ring Color**:
```css
oklch(from var(--primary) calc(l + 0.15) c h / 0.25)
                                            ↑         ↑
                                        +15% light   25% opacity
```

**Explanation**:
- Uses `calc(l + 0.15)` to lighten primary by 15%
- `/ 0.25` for 25% opacity (soft glow effect)
- Matches input component's focus ring calculation exactly

### Shadow Layer Design

#### Activated State Shadow Layers

**Before** (4 layers):
```typescript
'0 6px 20px rgba(0,0,0,0.25),              // Depth shadow
 inset 0 1px 0 rgba(255,255,255,0.25),    // Top highlight
 0 0 0 1px var(--accent),                  // Thin border ring
 0 0 12px var(--accent-active)'            // Outer glow
```

**After** (3 layers):
```typescript
'0 6px 20px rgba(0,0,0,0.25),                                    // Depth shadow (kept)
 inset 0 1px 0 rgba(255,255,255,0.25),                          // Top highlight (kept)
 0 0 0 3px oklch(from var(--primary) calc(l + 0.15) c h / 0.25)' // Focus ring (new)
```

#### Shadow Layer Changes

| Layer | Before | After | Reason |
|-------|--------|-------|--------|
| Depth shadow | `0 6px 20px` | `0 6px 20px` | Preserve 3D depth |
| Inner highlight | `inset 0 1px 0` | `inset 0 1px 0` | Preserve texture |
| Thin border ring | `0 0 0 1px var(--accent)` | **Removed** | Replaced by focus ring |
| Outer glow | `0 0 12px` | **Removed** | Replaced by focus ring |
| Focus ring | None | `0 0 0 3px` | **New** - Match input |

**Rationale**: Focus ring provides both border definition and glow. Simplify from 4 to 3 layers for better performance and cleaner code.

### State Transition Flow

```
User Action           → State Change          → Visual Update
────────────────────────────────────────────────────────────────────
pointerenter          → isHovered = true     → border = primary
                      → isActivated() = true → shadow + focus ring

pointerleave          → isHovered = false    →
                      → isActivated()? check →
                        ├─ if isFocused      → keep activated
                        └─ else              → border = primary/base
                                             → shadow = base

focus                 → isFocused = true     →
                      → isActivated() = true → border = primary
                                             → shadow + focus ring

blur                  → isFocused = false    →
                      → isActivated()? check →
                        ├─ if isHovered      → keep activated
                        └─ else              → border = primary/base
                                             → shadow = base
```

**Key Point**: Activated state uses OR logic (`isHovered || isFocused`). Element stays activated if EITHER condition is true.

## Edge Cases & Error Handling

### 1. Custom Border Color (lgBorder)

**Scenario**: User sets `lgBorder="red"`

**Normal State**:
- Logic: `lgBorder` exists → use "red"
- Result: Border shows custom color

**Activated State**:
- Logic: Force design consistency → ignore custom for focus ring
- Result: Border stays "red", but focus ring uses primary variant
- Rationale: Focus ring is system-level feedback, should not be overridden

### 2. Animation Disabled (lgDisableAnimation = true)

**Behavior**:
```typescript
if (!this.borderLayer) return;

// Still update colors and shadows
this.r.setStyle(this.borderLayer, 'border-color', newColor);
this.r.setStyle(this.borderLayer, 'box-shadow', newShadow);
```

**Result**: CSS transition handles smooth color change (0.2s ease-out), even when animation loop is disabled.

### 3. Border Layer Not Initialized

**Protection**:
```typescript
if (!this.borderLayer) return; // Line 700
```

**Rationale**: Prevent runtime errors if called before `ngOnInit` completes.

## Implementation

### Pseudocode

```typescript
private updateBorderColor(): void {
  if (!this.borderLayer) return;

  // === Normal State ===
  const baseColor = this.lgBorder || 'var(--primary)'; // Change 1
  const baseShadow = '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)';

  // === Activated State ===
  const focusRing = '0 0 0 3px oklch(from var(--primary) calc(l + 0.15) c h / 0.25)';
  const activatedShadow = '0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25), ' + focusRing;

  // === Apply Based on State ===
  if (this.isActivated()) {
    // Activated: keep border color, add focus ring
    this.r.setStyle(this.borderLayer, 'border-color', baseColor);
    this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidthActive}px`);
    this.r.setStyle(this.borderLayer, 'box-shadow', activatedShadow); // Change 2
  } else {
    // Normal: use primary/base color
    this.r.setStyle(this.borderLayer, 'border-color', baseColor);
    this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidth}px`);
    this.r.setStyle(this.borderLayer, 'box-shadow', baseShadow);
  }
}
```

## Testing Strategy

### Unit Tests

**Test File**: `liquid-glass.directive.spec.ts`

**New Test Cases**:
```typescript
describe('updateBorderColor', () => {
  it('should use --primary in normal state when lgBorder not provided', () => {
    directive.lgBorder = undefined;
    directive.isHovered = false;
    directive.isFocused = false;
    directive['updateBorderColor']();
    expect(directive['borderLayer'].style.borderColor).toBe('var(--primary)');
  });

  it('should apply focus ring in activated state', () => {
    directive.isHovered = true;
    directive['updateBorderColor']();
    const boxShadow = directive['borderLayer'].style.boxShadow;
    expect(boxShadow).toContain('0 0 0 3px');
    expect(boxShadow).toContain('oklch(from var(--primary)');
  });

  it('should preserve lgBorder in normal state', () => {
    directive.lgBorder = 'red';
    directive.isFocused = false;
    directive['updateBorderColor']();
    expect(directive['borderLayer'].style.borderColor).toBe('red');
  });

  it('should use primary focus ring even with custom lgBorder', () => {
    directive.lgBorder = 'red';
    directive.isHovered = true;
    directive['updateBorderColor']();
    const boxShadow = directive['borderLayer'].style.boxShadow;
    expect(boxShadow).toContain('var(--primary)'); // Focus ring uses primary
  });
});
```

### Integration Tests

**Scenarios**:
1. Mouse hover → Verify focus ring appears
2. Keyboard focus (Tab) → Verify focus ring appears
3. Combined state (Hover then Tab) → Verify stays activated
4. State transitions (Leave while focused) → Verify maintains activated

### Manual Testing

**Test Page**: `/demo/liquid-glass`

**Checklist**:
- [ ] Normal state border is Malachite green (primary)
- [ ] Hover shows focus ring
- [ ] Focus (Tab) shows focus ring
- [ ] Focus ring color is lightened primary variant
- [ ] Depth shadow preserved in activated state
- [ ] Test both light and dark themes
- [ ] Compare visually with input component

### Visual Regression Tests

**Tool**: Playwright or Percy

**Screenshots**:
```
/light-mode-normal.png
/light-mode-activated.png
/dark-mode-normal.png
/dark-mode-activated.png
/input-comparison.png (capture both input and liquid-glass)
```

## Implementation Impact

**Files Changed**: 1 (`liquid-glass.directive.ts`)
**Methods Changed**: 1 (`updateBorderColor`)
**Lines Changed**: ~10 lines
**New CSS Variables**: 0
**Breaking Changes**: No (preserves `lgBorder` support)

**Core Principles**:
- Design consistency over customization flexibility
- Minimal change, maximum effect
- Maintain backward compatibility

## Future/Divergent Ideas

1. **Border Width Optimization** - Current `lgBorderWidthActive: 2`, should it be adjusted?
2. **Inner Shadow Refinement** - `inset 0 1px 0 rgba(255,255,255,0.25)` tuning?
3. **Unit Test Updates** - Comprehensive test suite for new color logic
4. **Documentation Updates** - Update USAGE.md and demo examples
5. **Visual Regression Tests** - Screenshot comparison infrastructure
6. **Focus Ring Animation** - Subtle scale or pulse effect on activation
7. **Custom Focus Ring Color** - `lgFocusRingColor` input for special cases
8. **Transition Variants** - Different speeds for activate vs deactivate
9. **Theme-Aware Focus Ring** - Different focus ring styles per theme
10. **Accessibility Enhancements** - High contrast mode support

## MVP Scope

**Included**:
- ✅ Normal state uses `--primary`
- ✅ Activated state adds focus ring
- ✅ Preserve depth shadow layers
- ✅ Preserve backward compatibility

**Excluded (Parking Lot)**:
- ⏸️ Border width adjustments
- ⏸️ Inner shadow refinement
- ⏸️ Visual regression test infrastructure

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
