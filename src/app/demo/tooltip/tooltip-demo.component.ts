import { Component } from '@angular/core';
import { TooltipComponent, TooltipTriggerComponent, TooltipContentComponent } from '@app/shared/ui';

/**
 * Tooltip Demo Component
 *
 * 展示 Tooltip 组件的各种用法和样式
 */
@Component({
  selector: 'app-tooltip-demo',
  standalone: true,
  imports: [TooltipComponent, TooltipTriggerComponent, TooltipContentComponent],
  templateUrl: './tooltip-demo.component.html',
  styleUrl: './tooltip-demo.component.css',
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class TooltipDemoComponent {}
