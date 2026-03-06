import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { LOCAL_AUTH_USER_KEY } from "@/const";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import shenyunLogo from "@/assets/2ac420a999cddd5f145a62155f78b13e.png";
import { toast } from "sonner";

const DEFAULT_PASSWORD = "666-11";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { data: users = [] } = trpc.users.list.useQuery();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedUsers = useMemo(
    () =>
      (users as any[]).map((u) => ({
        ...u,
        username: u.openId?.startsWith("user-") ? u.openId.slice(5) : String(u.openId || ""),
      })),
    [users],
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) {
      toast.error("请输入用户名");
      return;
    }

    if (password !== DEFAULT_PASSWORD) {
      toast.error("密码错误");
      return;
    }

    const user = normalizedUsers.find((u) => String(u.username).toLowerCase() === name.toLowerCase());
    if (!user) {
      toast.error("用户不存在");
      return;
    }

    setSubmitting(true);
    try {
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(user));
      toast.success("登录成功");
      setLocation("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <img src={shenyunLogo} alt="SHENYUN" className="h-12 w-auto object-contain" />
          </div>
          <CardTitle className="text-center text-xl">登录系统</CardTitle>
          <p className="text-center text-sm text-muted-foreground">请选择用户登录查看权限</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              登录
            </Button>
            <p className="text-xs text-muted-foreground text-center">当前测试密码：{DEFAULT_PASSWORD}</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
