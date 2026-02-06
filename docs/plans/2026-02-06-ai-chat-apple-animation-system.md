# AI Chat Panel — Apple-Feel Animation System

**Goal:** Replace all mechanical CSS animations in the ai-chat component tree with spring-physics-based motion using CSS `linear()` easing + Tailwind v4 custom utilities, achieving Apple-like fluid motion without any JS animation libraries.

**Architecture:** CSS-first, Tailwind v4 `@theme inline` token system, CSS `linear()` spring curves, `@keyframes` with spring easing, staggered `animation-delay` utilities.

**Browser Requirement:** Safari 17.2+, Chrome 113+, Firefox 112+ (all support CSS `linear()`)

**Scope:** Only `src/app/shared/ui/ai-chat/**` and `src/styles.css` (global tokens). No changes to component logic/TS — only CSS/Tailwind class changes.

---

## Master Status Tracker

| Phase | Independence | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| **P1: Spring Easing Tokens** | High | None | 🟢 Done |
| **P2: Panel Open/Close** | High | P1 | 🟢 Done |
| **P3: Message Bubble Entrance** | High | P1 | 🟢 Done |
| **P4: Session Tab Transitions** | High | P1 | 🟢 Done |
| **P5: Collapse/Expand Messages** | High | P1 | 🟢 Done |
| **P6: Button Press Micro-interactions** | High | P1 | 🟢 Done |
| **P7: Drag Handle & Resize Handles** | High | P1 | 🟢 Done |

> **Status Legend:** 🔴 To Do, 🟡 In Progress, 🟢 Done

> **Parallelism:** P2–P7 are all independent of each other. They only depend on P1 (tokens). After P1 is done, P2–P7 can all be executed in parallel by separate agents.

---

## P1: Spring Easing Tokens (Global Foundation)

**Independence:** High — no dependencies
**Files:** `src/styles.css`
**Purpose:** Define reusable spring easing curves, animation duration tokens, and stagger delay utilities in the Tailwind `@theme inline` block. All subsequent phases consume these tokens.

### Task 1.1: Define Spring Easing Custom Properties

**File:** `src/styles.css` — inside `@theme inline { ... }`
**What to add:**

```css
/* Spring easing curves via CSS linear() */
/*
 * Spring-smooth: gentle settle, no visible overshoot
 * Use for: collapse/expand, fade transitions, subtle state changes
 */
--ease-spring-smooth: linear(
  0, 0.011, 0.044, 0.098, 0.175, 0.273, 0.393, 0.535,
  0.696, 0.869, 1.035, 1.17, 1.251, 1.274, 1.249,
  1.196, 1.13, 1.067, 1.014, 0.978, 0.959, 0.954,
  0.961, 0.975, 0.99, 1.002, 1.008, 1.008, 1.004, 1
);

/*
 * Spring-bounce: visible overshoot + settle
 * Use for: panel open, element entrance, tab switch indicator
 */
--ease-spring-bounce: linear(
  0, 0.009, 0.035, 0.078, 0.141, 0.223, 0.326, 0.447,
  0.583, 0.73, 0.876, 1.01, 1.12, 1.194, 1.229, 1.226,
  1.191, 1.131, 1.056, 0.975, 0.9, 0.84, 0.802, 0.785,
  0.793, 0.822, 0.867, 0.92, 0.972, 1.012, 1.034, 1.035,
  1.016, 0.987, 0.956, 0.932, 0.92, 0.924, 0.942, 0.968,
  0.996, 1.014, 1.02, 1.013, 1
);

/*
 * Spring-snappy: fast attack, quick settle, minimal overshoot
 * Use for: button press feedback, micro-interactions, hover states
 */
--ease-spring-snappy: linear(
  0, 0.05, 0.18, 0.37, 0.58, 0.77, 0.91, 1.01,
  1.07, 1.08, 1.05, 1.01, 0.98, 0.97, 0.98, 0.99, 1
);

/* Spring animation durations */
--duration-spring-fast: 350ms;
--duration-spring-normal: 500ms;
--duration-spring-slow: 700ms;
```

