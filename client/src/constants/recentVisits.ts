export const RECENT_VISITS_STORAGE_KEY = "erp-recent-pages";

export type RecentVisitItem = {
  path: string;
  label: string;
  parentLabel?: string;
  visitedAt: number;
};

type RecentVisitUserLike = {
  id?: unknown;
  email?: unknown;
  name?: unknown;
} | null | undefined;

function normalizeRecentVisitStorageKey(user?: RecentVisitUserLike): string {
  const id = String(user?.id ?? "").trim();
  const email = String(user?.email ?? "").trim().toLowerCase();
  const name = String(user?.name ?? "").trim();
  const suffix = id || email || name;
  return suffix ? `${RECENT_VISITS_STORAGE_KEY}:${suffix}` : RECENT_VISITS_STORAGE_KEY;
}

export function readRecentVisits(user?: RecentVisitUserLike): RecentVisitItem[] {
  try {
    const raw = localStorage.getItem(normalizeRecentVisitStorageKey(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        path: String(item?.path ?? ""),
        label: String(item?.label ?? ""),
        parentLabel:
          item?.parentLabel === undefined ? undefined : String(item.parentLabel),
        visitedAt: Number(item?.visitedAt ?? 0),
      }))
      .filter((item) => item.path && item.label && Number.isFinite(item.visitedAt));
  } catch {
    return [];
  }
}

export function writeRecentVisits(items: RecentVisitItem[], user?: RecentVisitUserLike) {
  localStorage.setItem(normalizeRecentVisitStorageKey(user), JSON.stringify(items));
}
