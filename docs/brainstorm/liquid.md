下面把 **1–6 步**从零到可跑完整重发（Angular + Tailwind v4 + Directive 版）。你按顺序做就能得到一个“Liquid Glass”效果的卡片，并且后续可以接上我刚才发的 7–12 进阶。

---

## 1) 新建 Angular 项目（standalone）

```bash
npm create @angular@latest liquid-glass-demo
# 选择：Standalone: Yes，Routing: No（可选），Styles: CSS（或 SCSS）
cd liquid-glass-demo
npm i
npm start
```

---

## 2) 安装并启用 Tailwind CSS v4

安装：

```bash
npm i -D tailwindcss @tailwindcss/postcss postcss
```

创建 `postcss.config.js`（在项目根目录）：

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

在 `src/styles.css` 写入 Tailwind v4 的导入（v4 用这一句）：

```css
@import "tailwindcss";
```

启动项目确认无报错。

---

## 3) 创建 Liquid Glass 指令文件

生成一个 directive（或手动新建也行）：

```bash
ng g directive liquid-glass --standalone
```

然后用下面的完整代码覆盖 `src/app/liquid-glass.directive.ts`。

---

## 4) 实现 LiquidGlassDirective（核心：结构 + CSS + SVG filter）

> 这版是“基础可运行版”（后续 7) 我给的 edge-mask 版会更像 demo）。

