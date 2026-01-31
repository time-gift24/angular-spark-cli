import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, Signal, viewChild, ElementRef, computed, effect, inject, DestroyRef, signal } from '@angular/core';
import { DragHandleDirective } from '../../directives/drag-handle.directive';
import { ResizeHandleDirective } from '../../directives/resize-handle.directive';
import { LiquidGlassDirective } from '../liquid-glass';
import { ChatMessage, PanelPosition, PanelSize } from '../../models';

/**
 * AI Chat Messages Card Component - 矿物与时光主题
 *
 * 可自由拖拽、缩放的 AI 消息面板，使用 liquid-glass 效果。
 *
 * 特性：
 * - Liquid glass 视觉效果（与输入框风格一致）
 * - 自由拖拽定位
 * - 自由缩放大小
 * - 消息气泡样式
 * - 自动滚动到底部
 * - 平滑动画过渡
 *
 * @example
 * ```html
 * <app-chat-messages-card
 *   [messages]="messagesSignal"
 *   [isVisible]="isVisibleSignal"
 *   [position]="positionSignal"
 *   [size]="sizeSignal"
 *   (positionChange)="onPositionChange($event)"
 *   (sizeChange)="onSizeChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-chat-messages-card',
  standalone: true,
  imports: [CommonModule, DragHandleDirective, ResizeHandleDirective, LiquidGlassDirective, DatePipe],
  templateUrl: './chat-messages-card.component.html',
  styleUrls: ['./chat-messages-card.component.css'],
})
export class ChatMessagesCardComponent {
  @Input() messages: Signal<ChatMessage[]>;
  @Input() isVisible: Signal<boolean>;
  @Input() position: Signal<PanelPosition>;
  @Input() size: Signal<PanelSize>;

  @Output() positionChange = new EventEmitter<PanelPosition>();
  @Output() sizeChange = new EventEmitter<PanelSize>();

  // 视图子元素引用
  readonly messageListRef = viewChild.required<ElementRef<HTMLDivElement>>('messageList');

  // 私有状态
  private readonly NEAR_BOTTOM_THRESHOLD = 50;
  private readonly destroyRef = inject(DestroyRef);
  private previousMessageCount = signal(0);

  // 计算属性 - 安全获取器
  readonly isUserNearBottom = computed(() => {
    const element = this.messageListRef()?.nativeElement;
    if (!element) return true;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    return distanceFromBottom < this.NEAR_BOTTOM_THRESHOLD;
  });

  // 安全获取器
  get safePosition(): PanelPosition {
    const pos = this.position?.();
    if (!pos || (pos.x === 0 && pos.y === 0)) {
      return this.calculateCenteredPosition();
    }
    return pos;
  }

  get safeSize(): PanelSize {
    return this.size?.() ?? { width: 500, height: 400 };
  }

  get safeIsVisible(): boolean {
    return this.isVisible?.() ?? false;
  }

  get safeMessages(): ChatMessage[] {
    return this.messages?.() ?? [];
  }

  // 自动滚动效果
  private readonly autoScrollEffect = effect(() => {
    const messages = this.messages();
    const currentCount = messages.length;
    const previousCount = this.previousMessageCount();

    if (currentCount > previousCount && currentCount > 0) {
      const isNearBottom = this.isUserNearBottom();
      if (isNearBottom) {
        setTimeout(() => {
          this.scrollToBottom('smooth');
        }, 0);
      }
    }

    this.previousMessageCount.set(currentCount);
  });

  /**
   * 计算居中位置（初始位置）
   */
  private calculateCenteredPosition(): PanelPosition {
    const panelWidth = this.safeSize.width;
    const panelHeight = this.safeSize.height;

    // 屏幕中央位置
    const centerX = (window.innerWidth - panelWidth) / 2;
    const centerY = (window.innerHeight - panelHeight) / 2;

    return {
      x: Math.max(0, centerX),
      y: Math.max(0, centerY)
    };
  }

  /**
   * 滚动到底部
   */
  scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    const messageListEl = this.messageListRef()?.nativeElement;
    if (!messageListEl) return;
    messageListEl.scrollTo({
      top: messageListEl.scrollHeight,
      behavior: behavior,
    });
  }
}
