import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check } from "lucide-react";
import { DraggableDialog, DraggableDialogContent } from "@/components/DraggableDialog";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Customer as DbCustomer } from "../../../drizzle/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 扩展Customer类型，添加salesPersonName字段
export type Customer = DbCustomer & {
  salesPersonName?: string | null;
};



interface CustomerSelectProps {
  customers?: Customer[]; // 可选，如果不提供则从 API 加载
  selectedCustomer?: Customer | null;
  onCustomerSelect: (customer: Customer) => void;
  placeholder?: string;
}

export default function CustomerSelect({
  customers: propCustomers,
  selectedCustomer,
  onCustomerSelect,
  placeholder = "选择客户",
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 从 API 加载客户数据
  const { data: apiCustomers } = trpc.customers.list.useQuery(undefined, {
    enabled: !propCustomers, // 只在没有提供 customers prop 时查询
  });

  const customers: Customer[] = (propCustomers || apiCustomers || []) as Customer[];

  const filteredCustomers = customers.filter(
    (customer) =>
      String(customer.code ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(customer.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.contactPerson?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-left font-normal"
      >
        {selectedCustomer ? (
          <span>
            {selectedCustomer.code} - {selectedCustomer.name}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      <DraggableDialog
        open={open}
        onOpenChange={setOpen}
        defaultWidth={800}
        defaultHeight={600}
      >
        <DraggableDialogContent>
          <DialogHeader>
            <DialogTitle>选择客户</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索客户编码、名称、联系人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 客户列表 */}
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">客户编码</TableHead>
                    <TableHead>客户名称</TableHead>
                    <TableHead className="w-[100px]">客户类型</TableHead>
                    <TableHead className="w-[100px]">联系人</TableHead>
                    <TableHead className="w-[130px]">联系电话</TableHead>
                    <TableHead className="w-[120px]">地区</TableHead>
                    <TableHead className="w-[100px]">销售负责人</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        未找到匹配的客户
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedCustomer?.id === customer.id ? "bg-muted" : ""
                        }`}
                        onClick={() => handleSelect(customer)}
                      >
                        <TableCell className="font-medium">{customer.code}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                          {customer.type === 'hospital' ? '医院' : 
                           customer.type === 'dealer' ? '经销商' : 
                           customer.type === 'domestic' ? '国内客户' : 
                           customer.type === 'overseas' ? '海外客户' : customer.type}
                        </TableCell>
                        <TableCell>{customer.contactPerson || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>{customer.country || customer.province || '-'}</TableCell>
                        <TableCell>{customer.salesPersonName || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(customer);
                            }}
                          >
                            {selectedCustomer?.id === customer.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              "选择"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DraggableDialogContent>
      </DraggableDialog>
    </>
  );
}
