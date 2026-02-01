import type { Invoice, TableExample } from '../types/table-demo.types';

/**
 * 发票示例数据
 */
export const invoices: Invoice[] = [
  {
    invoice: 'INV001',
    status: 'Paid',
    amount: '$250.00',
    method: 'Credit Card',
  },
  {
    invoice: 'INV002',
    status: 'Pending',
    amount: '$150.00',
    method: 'PayPal',
  },
  {
    invoice: 'INV003',
    status: 'Unpaid',
    amount: '$350.00',
    method: 'Bank Transfer',
  },
  {
    invoice: 'INV004',
    status: 'Paid',
    amount: '$450.00',
    method: 'Credit Card',
  },
  {
    invoice: 'INV005',
    status: 'Paid',
    amount: '$550.00',
    method: 'PayPal',
  },
  {
    invoice: 'INV006',
    status: 'Pending',
    amount: '$200.00',
    method: 'Bank Transfer',
  },
  {
    invoice: 'INV007',
    status: 'Unpaid',
    amount: '$300.00',
    method: 'Credit Card',
  },
];

/**
 * 计算总金额
 */
export const totalAmount = invoices.reduce(
  (sum, invoice) => sum + parseFloat(invoice.amount.replace('$', '')),
  0
);

/**
 * 表格示例配置
 */
export const tableExamples: TableExample[] = [
  {
    title: 'Basic Table',
    description: 'A simple table with caption, header, and body.',
    showCaption: true,
    showFooter: false,
    showSelected: false,
  },
  {
    title: 'Table with Footer',
    description: 'A table with footer showing total amount.',
    showCaption: true,
    showFooter: true,
    showSelected: false,
  },
  {
    title: 'Table with Selected Row',
    description: 'A table with a selected row.',
    showCaption: true,
    showFooter: false,
    showSelected: true,
  },
];
