import React from 'react';
import { PrintTemplate, PrintHeader, PrintSection, PrintInfoRow, PrintTable, PrintFooter } from '../PrintTemplate';
import { normalizePaymentCondition } from "@shared/paymentTerms";

// ========== 销售订单打印 ==========
interface SalesOrderPrintProps {
  open: boolean;
  onClose: () => void;
  order: {
    orderNumber: string;
    orderDate: string;
    deliveryDate?: string;
    customerName: string;
    shippingAddress?: string;
    shippingContact?: string;
    shippingPhone?: string;
    paymentMethod?: string;
    status: string;
    totalAmount: number;
    items: Array<{
      productName: string;
      productCode?: string;
      specification?: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    notes?: string;
    salesPersonName?: string;
  };
}

const statusMap: Record<string, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已审批',
  in_production: '生产中',
  ready_to_ship: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已驳回',
  confirmed: '已确认',
  processing: '处理中',
};

const paymentMethodMap: Record<string, string> = {
  cash: '现金',
  transfer: '转账',
  check: '支票',
  credit: '赊账',
  other: '其他',
};

export function SalesOrderPrint({ open, onClose, order }: SalesOrderPrintProps) {
  const columns = [
    { key: 'index', label: '序号', width: '60px', align: 'center' as const },
    { key: 'productCode', label: '产品编号', width: '120px' },
    { key: 'productName', label: '产品名称', width: '200px' },
    { key: 'specification', label: '规格型号', width: '150px' },
    { key: 'quantity', label: '数量', width: '80px', align: 'right' as const },
    { key: 'unitPrice', label: '单价', width: '100px', align: 'right' as const },
    { key: 'amount', label: '金额', width: '120px', align: 'right' as const },
  ];

  const tableData = order.items.map((item, index) => ({
    index: index + 1,
    productCode: item.productCode || '-',
    productName: item.productName,
    specification: item.specification || '-',
    quantity: item.quantity,
    unitPrice: `¥${item.unitPrice.toFixed(2)}`,
    amount: `¥${item.amount.toFixed(2)}`,
  }));

  const totalRow = {
    index: '',
    productCode: '',
    productName: '',
    specification: '',
    quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    unitPrice: '合计',
    amount: `¥${order.totalAmount.toFixed(2)}`,
  };

  return (
    <PrintTemplate open={open} onClose={onClose} title="销售订单打印预览">
      <PrintHeader documentTitle="销售订单" documentNumber={order.orderNumber} date={order.orderDate} />
      <PrintSection title="客户信息">
        <div className="grid grid-cols-2 gap-x-8">
          <PrintInfoRow label="客户名称" value={order.customerName} />
          <PrintInfoRow label="订单状态" value={statusMap[order.status] || order.status} />
          <PrintInfoRow label="收货地址" value={order.shippingAddress} />
          <PrintInfoRow label="交货日期" value={order.deliveryDate} />
          <PrintInfoRow label="收货联系人" value={order.shippingContact} />
          <PrintInfoRow label="联系电话" value={order.shippingPhone} />
          <PrintInfoRow label="付款条件" value={normalizePaymentCondition(paymentMethodMap[order.paymentMethod || ''] || order.paymentMethod)} />
          <PrintInfoRow label="销售负责人" value={order.salesPersonName} />
        </div>
      </PrintSection>
      <PrintSection title="订单明细">
        <PrintTable columns={columns} data={[...tableData, totalRow]} />
      </PrintSection>
      <div className="print-section mb-6">
        <div className="flex justify-end">
          <div className="w-80 space-y-2 text-base">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">订单总额：</span>
              <span className="text-xl font-bold text-red-600">¥{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      <PrintFooter signatures={['销售员', '客户签收', '财务审核']} notes={order.notes} />
    </PrintTemplate>
  );
}

// ========== 发货单打印 ==========
interface DeliveryNotePrintProps {
  open: boolean;
  onClose: () => void;
  order: {
    orderNumber: string;
    deliveryDate: string;
    customerName: string;
    shippingAddress?: string;
    shippingContact?: string;
    shippingPhone?: string;
    items: Array<{
      productName: string;
      productCode?: string;
      specification?: string;
      quantity: number;
      unit?: string;
      batchNumber?: string;
      serialNumber?: string;
    }>;
    notes?: string;
    deliveryPerson?: string;
    vehicleNumber?: string;
  };
}

export function DeliveryNotePrint({ open, onClose, order }: DeliveryNotePrintProps) {
  const columns = [
    { key: 'index', label: '序号', width: '60px', align: 'center' as const },
    { key: 'productCode', label: '产品编号', width: '120px' },
    { key: 'productName', label: '产品名称', width: '180px' },
    { key: 'specification', label: '规格型号', width: '120px' },
    { key: 'quantity', label: '数量', width: '80px', align: 'right' as const },
    { key: 'unit', label: '单位', width: '60px', align: 'center' as const },
    { key: 'batchNumber', label: '批号', width: '100px' },
    { key: 'serialNumber', label: '序列号', width: '120px' },
  ];

  const tableData = order.items.map((item, index) => ({
    index: index + 1,
    productCode: item.productCode || '-',
    productName: item.productName,
    specification: item.specification || '-',
    quantity: item.quantity,
    unit: item.unit || '件',
    batchNumber: item.batchNumber || '-',
    serialNumber: item.serialNumber || '-',
  }));

  return (
    <PrintTemplate open={open} onClose={onClose} title="发货单打印预览">
      <PrintHeader documentTitle="发货单" documentNumber={order.orderNumber} date={order.deliveryDate} />
      <PrintSection title="收货信息">
        <div className="grid grid-cols-2 gap-x-8">
          <PrintInfoRow label="客户名称" value={order.customerName} />
          <PrintInfoRow label="发货日期" value={order.deliveryDate} />
          <PrintInfoRow label="收货地址" value={order.shippingAddress} />
          <PrintInfoRow label="收货联系人" value={order.shippingContact} />
          <PrintInfoRow label="联系电话" value={order.shippingPhone} />
          <PrintInfoRow label="配送人员" value={order.deliveryPerson} />
          <PrintInfoRow label="车牌号" value={order.vehicleNumber} />
        </div>
      </PrintSection>
      <PrintSection title="发货明细">
        <PrintTable columns={columns} data={tableData} />
      </PrintSection>
      <div className="print-section mb-6">
        <div className="flex justify-end">
          <div className="w-80 space-y-2 text-base">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">发货总件数：</span>
              <span className="text-xl font-bold">{order.items.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
            </div>
          </div>
        </div>
      </div>
      <div className="print-section mb-6 p-4 border-2 border-gray-300 rounded">
        <h4 className="font-semibold mb-2">收货确认</h4>
        <p className="text-sm text-gray-600 mb-4">本人已收到上述货物，数量、规格、质量均符合要求，特此确认。</p>
        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <div className="mb-2">收货人签字：</div>
            <div className="border-b border-gray-400 h-12"></div>
          </div>
          <div>
            <div className="mb-2">收货日期：</div>
            <div className="border-b border-gray-400 h-12"></div>
          </div>
        </div>
      </div>
      <PrintFooter signatures={['发货人', '配送员', '仓库主管']} notes={order.notes} />
    </PrintTemplate>
  );
}

// ========== 收据打印 ==========
interface ReceiptPrintProps {
  open: boolean;
  onClose: () => void;
  receipt: {
    receiptNumber: string;
    receiptDate: string;
    orderNumber: string;
    customerName: string;
    paymentMethod: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    notes?: string;
    cashier?: string;
    paymentAccount?: string;
  };
}

const convertToChinese = (amount: number): string => {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
  const decimalUnits = ['角', '分'];

  if (amount === 0) return '零元整';

  const [integerPart, decimalPart] = amount.toFixed(2).split('.');
  let result = '';

  const intStr = integerPart.split('').reverse();
  for (let i = 0; i < intStr.length; i++) {
    const digit = parseInt(intStr[i]);
    if (digit !== 0) {
      result = digits[digit] + units[i] + result;
    } else if (result && result[0] !== '零') {
      result = '零' + result;
    }
  }
  result += '元';

  if (decimalPart) {
    const dec1 = parseInt(decimalPart[0]);
    const dec2 = parseInt(decimalPart[1]);
    if (dec1 !== 0) result += digits[dec1] + decimalUnits[0];
    if (dec2 !== 0) result += digits[dec2] + decimalUnits[1];
    if (dec1 === 0 && dec2 === 0) result += '整';
  } else {
    result += '整';
  }

  return result;
};

export function ReceiptPrint({ open, onClose, receipt }: ReceiptPrintProps) {
  const columns = [
    { key: 'index', label: '序号', width: '60px', align: 'center' as const },
    { key: 'productName', label: '产品名称', width: '300px' },
    { key: 'quantity', label: '数量', width: '100px', align: 'right' as const },
    { key: 'unitPrice', label: '单价', width: '120px', align: 'right' as const },
    { key: 'amount', label: '金额', width: '150px', align: 'right' as const },
  ];

  const tableData = receipt.items.map((item, index) => ({
    index: index + 1,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: `¥${item.unitPrice.toFixed(2)}`,
    amount: `¥${item.amount.toFixed(2)}`,
  }));

  const totalRow = {
    index: '',
    productName: '',
    quantity: receipt.items.reduce((sum, item) => sum + item.quantity, 0),
    unitPrice: '合计',
    amount: `¥${receipt.totalAmount.toFixed(2)}`,
  };

  return (
    <PrintTemplate open={open} onClose={onClose} title="收据打印预览">
      <PrintHeader documentTitle="收款收据" documentNumber={receipt.receiptNumber} date={receipt.receiptDate} />
      <PrintSection title="收款信息">
        <div className="grid grid-cols-2 gap-x-8">
          <PrintInfoRow label="客户名称" value={receipt.customerName} />
          <PrintInfoRow label="关联订单" value={receipt.orderNumber} />
          <PrintInfoRow label="收款方式" value={paymentMethodMap[receipt.paymentMethod] || receipt.paymentMethod} />
          <PrintInfoRow label="收款账户" value={receipt.paymentAccount} />
          <PrintInfoRow label="收款日期" value={receipt.receiptDate} />
          <PrintInfoRow label="收款人" value={receipt.cashier} />
        </div>
      </PrintSection>
      <PrintSection title="收款明细">
        <PrintTable columns={columns} data={[...tableData, totalRow]} />
      </PrintSection>
      <div className="print-section mb-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b-2 border-gray-300">
            <span className="text-lg font-medium">订单总额：</span>
            <span className="text-2xl font-bold">¥{receipt.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b-2 border-red-300">
            <span className="text-lg font-medium">本次收款：</span>
            <span className="text-2xl font-bold text-red-600">¥{receipt.paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b-2 border-gray-300">
            <span className="text-lg font-medium">剩余应收：</span>
            <span className="text-2xl font-bold text-orange-600">¥{receipt.remainingAmount.toFixed(2)}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-sm text-gray-600 mb-1">金额大写：</div>
            <div className="text-lg font-semibold text-gray-900">{convertToChinese(receipt.paidAmount)}</div>
          </div>
        </div>
      </div>
      <div className="print-section mb-6 p-4 border-2 border-dashed border-gray-400 rounded bg-yellow-50">
        <div className="flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <h4 className="font-semibold mb-1">重要提示</h4>
            <p className="text-sm text-gray-700">本收据为收款凭证，请妥善保管。如需退款，请携带本收据原件办理。</p>
          </div>
        </div>
      </div>
      <PrintFooter signatures={['收款人', '客户确认', '财务主管']} notes={receipt.notes} />
    </PrintTemplate>
  );
}
