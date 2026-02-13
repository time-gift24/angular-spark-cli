# shadcn-angular 组件引入架构计划

**Goal:** 规划并引入新的 shadcn/ui 组件到 Angular 项目，遵循现有架构模式和设计系统规范

**Architecture:** Standalone Components + Signals + CVA (Class Variance Authority) + Design Tokens

---

## Master Status Tracker

| Phase | Independence | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| **P1: 表单与数据输入组件** | High | None | 🔴 To Do |
| **P2: 反馈与展示组件** | High | None | 🔴 To Do |
| **P3: 导航与布局组件** | Medium | P1 | 🔴 To Do |
| **P4: 高级交互组件** | Low | P1, P2 | 🔴 To Do |
| **P5: 组件文档与示例** | Low | P1-P4 | 🔴 To Do |

> **Status Legend:** 🔴 To Do, 🟡 In Progress, 🟢 Done

---

## 组件清单分析

### 已实现组件
| 组件 | 状态 |
| :--- | :--- |
| button | ✅ 已实现 |
| card | ✅ 已实现 |
| input | ✅ 已实现 |
| badge | ✅ 已实现 |
| checkbox | ✅ 已实现 |
| switch | ✅ 已实现 |
| separator | ✅ 已实现 |
| sheet | ✅ 已实现 |
| tabs | ✅ 已实现 |
| tooltip | ✅ 已实现 |
| context-menu | ✅ 已实现 |

### 待引入组件（按优先级分类）

#### P1: 表单与数据输入组件 (高优先级)
| 组件 | 复杂度 | 依赖 |
| :--- | :--- | :--- |
| **label** | Low | None |
| **textarea** | Low | None |
| **select** | Medium | None |
| **radio-group** | Medium | None |
| **slider** | Medium | None |
| **calendar** | High | date-fns |
| **input-otp** | Medium | None |
| **form** | High | label, input |
| **field** | Medium | label |

#### P2: 反馈与展示组件 (中优先级)
| 组件 | 复杂度 | 依赖 |
| :--- | :--- | :--- |
| **alert** | Low | None |
| **skeleton** | Low | None |
| **progress** | Medium | None |
| **spinner** | Low | None |
| **empty** | Low | None |
| **kbd** | Low | None |
| **avatar** | Medium | None |
| **alert-dialog** | High | dialog |

#### P3: 导航与布局组件 (中优先级)
| 组件 | 复杂度 | 依赖 |
| :--- | :--- | :--- |
| **accordion** | Medium | None |
| **collapsible** | Medium | None |
| **breadcrumb** | Low | None |
| **pagination** | Medium | button |
| **scroll-area** | Medium | None |
| **resizable** | High | None |
| **sidebar** | High | collapsible |
| **menubar** | Medium | dropdown-menu |

#### P4: 高级交互组件 (低优先级)
| 组件 | 复杂度 | 依赖 |
| :--- | :--- | :--- |
| **dialog** | High | None |
| **popover** | Medium | None |
| **dropdown-menu** | High | None |
| **hover-card** | Medium | popover |
| **navigation-menu** | High | None |
| **combobox** | High | command |
| **command** | High | dialog, input |
| **drawer** | Medium | None |
| **carousel** | High | embla-carousel |
| **sonner** | High | None |
| **toggle** | Low | None |
| **toggle-group** | Low | toggle |
| **chart** | High | recharts |
| **table** | High | None |

---

## Phase 1: 表单与数据输入组件

**Independence Level:** High
**Dependencies:** None

### Domain Model

```typescript
// 表单组件通用状态接口
interface FormFieldState {
  value: T;
  disabled: boolean;
  error: string | null;
  touched: boolean;
}

// Label 组件变体
type LabelVariant = 'default' | 'required' | 'optional';

// Textarea 变体
type TextareaSize = 'sm' | 'md' | 'lg';
type TextareaState = 'default' | 'error' | 'success';

// Select 选项模型
interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: ComponentType;
}

// Radio Group 模型
interface RadioOption<T = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

// Slider 模型
type SliderValue = number | number[];
interface SliderMarks {
  [key: number]: string;
}

// Calendar 状态模型
type CalendarDate = Date;
type CalendarView = 'day' | 'month' | 'year';
interface CalendarSelection {
  from?: Date;
  to?: Date;
}

// Input OTP 模型
type OtpValue = string[];
interface OtpConfig {
  length: number;
  type: 'numeric' | 'alphanumeric';
  pattern?: RegExp;
}
```

