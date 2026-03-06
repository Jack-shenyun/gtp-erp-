import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * 用户角色类型
 */
export type UserRole = "admin" | "user";

/**
 * 权限操作类型
 */
export type PermissionAction = "view" | "create" | "edit" | "delete";

/**
 * 权限配置
 * admin: 可以执行所有操作
 * user: 只能查看、新增、编辑，不能删除
 */
const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: ["view", "create", "edit", "delete"],
  user: ["view", "create", "edit"],
};

interface UsePermissionReturn {
  /** 当前用户角色 */
  role: UserRole;
  /** 是否是管理员 */
  isAdmin: boolean;
  /** 是否可以查看 */
  canView: boolean;
  /** 是否可以新增 */
  canCreate: boolean;
  /** 是否可以编辑 */
  canEdit: boolean;
  /** 是否可以删除 */
  canDelete: boolean;
  /** 检查是否有指定权限 */
  hasPermission: (action: PermissionAction) => boolean;
  /** 获取当前用户所有权限 */
  permissions: PermissionAction[];
}

/**
 * 权限控制Hook
 * 
 * @example
 * ```tsx
 * const { canDelete, isAdmin } = usePermission();
 * 
 * // 根据权限显示/隐藏删除按钮
 * {canDelete && <Button onClick={handleDelete}>删除</Button>}
 * ```
 */
export function usePermission(): UsePermissionReturn {
  const { user, isAuthenticated } = useAuth();

  const role: UserRole = useMemo(() => {
    if (!isAuthenticated || !user) {
      return "user"; // 默认为普通用户
    }
    return (user.role as UserRole) || "user";
  }, [user, isAuthenticated]);

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  }, [role]);

  const hasPermission = useMemo(() => {
    return (action: PermissionAction) => permissions.includes(action);
  }, [permissions]);

  const isAdmin = role === "admin";
  const canView = hasPermission("view");
  const canCreate = hasPermission("create");
  const canEdit = hasPermission("edit");
  const canDelete = hasPermission("delete");

  return {
    role,
    isAdmin,
    canView,
    canCreate,
    canEdit,
    canDelete,
    hasPermission,
    permissions,
  };
}

/**
 * 检查指定角色是否有指定权限
 */
export function checkPermission(role: UserRole, action: PermissionAction): boolean {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  return permissions.includes(action);
}

/**
 * 获取角色的所有权限
 */
export function getRolePermissions(role: UserRole): PermissionAction[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
}
