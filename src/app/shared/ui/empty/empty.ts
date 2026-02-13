import { Component, computed, input, output, Type, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '@app/shared/utils';
import { ButtonComponent } from '@app/shared/ui/button';
import { NgComponentOutlet } from '@angular/common';

/**
 * Empty Component - Empty state with icon, title, description, and action
 *
 * Displays an empty state placeholder with optional icon and action button.
 * All sizing uses CSS variables.
 *
 * @selector div[spark-empty]
 * @standalone true
 *
 * @example
 * ```html
 * <div spark-empty [title]="'No items'" [description]="'Create your first item to get started'" />
 * ```
 */
@Component({
  selector: 'div[spark-empty]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent, NgComponentOutlet],
  host: {
    '[class]': 'computedClass()',
    '[attr.role]': '"status"',
    '[attr.aria-label]': 'title()',
  },
  template: `
    <div class="empty-content">
      @if (icon()) {
        <div class="empty-icon">
          <ng-container [ngComponentOutlet]="icon()!" />
        </div>
      }
      <h3 class="empty-title">{{ title() }}</h3>
      @if (description()) {
        <p class="empty-description">{{ description() }}</p>
      }
      @if (actionLabel() && actionLabel().length > 0) {
        <button
          type="button"
          spark-button
          variant="outline"
          (click)="onActionClick()"
          class="empty-action"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styleUrl: './empty.css',
})
export class EmptyComponent {
  /**
   * Icon component to display (Type)
   */
  readonly icon = input<Type<unknown> | null>(null);

  /**
   * Title text (required)
   */
  readonly title = input.required<string>();

  /**
   * Description text
   */
  readonly description = input<string>('');

  /**
   * Action button label
   */
  readonly actionLabel = input<string>('');

  /**
   * Action button click event
   */
  readonly actionClick = output<void>();

  /**
   * Base empty state styles
   */
  private readonly baseClass = 'flex flex-col items-center justify-center text-center';

  /**
   * Computed class string (base + custom classes)
   */
  protected computedClass = computed(() => {
    return cn(this.baseClass, '');
  });

  /**
   * Handle action button click
   */
  protected onActionClick(): void {
    this.actionClick.emit();
  }
}
