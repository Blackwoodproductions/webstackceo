import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CadeTaskType = "CRAWL" | "CATEGORIZATION" | "CSS" | "CONTENT" | "UNKNOWN";

export interface CadeEventTask {
  id: string; // request_id (preferred) or event id fallback
  request_id?: string;
  target_request_id?: string;
  user_id?: string;
  domain: string;
  type: CadeTaskType;
  status: string;
  statusValue: string; // The part after ":" e.g. "running", "completed"
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  current_url?: string;
  message?: string;
  error?: string;
  created_at?: string;
  updated_at?: string; // Track the most recent update
  // Extended data from raw_payload
  categories?: string[];
  description?: string;
  competitors?: string;
  country?: string;
  language?: string;
  tier?: string;
  domain_id?: string;
  analyze_css?: boolean;
}

export interface CadeTaskStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  byType: {
    crawl: number;
    categorization: number;
    css: number;
    content: number;
  };
}

const parseTypeFromStatus = (status?: string): CadeTaskType => {
  const prefix = (status || "").split(":")[0]?.toUpperCase();
  if (prefix === "CRAWL") return "CRAWL";
  if (prefix === "CATEGORIZATION") return "CATEGORIZATION";
  if (prefix === "CSS") return "CSS";
  if (prefix === "CONTENT") return "CONTENT";
  return "UNKNOWN";
};

const parseStatusValue = (status?: string): string => {
  if (!status) return "unknown";
  const parts = status.split(":");
  return parts.length > 1 ? parts[1].toLowerCase() : status.toLowerCase();
};

export function useCadeEventTasks(domain?: string) {
  const [tasks, setTasks] = useState<CadeEventTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!domain) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from("cade_crawl_events")
        .select(
          "id, created_at, domain, status, progress, pages_crawled, total_pages, current_url, error_message, message, request_id, user_id, raw_payload"
        )
        .eq("domain", domain)
        .order("created_at", { ascending: false })
        .limit(200);

      if (dbError) throw dbError;

      const rows = data ?? [];

      // Build latest task-per-(type+request_id)
      const seen = new Map<string, CadeEventTask>();

      for (const row of rows) {
        const type = parseTypeFromStatus(row.status);
        const statusValue = parseStatusValue(row.status);
        const requestId = row.request_id ?? undefined;
        const raw = (row.raw_payload ?? {}) as Record<string, unknown>;
        const rawData = (raw?.data ?? {}) as Record<string, unknown>;
        
        const targetRequestId =
          (raw?.target_request_id as string) ?? 
          (rawData?.target_request_id as string) ?? 
          undefined;

        const logicalId = requestId ?? row.id;
        const key = `${type}:${logicalId}`;
        
        // If we've seen this task already, we have the latest event for it
        // But we may want to merge some data (like categories from completed events)
        if (seen.has(key)) {
          const existing = seen.get(key)!;
          // Merge extended data if current event has it
          if (rawData?.categories && !existing.categories) {
            existing.categories = rawData.categories as string[];
          }
          if (rawData?.description && !existing.description) {
            existing.description = rawData.description as string;
          }
          continue;
        }

        seen.set(key, {
          id: logicalId,
          request_id: requestId,
          target_request_id: targetRequestId,
          user_id: row.user_id ?? undefined,
          domain: row.domain,
          type,
          status: row.status,
          statusValue,
          progress: row.progress ?? undefined,
          pages_crawled: row.pages_crawled ?? undefined,
          total_pages: row.total_pages ?? undefined,
          current_url: row.current_url ?? (rawData?.current_url as string) ?? undefined,
          message: row.message ?? (rawData?.message as string) ?? undefined,
          error: row.error_message ?? (raw?.error as Record<string, unknown>)?.message as string ?? undefined,
          created_at: row.created_at ?? undefined,
          // Extended data
          categories: rawData?.categories as string[] ?? undefined,
          description: rawData?.description as string ?? undefined,
          competitors: rawData?.competitors as string ?? undefined,
          country: rawData?.country as string ?? undefined,
          language: rawData?.language as string ?? undefined,
          tier: rawData?.tier as string ?? undefined,
          domain_id: rawData?.domain_id as string ?? undefined,
          analyze_css: rawData?.analyze_css as boolean ?? undefined,
        });
      }

      setTasks(Array.from(seen.values()));
    } catch (e) {
      console.error("[CADE Event Tasks] Fetch error:", e);
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime updates
  useEffect(() => {
    if (!domain) return;

    const channel = supabase
      .channel(`cade-events-${domain}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cade_crawl_events",
          filter: `domain=eq.${domain}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [domain, fetchTasks]);

  const byType = useMemo(() => {
    return {
      crawl: tasks.filter((t) => t.type === "CRAWL"),
      categorization: tasks.filter((t) => t.type === "CATEGORIZATION"),
      css: tasks.filter((t) => t.type === "CSS"),
      content: tasks.filter((t) => t.type === "CONTENT"),
      unknown: tasks.filter((t) => t.type === "UNKNOWN"),
    };
  }, [tasks]);

  // Calculate task statistics
  const stats = useMemo((): CadeTaskStats => {
    const isActive = (s: string) => 
      ["running", "processing", "pending", "queued", "in_progress"].includes(s.toLowerCase());
    const isCompleted = (s: string) => 
      ["completed", "done", "success"].includes(s.toLowerCase());
    const isFailed = (s: string) => 
      ["failed", "error"].includes(s.toLowerCase());

    return {
      total: tasks.length,
      active: tasks.filter(t => isActive(t.statusValue)).length,
      completed: tasks.filter(t => isCompleted(t.statusValue)).length,
      failed: tasks.filter(t => isFailed(t.statusValue)).length,
      byType: {
        crawl: byType.crawl.length,
        categorization: byType.categorization.length,
        css: byType.css.length,
        content: byType.content.length,
      },
    };
  }, [tasks, byType]);

  // Latest completed categorization (has description/categories)
  const latestCategorization = useMemo(() => {
    return byType.categorization.find(
      (t) => t.statusValue === "completed" && t.description
    );
  }, [byType.categorization]);

  // Check if any tasks are currently active
  const hasActiveTasks = useMemo(() => stats.active > 0, [stats.active]);

  // Get the most recent active task per type
  const activeTasksByType = useMemo(() => {
    const isActive = (s: string) => 
      ["running", "processing", "pending", "queued", "in_progress"].includes(s.toLowerCase());
    
    return {
      crawl: byType.crawl.find(t => isActive(t.statusValue)),
      categorization: byType.categorization.find(t => isActive(t.statusValue)),
      css: byType.css.find(t => isActive(t.statusValue)),
      content: byType.content.find(t => isActive(t.statusValue)),
    };
  }, [byType]);

  return {
    tasks,
    byType,
    stats,
    latestCategorization,
    hasActiveTasks,
    activeTasksByType,
    isLoading,
    error,
    refresh: fetchTasks,
  };
}
