# AI Chat Panel Design - Mineral & Time Theme

**Created:** 2026-01-31
**Status:** Design Complete
**Priority:** High

---

## 🎨 Design Philosophy

**Core Principles:**
- **低饱和度** (Low saturation) - Soft mineral tones
- **紧凑轻盈** (Ultra compact) - Minimal footprint, maximum functionality
- **可访问性** (Accessibility) - WCAG AA compliant
- **Glass Morphism** - Translucent backgrounds with blur effects
- **持久化存储** (Persistent storage) - Remembers user preferences

---

## 🏗️ Component Architecture

### Hierarchy

```
AiChatPanelContainer (Fixed Position)
├── SessionToggleButton (Fixed Floating)
├── ChatMessagesCard (Draggable + Resizable)
│   ├── DragHandleDirective
│   ├── ResizeHandleDirective
│   ├── MessageList
│   └── Scrollbar
├── StatusBadgesContainer (Floating)
└── ChatInputContainer (Fixed)
    ├── InputTextArea
    └── InputToolbar
```

---

## 📐 Layout Specifications

### 1. Session Toggle Button (始终悬浮固定)

**Position:**
- Desktop: `bottom-24 right-24` (24px from bottom/right edges)
- Mobile: `bottom-16 right-16`

**Size:**
- Width: `48px` (touch-friendly minimum)
- Height: `48px`
- Border-radius: `24px` (circle)

**Styling:**
```css
background: oklch(0.48 0.07 195 / 95%);  /* 石绿 primary */
backdrop-filter: blur(20px);
box-shadow:
  0 4px 12px oklch(0.28 0.03 185 / 15%),
  0 0 0 2px oklch(0.48 0.07 195 / 20%);
transition: all var(--duration-normal) ease;
```

**States:**
- Default: Opacity 90%, scale 1
- Hover: Opacity 100%, scale 1.05
- Active: Scale 0.95
- Badge active: Show notification dot

**Icon:**
- Closed: Chat bubble icon
- Open: Collapse/Minimize icon

---

### 2. Chat Messages Card (可拖拽、可调整大小)

**Initial Position:**
- Desktop: `bottom-100 left-[50%] translate-x-[-50%]`
- Mobile: `bottom-80 left-8 right-8`

**Dimensions:**
- Default width: `600px` (desktop), `auto` (mobile)
- Default height: `400px` (desktop), `300px` (mobile)
- Min width: `300px`, Min height: `200px`
- Max width: `90vw`, Max height: `70vh`

**Styling:**
```css
background: oklch(0.91 0.015 85 / 95%);  /* 绢黄 background with opacity */
backdrop-filter: blur(20px);
border-radius: var(--radius-xl);  /* 12px */
border: 1px solid oklch(0.48 0.07 195 / 30%);
box-shadow:
  0 -4px 24px oklch(0.28 0.03 185 / 15%),
  0 0 0 1px oklch(0.48 0.07 195 / 10%);
```

**Drag Handle (顶部手柄):**
```css
position: absolute;
top: -20px;
left: 50%;
transform: translateX(-50%);
cursor: grab;
padding: 8px 16px;
opacity: 0.4;
transition: opacity var(--duration-fast);

&:hover { opacity: 0.7; }
&:active { cursor: grabbing; }
```

**Drag Handle Visual:**
- Three horizontal lines (20px × 2px, gap 3px)
- Color: `oklch(0.48 0.07 195)` (石绿)
- No background, no border

**Resize Handle (右下角):**
```css
position: absolute;
bottom: 0;
right: 0;
width: 16px;
height: 16px;
cursor: nwse-resize;
opacity: 0;
transition: opacity var(--duration-fast);

.card:hover & { opacity: 0.4; }
&:hover { opacity: 0.6 !important; }
```

**Resize Handle Visual:**
- Two diagonal lines forming corner indicator
- Color: `oklch(0.48 0.07 195)` (石绿)

---

### 3. Status Badges Container (悬浮徽章)

**Position:**
- Below chat messages card
- Above input container
- Left-aligned: `justify-start`

**Styling:**
```css
display: flex;
gap: var(--spacing-md);  /* 8px */
flex-wrap: wrap;
padding: var(--spacing-sm) 0;  /* 4px 0 */
```

**Badge States:**

| State | Background | Border | Icon | Animation |
|-------|-----------|--------|------|-----------|
| **Thinking** | `oklch(0.48 0.07 195 / 15%)` | `oklch(0.48 0.07 195 / 40%)` | Pulsing dot (8px) | Pulse 2s infinite |
| **Typing** | `oklch(0.60 0.08 210 / 15%)` | `oklch(0.60 0.08 210 / 40%)` | Bouncing dots (3×3px) | Bounce 1.4s staggered |
| **Done** | `oklch(0.55 0.06 195 / 15%)` | `oklch(0.55 0.06 195 / 40%)` | Checkmark | Fade in 0.3s |
| **Error** | `oklch(0.50 0.20 25 / 15%)` | `oklch(0.50 0.20 25 / 40%)` | Warning | Shake 0.4s |