### Task List

#### Task 1.1: Label 组件
**Output:** Compilable Label Component

```typescript
// 定义接口
@Component({
  selector: 'label[spark-label]',
  host: {
    '[class]': 'computedClass()',
  },
})
export class SparkLabelComponent {
  readonly required = input<boolean>(false);
  readonly optional = input<boolean>(false);
  readonly for = input<string>();

  protected computedClass = computed(() =>
    cn(
      'text-sm font-medium leading-none',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      this.required() && 'after:content-["*"] after:ml-0.5 after:text-destructive',
      this.optional() && 'text-muted-foreground'
    )
  );
}
```

#### Task 1.2: Textarea 组件
**Output:** Compilable Textarea Component with CVA

```typescript
// 变体定义
const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      state: {
        default: 'border-input bg-background',
        error: 'border-destructive',
        success: 'border-success',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

// 组件签名
@Component({
  selector: 'textarea[spark-textarea]',
  host: {
    '[class]': 'computedClass()',
    '[attr.aria-invalid]': 'error()',
  },
})
export class SparkTextareaComponent {
  readonly size: Input<TextareaSize>;
  readonly error = input<boolean>(false);
  readonly placeholder = input('');
  readonly value = model<string>('');
}
```

#### Task 1.3: Select 组件
**Output:** Compilable Select Component (使用 Ngx-FormGroup 或原生实现)

```typescript
// Select 状态机
enum SelectState {
  Idle = 'idle',
  Open = 'open',
  Closed = 'closed',
  Selecting = 'selecting',
}

// 组件签名
@Component({
  selector: 'div[spark-select]',
})
export class SparkSelectComponent<T = string> {
  readonly options = input.required<SelectOption<T>[]>();
  readonly value = model<T | null>(null);
  readonly placeholder = input('Select...');
  readonly disabled = input(false);
  readonly searchable = input(false);

  readonly state = signal<SelectState>(SelectState.Idle);
  readonly highlightedIndex = signal<number>(-1);

  readonly valueChange = output<T>();
}
```

#### Task 1.4: Radio Group 组件
**Output:** Compilable RadioGroup Component

```typescript
@Component({
  selector: 'div[spark-radio-group]',
  host: {
    '[attr.role]': '"radiogroup"',
    '[attr.aria-orientation]': 'orientation()',
  },
})
export class SparkRadioGroupComponent<T = string> {
  readonly options = input.required<RadioOption<T>[]>();
  readonly value = model<T | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly disabled = input(false);

  readonly valueChange = output<T>();

  // 键盘导航逻辑
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // 实现细节在实现阶段
  }
}
```

#### Task 1.5: Slider 组件
**Output:** Compilable Slider Component

```typescript
@Component({
  selector: 'div[spark-slider]',
  host: {
    '[class]': 'computedClass()',
  },
})
export class SparkSliderComponent {
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly value = model<SliderValue>(0);
  readonly marks = input<SliderMarks>({});
  readonly disabled = input(false);

  readonly percentage = computed(() => {
    const val = this.value();
    return Array.isArray(val)
      ? val.map(v => ((v - this.min()) / (this.max() - this.min())) * 100)
      : ((val - this.min()) / (this.max() - this.min())) * 100;
  });

  readonly valueChange = output<SliderValue>();
}
```

#### Task 1.6: Calendar 组件
**Output:** Compilable Calendar Component

```typescript
// Calendar 状态模型
interface CalendarState {
  view: CalendarView;
  currentDate: Date;
  selectedDate: CalendarSelection;
  hoveredDate: Date | null;
}

@Component({
  selector: 'div[spark-calendar]',
})
export class SparkCalendarComponent {
  readonly mode = input<'single' | 'range' | 'multiple'>('single');
  readonly selected = model<CalendarSelection>({});
  readonly disabled = input<(date: Date) => boolean>(() => false);
  readonly minDate = input<Date | undefined>(undefined);
  readonly maxDate = input<Date | undefined>(undefined);

  readonly state = signal<CalendarState>({
    view: 'day',
    currentDate: new Date(),
    selectedDate: {},
    hoveredDate: null,
  });

  readonly selectedChange = output<CalendarSelection>();

  // 日期计算逻辑
  protected getDaysInMonth(): Date[] {
    // 实现细节
  }
}
```

