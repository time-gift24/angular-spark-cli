import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, Signal, viewChild, ElementRef, computed, effect, inject, DestroyRef, signal, ChangeDetectionStrategy, ChangeDetectorRef, booleanAttribute } from '@angular/core';
import { LiquidGlassDirective } from '../liquid-glass';
import { ChatMessage, PanelPosition, PanelSize } from '../../models';

/**
 * AI Chat Messages Card Component - 矿物与时光主题
 *
 * 可自由拖拽、缩放的 AI 消息面板，使用 liquid-glass 效果。
 *
 * 特性：
 * - Liquid glass 视觉效果（可选，与输入框风格一致）
 * - 自由拖拽定位
 * - 自由缩放大小
 * - 消息气泡样式
 * - 自动滚动到底部
 * - 平滑动画过渡
 * - 性能优化（OnPush + 拖拽期间暂停动画）
 *
 * @example
 * ```html
 * <!-- 默认启用 liquid glass 效果 -->
 * <app-chat-messages-card
 *   [messages]="messagesSignal"
 *   [isVisible]="isVisibleSignal"
 *   [position]="positionSignal"
 *   [size]="sizeSignal"
 *   (positionChange)="onPositionChange($event)"
 *   (sizeChange)="onSizeChange($event)"
 * />
 *
 * <!-- 禁用 liquid glass 效果以提升性能 -->
 * <app-chat-messages-card
 *   [enableLiquidGlass]="false"
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
  imports: [CommonModule, LiquidGlassDirective, DatePipe],
  templateUrl: './chat-messages-card.component.html',
  styleUrls: ['./chat-messages-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessagesCardComponent {
  @Input() messages: Signal<ChatMessage[]>;
  @Input() isVisible: Signal<boolean>;
  @Input() position: Signal<PanelPosition>;
  @Input() size: Signal<PanelSize>;

  /**
   * 启用或禁用 liquid glass 视觉效果
   *
   * 默认启用。设置为 false 可以提升性能，特别是在拖拽/resize 期间。
   * 建议在需要最佳性能时禁用此效果。
   *
   * @default true
   */
  @Input({ transform: booleanAttribute }) enableLiquidGlass = true;

  @Output() positionChange = new EventEmitter<PanelPosition>();
  @Output() sizeChange = new EventEmitter<PanelSize>();

  // 视图子元素引用
  readonly messageListRef = viewChild.required<ElementRef<HTMLDivElement>>('messageList');

  // 私有状态
  private readonly NEAR_BOTTOM_THRESHOLD = 50;
  private readonly destroyRef = inject(DestroyRef);
  private previousMessageCount = signal(0);

  // 性能优化：跟踪拖拽/resize 状态
  readonly isDraggingOrResizing = signal(false);

  // 计算属性 - 使用 computed signal 替代 getter
  readonly isUserNearBottom = computed(() => {
    const element = this.messageListRef()?.nativeElement;
    if (!element) return true;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    return distanceFromBottom < this.NEAR_BOTTOM_THRESHOLD;
  });

  readonly safePosition = computed(() => {
    const pos = this.position?.();
    const size = this.safeSize();
    if (!pos || (pos.x === 0 && pos.y === 0)) {
      return this.calculateCenteredPosition(size.width, size.height);
    }
    return pos;
  });

  readonly safeSize = computed(() => {
    return this.size?.() ?? { width: 500, height: 400 };
  });

  readonly safeIsVisible = computed(() => {
    return this.isVisible?.() ?? false;
  });

  readonly safeMessages = computed(() => {
    return this.messages?.() ?? [];
  });

  // 性能优化：根据拖拽/resize 状态决定是否启用 liquid glass 动画
  readonly liquidGlassDisabled = computed(() => {
    return this.isDraggingOrResizing();
  });

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
  private calculateCenteredPosition(panelWidth: number, panelHeight: number): PanelPosition {
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

  /**
   * 性能优化：拖拽开始时暂停 liquid glass 动画
   */
  onDragStart(): void {
    this.isDraggingOrResizing.set(true);
  }

  /**
   * 性能优化：拖拽结束时恢复 liquid glass 动画
   */
  onDragEnd(): void {
    this.isDraggingOrResizing.set(false);
  }

  /**
   * 性能优化：resize 开始时暂停 liquid glass 动画
   */
  onResizeStart(): void {
    this.isDraggingOrResizing.set(true);
  }

  /**
   * 性能优化：resize 结束时恢复 liquid glass 动画
   */
  onResizeEnd(): void {
    this.isDraggingOrResizing.set(false);
  }
}
