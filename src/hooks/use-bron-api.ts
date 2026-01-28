import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types for BRON API responses
export interface BronDomain {
  id?: number;
  domain: string;
  domain_name?: string;
  status?: string | number;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted?: number;
  settings?: Record<string, unknown>;
  // Extended fields from API
  domain_country?: string;
  ishttps?: number;
  servicetype?: string;
  userid?: number;
  usewww?: number;
  wp_plugin?: number;
  // Business/GMB fields
  wr_name?: string;
  wr_address?: string;
  wr_phone?: string;
  wr_email?: string;
  wr_facebook?: string;
  wr_instagram?: string;
  wr_linkedin?: string;
  wr_twitter?: string;
  wr_video?: string;
}

export interface BronKeyword {
  id: number | string;
  keyword?: string;
  keywordtitle?: string;
  domainid?: number;
  active?: number;
  deleted?: number;
  linkouturl?: string;
  metadescription?: string;
  metatitle?: string;
  resaddress?: string;
  resfb?: string;
  resfeedtext?: string; // HTML content
  createdDate?: string;
  // Cluster/hierarchy fields
  parent_keyword_id?: number | string;
  is_supporting?: boolean | number;
  bubblefeed?: boolean | number;
  cluster_id?: number | string;
  // Legacy fields for compatibility
  domain?: string;
  url?: string;
  anchor_text?: string;
  status?: string;
  position?: number;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface BronPage {
  pageid?: number;
  post_title?: string;
  post_content?: string;
  post_date?: string;
  post_excerpt?: string;
  post_uri?: string;
  post_metatitle?: string;
  post_metakeywords?: string;
  // Legacy fields for compatibility
  url?: string;
  title?: string;
  type?: string;
  status?: string;
  word_count?: number;
  created_at?: string;
}

export interface BronSerpReport {
  keyword?: string;
  google?: string | number;
  bing?: string | number;
  yahoo?: string | number;
  duck?: string | number;
  started?: string;
  complete?: string;
  // Legacy fields
  id?: string;
  position?: number;
  url?: string;
  search_volume?: number;
  difficulty?: number;
  created_at?: string;
}

// SERP List item (historical report metadata)
export interface BronSerpListItem {
  id: string | number;
  report_id?: string | number;
  domain?: string;
  started?: string;
  complete?: string;
  created_at?: string;
  status?: string;
}


export interface BronLink {
  source_url?: string;
  target_url?: string;
  anchor_text?: string;
  domain?: string;
  status?: string;
  type?: string;
  created_at?: string;
}

export interface UseBronApiReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  domains: BronDomain[];
  keywords: BronKeyword[];
  pages: BronPage[];
  serpReports: BronSerpReport[];
  serpHistory: BronSerpListItem[];
  linksIn: BronLink[];
  linksOut: BronLink[];
  linksInError: string | null;
  linksOutError: string | null;
  verifyAuth: () => Promise<boolean>;
  fetchDomains: () => Promise<void>;
  fetchDomain: (domain: string) => Promise<BronDomain | null>;
  updateDomain: (domain: string, data: Record<string, unknown>) => Promise<boolean>;
  deleteDomain: (domain: string) => Promise<boolean>;
  restoreDomain: (domain: string) => Promise<boolean>;
  fetchKeywords: (domain?: string) => Promise<void>;
  addKeyword: (data: Record<string, unknown>) => Promise<boolean>;
  updateKeyword: (keywordId: string, data: Record<string, unknown>) => Promise<boolean>;
  deleteKeyword: (keywordId: string) => Promise<boolean>;
  restoreKeyword: (keywordId: string) => Promise<boolean>;
  fetchPages: (domain: string) => Promise<void>;
  fetchSerpReport: (domain: string) => Promise<void>;
  fetchSerpList: (domain: string) => Promise<void>;
  fetchSerpDetail: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
  fetchLinksIn: (domain: string) => Promise<void>;
  fetchLinksOut: (domain: string) => Promise<void>;
}

