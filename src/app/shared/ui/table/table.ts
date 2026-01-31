import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'w-full caption-bottom text-sm',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableComponent {}

@Component({
  selector: 'ui-table-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': '[&_tr]:border-b',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableHeaderComponent {}

@Component({
  selector: 'ui-table-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': '[&_tr:last-child]:border-0',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableBodyComponent {}

@Component({
  selector: 'ui-table-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableFooterComponent {}

@Component({
  selector: 'ui-table-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableRowComponent {}

@Component({
  selector: 'ui-table-head',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableHeadComponent {}

@Component({
  selector: 'ui-table-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'p-4 align-middle [&:has([role=checkbox])]:pr-0',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableCellComponent {}

@Component({
  selector: 'ui-table-caption',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'mt-4 text-sm text-muted-foreground',
  },
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableCaptionComponent {}
