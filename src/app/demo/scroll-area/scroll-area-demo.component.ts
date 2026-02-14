import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrollAreaComponent } from '@app/shared/ui/scroll-area';
import {
  basicScrollAreas,
  sizedScrollAreas,
  styledScrollAreas,
  generateLongContent,
  generateLongHorizontalContent,
} from './examples/scroll-area-examples';

/**
 * Demo Scroll Area Page Component
 *
 * 展示 Scroll Area 组件的各种用法和样式
 */
@Component({
  selector: 'app-scroll-area-demo',
  imports: [ScrollAreaComponent],
  templateUrl: './scroll-area-demo.component.html',
  styleUrl: './scroll-area-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class ScrollAreaDemoComponent {
  // 示例配置 - 从 examples 文件导入
  readonly basicScrollAreas = basicScrollAreas;
  readonly sizedScrollAreas = sizedScrollAreas;
  readonly styledScrollAreas = styledScrollAreas;

  // 生成的内容
  readonly longContent = generateLongContent();
  readonly longHorizontalContent = generateLongHorizontalContent();

  /**
   * 获取滚动区域高度样式
   */
  getScrollHeight(example: { height?: string }): string {
    return example.height || '12rem';
  }
}