#### Task 1.7: Input OTP 组件
**Output:** Compilable InputOTP Component

```typescript
@Component({
  selector: 'div[spark-input-otp]',
})
export class SparkInputOtpComponent {
  readonly length = input(6);
  readonly type = input<'numeric' | 'alphanumeric'>('numeric');
  readonly pattern = input<RegExp>(/\d/);
  readonly value = model<string[]>([]);
  readonly disabled = input(false);

  readonly valueChange = output<string[]>();
  readonly complete = output<boolean>();

  protected isComplete = computed(() =>
    this.value().length === this.length() && this.value().every(v => v !== '')
  );

  // 自动聚焦逻辑
  // 粘贴处理逻辑
}
```

#### Task 1.8: Field 组件 (表单字段包装器)
**Output:** Compilable Field Component

```typescript
@Component({
  selector: 'div[spark-field]',
})
export class SparkFieldComponent {
  readonly error = input<string>('');
  readonly description = input<string>('');
  readonly required = input(false);

  // 提供 ControlStatusToken 给子组件
  static provide(control: AbstractControl): Provider {
    return {
      provide: CONTROL_STATUS_TOKEN,
      useValue: control,
    };
  }
}
```

#### Task 1.9: Form 组件 (表单集成)
**Output:** Compilable Form Component with Reactive Forms

```typescript
@Component({
  selector: 'form[spark-form]',
})
export class SparkFormComponent<T = any> {
  readonly form = input.required<FormGroup>();
  readonly submit = output<T>();

  @HostListener('submit', ['$event'])
  handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.form().valid) {
      this.submit.emit(this.form().value);
    }
  }

  // 表单状态暴露
  readonly invalid = computed(() => this.form().invalid);
  readonly dirty = computed(() => this.form().dirty);
  readonly touched = computed(() => this.form().touched);
}
```

---

## Phase 2: 反馈与展示组件

**Independence Level:** High
**Dependencies:** None

### Domain Model

```typescript
// Alert 变体
type AlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

// Skeleton 变体
type SkeletonShape = 'rectangle' | 'circle' | 'text';

// Progress 变体
type ProgressSize = 'sm' | 'md' | 'lg';
type ProgressIndicator = 'bar' | 'circle';

// Empty State 模型
interface EmptyStateProps {
  icon?: ComponentType;
  title: string;
  description?: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Avatar 模型
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### Task List

#### Task 2.1: Alert 组件
**Output:** Compilable Alert Component

```typescript
const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive',
        warning: 'border-warning/50 text-warning',
        success: 'border-success/50 text-success',
        info: 'border-info/50 text-info',
      },
    },
  }
);

@Component({
  selector: 'div[spark-alert]',
  host: {
    '[class]': 'computedClass()',
    '[attr.role]': '"alert"',
  },
})
export class SparkAlertComponent {
  readonly variant = input<AlertVariant>('default');
  readonly title = input('');
  readonly dismissible = input(false);
  readonly dismissed = output<void>();
}
```

#### Task 2.2: Skeleton 组件
**Output:** Compilable Skeleton Component

```typescript
@Component({
  selector: 'div[spark-skeleton]',
  host: {
    '[class]': 'computedClass()',
    '[attr.role]': '"status"',
    '[attr.aria-label]': '"Loading..."',
  },
})
export class SparkSkeletonComponent {
  readonly shape = input<SkeletonShape>('rectangle');
  readonly width = input<string | undefined>(undefined);
  readonly height = input<string | undefined>(undefined);
  readonly count = input(1);