export function useBronApi(): UseBronApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [domains, setDomains] = useState<BronDomain[]>([]);
  const [keywords, setKeywords] = useState<BronKeyword[]>([]);
  const [pages, setPages] = useState<BronPage[]>([]);
  const [serpReports, setSerpReports] = useState<BronSerpReport[]>([]);
  const [serpHistory, setSerpHistory] = useState<BronSerpListItem[]>([]);
  const [linksIn, setLinksIn] = useState<BronLink[]>([]);
  const [linksOut, setLinksOut] = useState<BronLink[]>([]);
  const [linksInError, setLinksInError] = useState<string | null>(null);
  const [linksOutError, setLinksOutError] = useState<string | null>(null);

  const formatInvokeError = useCallback(async (error: unknown): Promise<string> => {
    const fallback = error instanceof Error ? error.message : "Request failed";

    // supabase-js function errors often include a Response in `context`
    const context = (error as { context?: Response })?.context;
    if (!context) return fallback;

    try {
      const contentType = context.headers.get("content-type") || "";
      const status = context.status;

      if (contentType.includes("application/json")) {
        const body = (await context.json()) as any;
        const detail =
          body?.details?.detail ||
          body?.details?.message ||
          body?.detail ||
          body?.message ||
          body?.error;

        if (detail) return `BRON API error (${status}): ${String(detail)}`;
        return `BRON API error (${status})`;
      }

      const text = await context.text();
      if (text) return `BRON API error (${status}): ${text}`;
      return `BRON API error (${status})`;
    } catch {
      return fallback;
    }
  }, []);

  const callApi = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke("bron-rsapi", {
        body: { action, ...params },
      });

      if (error) {
        const message = await formatInvokeError(error);
        console.error("BRON API error:", error);
        throw new Error(message);
      }

      return data;
    } catch (err) {
      console.error("BRON API call error:", err);
      throw err;
    }
  }, [formatInvokeError]);

  const verifyAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("verifyAuth");
      const authenticated = result?.success === true;
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const fetchDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callApi("listDomains", { limit: 100 });
      if (result?.success && result.data) {
        const rawList = result.data.domains || result.data.items || [];
        // Normalize domain_name to domain for consistency
        const domainList: BronDomain[] = (Array.isArray(rawList) ? rawList : []).map((d: { id?: number; domain_name?: string; domain?: string; deleted?: number; is_deleted?: boolean }) => ({
          id: d.id,
          domain: String(d.domain_name || d.domain || ''),
          domain_name: d.domain_name,
          is_deleted: d.deleted === 1 || d.is_deleted === true,
        }));
        setDomains(domainList);
      }
    } catch (err) {
      toast.error("Failed to fetch domains");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const fetchDomain = useCallback(async (domain: string): Promise<BronDomain | null> => {
    try {
      const result = await callApi("getDomain", { domain });
      if (result?.success && result.data) {
        return result.data as BronDomain;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [callApi]);

  const updateDomain = useCallback(async (domain: string, data: Record<string, unknown>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("updateDomain", { domain, data });
      if (result?.success) {
        toast.success("Domain updated successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Failed to update domain");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const deleteDomain = useCallback(async (domain: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("deleteDomain", { domain });
      if (result?.success) {
        toast.success("Domain deleted");
        await fetchDomains();
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Failed to delete domain");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi, fetchDomains]);

  const restoreDomain = useCallback(async (domain: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("restoreDomain", { domain });
      if (result?.success) {
        toast.success("Domain restored");
        await fetchDomains();
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Failed to restore domain");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi, fetchDomains]);

  const fetchKeywords = useCallback(async (domain?: string) => {
    setIsLoading(true);
    try {
      const result = await callApi("listKeywords", { domain, limit: 200 });
      if (result?.success && result.data) {
        const keywordList = result.data.keywords || result.data.items || [];
        setKeywords(Array.isArray(keywordList) ? keywordList : []);
      }
    } catch (err) {
      toast.error("Failed to fetch keywords");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const addKeyword = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("addKeyword", { data });
      if (result?.success) {
        toast.success("Keyword added successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Failed to add keyword");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const updateKeyword = useCallback(async (keywordId: string, data: Record<string, unknown>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("updateKeyword", { keyword_id: keywordId, data });
      if (result?.success) {
        toast.success("Keyword updated successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Failed to update keyword");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const deleteKeyword = useCallback(async (keywordId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("deleteKeyword", { keyword_id: keywordId });
      if (result?.success) {
        toast.success("Keyword deleted");
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Failed to delete keyword");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const restoreKeyword = useCallback(async (keywordId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await callApi("restoreKeyword", { keyword_id: keywordId });
      if (result?.success) {
        toast.success("Keyword restored");
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Failed to restore keyword");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const fetchPages = useCallback(async (domain: string) => {
    setIsLoading(true);
    try {
      const result = await callApi("getPages", { domain });
      if (result?.success && result.data) {
        // API returns array directly in data, or nested in pages/articles/items
        const pageList = Array.isArray(result.data) 
          ? result.data 
          : (result.data.pages || result.data.articles || result.data.items || []);
        setPages(Array.isArray(pageList) ? pageList : []);
      }
    } catch (err) {
      toast.error("Failed to fetch pages");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const fetchSerpReport = useCallback(async (domain: string) => {
    setIsLoading(true);
    try {
      const result = await callApi("getSerpReport", { domain });
      if (result?.success && result.data) {
        // API returns array directly or nested
        const reports = Array.isArray(result.data)
          ? result.data
          : (result.data.rankings || result.data.keywords || result.data.items || []);
        setSerpReports(Array.isArray(reports) ? reports : []);
      }
    } catch (err) {
      toast.error("Failed to fetch SERP report");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  // Fetch list of historical SERP reports
  const fetchSerpList = useCallback(async (domain: string) => {
    setIsLoading(true);
    try {
      const result = await callApi("getSerpList", { domain });
      if (result?.success && result.data) {
        // API returns array directly or nested
        const reports = Array.isArray(result.data)
          ? result.data
          : (result.data.reports || result.data.items || []);
        setSerpHistory(Array.isArray(reports) ? reports : []);
      }
    } catch (err) {
      console.error("Failed to fetch SERP list:", err);
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  // Fetch detailed SERP data for a specific historical report
  const fetchSerpDetail = useCallback(async (domain: string, reportId: string): Promise<BronSerpReport[]> => {
    try {
      const result = await callApi("getSerpDetail", { domain, data: { report_id: reportId } });
      if (result?.success && result.data) {
        // API returns array directly or nested
        const reports = Array.isArray(result.data)
          ? result.data
          : (result.data.rankings || result.data.keywords || result.data.items || []);
        return Array.isArray(reports) ? reports : [];
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch SERP detail:", err);
      return [];
    }
  }, [callApi]);

  const fetchLinksIn = useCallback(async (domain: string) => {
    setIsLoading(true);
    setLinksInError(null);
    try {
      const result = await callApi("getLinksIn", { domain });
      if (result?.success && result.data) {
        // API returns array directly or nested
        const links = Array.isArray(result.data)
          ? result.data
          : (result.data.links || result.data.items || []);
        setLinksIn(Array.isArray(links) ? links : []);
      } else if (result?.error) {
        setLinksInError(result.error || "Failed to fetch inbound links");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch inbound links";
      setLinksInError(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  const fetchLinksOut = useCallback(async (domain: string) => {
    setIsLoading(true);
    setLinksOutError(null);
    try {
      const result = await callApi("getLinksOut", { domain });
      if (result?.success && result.data) {
        // API returns array directly or nested
        const links = Array.isArray(result.data)
          ? result.data
          : (result.data.links || result.data.items || []);
        setLinksOut(Array.isArray(links) ? links : []);
      } else if (result?.error) {
        setLinksOutError(result.error || "Failed to fetch outbound links");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch outbound links";
      setLinksOutError(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [callApi]);

  return {
    isLoading,
    isAuthenticated,
    domains,
    keywords,
    pages,
    serpReports,
    serpHistory,
    linksIn,
    linksOut,
    linksInError,
    linksOutError,
    verifyAuth,
    fetchDomains,
    fetchDomain,
    updateDomain,
    deleteDomain,
    restoreDomain,
    fetchKeywords,
    addKeyword,
    updateKeyword,
    deleteKeyword,
    restoreKeyword,
    fetchPages,
    fetchSerpReport,
    fetchSerpList,
    fetchSerpDetail,
    fetchLinksIn,
    fetchLinksOut,
  };
}
