import { useState, useEffect, useCallback, useRef } from "react";

/**
 * 草稿存储管理工具
 */
const DRAFT_PREFIX = "erp_draft_";
const DRAFT_EXPIRY_HOURS = 24; // 草稿24小时后过期

interface DraftData {
  data: Record<string, any>;
  timestamp: number;
  formId: string;
}

/**
 * 获取草稿存储键
 */
function getDraftKey(formId: string): string {
  return `${DRAFT_PREFIX}${formId}`;
}

/**
 * 保存草稿到本地存储
 */
function saveDraft(formId: string, data: Record<string, any>): void {
  try {
    const draftData: DraftData = {
      data,
      timestamp: Date.now(),
      formId,
    };
    localStorage.setItem(getDraftKey(formId), JSON.stringify(draftData));
  } catch (error) {
    console.warn("保存草稿失败:", error);
  }
}

/**
 * 从本地存储获取草稿
 */
function getDraft(formId: string): Record<string, any> | null {
  try {
    const stored = localStorage.getItem(getDraftKey(formId));
    if (!stored) return null;

    const draftData: DraftData = JSON.parse(stored);
    
    // 检查草稿是否过期
    const expiryTime = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;
    if (Date.now() - draftData.timestamp > expiryTime) {
      clearDraft(formId);
      return null;
    }

    return draftData.data;
  } catch (error) {
    console.warn("读取草稿失败:", error);
    return null;
  }
}

/**
 * 清除草稿
 */
function clearDraft(formId: string): void {
  try {
    localStorage.removeItem(getDraftKey(formId));
  } catch (error) {
    console.warn("清除草稿失败:", error);
  }
}

/**
 * 检查是否有草稿
 */
function hasDraft(formId: string): boolean {
  return getDraft(formId) !== null;
}

/**
 * 获取草稿保存时间
 */
function getDraftTimestamp(formId: string): Date | null {
  try {
    const stored = localStorage.getItem(getDraftKey(formId));
    if (!stored) return null;

    const draftData: DraftData = JSON.parse(stored);
    return new Date(draftData.timestamp);
  } catch (error) {
    return null;
  }
}

/**
 * 清理所有过期草稿
 */
function cleanExpiredDrafts(): void {
  try {
    const expiryTime = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const draftData: DraftData = JSON.parse(stored);
          if (now - draftData.timestamp > expiryTime) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (error) {
    console.warn("清理过期草稿失败:", error);
  }
}

interface UseDraftAutoSaveOptions {
  /** 表单唯一标识 */
  formId: string;
  /** 是否启用自动保存 */
  enabled?: boolean;
  /** 自动保存延迟（毫秒） */
  debounceMs?: number;
  /** 草稿恢复回调 */
  onDraftRestore?: (data: Record<string, any>) => void;
}

interface UseDraftAutoSaveReturn {
  /** 是否有可恢复的草稿 */
  hasDraft: boolean;
  /** 草稿保存时间 */
  draftTimestamp: Date | null;
  /** 保存草稿 */
  saveDraft: (data: Record<string, any>) => void;
  /** 恢复草稿 */
  restoreDraft: () => Record<string, any> | null;
  /** 清除草稿 */
  clearDraft: () => void;
  /** 忽略草稿（清除但不恢复） */
  dismissDraft: () => void;
}

/**
 * 草稿自动保存Hook
 * 
 * @example
 * ```tsx
 * const { hasDraft, saveDraft, restoreDraft, clearDraft } = useDraftAutoSave({
 *   formId: "customer-form",
 *   onDraftRestore: (data) => setFormData(data),
 * });
 * 
 * // 表单值变化时自动保存
 * useEffect(() => {
 *   saveDraft(formData);
 * }, [formData]);
 * 
 * // 表单提交成功后清除草稿
 * const handleSubmit = () => {
 *   submitForm();
 *   clearDraft();
 * };
 * ```
 */
export function useDraftAutoSave({
  formId,
  enabled = true,
  debounceMs = 1000,
  onDraftRestore,
}: UseDraftAutoSaveOptions): UseDraftAutoSaveReturn {
  const [hasDraftState, setHasDraftState] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化时检查是否有草稿
  useEffect(() => {
    if (enabled) {
      const exists = hasDraft(formId);
      setHasDraftState(exists);
      if (exists) {
        setDraftTimestamp(getDraftTimestamp(formId));
      }
      // 清理过期草稿
      cleanExpiredDrafts();
    }
  }, [formId, enabled]);

  // 保存草稿（带防抖）
  const saveDraftDebounced = useCallback(
    (data: Record<string, any>) => {
      if (!enabled) return;

      // 清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 设置新的定时器
      debounceTimerRef.current = setTimeout(() => {
        // 检查数据是否有实际内容
        const hasContent = Object.values(data).some(
          (value) => value !== undefined && value !== null && value !== ""
        );
        
        if (hasContent) {
          saveDraft(formId, data);
          setHasDraftState(true);
          setDraftTimestamp(new Date());
        }
      }, debounceMs);
    },
    [formId, enabled, debounceMs]
  );

  // 恢复草稿
  const restoreDraftCallback = useCallback(() => {
    const draft = getDraft(formId);
    if (draft && onDraftRestore) {
      onDraftRestore(draft);
    }
    return draft;
  }, [formId, onDraftRestore]);

  // 清除草稿
  const clearDraftCallback = useCallback(() => {
    clearDraft(formId);
    setHasDraftState(false);
    setDraftTimestamp(null);
  }, [formId]);

  // 忽略草稿
  const dismissDraftCallback = useCallback(() => {
    clearDraft(formId);
    setHasDraftState(false);
    setDraftTimestamp(null);
  }, [formId]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    hasDraft: hasDraftState,
    draftTimestamp,
    saveDraft: saveDraftDebounced,
    restoreDraft: restoreDraftCallback,
    clearDraft: clearDraftCallback,
    dismissDraft: dismissDraftCallback,
  };
}

// 导出工具函数供外部使用
export { saveDraft, getDraft, clearDraft, hasDraft, getDraftTimestamp, cleanExpiredDrafts };