  protected computedClass = computed(() =>
    cn(
      'animate-pulse rounded-md bg-muted',
      this.shape() === 'circle' && 'rounded-full',
      this.shape() === 'text' && 'h-4 w-full'
    )
  );
}
```

#### Task 2.3: Progress 组件
**Output:** Compilable Progress Component

```typescript
@Component({
  selector: 'div[spark-progress]',
  host: {
    '[attr.role]': '"progressbar"',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
  },
})
export class SparkProgressComponent {
  readonly value = input(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly size = input<ProgressSize>('md');
  readonly indicator = input<ProgressIndicator>('bar');
  readonly showLabel = input(false);

  protected percentage = computed(() => {
    const range = this.max() - this.min();
    return ((this.value() - this.min()) / range) * 100;
  });
}
```

#### Task 2.4: Spinner 组件
**Output:** Compilable Spinner Component

```typescript
@Component({
  selector: 'div[spark-spinner]',
  host: {
    '[class]': 'computedClass()',
    '[attr.role]': '"status"',
    '[attr.aria-label]': '"Loading..."',
  },
})
export class SparkSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly color = input<'primary' | 'current'>('primary');

  protected computedClass = computed(() =>
    cn(
      'animate-spin',
      this.size() === 'sm' && 'w-4 h-4',
      this.size() === 'md' && 'w-6 h-6',
      this.size() === 'lg' && 'w-8 h-8',
      this.size() === 'xl' && 'w-12 h-12'
    )
  );
}
```

#### Task 2.5: Empty 组件
**Output:** Compilable Empty Component

```typescript
@Component({
  selector: 'div[spark-empty]',
})
export class SparkEmptyComponent {
  readonly icon = input<ComponentType | null>(null);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly actionLabel = input('');
  readonly actionClick = output<void>();
}
```

#### Task 2.6: KBD 组件
**Output:** Compilable KBD Component

```typescript
@Component({
  selector: 'kbd[spark-kbd]',
  host: {
    '[class]': 'computedClass()',
  },
})
export class SparkKbdComponent {
  readonly keys = input.required<string[]>();

  protected computedClass = computed(() =>
    cn(
      'inline-flex items-center gap-1',
      'rounded border border-border bg-muted px-2 py-1',
      'text-xs font-medium text-muted-foreground',
      'shadow-sm'
    )
  );
}
```

#### Task 2.7: Avatar 组件
**Output:** Compilable Avatar Component

```typescript
@Component({
  selector: 'div[spark-avatar]',
  host: {
    '[class]': 'computedClass()',
  },
})
export class SparkAvatarComponent {
  readonly src = input<string>('');
  readonly alt = input('');
  readonly fallback = input('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  readonly imageLoadFailed = signal(false);

  protected computedClass = computed(() =>
    cn(
      'relative flex shrink-0 overflow-hidden rounded-full',
      this.size() === 'sm' && 'h-8 w-8',
      this.size() === 'md' && 'h-10 w-10',
      this.size() === 'lg' && 'h-12 w-12',
      this.size() === 'xl' && 'h-16 w-16'
    )
  );

  protected getInitials(): string {
    // 从 src 或 alt 生成首字母
  }
}
```

#### Task 2.8: Alert Dialog 组件
**Output:** Compilable AlertDialog Component

```typescript
// AlertDialog 状态
enum AlertDialogState {
  Closed = 'closed',
  Open = 'open',
  Closing = 'closing',
}

@Component({
  selector: 'div[spark-alert-dialog]',
  host: {
    '[attr.state]': 'state()',
  },
})
export class SparkAlertDialogComponent {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly variant = input<'default' | 'destructive'>('default');

  readonly state = signal<AlertDialogState>(AlertDialogState.Closed);
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  // 焦点陷阱逻辑
  // ESC 键关闭逻辑
}
```

---

## Phase 3: 导航与布局组件

**Independence Level:** Medium
**Dependencies:** P1 (表单组件)

### Domain Model

```typescript
// Accordion 状态
interface AccordionItem {
  value: string;
  disabled?: boolean;
}

// Breadcrumb 模型
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ComponentType;
}

// Pagination 模型
interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

// Sidebar 状态
interface SidebarState {
  collapsed: boolean;
  pinned: boolean;
  activeItem: string | null;
}
```

### Task List

#### Task 3.1: Accordion 组件
**Output:** Compilable Accordion Component

```typescript
@Component({
  selector: 'div[spark-accordion]',
  host: {
    '[class]': 'computedClass()',
  },
})
export class SparkAccordionComponent {
  readonly items = input.required<AccordionItem[]>();
  readonly multiple = input(false);
  readonly collapsible = input(true);
  readonly value = model<string[]>([]);

  readonly valueChange = output<string[]>();

