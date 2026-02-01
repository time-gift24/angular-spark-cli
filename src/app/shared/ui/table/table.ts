import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Table Component - 主容器
 *
 * 完全响应式的表格组件，支持深色模式
 *
 * @selector table[spark-table]
 * @standalone true
 */
@Component({
  selector: 'table[spark-table]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table;
      width: 100%;
      caption-side: bottom;
      font-size: var(--table-font-size);
    }
  `,
})
export class TableComponent {}

/**
 * Table Header Component - 表头容器
 *
 * @selector thead[spark-table-header]
 * @standalone true
 */
@Component({
  selector: 'thead[spark-table-header]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table-header-group;
    }

    :host ::ng-deep tr {
      border-bottom: var(--table-border-width) solid var(--border);
    }
  `,
})
export class TableHeaderComponent {}

/**
 * Table Body Component - 表体容器
 *
 * @selector tbody[spark-table-body]
 * @standalone true
 */
@Component({
  selector: 'tbody[spark-table-body]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table-row-group;
    }

    :host ::ng-deep tr:last-child {
      border-bottom: 0;
    }
  `,
})
export class TableBodyComponent {}

/**
 * Table Footer Component - 表脚容器
 *
 * @selector tfoot[spark-table-footer]
 * @standalone true
 */
@Component({
  selector: 'tfoot[spark-table-footer]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table-footer-group;
      border-top: var(--table-border-width) solid var(--border);
      background-color: color-mix(in srgb, var(--muted) calc(var(--table-hover-bg-opacity) * 100%));
      font-weight: 500; /* font-medium */
    }

    :host ::ng-deep tr:last-child {
      border-bottom: 0;
    }
  `,
})
export class TableFooterComponent {}

/**
 * Table Row Component - 行组件
 *
 * 支持悬停效果和选择状态
 *
 * @selector tr[spark-table-row]
 * @standalone true
 */
@Component({
  selector: 'tr[spark-table-row]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table-row;
      border-bottom: var(--table-border-width) solid var(--border);
      transition: background-color var(--duration-fast) var(--ease-out);
    }

    :host:hover {
      background-color: color-mix(in srgb, var(--muted) calc(var(--table-hover-bg-opacity) * 100%));
    }

    :host[data-state='selected'] {
      background-color: color-mix(in srgb, var(--muted) calc(var(--table-selected-bg-opacity) * 100%));
    }
  `,
})
export class TableRowComponent {}

/**
 * Table Head Component - 表头单元格
 *
 * @selector th[spark-table-head]
 * @standalone true
 */
@Component({
  selector: 'th[spark-table-head]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table-cell;
      height: var(--table-head-height);
      padding: var(--table-cell-padding);
      text-align: left;
      vertical-align: middle;
      font-weight: 500; /* font-medium */
      color: var(--muted-foreground);
    }

    /* Adjust padding when containing checkbox */
    :host(:has([role='checkbox'])) {
      padding-right: 0;
    }
  `,
})
export class TableHeadComponent {}

/**
 * Table Cell Component - 数据单元格
 *
 * @selector td[spark-table-cell]
 * @standalone true
 */
@Component({
  selector: 'td[spark-table-cell]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table-cell;
      padding: var(--table-cell-padding);
      vertical-align: middle;
    }

    /* Adjust padding when containing checkbox */
    :host(:has([role='checkbox'])) {
      padding-right: 0;
    }
  `,
})
export class TableCellComponent {}

/**
 * Table Caption Component - 标题/说明
 *
 * @selector caption[spark-table-caption]
 * @standalone true
 */
@Component({
  selector: 'caption[spark-table-caption]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: table-caption;
      margin-top: var(--table-caption-margin-top);
      font-size: var(--table-font-size);
      color: var(--muted-foreground);
    }
  `,
})
export class TableCaptionComponent {}