**Badge Size:**
```css
padding: 4px 10px;
border-radius: 12px;
font-size: 11px;
font-weight: 500;
gap: 6px;  /* icon-text spacing */
```

**Interactions:**
- Hover: `translateY(-2px)` + shadow
- Click: Toggle panel collapse

---

### 4. Chat Input Container (固定输入框)

**Position:**
- Always visible at bottom
- Desktop: `bottom-24 left-[50%] translate-x-[-50%]`
- Mobile: `bottom-16 left-8 right-8`

**Dimensions:**
- Width: `600px` (desktop), `auto` (mobile)
- Min height: `48px`, Max height: `120px`

**Styling:**
```css
background: oklch(0.91 0.015 85 / 95%);
backdrop-filter: blur(20px);
border-radius: var(--radius-xl);  /* 12px */
border: 1px solid oklch(0.48 0.07 195 / 25%);
box-shadow: 0 -2px 12px oklch(0.28 0.03 185 / 10%);
```

**Structure:**
```
┌─────────────────────────────────┐
│  [Textarea - auto-expand]       │  ← Top section (padding: 12px 16px)
├─────────────────────────────────┤
│ [📎 🖼️ 🎤]           [Send ↑]  │  ← Bottom toolbar (padding: 8px 12px)
└─────────────────────────────────┘
```

**Input TextArea:**
```css
min-height: 24px;
max-height: 120px;
padding: 0;
background: transparent;
border: none;
font-size: 13px;
line-height: 1.5;
resize: none;

&::placeholder {
  color: oklch(0.50 0.02 185);
}
```

**Toolbar:**
- Left: Tool buttons (28px × 28px each)
  - File attachment 📎
  - Image upload 🖼️
  - Voice input 🎤
- Right: Send button (height: 28px)

**Send Button:**
```css
padding: 0 12px;
height: 28px;
background: oklch(0.48 0.07 195);  /* 石绿 */
color: oklch(1 0 0);  /* white */
border-radius: 6px;
font-size: 12px;
font-weight: 500;
gap: 4px;
transition: all var(--duration-fast);

&:hover {
  background: oklch(0.42 0.08 195);
  transform: scale(1.02);
}

&:active {
  transform: scale(0.98);
}

&:disabled {
  background: oklch(0.88 0.015 85);
  color: oklch(0.60 0.02 185);
  cursor: not-allowed;
  transform: none;
}
```

---

## 🎭 Message Bubbles

### User Message (Right-aligned)
```css
max-width: 85%;
background: oklch(0.42 0.04 195);  /* Darker 石绿 */
color: oklch(1 0 0);  /* white */
padding: 10px 14px;
border-radius: 12px;
margin-left: auto;
```

### AI Message (Left-aligned)
```css
max-width: 85%;
background: oklch(0.88 0.015 85 / 80%);
border: 1px solid oklch(0.48 0.07 195 / 20%);
color: oklch(0.28 0.03 185);  /* 深灰 */
padding: 10px 14px;
border-radius: 12px;
margin-right: auto;
```

### Action Buttons (in AI messages)
```css
padding: 6px 12px;
border-radius: 6px;
background: oklch(0.48 0.07 195 / 10%);
border: 1px solid oklch(0.48 0.07 195 / 30%);
color: oklch(0.48 0.07 195);
font-size: 11px;
font-weight: 500;
cursor: pointer;
transition: all var(--duration-fast);

&:hover {
  background: oklch(0.48 0.07 195 / 20%);
  border-color: oklch(0.48 0.07 195 / 50%);
}
```

---

## 🎬 Animations

### Slide Up (Entry)
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: slideUp 0.4s ease-out;
```

### Message Slide In
```css
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: messageSlideIn 0.3s ease-out;
```

### Pulse (Thinking badge)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

animation: pulse 2s ease-in-out infinite;
```

### Bounce (Typing dots)
```css
@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

/* Staggered delays: 0s, 0.2s, 0.4s */
animation: bounce 1.4s ease-in-out infinite;
```

---

## 💾 User Preferences Storage

### Storage Schema
```typescript
interface AiChatPanelPreferences {
  // Position
  position: {
    x: number;      // Left position (px)
    y: number;      // Top position (px)
  };

  // Size
  size: {
    width: number;   // Width (px)
    height: number;  // Height (px)
  };

  // State
  isCollapsed: boolean;
  sessionId: string;  // Current session identifier
}

const STORAGE_KEY = 'ai-chat-panel-preferences';
```

### Storage Service
```typescript
@Injectable({ providedIn: 'root' })
export class AiChatPanelStorageService {
  private readonly storage = localStorage;
  private readonly key = STORAGE_KEY;

  save(preferences: AiChatPanelPreferences): void {
    this.storage.setItem(this.key, JSON.stringify(preferences));
  }

  load(): AiChatPanelPreferences | null {
    const data = this.storage.getItem(this.key);
    return data ? JSON.parse(data) : null;
  }

  clear(): void {
    this.storage.removeItem(this.key);
  }
}
```

### Auto-Save Triggers
- Drag end: Save new position
- Resize end: Save new dimensions
- Collapse toggle: Save collapsed state
- Session change: Save session ID

