# Angular Spark CLI 项目开发规范（v1）

## 1. 适用范围与技术基线

- 适用仓库：`angular-spark-cli`
- Angular：`20.3.x`
- TypeScript：`5.9.x`
- 构建：Angular CLI + `@angular/build`
- 样式：Tailwind CSS v4 + `src/styles.css` 主题变量
- 状态管理：Angular Signals

## 2. TypeScript 规范

- 必须启用严格模式（`strict: true`），保持 `strictTemplates: true`。
- 类型明显时优先类型推断，避免冗余注解。
- 禁止使用 `any`；不确定类型使用 `unknown`，并在使用前做类型收窄。
- 公共 API、服务返回值、领域模型必须有明确类型。
- 禁止通过类型断言掩盖真实错误（如滥用 `as any`、双重断言）。

## 3. Angular 架构规范

- 一律使用 Standalone 体系。
- 禁止新增 NgModule 作为功能组织方式（迁移兼容除外）。
- 在 Angular v20+ 中，不在装饰器中显式设置 `standalone: true`。
- 新增功能路由必须懒加载（`loadChildren` 或 `loadComponent`）。
- 依赖注入统一使用 `inject()`，默认通过 `providedIn: 'root'` 提供单例服务。
- 路由守卫优先使用函数式 Guard。
- 推荐启用 `withComponentInputBinding()` 进行路由参数到 `input()` 的自动绑定。

## 4. 组件规范

- 单一职责：组件要小、聚焦，复杂逻辑下沉到服务或纯函数。
- 变更检测必须设置 `changeDetection: ChangeDetectionStrategy.OnPush`。
- 输入输出使用 `input()` / `output()`，禁止 `@Input()` / `@Output()` 新增用法。
- 派生状态统一使用 `computed()`。
- Host 绑定统一写在 `host` 对象，禁止 `@HostBinding` / `@HostListener`。
- 小组件优先内联模板；大型组件可拆分外部模板与样式。
- 外部 `templateUrl` / `styleUrl` 必须使用相对当前 TS 文件的路径。

## 5. 模板规范

- 模板保持简单，避免复杂计算和业务分支。
- 控制流使用原生 `@if` / `@for` / `@switch`，禁止 `*ngIf` / `*ngFor` / `*ngSwitch` 新增用法。
- 处理 Observable 优先 `async` pipe。
- 禁止在模板中写箭头函数。
- 禁止在模板中写正则表达式字面量。
- 不依赖全局对象表达式（如直接 `new Date()`）；需在组件中准备好数据后绑定。
- 禁止 `ngClass`，使用 `class` 绑定。
- 禁止 `ngStyle`，使用 `style` 绑定。

## 6. 状态管理规范（Signals）

- 本地状态统一使用 `signal()`。
- 派生状态统一使用 `computed()`。
- 副作用使用 `effect()`，并保持可清理、可追踪。
- 状态更新必须使用 `set()` / `update()`，禁止 `mutate()`。
- 状态转换保持纯函数、可预测，不在更新函数中做 I/O。

## 7. 表单规范

- 默认采用 Typed Reactive Forms（生产稳定）。
- 禁止 Template-driven Forms（`ngModel`）作为新实现方案。
- 优先使用 `NonNullableFormBuilder` 构建强类型表单。
- 表单校验信息必须可访问（错误提示与字段关联，含 `aria-describedby`）。
- Signal Forms 在 Angular 20 项目中仅可用于实验场景，不作为默认标准。

## 8. 服务规范（Services）

- 服务必须遵循单一职责，避免同时承担状态、I/O、视图拼装等多种角色。
- 默认使用 `@Injectable({ providedIn: 'root' })` 提供单例服务。
- 服务依赖统一使用 `inject()`，不新增构造函数注入风格。
- 服务对外暴露稳定类型，不向组件暴露不透明的内部实现细节。
- 跨组件共享状态优先由服务持有信号，只暴露只读视图或受控更新方法。

## 9. HTTP 与数据获取

- 简单数据请求优先 `httpResource()` / `resource()`，复杂流式场景可用 `HttpClient + RxJS`。
- 服务层负责请求与错误归一化，组件层只消费状态。
- 统一处理加载、空态、错误态；禁止无反馈请求。
- 拦截器优先使用函数式 Interceptor。

## 10. 样式与 UI 规范（项目约束）

- 禁止硬编码主题色、间距、圆角等设计值。
- 样式优先 Tailwind 工具类，主题值来自 `src/styles.css` CSS 变量。
- 非必要不新增组件级 `.css` 文件；若必须新增，需说明 Tailwind 无法覆盖的原因。
- 基础 UI 组件放在 `src/app/shared/ui`，复杂业务组件通过组合实现。
- 静态图片必须使用 `NgOptimizedImage`；内联 base64 图片除外。

## 11. 可访问性（A11y）