  protected toggleItem(itemValue: string): void {
    // 实现
  }
}
```

#### Task 3.2: Collapsible 组件
**Output:** Compilable Collapsible Component

```typescript
@Component({
  selector: 'div[spark-collapsible]',
  host: {
    '[attr.data-state]': 'state()',
  },
})
export class SparkCollapsibleComponent {
  readonly open = model(false);
  readonly disabled = input(false);

  readonly state = computed(() => this.open() ? 'open' : 'closed');
  readonly toggle = output<boolean>();

  protected toggleOpen(): void {
    if (!this.disabled()) {
      this.open.update(v => !v);
      this.toggle.emit(this.open());
    }
  }
}
```

#### Task 3.3: Breadcrumb 组件
**Output:** Compilable Breadcrumb Component

```typescript
@Component({
  selector: 'nav[spark-breadcrumb]',
  host: {
    '[attr.role]': '"navigation"',
    '[attr.aria-label]': '"Breadcrumb"',
  },
})
export class SparkBreadcrumbComponent {
  readonly items = input.required<BreadcrumbItem[]>();
  readonly separator = input('/');
  readonly homeHref = input('/');
}
```

#### Task 3.4: Pagination 组件
**Output:** Compilable Pagination Component

```typescript
@Component({
  selector: 'nav[spark-pagination]',
  host: {
    '[attr.role]': '"navigation"',
    '[attr.aria-label]': '"Pagination"',
  },
})
export class SparkPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageSize = input(10);
  readonly totalItems = input(0);
  readonly showSizeChanger = input(false);
  readonly showQuickJumper = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected pages = computed(() => {
    // 生成分页数组逻辑
  });
}
```

#### Task 3.5: Scroll Area 组件
**Output:** Compilable ScrollArea Component

```typescript
@Component({
  selector: 'div[spark-scroll-area]',
})
export class SparkScrollAreaComponent {
  readonly orientation = input<'vertical' | 'horizontal' | 'both'>('vertical');
  readonly hideScrollbar = input(false);

  // 使用自定义滚动条实现
  // 或使用原生 scrollbar 样式
}
```

#### Task 3.6: Resizable 组件
**Output:** Compilable Resizable Component

```typescript
interface ResizeHandle {
  id: string;
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
}

@Component({
  selector: 'div[spark-resizable]',
})
export class SparkResizableComponent {
  readonly handles = input<ResizeHandle[]>([{ id: 'e', direction: 'e' }]);
  readonly minWidth = input(0);
  readonly minHeight = input(0);
  readonly maxWidth = input<number | undefined>(undefined);
  readonly maxHeight = input<number | undefined>(undefined);

  readonly size = signal<{ width: number; height: number }>({
    width: 200,
    height: 200,
  });

  readonly resizeStart = output<void>();
  readonly resize = output<{ width: number; height: number }>();
  readonly resizeEnd = output<void>();

  // 拖拽逻辑
}
```

#### Task 3.7: Sidebar 组件
**Output:** Compilable Sidebar Component

```typescript
interface SidebarItem {
  value: string;
  label: string;
  icon?: ComponentType;
  badge?: string | number;
  children?: SidebarItem[];
  disabled?: boolean;
}

@Component({
  selector: 'aside[spark-sidebar]',
  host: {
    '[attr.data-state]': 'state()',
  },
})
export class SparkSidebarComponent {
  readonly items = input.required<SidebarItem[]>();
  readonly collapsed = model(false);
  readonly pinned = input(false);
  readonly collapsible = input(true);

  readonly state = computed(() =>
    this.collapsed() ? 'collapsed' : 'expanded'
  );

  readonly activeItem = model<string | null>(null);
  readonly itemClick = output<SidebarItem>();

  protected toggleCollapse(): void {
    if (this.collapsible()) {
      this.collapsed.update(v => !v);
    }
  }
}
```

#### Task 3.8: Menubar 组件
**Output:** Compilable Menubar Component

```typescript
interface MenuItem {
  label: string;
  icon?: ComponentType;
  shortcut?: string;
  disabled?: boolean;
  children?: MenuItem[];
  action?: () => void;
}

@Component({
  selector: 'nav[spark-menubar]',
  host: {
    '[attr.role]': '"menubar"',
  },
})
export class SparkMenubarComponent {
  readonly items = input.required<MenuItem[][]>();