**Verification:** Project compiles. `--ease-spring-*` and `--duration-spring-*` are accessible via `var()` in any component CSS.

### Task 1.2: Define Stagger Delay Utilities

**File:** `src/styles.css` — inside `@theme inline { ... }`
**What to add:**

```css
/* Stagger delay tokens for choreographed entrances */
--stagger-1: 0ms;
--stagger-2: 40ms;
--stagger-3: 80ms;
--stagger-4: 120ms;
--stagger-5: 160ms;
--stagger-6: 200ms;
```

**Verification:** Tokens accessible. No visual change yet.

### Task 1.3: Define Shared @keyframes in styles.css

**File:** `src/styles.css` — add a new section after `@layer base { ... }` block
**What to add:** A set of reusable `@keyframes` that use the spring tokens. These will be referenced by component CSS.

```css
/* === Spring Animation Keyframes === */

/* Panel entrance: scale + fade from bottom-right origin */
@keyframes spring-scale-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Panel exit: scale + fade to bottom-right origin */
@keyframes spring-scale-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(8px);
  }
}

/* Message bubble entrance: slight scale + vertical slide */
@keyframes spring-message-in {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Generic fade + slide up (for content sections) */
@keyframes spring-fade-up {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Button press: scale down then spring back (applied on :active) */
@keyframes spring-press {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

/* Collapse: height shrink with fade */
@keyframes spring-collapse {
  from {
    opacity: 1;
    transform: scaleY(1);
    max-height: 999px;
  }
  to {
    opacity: 0;
    transform: scaleY(0.95);
    max-height: 0;
  }
}

/* Expand: height grow with fade */
@keyframes spring-expand {
  from {
    opacity: 0;
    transform: scaleY(0.95);
  }
  to {
    opacity: 1;
    transform: scaleY(1);
  }
}
```

**Verification:** Project compiles. Keyframes are globally available. No visual change yet — they are not applied to any element.

---

## P2: Panel Open/Close Animation

**Independence:** High — depends only on P1
**Files:**
- `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.css`
- `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.html` (minor class change)

**Current behavior:** `slideInUp 0.3s var(--ease-out)` — linear slide, no spring, no scale.
**Target behavior:** Spring scale-in from bottom-right corner with slight overshoot. Panel appears to "pop" into place like a macOS popover.

### Task 2.1: Replace Panel Open Animation

**File:** `ai-chat-panel.component.css`
**What to change:**

1. Replace the `animation` property on `.ai-chat-panel-container`:
   - **Remove:** `animation: slideInUp 0.3s var(--ease-out);`
   - **Add:** `animation: spring-scale-in var(--duration-spring-normal) var(--ease-spring-bounce);`
   - **Add:** `transform-origin: bottom right;` (panel anchors at bottom-right)

