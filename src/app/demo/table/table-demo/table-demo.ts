import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TableComponent,
  TableHeaderComponent,
  TableBodyComponent,
  TableFooterComponent,
  TableRowComponent,
  TableHeadComponent,
  TableCellComponent,
  TableCaptionComponent,
} from '../../../shared/ui/table/table';
import { invoices, totalAmount } from './examples/table-examples';
import type { Invoice } from './types/table-demo.types';

/**
 * 排序方向
 */
type SortDirection = 'asc' | 'desc' | null;

/**
 * 排序状态
 */
interface SortState {
  column: keyof Invoice | null;
  direction: SortDirection;
}

/**
 * Table Demo Component
 *
 * 展示 Table 组件的所有功能和用法
 */
@Component({
  selector: 'app-table-demo',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    TableHeaderComponent,
    TableBodyComponent,
    TableFooterComponent,
    TableRowComponent,
    TableHeadComponent,
    TableCellComponent,
    TableCaptionComponent,
  ],
  templateUrl: './table-demo.html',
  styleUrl: '../../shared/demo-page-styles.css',
})
export class TableDemoComponent {
  /**
   * 发票数据
   */
  readonly invoices = invoices;

  /**
   * 总金额
   */
  readonly totalAmount = totalAmount;

  /**
   * 排序状态
   */
  private readonly sortState = signal<SortState>({ column: null, direction: null });

  /**
   * 搜索过滤文本
   */
  readonly filterText = signal('');

  /**
   * 分页状态
   */
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);

  /**
   * 排序后的发票数据
   */
  readonly sortedInvoices = computed(() => {
    const { column, direction } = this.sortState();

    if (!column || !direction) {
      return this.invoices;
    }

    return [...this.invoices].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  });

  /**
   * 过滤后的发票数据（结合排序和过滤）
   */
  readonly filteredAndSortedInvoices = computed(() => {
    const filter = this.filterText().toLowerCase().trim();

    // 先过滤
    let filtered = this.invoices;

    if (filter) {
      filtered = this.invoices.filter(
        (invoice) =>
          invoice.invoice.toLowerCase().includes(filter) ||
          invoice.status.toLowerCase().includes(filter) ||
          invoice.method.toLowerCase().includes(filter) ||
          invoice.amount.toLowerCase().includes(filter)
      );
    }

    // 再排序
    const { column, direction } = this.sortState();

    if (!column || !direction) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  });

  /**
   * 总页数
   */
  readonly totalPages = computed(() => {
    const filteredCount = this.filteredAndSortedInvoices().length;
    const size = this.pageSize();
    return Math.ceil(filteredCount / size);
  });

  /**
   * 分页后的发票数据
   */
  readonly paginatedInvoices = computed(() => {
    const filtered = this.filteredAndSortedInvoices();
    const page = this.currentPage();
    const size = this.pageSize();

    const start = (page - 1) * size;
    const end = start + size;

    return filtered.slice(start, end);
  });

  /**
   * 获取状态样式类
   */
  getStatusClass(status: Invoice['status']): string {
    const statusMap = {
      Paid: 'text-primary',
      Pending: 'text-warning',
      Unpaid: 'text-destructive',
    };
    return statusMap[status] || '';
  }

  /**
   * 获取排序方向图标
   */
  getSortIcon(column: keyof Invoice): string {
    const { column: currentColumn, direction } = this.sortState();

    if (currentColumn !== column) {
      return '⇅'; // 未排序
    }

    return direction === 'asc' ? '↑' : '↓'; // 升序或降序
  }

  /**
   * 切换排序
   */
  toggleSort(column: keyof Invoice): void {
    const currentSort = this.sortState();

    if (currentSort.column === column) {
      // 如果点击的是当前排序列，循环切换：asc -> desc -> null
      if (currentSort.direction === 'asc') {
        this.sortState.set({ column, direction: 'desc' });
      } else if (currentSort.direction === 'desc') {
        this.sortState.set({ column: null, direction: null });
      }
    } else {
      // 如果点击的是新列，设置为升序
      this.sortState.set({ column, direction: 'asc' });
    }
  }

  /**
   * 检查列是否正在排序
   */
  isSorting(column: keyof Invoice): boolean {
    return this.sortState().column === column;
  }

  /**
   * 清空过滤器
   */
  clearFilter(): void {
    this.filterText.set('');
    this.currentPage.set(1);
  }

  /**
   * 前往指定页
   */
  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }

  /**
   * 下一页
   */
  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  /**
   * 上一页
   */
  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  /**
   * 第一页
   */
  firstPage(): void {
    this.currentPage.set(1);
  }

  /**
   * 最后一页
   */
  lastPage(): void {
    this.currentPage.set(this.totalPages());
  }

  /**
   * 检查是否是第一页
   */
  get isFirstPage(): boolean {
    return this.currentPage() === 1;
  }

  /**
   * 检查是否是最后一页
   */
  get isLastPage(): boolean {
    return this.currentPage() === this.totalPages();
  }

  /**
   * 生成页码数组
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // 简单的逻辑：显示所有页码
    // 对于大量数据，可以实现更复杂的逻辑（如只显示部分页码）
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * 计算当前页结束索引
   */
  getEndIndex(): number {
    const current = this.currentPage();
    const size = this.pageSize();
    const filteredCount = this.filteredAndSortedInvoices().length;
    return Math.min(current * size, filteredCount);
  }

  /**
   * 计算当前页开始索引
   */
  getStartIndex(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }
}