---

## 📱 Responsive Design

### Desktop (≥768px)
- Chat card: 600px wide, centered
- Session button: bottom-24 right-24
- Input: 600px wide, centered

### Mobile (<768px)
- Chat card: 100% width (minus 16px margins)
- Session button: bottom-16 right-16
- Input: 100% width (minus 16px margins)
- Disable dragging on mobile (use fixed position)

---

## ♿ Accessibility

### Keyboard Navigation
- `Tab` - Focus through interactive elements
- `Enter` - Send message
- `Shift+Enter` - New line in textarea
- `Escape` - Close panel

### Focus States
```css
*:focus-visible {
  outline: 2px solid oklch(0.48 0.07 195);
  outline-offset: 2px;
}
```

### ARIA Labels
- Session toggle button: `aria-label="Toggle AI chat panel"`
- Drag handle: `aria-label="Drag to move chat panel"`
- Resize handle: `aria-label="Drag to resize chat panel"`
- Send button: `aria-label="Send message"`

### Screen Reader Support
- Live region for new messages
- Status announcements for badge changes

---

## 🎨 Design System Integration

### Tailwind CSS v4 Tokens Used

**Colors:**
- `bg-background` → `oklch(0.91 0.015 85)`
- `bg-primary` → `oklch(0.48 0.07 195)`
- `text-foreground` → `oklch(0.28 0.03 185)`
- `border-border` → `oklch(0.85 0.015 85)`

**Spacing:**
- `--spacing-xs` (2px)
- `--spacing-sm` (4px)
- `--spacing-md` (8px)
- `--spacing-lg` (12px)
- `--spacing-xl` (16px)

**Radius:**
- `--radius-md` (4px)
- `--radius-lg` (5px)
- `--radius-xl` (6px)

**Duration:**
- `--duration-fast` (150ms)
- `--duration-normal` (200ms)
- `--duration-slow` (300ms)

**Typography:**
- `font-sans` (Figtree)
- `text-xs` (11-12px)
- `text-sm` (13-14px)

---

## 🔧 Technical Implementation

### Component Structure
```
src/app/shared/ui/ai-chat/
├── ai-chat-panel/
│   ├── ai-chat-panel.component.ts
│   ├── ai-chat-panel.component.html
│   └── ai-chat-panel.component.css
├── chat-messages-card/
│   ├── chat-messages-card.component.ts
│   ├── chat-messages-card.component.html
│   └── chat-messages-card.component.css
├── status-badges/
│   ├── status-badges.component.ts
│   ├── status-badges.component.html
│   └── status-badges.component.css
├── chat-input/
│   ├── chat-input.component.ts
│   ├── chat-input.component.html
│   └── chat-input.component.css
├── session-toggle-button/
│   ├── session-toggle-button.component.ts
│   ├── session-toggle-button.component.html
│   └── session-toggle-button.component.css
├── directives/
│   ├── drag-handle.directive.ts
│   └── resize-handle.directive.ts
├── services/
│   └── ai-chat-storage.service.ts
├── types/
│   └── chat.types.ts
└── index.ts
```

### State Management (Angular Signals)
```typescript
export class AiChatPanelComponent {
  // Panel state
  readonly isCollapsed = signal(false);
  readonly position = signal({ x: 0, y: 0 });
  readonly size = signal({ width: 600, height: 400 });

  // Chat state
  readonly messages = signal<Message[]>([]);
  readonly currentBadge = signal<BadgeType | null>(null);
  readonly inputValue = signal('');

  // Computed
  readonly showPanel = computed(() => !this.isCollapsed());
  readonly canSend = computed(() => this.inputValue().trim().length > 0);
}
```

---

## ✅ Pre-Delivery Checklist

### Visual Quality
- [ ] All colors use OKLCH from design system
- [ ] Glass morphism effects applied correctly
- [ ] Shadows match Mineral & Time theme
- [ ] Animations are smooth (150-300ms)
- [ ] No layout shift on hover

### Interaction
- [ ] Drag works smoothly without lag
- [ ] Resize respects min/max constraints
- [ ] Clicking drag handle doesn't collapse panel
- [ ] Session button toggles panel visibility
- [ ] Auto-expand textarea works

### Storage
- [ ] Position saved on drag end
- [ ] Size saved on resize end
- [ ] Preferences load on init
- [ ] Storage cleared on logout (optional)

### Accessibility
- [ ] All interactive elements have focus states
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Screen reader announcements
- [ ] Touch targets ≥44px

### Responsive
- [ ] Works at 375px (mobile)
- [ ] Works at 768px (tablet)
- [ ] Works at 1440px (desktop)
- [ ] No horizontal scroll
- [ ] Touch-friendly on mobile

---

## 📚 References

- **Design System:** `/CLAUDE.md`
- **Styles:** `/src/styles.css`
- **Existing Prototype:** `/ai-chat-preview.html`
- **Original Design Summary:** `/ai-chat-panel-design-summary.md`

---

**Design Status:** ✅ Complete
**Next Step:** Implementation Phase
**Priority:** High
**Estimated Effort:** 6-8 hours