2. Delete the old `@keyframes slideInUp` block entirely (it's replaced by the global `spring-scale-in`).

**Verification:** Open the panel → it scales in with a spring bounce from the bottom-right corner.

### Task 2.2: Add Panel Header Staggered Entrance

**File:** `ai-chat-panel.component.css`
**What to change:**

Add staggered fade-up animation to the panel's child sections so they don't all appear at once:

```css
.ai-chat-panel-header {
  animation: spring-fade-up var(--duration-spring-fast) var(--ease-spring-smooth);
  animation-delay: var(--stagger-1);
  animation-fill-mode: backwards;
}

.ai-chat-panel-tabs {
  animation: spring-fade-up var(--duration-spring-fast) var(--ease-spring-smooth);
  animation-delay: var(--stagger-2);
  animation-fill-mode: backwards;
}

.chat-messages-card-wrapper {
  animation: spring-fade-up var(--duration-spring-fast) var(--ease-spring-smooth);
  animation-delay: var(--stagger-3);
  animation-fill-mode: backwards;
}

.ai-chat-panel-input {
  animation: spring-fade-up var(--duration-spring-fast) var(--ease-spring-smooth);
  animation-delay: var(--stagger-4);
  animation-fill-mode: backwards;
}
```

**Important:** `animation-fill-mode: backwards` ensures elements are invisible (at `from` state) during their delay period.

**Verification:** Open panel → header appears first, then tabs, then messages, then input — each with a 40ms stagger.

### Task 2.3: Update prefers-reduced-motion

**File:** `ai-chat-panel.component.css`
**What to change:**

The existing `@media (prefers-reduced-motion: reduce)` block already sets `animation: none`. Verify it also covers the new staggered animations. Add:

```css
@media (prefers-reduced-motion: reduce) {
  .ai-chat-panel-container,
  .ai-chat-panel-header,
  .ai-chat-panel-tabs,
  .chat-messages-card-wrapper,
  .ai-chat-panel-input {
    animation: none;
  }
}
```

**Verification:** With `prefers-reduced-motion: reduce` enabled, panel appears instantly without animation.

---

## P3: Message Bubble Entrance

**Independence:** High — depends only on P1
**Files:**
- `src/app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component.css`
- `src/app/shared/ui/ai-chat/chat-messages-card/css.ts` (Tailwind class update)

**Current behavior:** `messageSlideIn 0.3s ease-out` — simple translateY(10px) fade.
**Target behavior:** Spring scale-in with slight bounce. User messages enter from right, assistant messages from left. Each new message has a subtle spring overshoot.

### Task 3.1: Replace Card Entrance Animation

**File:** `chat-messages-card.component.css`
**What to change:**

1. Replace `.chat-messages-card` animation:
   - **Remove:** `animation: slideInRight 0.4s ease-out;`
   - **Add:** `animation: spring-scale-in var(--duration-spring-normal) var(--ease-spring-bounce);`
   - **Add:** `transform-origin: top center;`

2. Delete the old `@keyframes slideInRight` block.

**Verification:** Messages card appears with spring scale-in.

### Task 3.2: Replace Message Bubble Animation

**File:** `chat-messages-card.component.css`
**What to change:**

1. Replace `.message` animation:
   - **Remove:** `animation: messageSlideIn 0.3s ease-out;`
   - **Add:** `animation: spring-message-in var(--duration-spring-fast) var(--ease-spring-bounce);`

2. Add directional transform-origin per role:
   ```css
   .message.justify-end {
     /* User messages: spring from right */
     transform-origin: bottom right;
   }
   .message.justify-start {
     /* Assistant messages: spring from left */
     transform-origin: bottom left;
   }
   ```

3. Delete the old `@keyframes messageSlideIn` block.

**Verification:** New messages pop in with a spring bounce. User messages feel like they originate from the right, assistant from the left.

### Task 3.3: Add Message Stagger for Initial Load

**File:** `chat-messages-card.component.css`
**What to add:**

When the messages card first appears (e.g., switching sessions), stagger the first few visible messages:

```css
.message:nth-child(1) { animation-delay: var(--stagger-1); animation-fill-mode: backwards; }
.message:nth-child(2) { animation-delay: var(--stagger-2); animation-fill-mode: backwards; }
.message:nth-child(3) { animation-delay: var(--stagger-3); animation-fill-mode: backwards; }
.message:nth-child(4) { animation-delay: var(--stagger-4); animation-fill-mode: backwards; }
.message:nth-child(5) { animation-delay: var(--stagger-5); animation-fill-mode: backwards; }
```

**Note:** Only the first 5 messages get stagger. Messages beyond that appear at `var(--stagger-5)` delay (no infinite stagger — that would look broken on long histories).

**Verification:** Switch to a session with messages → first 5 messages cascade in with 40ms stagger.

### Task 3.4: Add prefers-reduced-motion

**File:** `chat-messages-card.component.css`
**What to add:**

```css
@media (prefers-reduced-motion: reduce) {
  .chat-messages-card,
  .message {
    animation: none;
  }
}
```

---

## P4: Session Tab Transitions

**Independence:** High — depends only on P1
**Files:**
- `src/app/shared/ui/session-tabs-bar/session-tabs-bar.component.css`

**Current behavior:** `transition: all var(--duration-normal) ease` — generic ease, `translateY(-1px)` on hover/active.
**Target behavior:** Spring-based hover lift, spring-based active indicator, smooth tab creation entrance.

### Task 4.1: Replace Tab Hover/Active Transitions

**File:** `session-tabs-bar.component.css`
**What to change:**

1. On `.session-tab`, replace:
   - **Remove:** `transition: all var(--duration-normal) ease;`
   - **Add:** `transition: transform var(--duration-spring-fast) var(--ease-spring-snappy), box-shadow var(--duration-spring-fast) var(--ease-spring-snappy), border-color var(--duration-fast) ease, background var(--duration-fast) ease, filter var(--duration-fast) ease;`

2. On `.session-tab:hover`, keep `transform: translateY(-1px)` — the spring easing will make it feel bouncy.

3. On `.session-tab.active`, keep `transform: translateY(-1px)` — same spring easing applies.

**Verification:** Hover over tabs → they lift with a subtle spring settle instead of linear motion.

### Task 4.2: Add New Tab Entrance Animation

**File:** `session-tabs-bar.component.css`
**What to add:**

```css
/* New tab entrance animation */
.session-tab {
  animation: spring-fade-up var(--duration-spring-fast) var(--ease-spring-bounce);
}
```

**Note:** This fires on every tab render (including initial load). Since tabs are rendered via `@for`, each tab gets the animation on mount. This is acceptable — the animation is fast (350ms) and subtle.

**Verification:** Click "New Chat" → the new tab pops in with a spring entrance.

### Task 4.3: Add Active Tab Press Feedback

**File:** `session-tabs-bar.component.css`
**What to add:**

```css
.session-tab:active {
  transform: scale(0.96);
  transition: transform 80ms var(--ease-spring-snappy);
}
```

**Verification:** Click a tab → it briefly compresses then springs back.

---

## P5: Collapse/Expand Messages Area

**Independence:** High — depends only on P1
**Files:**
- `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.css`

**Current behavior:** `.chat-messages-card-wrapper.collapsed` uses `flex: 0; height: 0; opacity: 0;` with `transition: all var(--duration-normal) var(--ease-out)`.
**Target behavior:** Spring-based collapse/expand with smooth height transition and opacity fade.

### Task 5.1: Replace Collapse/Expand Transition

**File:** `ai-chat-panel.component.css`
**What to change:**

1. On `.chat-messages-card-wrapper`, replace:
   - **Remove:** `transition: all var(--duration-normal) var(--ease-out);`
   - **Add:**
     ```css
     transition:
       flex var(--duration-spring-normal) var(--ease-spring-smooth),
       opacity var(--duration-spring-fast) var(--ease-spring-smooth),
       max-height var(--duration-spring-normal) var(--ease-spring-smooth);
     transform-origin: top center;
     ```

2. On `.chat-messages-card-wrapper` (non-collapsed), add:
   ```css
   max-height: 999px;
   opacity: 1;
   ```

3. On `.chat-messages-card-wrapper.collapsed`, replace:
   - **Remove:** `flex: 0; height: 0; opacity: 0;`
   - **Add:**
     ```css
     flex: 0;
     max-height: 0;
     opacity: 0;
     overflow: hidden;
     pointer-events: none;
     ```

**Verification:** Click session toggle → messages area collapses with a spring-smooth ease (gentle settle). Click again → expands with the same spring curve.

---

## P6: Button Press Micro-interactions

**Independence:** High — depends only on P1
**Files:**
- `src/app/shared/ui/ai-chat/chat-input/chat-input.component.css`
- `src/app/shared/ui/ai-chat/session-toggle-button/css.ts`
- `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.css`

**Current behavior:** Buttons use `transition: all var(--duration-fast) var(--ease-out)`. Send button has `transform: scale(1.06)` on hover and `scale(0.96)` on active. Toggle button has `hover:scale-[1.08]` and `active:scale-[0.95]`.
**Target behavior:** All interactive buttons use spring-snappy easing for press/release. Consistent scale values across all buttons.

### Task 6.1: Update Send Button Spring Transitions

**File:** `chat-input.component.css`
**What to change:**

1. On `.chat-send-btn`, replace:
   - **Remove:** `transition: all var(--duration-normal) var(--ease-out);`
   - **Add:** `transition: transform var(--duration-spring-fast) var(--ease-spring-snappy), background-color var(--duration-fast) ease, border-color var(--duration-fast) ease, opacity var(--duration-fast) ease;`

2. On `.chat-send-btn:not(:disabled):hover`, replace:
   - **Remove:** `transform: scale(1.06);`
   - **Add:** `transform: scale(1.05);`

3. On `.chat-send-btn:not(:disabled):active`, replace:
   - **Remove:** `transform: scale(0.96);`
   - **Add:** `transform: scale(0.92);`

**Verification:** Click send button → it compresses with spring-snappy easing, then bounces back.

### Task 6.2: Update Toolbar Button Spring Transitions

**File:** `chat-input.component.css`
**What to change:**

1. On `.chat-toolbar-btn`, replace:
   - **Remove:** `transition: all var(--duration-fast) var(--ease-out);`
   - **Add:** `transition: transform var(--duration-spring-fast) var(--ease-spring-snappy), background-color var(--duration-fast) ease, color var(--duration-fast) ease;`

2. Add active state:
   ```css
   .chat-toolbar-btn:active {
     transform: scale(0.90);
   }
   ```

**Verification:** Click file/image/voice buttons → spring press feedback.

### Task 6.3: Update Session Toggle Button Spring Transitions

**File:** `session-toggle-button/css.ts`
**What to change:**

1. In `sessionToggleBase` array, replace:
   - **Remove:** `'transition-all duration-300 ease-in-out'`
   - **Add:** `'transition-transform duration-[350ms] ease-[var(--ease-spring-snappy)]'`

   **Note:** Tailwind v4 supports arbitrary values via `duration-[350ms]` and `ease-[var(--ease-spring-snappy)]`.

2. Keep `'hover:scale-[1.08]'` and `'active:scale-[0.95]'` — the spring easing will handle the motion quality.

**Verification:** Click the floating toggle → spring press/release.

### Task 6.4: Update Panel Header Close Button

**File:** `ai-chat-panel.component.css`
**What to change:**

1. On `.header-action-btn`, replace:
   - **Remove:** `transition: all var(--duration-fast) var(--ease-out);`
   - **Add:** `transition: transform var(--duration-spring-fast) var(--ease-spring-snappy), background-color var(--duration-fast) ease, color var(--duration-fast) ease;`

2. Add active state:
   ```css
   .header-action-btn:active {
     transform: scale(0.88);
   }
   ```

**Verification:** Click the X close button → spring press feedback.

---

## P7: Drag Handle & Resize Handle Polish

**Independence:** High — depends only on P1
**Files:**
- `src/app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component.css`
- `src/app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component.ts` (template only — change drag handle SVG to pill shape)

**Current behavior:** Drag handle is three horizontal lines (hamburger icon). Resize handles fade in on card hover with `opacity` transition.
**Target behavior:** Drag handle becomes a pill-shaped grabber (like iOS sheet indicator). Resize handles use spring-smooth fade.

### Task 7.1: Replace Drag Handle with Pill Grabber

**File:** `chat-messages-card.component.ts` — template section only
**What to change:**

Replace the drag handle SVG (the three `<line>` elements) with a simple pill-shaped `<div>`:

```html
<!-- Drag Handle — iOS-style pill grabber -->
<div class="drag-handle" cdkDragHandle>
  <div class="drag-pill"></div>
</div>
```

**File:** `chat-messages-card.component.css`
**What to change:**

1. Replace `.drag-handle svg` styles with `.drag-pill`:
   ```css
   .drag-pill {
     width: 36px;
     height: 5px;
     border-radius: 3px;
     background: var(--color-muted-foreground);
     opacity: 0.35;
     transition: opacity var(--duration-spring-fast) var(--ease-spring-smooth),
                 width var(--duration-spring-fast) var(--ease-spring-snappy);
   }

   .drag-handle:hover .drag-pill {
     opacity: 0.7;
     width: 44px;
   }
   ```

2. Remove the old `.drag-handle svg` and `.drag-handle:hover svg` rules.

**Verification:** Drag handle shows a small rounded pill. On hover, it widens with spring easing and becomes more visible.

### Task 7.2: Update Resize Handle Transitions

**File:** `chat-messages-card.component.css`
**What to change:**

1. On `.resize-handle`, replace:
   - **Remove:** `transition: opacity var(--duration-fast) var(--ease-out);`
   - **Add:** `transition: opacity var(--duration-spring-fast) var(--ease-spring-smooth);`

2. On edge handle hover (`.resize-handle-top:hover`, etc.), replace:
   - **Remove:** `transition: background-color var(--duration-instant) var(--ease-out);`
   - **Add:** `transition: background-color var(--duration-spring-fast) var(--ease-spring-smooth), opacity var(--duration-spring-fast) var(--ease-spring-smooth);`

**Verification:** Hover near card edges → resize handles fade in with a spring-smooth curve (slightly overshoots opacity then settles).

### Task 7.3: Add prefers-reduced-motion for Handles

**File:** `chat-messages-card.component.css`
**What to add to the existing reduced-motion block:**

```css
@media (prefers-reduced-motion: reduce) {
  .drag-pill,
  .resize-handle {
    transition: none;
  }
}
```

---

## Implementation Notes for Executing Agent

### Key Constraints

1. **No TS logic changes.** All changes are CSS properties, Tailwind classes in `css.ts` files, and one template SVG→div swap (Task 7.1).
2. **No new dependencies.** Everything uses native CSS `linear()` and existing Tailwind v4.
3. **Preserve existing class names.** Don't rename CSS classes — only change their property values.
4. **`animation-fill-mode: backwards`** is critical for staggered animations. Without it, elements flash visible before their delay starts.
5. **Delete old @keyframes** when replacing them. Don't leave dead code:
   - Delete `slideInUp` from `ai-chat-panel.component.css`
   - Delete `slideInRight` from `chat-messages-card.component.css`
   - Delete `messageSlideIn` from `chat-messages-card.component.css`
6. **Tailwind arbitrary values syntax:** `duration-[350ms]` and `ease-[var(--ease-spring-snappy)]` — use square brackets for custom values.
7. **Test dark mode.** Spring animations are color-independent, but verify the staggered fade-up doesn't flash white in dark mode (it shouldn't if `animation-fill-mode: backwards` is set).

### Execution Order

```
P1 (tokens) → then P2, P3, P4, P5, P6, P7 in parallel
```

### Verification Checklist (After All Phases)

- [ ] Panel opens with spring bounce from bottom-right
- [ ] Panel sections (header, tabs, messages, input) stagger in with 40ms delays
- [ ] New messages pop in with spring scale + directional origin
- [ ] First 5 messages stagger on session switch
- [ ] Session tabs hover/click have spring feel
- [ ] New tab creation has spring entrance
- [ ] Messages area collapse/expand uses spring-smooth
- [ ] Send button press has spring-snappy feedback
- [ ] All toolbar buttons have spring press feedback
- [ ] Floating toggle button has spring press
- [ ] Header close button has spring press
- [ ] Drag handle is a pill shape that widens on hover
- [ ] Resize handles fade with spring-smooth
- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] Dark mode looks correct
- [ ] No console errors, project compiles clean
