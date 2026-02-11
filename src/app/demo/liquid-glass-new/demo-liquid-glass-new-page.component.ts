import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LiquidGlassComponentV2,
  LiquidGlassDirectiveV2,
} from '@app/shared/ui';

/**
 * Liquid Glass New Demo Page
 *
 * Showcases the new liquid-glass component with various configurations.
 */
@Component({
  selector: 'app-demo-liquid-glass-new-page',
  imports: [CommonModule, RouterLink, LiquidGlassComponentV2, LiquidGlassDirectiveV2],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-page">
      <div class="demo-header">
        <h1 class="demo-title">Liquid Glass v2</h1>
        <p class="demo-subtitle">完美复刻 liquid-glass-react，Apple 质感</p>
        <a routerLink="/demo/liquid-glass" class="demo-link">← 查看旧版本</a>
      </div>

      <!-- Mode Comparison -->
      <section class="demo-section">
        <h2 class="section-title">模式对比 / Mode Comparison</h2>
        <div class="demo-grid">
          <div class="demo-item">
            <div class="demo-label">Standard</div>
            <spk-liquid-glass
              [cornerRadius]="100"
              [padding]="'8px 16px'"
              [displacementScale]="64"
              [elasticity]="0.2"
              [mode]="'standard'"
              (click)="onButtonClick('Standard')">
              <span class="button-text">Standard Mode</span>
            </spk-liquid-glass>
          </div>

          <div class="demo-item">
            <div class="demo-label">Polar</div>
            <spk-liquid-glass
              [cornerRadius]="100"
              [padding]="'8px 16px'"
              [displacementScale]="64"
              [elasticity]="0.2"
              [mode]="'polar'"
              (click)="onButtonClick('Polar')">
              <span class="button-text">Polar Mode</span>
            </spk-liquid-glass>
          </div>

          <div class="demo-item">
            <div class="demo-label">Prominent</div>
            <spk-liquid-glass
              [cornerRadius]="100"
              [padding]="'8px 16px'"
              [displacementScale]="64"
              [elasticity]="0.2"
              [mode]="'prominent'"
              (click)="onButtonClick('Prominent')">
              <span class="button-text">Prominent Mode</span>
            </spk-liquid-glass>
          </div>

          <div class="demo-item">
            <div class="demo-label">Shader</div>
            <spk-liquid-glass
              [cornerRadius]="100"
              [padding]="'8px 16px'"
              [displacementScale]="64"
              [elasticity]="0.2"
              [mode]="'shader'"
              (click)="onButtonClick('Shader')">
              <span class="button-text">Shader Mode</span>
            </spk-liquid-glass>
          </div>
        </div>
      </section>

      <!-- Elasticity Comparison -->
      <section class="demo-section">
        <h2 class="section-title">弹性对比 / Elasticity</h2>
        <div class="demo-grid">
          <div class="demo-item">
            <div class="demo-label">Low (0.05)</div>
            <spk-liquid-glass
              [cornerRadius]="100"
              [padding]="'8px 16px'"
              [elasticity]="0.05"
              (click)="onButtonClick('Low')">
              <span class="button-text">Low Elasticity</span>
            </spk-liquid-glass>
          </div>

          <div class="demo-item">
            <div class="demo-label">Medium (0.15)</div>
            <spk-liquid-glass
              [cornerRadius]="100"
              [padding]="'8px 16px'"
              [elasticity]="0.15"
              (click)="onButtonClick('Medium')">
              <span class="button-text">Medium</span>
            </spk-liquid-glass>
          </div>

          <div class="demo-item">
            <div class="demo-label">High (0.3)</div>
            <spk-liquid-glass
              [cornerRadius]="100"
              [padding]="'8px 16px'"
              [elasticity]="0.3"
              (click)="onButtonClick('High')">
              <span class="button-text">High Elasticity</span>
            </spk-liquid-glass>
          </div>
        </div>
      </section>

      <!-- Size Variants -->
      <section class="demo-section">
        <h2 class="section-title">尺寸变体 / Size Variants</h2>
        <div class="demo-flex">
          <spk-liquid-glass
            [cornerRadius]="100"
            [padding]="'6px 12px'"
            [displacementScale]="50"
            [elasticity]="0.15"
            (click)="onButtonClick('Small')">
            <span class="button-text-small">Small</span>
          </spk-liquid-glass>

          <spk-liquid-glass
            [cornerRadius]="100"
            [padding]="'8px 16px'"
            [displacementScale]="64"
            [elasticity]="0.15"
            (click)="onButtonClick('Medium')">
            <span class="button-text">Medium</span>
          </spk-liquid-glass>

          <spk-liquid-glass
            [cornerRadius]="100"
            [padding]="'10px 20px'"
            [displacementScale]="80"
            [elasticity]="0.15"
            (click)="onButtonClick('Large')">
            <span class="button-text-large">Large</span>
          </spk-liquid-glass>
        </div>
      </section>

      <!-- Card Examples -->
      <section class="demo-section">
        <h2 class="section-title">卡片示例 / Cards</h2>
        <div class="card-grid">
          <spk-liquid-glass
            [cornerRadius]="16"
            [padding]="'20px'"
            [displacementScale]="70"
            [elasticity]="0.15"
            class="card">
            <div class="card-content">
              <div class="card-icon">💎</div>
              <h3 class="card-title">Liquid Card</h3>
              <p class="card-text">Fluid distortion with mouse tracking</p>
            </div>
          </spk-liquid-glass>

          <spk-liquid-glass
            [cornerRadius]="16"
            [padding]="'20px'"
            [displacementScale]="70"
            [elasticity]="0.15"
            [mode]="'prominent'"
            class="card">
            <div class="card-content">
              <div class="card-icon">🔮</div>
              <h3 class="card-title">Prominent</h3>
              <p class="card-text">Stronger distortion effect</p>
            </div>
          </spk-liquid-glass>

          <spk-liquid-glass
            [cornerRadius]="16"
            [padding]="'20px'"
            [displacementScale]="70"
            [elasticity]="0.15"
            [overLight]="true"
            class="card">
            <div class="card-content">
              <div class="card-icon">✨</div>
              <h3 class="card-title">Over Light</h3>
              <p class="card-text">Enhanced blur and shadows</p>
            </div>
          </spk-liquid-glass>
        </div>
      </section>

      <!-- Directive Example -->
      <section class="demo-section">
        <h2 class="section-title">指令用法 / Directive</h2>
        <p class="section-desc">只需添加 <code>[liquidGlass]</code> 即可将任意元素 liquid 化</p>
        <div class="directive-demo">
          <div
            [liquidGlass]="true"
            [liquidGlassMode]="'standard'"
            [liquidGlassCornerRadius]="12"
            [liquidGlassPadding]="'20px'"
            [liquidGlassElasticity]="0.15"
            [liquidGlassDisplacementScale]="70"
            class="custom-card">
            <div class="card-content">
              <div class="card-icon">🎨</div>
              <h3 class="card-title">Directive Style</h3>
              <p class="card-text">Works on any element!</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Click Feedback -->
      @if (lastClick()) {
        <div class="click-feedback">Clicked: {{ lastClick() }}</div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .demo-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 40px;
      position: relative;
    }

    .demo-title {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      background: linear-gradient(
        135deg,
        var(--primary) 0%,
        var(--chart-2) 50%,
        var(--accent) 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .demo-subtitle {
      color: var(--muted-foreground);
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .demo-link {
      color: var(--primary);
      text-decoration: none;
      font-size: 0.9rem;
    }

    .demo-link:hover {
      text-decoration: underline;
    }

    .demo-section {
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--foreground);
    }

    .section-desc {
      color: var(--muted-foreground);
      margin-bottom: 16px;
      font-size: 0.9rem;
    }

    .section-desc code {
      background: var(--muted);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.85em;
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 24px;
      align-items: center;
    }

    .demo-flex {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .demo-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .demo-label {
      font-size: 0.75rem;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .button-text {
      color: var(--primary-foreground);
      font-weight: 500;
      font-size: 0.9rem;
    }

    .button-text-small {
      color: var(--primary-foreground);
      font-weight: 500;
      font-size: 0.85rem;
    }

    .button-text-large {
      color: var(--primary-foreground);
      font-weight: 500;
      font-size: 1rem;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .card :host {
      display: block;
    }

    .card-content {
      color: var(--primary-foreground);
      text-align: center;
    }

    .card-icon {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .card-title {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .card-text {
      margin: 0;
      font-size: 0.85rem;
      color: var(--primary-foreground);
      line-height: 1.4;
      opacity: 0.8;
    }

    .directive-demo {
      display: flex;
      justify-content: center;
      padding: 20px 0;
    }

    .custom-card {
      width: 280px;
    }

    .click-feedback {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, var(--primary), var(--chart-2));
      color: var(--primary-foreground);
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: var(--shadow-control-hover);
      animation: fadeIn 0.3s ease-out;
      z-index: 1000;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class DemoLiquidGlassNewPageComponent {
  readonly lastClick = signal('');

  onButtonClick(name: string): void {
    this.lastClick.set(name);
    console.log('[Liquid Glass Demo] Clicked:', name);
  }
}