```ts
import {
  Directive,
  ElementRef,
  Input,
  Renderer2,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
} from '@angular/core';

type RefractionMode = 'standard' | 'polar' | 'prominent';

@Directive({
  selector: '[liquidGlass]',
  standalone: true,
})
export class LiquidGlassDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private r = inject(Renderer2);

  // ===== Public inputs (basic set) =====
  @Input() lgDisplacementScale = 90;      // 0..140
  @Input() lgBlurAmount = 0.45;           // 0..1 (overlay blur + small filter blur)
  @Input() lgSaturation = 140;            // 50..200 (%)
  @Input() lgAberrationIntensity = 2;     // 0..6 (px-ish)
  @Input() lgElasticity = 0.25;           // 0..0.6 (smoothing)
  @Input() lgCornerRadius = 28;           // px
  @Input() lgOverLight = false;           // invert-ish overlay tint
  @Input() lgMode: RefractionMode = 'standard';

  // ===== internals =====
  private host!: HTMLElement;
  private overlay!: HTMLDivElement;
  private svgDefs?: SVGSVGElement;
  private raf = 0;

  private filterId = `lg-filter-${Math.random().toString(16).slice(2)}`;

  // cursor tracking (smoothed)
  private targetX = 0.5;
  private targetY = 0.5;
  private curX = 0.5;
  private curY = 0.5;

  ngOnInit(): void {
    this.host = this.el.nativeElement;

    // Host base styles
    this.r.setStyle(this.host, 'position', 'relative');
    this.r.setStyle(this.host, 'isolation', 'isolate');
    this.r.setStyle(this.host, 'overflow', 'hidden');
    this.r.setStyle(this.host, 'border-radius', `${this.lgCornerRadius}px`);

    // Create overlay layer
    this.overlay = this.r.createElement('div');
    this.r.appendChild(this.host, this.overlay);

    this.applyBaseOverlayStyles();
    this.applyVisualStyles();

    // Add SVG filter defs inside host (works with url(#id))
    this.svgDefs = this.createSvgFilterDefs();
    this.r.appendChild(this.host, this.svgDefs);

    // Start animation loop (for smoothing)
    this.loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    if (this.svgDefs?.parentNode) this.svgDefs.parentNode.removeChild(this.svgDefs);
    if (this.overlay?.parentNode) this.overlay.parentNode.removeChild(this.overlay);
  }

  // ===== Interaction =====
  @HostListener('pointermove', ['$event'])
  onPointerMove(ev: PointerEvent) {
    const rect = this.host.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;
    const y = (ev.clientY - rect.top) / rect.height;
    this.targetX = clamp01(x);
    this.targetY = clamp01(y);
  }

  @HostListener('pointerleave')
  onPointerLeave() {
    // ease back to center
    this.targetX = 0.5;
    this.targetY = 0.5;
  }

  // ===== Styles =====
  private applyBaseOverlayStyles() {
    // Make sure overlay doesn't block clicks
    this.r.setStyle(this.overlay, 'pointer-events', 'none');
    this.r.setStyle(this.overlay, 'position', 'absolute');
    this.r.setStyle(this.overlay, 'inset', '0');
    this.r.setStyle(this.overlay, 'border-radius', 'inherit');

    // Put overlay above content
    this.r.setStyle(this.overlay, 'z-index', '1');

    // Base glass look
    this.r.setStyle(this.overlay, 'backdrop-filter', `blur(${this.blurPx()}px) saturate(${this.lgSaturation}%)`);
    this.r.setStyle(this.overlay, '-webkit-backdrop-filter', `blur(${this.blurPx()}px) saturate(${this.lgSaturation}%)`);

    // We'll animate highlight via CSS vars
    this.r.setStyle(this.overlay, 'will-change', 'transform, filter, background');
    this.r.setStyle(this.overlay, 'transform', 'translateZ(0)');

    // Border / inner highlight
    this.r.setStyle(this.overlay, 'border', '1px solid rgba(255,255,255,0.16)');
    this.r.setStyle(this.overlay, 'box-shadow', '0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.22)');
  }

  private applyVisualStyles() {
    // overlay tint + highlight
    const baseTint = this.lgOverLight ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.06)';
    const hotspotA = this.lgOverLight ? 0.18 : 0.22;

    this.r.setStyle(
      this.overlay,
      'background',
      `
      radial-gradient(140px 140px at var(--lg-x) var(--lg-y),
        rgba(255,255,255,${hotspotA}),
        rgba(255,255,255,0.08) 35%,
        rgba(255,255,255,0) 70%),
      linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 65%),
      ${baseTint}
    `.replace(/\s+/g, ' ').trim()
    );

    // chromatic-ish edge (simple)
    const a = Math.max(0, this.lgAberrationIntensity);
    this.r.setStyle(
      this.overlay,
      'filter',
      `url(#${this.filterId}) drop-shadow(${a}px 0 rgba(255,40,120,0.18)) drop-shadow(${-a}px 0 rgba(40,160,255,0.16))`
    );
  }

  private blurPx() {
    // map 0..1 => 0..18px (tweakable)
    return Math.round(this.lgBlurAmount * 18);
  }

  // ===== SVG filter =====
  private createSvgFilterDefs(): SVGSVGElement {
    const svg = this.r.createElement('svg', 'svg') as SVGSVGElement;
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('style', 'position:absolute; width:0; height:0; overflow:hidden;');

    const defs = this.r.createElement('defs', 'svg');
    const filter = this.r.createElement('filter', 'svg');

    filter.setAttribute('id', this.filterId);
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    const turbulence = this.r.createElement('feTurbulence', 'svg');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('numOctaves', '2');

    if (this.lgMode === 'polar') {
      turbulence.setAttribute('baseFrequency', '0.010 0.06');
      turbulence.setAttribute('seed', '9');
    } else if (this.lgMode === 'prominent') {
      turbulence.setAttribute('baseFrequency', '0.02 0.02');
      turbulence.setAttribute('numOctaves', '3');
      turbulence.setAttribute('seed', '4');
    } else {
      turbulence.setAttribute('baseFrequency', '0.014 0.035');
      turbulence.setAttribute('seed', '2');
    }

    turbulence.setAttribute('result', 'noise');

    const disp = this.r.createElement('feDisplacementMap', 'svg');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'noise');
    disp.setAttribute('scale', String(this.lgDisplacementScale));
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'G');
    disp.setAttribute('result', 'displaced');

    const blur = this.r.createElement('feGaussianBlur', 'svg');
    blur.setAttribute('in', 'displaced');
    blur.setAttribute('stdDeviation', String(Math.max(0, this.lgBlurAmount * 0.8)));
    blur.setAttribute('result', 'out');

    filter.appendChild(turbulence);
    filter.appendChild(disp);
    filter.appendChild(blur);

    defs.appendChild(filter);
    svg.appendChild(defs);
    return svg;
  }

  // ===== animation loop for smoothing + CSS vars =====
  private loop = () => {
    // exponential smoothing
    const e = clamp(this.lgElasticity, 0, 0.6);
    const k = 1 - Math.pow(1 - e, 2); // make it a bit stronger at low values

    this.curX += (this.targetX - this.curX) * k;
    this.curY += (this.targetY - this.curY) * k;

    // update CSS vars for highlight position
    this.host.style.setProperty('--lg-x', `${(this.curX * 100).toFixed(2)}%`);
    this.host.style.setProperty('--lg-y', `${(this.curY * 100).toFixed(2)}%`);

    // optional slight parallax tilt (very subtle)
    const dx = (this.curX - 0.5) * 2;
    const dy = (this.curY - 0.5) * 2;
    this.overlay.style.transform = `translate3d(${(-dx * 2).toFixed(2)}px, ${(-dy * 2).toFixed(2)}px, 0)`;

    this.raf = requestAnimationFrame(this.loop);
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
```

---

## 5) 在页面里使用指令（做一个示例卡片）

编辑 `src/app/app.component.ts`（standalone）：

```ts
import { Component } from '@angular/core';
import { LiquidGlassDirective } from './liquid-glass.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LiquidGlassDirective],
  template: `
    <main class="min-h-screen bg-slate-950 text-white">
      <div class="mx-auto max-w-5xl p-6">
        <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div class="absolute inset-0">
            <div class="h-full w-full bg-gradient-to-br from-fuchsia-500/30 via-sky-500/25 to-emerald-400/20"></div>
            <div class="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.15),transparent_45%)]"></div>
          </div>

          <div class="relative p-10">
            <div
              liquidGlass
              [lgMode]="'standard'"
              [lgDisplacementScale]="90"
              [lgBlurAmount]="0.45"
              [lgSaturation]="145"
              [lgAberrationIntensity]="2"
              [lgElasticity]="0.25"
              [lgCornerRadius]="28"
              class="w-full max-w-md p-6"
            >
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-white/15 grid place-items-center font-semibold">JD</div>
                <div>
                  <div class="text-lg font-semibold">John Doe</div>
                  <div class="text-white/70 text-sm">Software Engineer</div>
                </div>
              </div>

              <div class="mt-5 space-y-2 text-sm text-white/80">
                <div class="flex justify-between gap-4"><span>Email:</span><span>john.doe@example.com</span></div>
                <div class="flex justify-between gap-4"><span>Location:</span><span>San Francisco, CA</span></div>
                <div class="flex justify-between gap-4"><span>Joined:</span><span>March 2023</span></div>
              </div>

              <button
                class="mt-6 w-full rounded-2xl bg-white/10 hover:bg-white/15 transition border border-white/15 py-3 font-medium"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class AppComponent {}
```

> 注意：我这里背景层里写了一个 `bg-[...]` 的 Tailwind arbitrary value。**如果你严格要求“禁止 arbitrary values”**（很多团队会禁），我可以把这段换成纯 Tailwind utility 组合，不用 `bg-[...]`。

---

## 6) 运行 & 你应该看到的效果

启动：

```bash
npm start
```

然后你会得到：

- 一个半透明玻璃卡片（`backdrop-filter: blur + saturate`）
- 鼠标移动时高光热点跟随（CSS vars `--lg-x/--lg-y`）
- overlay 叠加了 SVG `feDisplacementMap` 的折射扰动（基础版是全局扰动）
- 轻微色散（`drop-shadow` 的红/蓝偏移）

---

如果你希望我把 **第 5 步示例里那段 arbitrary bg** 改成完全合规 Tailwind（不写 `bg-[...]`），告诉我你们 Tailwind 的限制规则（允许 `arbitrary` 吗、是否启用 JIT、是否有 safelist）。另外，如果你要更像截图 demo，我建议你直接把我前面发的 **7) “edge mask 位移”版 filter**替换进第 4 步的 `createSvgFilterDefs()`。