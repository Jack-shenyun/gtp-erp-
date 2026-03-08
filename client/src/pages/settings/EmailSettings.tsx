import { useState } from "react";
import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Bell,
} from "lucide-react";

// 通知节点说明
const NOTIFICATION_NODES = [
  {
    id: "sterilization_arrived",
    label: "灭菌到货通知",
    description: "灭菌单状态变为「到货」时，自动通知质量部安排 OQC 检验",
    targetDept: "质量部",
    trigger: "灭菌单 → 到货",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "oqc_qualified",
    label: "OQC 合格通知",
    description: "OQC 检验结果为「合格」时，自动通知生产部提交入库申请",
    targetDept: "生产部",
    trigger: "OQC → 合格",
    color: "bg-green-100 text-green-700",
  },
  {
    id: "oqc_unqualified",
    label: "OQC 不合格通知",
    description: "OQC 检验结果为「不合格」时，自动通知生产部和质量主管",
    targetDept: "生产部 + 质量部",
    trigger: "OQC → 不合格",
    color: "bg-red-100 text-red-700",
  },
  {
    id: "warehouse_approved",
    label: "入库审批通过通知",
    description: "生产入库申请审批通过时，自动通知仓库部执行实物入库",
    targetDept: "仓库管理",
    trigger: "入库申请 → 已审批",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "warehouse_completed",
    label: "入库完成通知",
    description: "生产入库完成时，自动通知销售部和财务部（可安排发货/开票）",
    targetDept: "销售部 + 财务部",
    trigger: "入库申请 → 已完成",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "purchase_approved",
    label: "采购申请审批通知",
    description: "采购申请审批通过时，自动通知采购部下达采购订单",
    targetDept: "采购部",
    trigger: "采购申请 → 已审批",
    color: "bg-orange-100 text-orange-700",
  },
];

export default function EmailSettingsPage() {
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // 获取系统设置（用于显示当前SMTP配置状态）
  const { data: companyInfo } = trpc.companyInfo.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // 测试邮件发送
  const testEmailMutation = trpc.settings.testEmail.useMutation({
    onSuccess: () => {
      toast.success("测试邮件发送成功！请检查收件箱");
      setIsTesting(false);
    },
    onError: (err) => {
      toast.error(`发送失败：${err.message}`);
      setIsTesting(false);
    },
  });

  // 保存SMTP配置
  const saveSmtpMutation = trpc.settings.saveSmtpConfig.useMutation({
    onSuccess: () => {
      toast.success("SMTP 配置已保存，重启服务后生效");
    },
    onError: (err) => {
      toast.error(`保存失败：${err.message}`);
    },
  });

  const handleTestEmail = () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("请输入有效的测试邮箱地址");
      return;
    }
    setIsTesting(true);
    testEmailMutation.mutate({ to: testEmail });
  };

  const handleSaveSmtp = () => {
    if (!smtpHost || !smtpUser || !smtpPass) {
      toast.error("请填写完整的 SMTP 配置信息");
      return;
    }
    saveSmtpMutation.mutate({
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser,
      smtpPass,
      smtpFrom: smtpFrom || smtpUser,
      smtpSecure,
    });
  };

  return (
    <ERPLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">邮件通知设置</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              配置 SMTP 邮件服务，启用关键业务节点的自动邮件协同通知
            </p>
          </div>
        </div>

        {/* 工作原理说明 */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-semibold">邮箱协同工作原理</p>
                <p>
                  系统在关键业务节点（灭菌到货、OQC 检验、入库审批等）自动向对应部门的用户发送邮件通知。
                  邮件收件人根据用户管理中的<strong>部门字段</strong>自动匹配，无需手动配置。
                </p>
                <p className="text-blue-600">
                  ⚠️ 未配置 SMTP 时，系统将降级为内部系统通知（仅通知系统管理员）。
                  配置 SMTP 后，通知将直接发送至各部门用户的邮箱。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SMTP 配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                SMTP 服务器配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="smtpHost">SMTP 服务器地址</Label>
                  <Input
                    id="smtpHost"
                    placeholder="如：smtp.exmail.qq.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtpPort">端口</Label>
                  <Input
                    id="smtpPort"
                    placeholder="465"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="smtpSecure"
                    checked={smtpSecure}
                    onCheckedChange={setSmtpSecure}
                  />
                  <Label htmlFor="smtpSecure" className="cursor-pointer">
                    SSL/TLS 加密
                  </Label>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="smtpUser">发件人邮箱（用户名）</Label>
                  <Input
                    id="smtpUser"
                    type="email"
                    placeholder="erp@yourcompany.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="smtpPass">邮箱密码 / 授权码</Label>
                  <Input
                    id="smtpPass"
                    type="password"
                    placeholder="邮箱密码或授权码"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="smtpFrom">发件人显示名称（可选）</Label>
                  <Input
                    id="smtpFrom"
                    placeholder="GTP-ERP 系统（留空则使用邮箱地址）"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  常用邮件服务商配置参考：
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium">腾讯企业邮</p>
                    <p>smtp.exmail.qq.com:465</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium">阿里云邮</p>
                    <p>smtp.mxhichina.com:465</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium">网易企业邮</p>
                    <p>smtp.qiye.163.com:994</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium">Gmail</p>
                    <p>smtp.gmail.com:465</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveSmtp}
                disabled={saveSmtpMutation.isPending}
                className="w-full"
              >
                {saveSmtpMutation.isPending ? "保存中..." : "保存 SMTP 配置"}
              </Button>

              <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                ⚠️ 配置保存后需要重启服务器才能生效。配置信息存储在服务器环境变量中，不会保存到数据库。
              </p>
            </CardContent>
          </Card>

          {/* 测试发送 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="h-4 w-4" />
                  测试邮件发送
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  输入测试邮箱地址，验证当前 SMTP 配置是否正常工作。
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="testEmail">测试收件邮箱</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={isTesting || testEmailMutation.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isTesting ? "发送中..." : "发送测试邮件"}
                </Button>
              </CardContent>
            </Card>

            {/* 部门邮箱配置说明 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4" />
                  收件人配置说明
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  邮件通知的收件人根据「用户管理」中的<strong>部门字段</strong>自动匹配，
                  无需在此单独配置。请确保各部门用户已填写正确的邮箱地址。
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    各节点通知部门
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { dept: "质量部", event: "灭菌到货" },
                      { dept: "生产部", event: "OQC 合格/不合格" },
                      { dept: "仓库管理", event: "入库审批通过" },
                      { dept: "销售部 + 财务部", event: "入库完成" },
                      { dept: "采购部", event: "采购申请审批通过" },
                    ].map((item) => (
                      <div
                        key={item.dept}
                        className="flex items-center justify-between text-xs bg-gray-50 rounded px-3 py-1.5"
                      >
                        <span className="text-gray-600">{item.event}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.dept}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="link"
                  className="text-xs p-0 h-auto text-blue-600"
                  onClick={() => window.location.href = "/settings/users"}
                >
                  前往用户管理配置邮箱 →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 通知节点列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              已启用的通知节点（6 个）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {NOTIFICATION_NODES.map((node) => (
                <div
                  key={node.id}
                  className="border rounded-lg p-4 space-y-2 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="font-medium text-sm">{node.label}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {node.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${node.color} border-0`}>
                      {node.targetDept}
                    </Badge>
                    <span className="text-xs text-gray-400 font-mono">
                      {node.trigger}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ERPLayout>
  );
}
