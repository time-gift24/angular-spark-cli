/**
 * 发票数据接口
 */
export interface Invoice {
  invoice: string;
  status: 'Paid' | 'Pending' | 'Unpaid';
  amount: string;
  method: string;
}

/**
 * 表格示例配置
 */
export interface TableExample {
  title: string;
  description: string;
  showCaption?: boolean;
  showFooter?: boolean;
  showSelected?: boolean;
}
