import { useCallback, useEffect, useMemo, useState } from "react";
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
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  current_url?: string;
  message?: string;
  error?: string;
  created_at?: string;
}

const parseTypeFromStatus = (status?: string): CadeTaskType => {
  const prefix = (status || "").split(":")[0]?.toUpperCase();
  if (prefix === "CRAWL") return "CRAWL";
  if (prefix === "CATEGORIZATION") return "CATEGORIZATION";
  if (prefix === "CSS") return "CSS";
  if (prefix === "CONTENT") return "CONTENT";
  return "UNKNOWN";
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
      const seen = new Set<string>();
      const next: CadeEventTask[] = [];

      for (const row of rows) {
        const type = parseTypeFromStatus(row.status);
        const requestId = row.request_id ?? undefined;
        const raw = (row.raw_payload ?? {}) as any;
        const targetRequestId =
          raw?.target_request_id ?? raw?.data?.target_request_id ?? undefined;

        const logicalId = requestId ?? row.id;
        const key = `${type}:${logicalId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        next.push({
          id: logicalId,
          request_id: requestId,
          target_request_id: targetRequestId,
          user_id: row.user_id ?? undefined,
          domain: row.domain,
          type,
          status: row.status,
          progress: row.progress ?? undefined,
          pages_crawled: row.pages_crawled ?? undefined,
          total_pages: row.total_pages ?? undefined,
          current_url: row.current_url ?? undefined,
          message: row.message ?? undefined,
          error: row.error_message ?? undefined,
          created_at: row.created_at ?? undefined,
        });
      }

      setTasks(next);
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

  return {
    tasks,
    byType,
    isLoading,
    error,
    refresh: fetchTasks,
  };
}