  readonly openMenu = signal<string | null>(null);

  protected handleMenuClick(menuId: string): void {
    // 切换菜单状态
  }
}
```

---

## Phase 4: 高级交互组件

**Independence Level:** Low
**Dependencies:** P1, P2

### Domain Model

```typescript
// Dialog 状态
interface DialogState {
  open: boolean;
  closing: boolean;
}

// Popover 位置
type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

// Dropdown Menu 模型
interface DropdownMenuItem {
  label: string;
  icon?: ComponentType;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  action?: () => void;
}

// Carousel 状态
interface CarouselState {
  currentPage: number;
  totalPages: number;
  orientation: 'horizontal' | 'vertical';
}
```

### Task List

#### Task 4.1: Dialog 组件
**Output:** Compilable Dialog Component

```typescript
@Component({
  selector: 'div[spark-dialog]',
  host: {
    '[attr.data-state]': 'state()',
    '[attr.role]': '"dialog"',
    '[attr.aria-modal]': 'true',
  },
})
export class SparkDialogComponent {
  readonly open = model(false);
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  readonly closeOnOverlayClick = input(true);
  readonly closeOnEscape = input(true);

  readonly state = signal<DialogState>({
    open: false,
    closing: false,
  });

  readonly close = output<void>();

  // 焦点管理
  // Portal 逻辑
  // 动画控制
}
```

#### Task 4.2: Popover 组件
**Output:** Compilable Popover Component

```typescript
@Component({
  selector: 'div[spark-popover]',
})
export class SparkPopoverComponent {
  readonly open = model(false);
  readonly placement = input<PopoverPlacement>('bottom');
  readonly offset = input(8);
  readonly trigger = input<'click' | 'hover'>('click');

  readonly openChange = output<boolean>();

  // 浮动定位逻辑
  // 点击外部关闭逻辑
}
```

#### Task 4.3: Dropdown Menu 组件
**Output:** Compilable DropdownMenu Component

```typescript
@Component({
  selector: 'div[spark-dropdown-menu]',
})
export class SparkDropdownMenuComponent {
  readonly items = input.required<DropdownMenuItem[]>();
  readonly open = model(false);
  readonly placement = input<PopoverPlacement>('bottom-start');

  readonly itemClick = output<DropdownMenuItem>();

  protected handleItemClick(item: DropdownMenuItem): void {
    if (!item.disabled) {
      item.action?.();
      this.itemClick.emit(item);
      this.open.set(false);
    }
  }
}
```

#### Task 4.4: Hover Card 组件
**Output:** Compilable HoverCard Component

```typescript
@Component({
  selector: 'div[spark-hover-card]',
})
export class SparkHoverCardComponent {
  readonly openDelay = input(300);
  readonly closeDelay = input(200);
  readonly placement = input<PopoverPlacement>('top');

  readonly state = signal<'closed' | 'opening' | 'open' | 'closing'>('closed');

  // 延迟定时器逻辑
}
```

#### Task 4.5: Navigation Menu 组件
**Output:** Compilable NavigationMenu Component

```typescript
interface NavMenuItem {
  value: string;
  label: string;
  icon?: ComponentType;
  children?: NavMenuItem[];
  disabled?: boolean;
}

@Component({
  selector: 'nav[spark-navigation-menu]',
  host: {
    '[attr.role]': '"navigation"',
  },
})
export class SparkNavigationMenuComponent {
  readonly items = input.required<NavMenuItem[]>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  readonly activeValue = model<string | null>(null);
  readonly activeValueChange = output<string>();
}
```

#### Task 4.6: Combobox 组件
**Output:** Compilable Combobox Component

```typescript
@Component({
  selector: 'div[spark-combobox]',
})
export class SparkComboboxComponent<T = string> {
  readonly options = input.required<SelectOption<T>[]>();
  readonly value = model<T | null>(null);
  readonly searchValue = model('');
  readonly multiple = input(false);
  readonly creatable = input(false);

  readonly isOpen = signal(false);
  readonly filteredOptions = computed<SelectOption<T>[]>(() => {
    // 过滤逻辑
  });

  readonly valueChange = output<T | T[] | null>();
}
```

#### Task 4.7: Command 组件
**Output:** Compilable Command Component

```typescript
interface CommandItem {
  value: string;
  label: string;
  icon?: ComponentType;
  shortcut?: string;
  keywords?: string[];
  action?: () => void;
}

