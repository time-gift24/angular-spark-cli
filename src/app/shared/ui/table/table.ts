import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<table class="w-full caption-bottom text-sm"><ng-content /></table>`,
  styleUrl: './table.css'
})
export class TableComponent {}

@Component({
  selector: 'ui-table-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<thead class="[&_tr]:border-b"><ng-content /></thead>`,
  styleUrl: './table.css'
})
export class TableHeaderComponent {}

@Component({
  selector: 'ui-table-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<tbody class="[&_tr:last-child]:border-0"><ng-content /></tbody>`,
  styleUrl: './table.css'
})
export class TableBodyComponent {}

@Component({
  selector: 'ui-table-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<tfoot class="border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"><ng-content /></tfoot>`,
  styleUrl: './table.css'
})
export class TableFooterComponent {}

@Component({
  selector: 'ui-table-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><ng-content /></tr>`,
  styleUrl: './table.css'
})
export class TableRowComponent {}

@Component({
  selector: 'ui-table-head',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"><ng-content /></th>`,
  styleUrl: './table.css'
})
export class TableHeadComponent {}

@Component({
  selector: 'ui-table-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<td class="p-4 align-middle [&:has([role=checkbox])]:pr-0"><ng-content /></td>`,
  styleUrl: './table.css'
})
export class TableCellComponent {}

@Component({
  selector: 'ui-table-caption',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<caption class="mt-4 text-sm text-muted-foreground"><ng-content /></caption>`,
  styleUrl: './table.css'
})
export class TableCaptionComponent {}
