import { useAuth } from "@/_core/hooks/useAuth";
import shenyunLogo from "@/assets/2ac420a999cddd5f145a62155f78b13e.png";
import ERPLayout from "@/components/ERPLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readRecentVisits, type RecentVisitItem } from "@/constants/recentVisits";
import { parseVisibleAppIds, WORKBENCH_APP_ENTRIES } from "@/constants/workbenchApps";
import { WORKBENCH } from "@/constants/uiStandard";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlarmClockPlus,
  Bell,
  CalendarMinus2,
  CheckSquare,
  Plane,
  PlayCircle,
  ReceiptText,
  Search,
  Send,
  Plus,
} from "lucide-react";

const DEPARTMENT_MENU_ACCESS: Record<string, string[]> = {
  管理部: ["admin", "settings", "common"],
  招商部: ["investment", "common"],
  销售部: ["sales", "common"],
  研发部: ["rd", "common"],
  生产部: ["production", "common"],
  质量部: ["quality", "common"],
  采购部: ["purchase", "common"],
  仓库管理: ["warehouse", "common"],
  财务部: ["finance", "common"],
};

const MENU_PATH_PREFIXES: Record<string, string[]> = {
  admin: ["/admin/"],
  common: [],
  investment: ["/investment/"],
  sales: ["/sales/"],
  rd: ["/rd/"],
  production: ["/production/"],
  quality: ["/quality/"],
  purchase: ["/purchase/"],
  warehouse: ["/warehouse/"],
  finance: ["/finance/"],
  settings: ["/settings/"],
};

const quickEntryItems = [
  { key: "reimbursement", label: "报销单", icon: ReceiptText, path: "" },
  { key: "overtime", label: "加班申请", icon: AlarmClockPlus, path: "" },
  { key: "leave", label: "请假单", icon: CalendarMinus2, path: "" },
  { key: "outing", label: "外出申请单", icon: Plane, path: "" },
] as const;

const quickEntryStyles = [
  "border-l-sky-300 bg-[linear-gradient(135deg,_rgba(248,250,252,1)_0%,_rgba(240,249,255,0.9)_100%)]",
  "border-l-emerald-300 bg-[linear-gradient(135deg,_rgba(248,250,252,1)_0%,_rgba(236,253,245,0.9)_100%)]",
  "border-l-amber-300 bg-[linear-gradient(135deg,_rgba(248,250,252,1)_0%,_rgba(255,251,235,0.9)_100%)]",
  "border-l-violet-300 bg-[linear-gradient(135deg,_rgba(248,250,252,1)_0%,_rgba(245,243,255,0.92)_100%)]",
] as const;