@Component({
  selector: 'div[spark-command]',
})
export class SparkCommandComponent {
  readonly items = input.required<CommandItem[]>();
  readonly open = model(false);
  readonly placeholder = input('Type a command or search...');
  readonly searchValue = model('');

  readonly filteredItems = computed(() => {
    // 搜索过滤逻辑
  });

  readonly execute = output<CommandItem>();
}
```

#### Task 4.8: Drawer 组件
**Output:** Compilable Drawer Component

```typescript
type DrawerSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'div[spark-drawer]',
})
export class SparkDrawerComponent {
  readonly open = model(false);
  readonly side = input<DrawerSide>('right');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  readonly closeOnOverlayClick = input(true);

  // 类似 Dialog 但从边缘滑入
}
```

#### Task 4.9: Carousel 组件
**Output:** Compilable Carousel Component

```typescript
@Component({
  selector: 'div[spark-carousel]',
  host: {
    '[attr.role]': '"region"',
    '[attr.aria-roledescription]': '"carousel"',
  },
})
export class SparkCarouselComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly loop = input(true);
  readonly autoplay = input(false);
  readonly interval = input(3000);

  readonly currentPage = signal(0);
  readonly totalPages = computed(() => 0); // 从内容获取

  readonly pageChange = output<number>();

  protected next(): void {
    // 实现
  }

  protected prev(): void {
    // 实现
  }
}
```

#### Task 4.10: Sonner 组件
**Output:** Compilable Sonner Component

```typescript
interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

@Component({
  selector: 'div[spark-sonner]',
})
export class SparkSonnerComponent {
  readonly toasts = signal<Toast[]>([]);
  readonly position = input<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  >('bottom-right');

  readonly positionChange = output<Toast>();

  show(toast: Omit<Toast, 'id'>): void {
    // 实现
  }

  dismiss(id: string): void {
    // 实现
  }
}
```

#### Task 4.11: Toggle 组件
**Output:** Compilable Toggle Component

```typescript
@Component({
  selector: 'button[spark-toggle]',
  host: {
    '[attr.pressed]': 'pressed()',
    '[attr.aria-pressed]': 'pressed()',
    '[class]': 'computedClass()',
  },
})
export class SparkToggleComponent {
  readonly pressed = model(false);
  readonly disabled = input(false);
  readonly variant = input<'default' | 'outline'>('default');

  protected computedClass = computed(() =>
    cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium',
      'transition-colors focus-visible:outline-none focus-visible:ring-2',
      'disabled:pointer-events-none disabled:opacity-50',
      this.pressed() && 'bg-accent text-accent-foreground'
    )
  );

  readonly pressedChange = output<boolean>();
}
```

#### Task 4.12: Toggle Group 组件
**Output:** Compilable ToggleGroup Component

```typescript
@Component({
  selector: 'div[spark-toggle-group]',
  host: {
    '[attr.role]': '"group"',
  },
})
export class SparkToggleGroupComponent<T = string> {
  readonly value = model<T | null>(null);
  readonly multiple = input(false);
  readonly disabled = input(false);

  readonly valueChange = output<T>();

  protected handleToggle(itemValue: T): void {
    if (this.multiple()) {
      // 多选逻辑
    } else {
      // 单选逻辑
    }
  }
}
```

---

## Phase 5: 组件文档与示例

**Independence Level:** Low
**Dependencies:** P1, P2, P3, P4

### Task List

#### Task 5.1: Storybook / 组件演示页面
**Output:** Compilable Demo Components

```typescript
// 每个组件的演示页面
@Component({
  selector: 'spark-demo-button',
  template: `
    <div class="space-y-4">
      <h2>Button Variants</h2>
      <div class="flex gap-2">
        <spark-button variant="default">Default</spark-button>
        <spark-button variant="destructive">Destructive</spark-button>
        <spark-button variant="outline">Outline</spark-button>
        <spark-button variant="ghost">Ghost</spark-button>
      </div>
    </div>
  `,
})
export class DemoButtonComponent {}
```

#### Task 5.2: API 文档生成
**Output:** Generated API Documentation

- 使用 Compodoc 或自定义工具
- 为每个组件生成:
  - Inputs 表格
  - Outputs 表格
  - Methods 表格
  - Usage 示例

#### Task 5.3: 可访问性测试
**Output:** A11y Test Suite

- axe-core 集成
- 键盘导航测试
- 屏幕阅读器测试
- ARIA 属性验证

---

## 实现规范 (STANDARDS.md 合规)

### 1. 组件结构规范

```typescript
// 标准组件模板
@Component({
  selector: 'tag[spark-component-name]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
})
export class SparkComponentNameComponent {
  // Inputs: 使用 input() API
  readonly value = input<string>('');