- 所有页面与组件必须通过 AXE 检查。
- 必须满足 WCAG AA 最低要求。
- 颜色对比达标。
- 键盘可达与可操作。
- 可见焦点样式。
- 语义化标签与正确 ARIA 属性。
- 交互控件需有可感知名称（`label`、`aria-label`、`aria-labelledby`）。

## 12. 安全规范

- 禁止使用危险 DOM 注入。
- 禁止 `[innerHTML]` 直接绑定不可信内容。
- 禁止 `ElementRef.nativeElement.innerHTML`、`outerHTML`、`insertAdjacentHTML`。
- 禁止 `document.write`。
- 需要渲染富文本时，必须先在服务层完成白名单清洗（如 DOMPurify），并最小化允许标签。
- 禁止绕过 Angular 安全机制滥用 `bypassSecurityTrust*`；如确需使用，必须有安全评审记录。

## 13. 目录与分层

推荐目录结构：

```text
src/
  app/
    features/                    # 业务功能域（按业务拆分）
    shared/
      ui/                        # 可复用 UI（含基础组件与跨域复合组件）
      services/                  # 跨域服务、基础设施服务
      models/                    # 跨域共享类型
      utils/                     # 无状态纯工具函数
      lib/                       # 框架适配、组合工具、第三方封装
      layout/                    # 全局布局组件
      mock-data/                 # 演示和开发数据
    demo/                        # 组件演示，不承载核心业务逻辑
  styles.css                     # 全局主题变量与设计 token 唯一来源
```

`shared/ui` 与 `shared/components` 的边界：

- `shared/ui`：放“可复用 UI 单元”，包括基础组件（button/input）和跨业务复合组件（如聊天壳、markdown 渲染器）。
- `shared/components`：历史兼容目录，不再新增。已有内容逐步迁移到 `shared/ui` 或 `features/*`。
- 判断规则 1：如果组件依赖业务语义（订单、用户权限、支付流程），放 `features/*`。
- 判断规则 2：如果组件不依赖具体业务，可被多个功能复用，放 `shared/ui`。
- 判断规则 3：如果只是某个功能的局部子组件，不对外复用，放该功能目录内部（`features/<domain>/components`）。

`ai-chat` 与 `streaming-markdown` 的放置建议：

- 建议放在同一层级的 `shared/ui` 下，不建议一个放 `shared/ui`、一个放 `shared/components`。
- 推荐目标结构：`shared/ui/ai-chat` 与 `shared/ui/streaming-markdown` 作为兄弟目录。
- 不建议把 `streaming-markdown` 下沉到 `ai-chat` 内部，因为它已被独立 demo 和其他场景复用。
- 若未来 `ai-chat` 强绑定单一业务（而非通用组件），则迁移到 `features/chat`，并继续依赖 `shared/ui/streaming-markdown`。

## 14. 代码评审检查清单（PR Checklist）

- 是否遵守 strict typing，且无 `any`。
- 是否使用 signals + `computed()` 管理状态。
- 是否设置 `OnPush`，并避免模板复杂逻辑。
- 是否使用原生控制流与 `input()` / `output()`。
- 是否避免 `@HostBinding` / `@HostListener`。
- 是否避免 `ngClass` / `ngStyle`。
- 是否避免危险 DOM API（含 `innerHTML`）。
- 是否满足 AXE + WCAG AA。
- 新增路由是否懒加载。
- 样式是否基于 Tailwind 与主题变量，避免硬编码。
- 是否避免新增 `shared/components` 目录内容（应进入 `shared/ui` 或 `features/*`）。

## 15. 违规示例（禁止）

```ts
// 禁止：any
const data: any = await fetchData();

// 禁止：standalone 显式声明（v20+ 默认）
@Component({
  standalone: true,
})
export class BadComponent {}

// 禁止：HostBinding/HostListener
@HostBinding('class.active') active = true;

// 禁止：signal mutate
state.mutate((s) => {
  s.count++;
});
```

```html
<!-- 禁止：模板箭头函数 -->
<div>{{ items().map(x => x.name) }}</div>

<!-- 禁止：ngClass/ngStyle -->
<div [ngClass]="classes" [ngStyle]="styles"></div>

<!-- 禁止：危险 innerHTML -->
<div [innerHTML]="rawHtml"></div>
```

## 16. 推荐示例（应当）

```ts
@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'active()',
    '(click)': 'onClick()',
  },
  template: `
    <article class="rounded-md border p-3">
      <h3 class="text-sm font-medium">{{ name() }}</h3>
      @if (subtitle()) {
        <p class="text-muted-foreground text-xs">{{ subtitle() }}</p>
      }
    </article>
  `,
})
export class UserCardComponent {
  readonly name = input.required<string>();
  readonly subtitle = input<string>('');
  readonly active = signal(false);
  readonly displayName = computed(() => this.name().trim());

  onClick(): void {
    this.active.update((value) => !value);
  }
}
```
