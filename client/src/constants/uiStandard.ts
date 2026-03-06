export const STATUS_STYLE = {
  inProgress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-red-100 text-red-700 border-red-200",
} as const;

export const WORKBENCH = {
  badge: "rounded-full bg-rose-500 hover:bg-rose-500 text-white min-w-7 justify-center tabular-nums",
  cardRadius: "rounded-2xl",
  sectionGap: "gap-4",
} as const;