  // Outputs: 使用 output() API
  readonly valueChange = output<string>();

  // Models: 双向绑定使用 model() API
  readonly state = model<string>('');

  // Computed: 派生状态
  protected computedClass = computed(() =>
    cn('base-class', this.value())
  );

  // 注入的服务
  private elementRef = inject(ElementRef);
}
```

### 2. 样式规范

- **所有样式必须使用 CSS 变量**，禁止硬编码颜色值
- 使用 Tailwind CSS v4 `@theme` 指令定义的设计 token
- 组件 CSS 文件仅包含组件特定的动画或特殊效果

```css
/* ✅ 正确 */
.custom-class {
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

/* ❌ 错误 */
.custom-class {
  color: #2B6D61;
  border: 1px solid #e5e7eb;
}
```

### 3. 变体系统规范

使用 Class Variance Authority (CVA) 模式:

```typescript
const componentVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'variant-default-classes',
        destructive: 'variant-destructive-classes',
      },
      size: {
        sm: 'size-sm-classes',
        md: 'size-md-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);
```

### 4. 可访问性规范

- 所有交互组件必须实现键盘导航
- 正确的 ARIA 属性
- 焦点管理 (focus trap, focus restore)
- 屏幕阅读器支持

### 5. 文件组织规范

```
src/app/shared/ui/
├── [component-name]/
│   ├── [component-name].component.ts
│   ├── [component-name].component.css (可选)
│   ├── [component-name].component.spec.ts (必须)
│   └── index.ts (导出)
└── index.ts (汇总导出)
```

---

## 执行顺序建议

### Wave 1: 基础组件 (1-2 周)
- P1: Label, Textarea, Field
- P2: Alert, Skeleton, Spinner, Empty, KBD

### Wave 2: 表单增强 (2-3 周)
- P1: Select, RadioGroup, Slider, InputOTP
- P2: Avatar, Progress

### Wave 3: 布局与导航 (2-3 周)
- P3: Accordion, Collapsible, Breadcrumb, ScrollArea

### Wave 4: 高级交互 (3-4 周)
- P4: Dialog, Popover, DropdownMenu
- P3: Pagination, Resizable, Sidebar

### Wave 5: 复杂组件 (4-5 周)
- P1: Calendar, Form
- P4: NavigationMenu, Combobox, Command, Drawer, Carousel, Sonner

### Wave 6: 文档与收尾 (1-2 周)
- P5: 所有文档和示例
- 可访问性审计

---

## 设计 Token 依赖

所有组件依赖的设计 token 定义在 `src/styles.css`:

```css
@theme {
  /* 颜色 */
  --color-primary: oklch(var(--primary));
  --color-destructive: oklch(var(--destructive));
  --color-muted: oklch(var(--muted));
  --color-accent: oklch(var(--accent));

  /* 间距 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* 圆角 */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* 动画 */
  --animation-spring: spring(1 100 10 0.5);
  --animation-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 附录: 依赖包列表

### 必需
- `clsx` / `classnames` - 类名合并
- `tailwind-merge` - Tailwind 类名合并
- `class-variance-authority` - 变体系统

### 可选 (按需引入)
- `date-fns` - Calendar 组件
- `embla-carousel` - Carousel 组件
- `recharts` - Chart 组件

### 开发依赖
- `@angular/cdk` - 部分组件可复用 CDK 功能
- `@testing-library/angular` - 测试

---

## 审批检查清单

在开始实现前，确认:

- [ ] 设计 Token 系统已完整迁移到 `@theme` 指令
- [ ] CVA 工具函数已添加到项目
- [ ] `cn()` 类名合并工具已实现
- [ ] 组件目录结构已确定
- [ ] 文档系统已准备就绪