function parseDepartments(raw: unknown): string[] {
  const value = String(raw ?? "").trim();
  if (!value) return [];
  return value
    .split(/[,\uFF0C;；/、|\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const [recentVisits, setRecentVisits] = useState<RecentVisitItem[]>([]);
  const [appSearch, setAppSearch] = useState("");

  const userRole = String((user as any)?.role ?? "user");
  const userDepartments = useMemo(() => parseDepartments((user as any)?.department), [user]);
  const configuredVisibleAppIds = useMemo(() => parseVisibleAppIds((user as any)?.visibleApps), [user]);

  const allowedMenuIds = useMemo(() => {
    if (userRole === "admin") return new Set(WORKBENCH_APP_ENTRIES.map((item) => item.menuId));
    const ids = new Set<string>();
    for (const dept of userDepartments) {
      const menuIds = DEPARTMENT_MENU_ACCESS[dept] ?? [];
      for (const menuId of menuIds) ids.add(menuId);
    }
    return ids;
  }, [userDepartments, userRole]);

  const visibleApps = useMemo(() => {
    if (configuredVisibleAppIds.length > 0) {
      return WORKBENCH_APP_ENTRIES.filter((item) => configuredVisibleAppIds.includes(item.id));
    }
    return WORKBENCH_APP_ENTRIES.filter((item) => allowedMenuIds.has(item.menuId));
  }, [allowedMenuIds, configuredVisibleAppIds]);

  const allowedRecentPrefixes = useMemo(() => {
    const sourceMenuIds = configuredVisibleAppIds.length > 0
      ? visibleApps.map((item) => item.menuId)
      : userRole === "admin"
        ? Object.keys(MENU_PATH_PREFIXES)
        : Array.from(allowedMenuIds);
    return Array.from(new Set(sourceMenuIds)).flatMap((menuId) => MENU_PATH_PREFIXES[menuId] ?? []);
  }, [allowedMenuIds, configuredVisibleAppIds, userRole, visibleApps]);

  const filteredApps = useMemo(() => {
    const keyword = appSearch.trim().toLowerCase();
    if (!keyword) return visibleApps;
    return visibleApps.filter((item) => item.label.toLowerCase().includes(keyword));
  }, [appSearch, visibleApps]);
  const handleAppClick = (item: (typeof WORKBENCH_APP_ENTRIES)[number]) => {
    if (item.path) {
      navigate(item.path);
      return;
    }
    toast.info(`${item.label}功能开发中`);
  };

  useEffect(() => {
    const syncRecent = () => {
      const userRecentVisits = readRecentVisits(user).filter((item) =>
        allowedRecentPrefixes.some((prefix) => item.path.startsWith(prefix))
      );
      setRecentVisits(userRecentVisits.slice(0, 4));
    };
    syncRecent();
    window.addEventListener("focus", syncRecent);
    return () => window.removeEventListener("focus", syncRecent);
  }, [allowedRecentPrefixes, user]);

  const workflowCounters = {
    myTodo: Number((stats as any)?.workflowCounters?.myTodo ?? 0),
    myCreated: Number((stats as any)?.workflowCounters?.myCreated ?? 0),
    myProcessed: Number((stats as any)?.workflowCounters?.myProcessed ?? 0),
    ccToMe: Number((stats as any)?.workflowCounters?.ccToMe ?? 0),
  };

  const quickActions = [
    { label: "我的待办", icon: Bell, count: workflowCounters.myTodo, path: "/workflow/center?tab=todo" },
    { label: "我发起的", icon: PlayCircle, count: workflowCounters.myCreated, path: "/workflow/center?tab=created" },
    { label: "我处理的", icon: CheckSquare, count: workflowCounters.myProcessed, path: "/workflow/center?tab=processed" },
    { label: "抄送我的", icon: Send, count: workflowCounters.ccToMe, path: "/workflow/center?tab=cc" },
  ];
  const reservedSlots = 2;
  const handleQuickEntryClick = (item: (typeof quickEntryItems)[number]) => {
    if (item.path) {
      navigate(item.path);
      return;
    }
    toast.info(`${item.label}功能开发中`);
  };
  const getWorkflowBadgeClass = (count: number) =>
    count > 0
      ? WORKBENCH.badge
      : "rounded-full border border-slate-200 bg-white text-slate-400 min-w-7 justify-center tabular-nums shadow-none";

  return (
    <ERPLayout>
      <div className="relative h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_22%),linear-gradient(180deg,_#f7fbff_0%,_#f3f6fb_100%)] p-3 md:p-4 xl:p-5">
        <div className="pointer-events-none absolute inset-x-6 top-3 h-20 rounded-[28px] bg-white/50 blur-3xl" />
        <div className="relative z-10 flex h-full w-full flex-col gap-4">
          <header className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] backdrop-blur md:px-5 md:py-4">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="flex items-center">
                <div className="rounded-2xl bg-gradient-to-br from-white via-sky-50 to-blue-50 px-4 py-3 shadow-inner ring-1 ring-slate-200/80">
                  <img src={shenyunLogo} alt="SHENYUN" className="h-8 w-auto object-contain md:h-9" />
                </div>
              </div>

              <div className="px-4 text-center">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none md:text-[2.35rem]">
                  神韵医疗
                  <span className="ml-3 text-lg font-bold tracking-normal text-slate-600 md:text-[1.7rem]">
                    （公司管理系统）
                  </span>
                </h1>
              </div>

              <div className="hidden md:flex items-center gap-3 text-slate-600">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm">
                  <Bell className="h-4.5 w-4.5" />
                </Button>
                <div className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-3 py-2.5 shadow-sm">
                  <Avatar className="h-12 w-12 border border-sky-100 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-sky-50 to-cyan-100 text-sky-700 font-semibold text-base">
                      {String((user as any)?.name ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-none truncate">
                      {String((user as any)?.name ?? "-")}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {String((user as any)?.email ?? "-")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="grid min-h-0 gap-4 grid-rows-[auto_1fr]">
              <Card className="rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="text-[15px] font-bold tracking-[0.04em] text-slate-900">工作事项</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">流程中心</span>
                  </div>
                  <div className="space-y-2.5">
                    {quickActions.map((item, index) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`group w-full flex items-center justify-between rounded-2xl border border-transparent bg-slate-50/70 px-3 py-3 text-left transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm ${
                          index === 4 ? "mt-3 border-t pt-4 rounded-none hover:bg-transparent" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                            <item.icon className="h-4.5 w-4.5 text-slate-600 transition-transform group-hover:scale-110" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-900">{item.label}</span>
                        </div>
                        {typeof item.count === "number" ? (
                          <Badge className={getWorkflowBadgeClass(item.count)}>
                            {item.count}
                          </Badge>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full min-h-0 rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold text-slate-900">快捷入口</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 h-full">
                  <div className="grid gap-2.5">
                    {quickEntryItems.map((item, index) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleQuickEntryClick(item)}
                        className={`group w-full rounded-2xl border border-slate-200/80 border-l-4 px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${quickEntryStyles[index % quickEntryStyles.length]}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                            <item.icon className="h-4 w-4 text-slate-600 transition-transform group-hover:scale-110" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid min-h-0 gap-4 grid-rows-[auto_1fr]">
              <Card className="rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.24)] backdrop-blur">
                <CardHeader className="flex flex-col items-start gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2 shrink-0">
                    <div>
                      <CardTitle className="text-[2rem] font-bold text-slate-900 whitespace-nowrap leading-none">我的应用</CardTitle>
                      <p className="mt-1.5 text-sm text-slate-500">部门入口与常用模块集中访问</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-[320px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        placeholder="请输入名称来搜索..."
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-3 gap-x-4 gap-y-6 justify-items-center lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {filteredApps.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAppClick(item)}
                        className="group flex w-full max-w-[160px] flex-col items-center rounded-[26px] px-3 py-2 text-center transition-all hover:bg-slate-50/80"
                      >
                        <div className={`relative flex h-[92px] w-[92px] items-center justify-center rounded-[28px] bg-gradient-to-br ${item.color} shadow-[0_18px_26px_-18px_rgba(15,23,42,0.55)] transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-[1.03] before:absolute before:inset-[1px] before:rounded-[27px] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.02))] before:content-['']`}>
                          <item.icon className="relative z-10 h-10 w-10 text-white" />
                        </div>
                        <span className="mt-2.5 text-[16px] font-semibold text-slate-900 text-center">{item.label}</span>
                      </button>
                    ))}
                    {Array.from({ length: reservedSlots }).map((_, index) => (
                      <div
                        key={`reserved-slot-${index}`}
                        className="flex w-full max-w-[160px] flex-col items-center rounded-[26px] px-3 py-2 text-center opacity-55"
                      >
                        <div className="flex h-[92px] w-[92px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50">
                          <Plus className="h-8 w-8 text-slate-400" />
                        </div>
                        <span className="mt-2.5 text-[15px] font-semibold text-slate-400">预留位</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="min-h-0 rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="text-2xl font-bold text-slate-900">最近使用</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {recentVisits.length === 0 ? (
                    <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 py-6 text-center text-sm text-muted-foreground">
                      暂无最近使用
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {recentVisits.slice(0, 4).map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => navigate(item.path)}
                          className="min-h-[74px] rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-white to-slate-50 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {item.parentLabel ? `${item.parentLabel} · ${item.label}` : item.label}
                          </p>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {new Date(item.visitedAt).toLocaleString("zh-CN")}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <footer className="py-1 text-center text-xs text-slate-500">
            2026@苏州神韵医疗器械有限公司版权所有
          </footer>
        </div>
      </div>
    </ERPLayout>
  );
}
