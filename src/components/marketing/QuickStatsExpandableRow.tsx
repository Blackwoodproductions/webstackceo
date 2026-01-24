import { useEffect, useMemo, useState, useCallback } from "react";
import { Activity, ChevronDown, DollarSign, Mail, Phone, Target, UserCheck, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

type Lead = {
  id: string;
  email: string;
  phone: string | null;
  created_at: string;
  full_name: string | null;
  company_employees: string | null;
  annual_revenue: string | null;
  funnel_stage: string | null;
  status: string;
  closed_at: string | null;
  closed_amount: number | null;
};

type VisitorSession = {
  id: string;
  session_id: string;
  first_page: string | null;
  referrer: string | null;
  started_at: string;
  last_activity_at: string;
};

type ExpandedKey =
  | "active"
  | "today"
  | "called"
  | "emailed"
  | "considering"
  | "revenue";

function formatShort(iso: string) {
  const d = new Date(iso);
  // Keep it simple and locale-safe
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QuickStatsExpandableRow({
  activeVisitors,
  newVisitorsToday,
  leads,
  sessions,
}: {
  activeVisitors: number;
  newVisitorsToday: number;
  leads: Lead[];
  sessions: VisitorSession[];
}) {
  type CardItem = {
    key: ExpandedKey;
    label: string;
    value: number;
    Icon: LucideIcon;
    cardClass: string;
    iconWrapClass: string;
    iconClass: string;
    showPulseDot?: boolean;
    formatValue?: (v: number) => string;
  };

  const [expanded, setExpanded] = useState<ExpandedKey | null>(null);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [activeSessions, setActiveSessions] = useState<VisitorSession[]>([]);
  const [todaySessions, setTodaySessions] = useState<VisitorSession[]>([]);

  // Fetch active sessions directly from DB when expanded
  const fetchActiveSessions = useCallback(async () => {
    setLoadingPanel(true);
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("visitor_sessions")
        .select("id, session_id, first_page, referrer, started_at, last_activity_at")
        .gte("last_activity_at", fiveMinutesAgo)
        .order("last_activity_at", { ascending: false })
        .limit(25);

      if (error) throw error;
      setActiveSessions((data as VisitorSession[]) || []);
    } catch (err) {
      console.error("Failed to fetch active sessions:", err);
      setActiveSessions([]);
    } finally {
      setLoadingPanel(false);
    }
  }, []);

  // Fetch today's sessions from DB when expanded
  const fetchTodaySessions = useCallback(async () => {
    setLoadingPanel(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("visitor_sessions")
        .select("id, session_id, first_page, referrer, started_at, last_activity_at")
        .gte("started_at", todayStart.toISOString())
        .order("started_at", { ascending: false })
        .limit(25);

      if (error) throw error;
      setTodaySessions((data as VisitorSession[]) || []);
    } catch (err) {
      console.error("Failed to fetch today sessions:", err);
      setTodaySessions([]);
    } finally {
      setLoadingPanel(false);
    }
  }, []);

  // Trigger fetch when panel opens
  useEffect(() => {
    if (expanded === "active") {
      fetchActiveSessions();
    } else if (expanded === "today") {
      fetchTodaySessions();
    }
  }, [expanded, fetchActiveSessions, fetchTodaySessions]);

  const calledLeads = useMemo(
    () => leads.filter((l) => l.status === "called").slice(0, 25),
    [leads],
  );

  const emailedLeads = useMemo(
    () => leads.filter((l) => l.status === "emailed").slice(0, 25),
    [leads],
  );

  const consideringLeads = useMemo(
    () => leads.filter((l) => l.status === "considering").slice(0, 25),
    [leads],
  );

  const closedLeads = useMemo(
    () => leads.filter((l) => l.status === "closed").slice(0, 25),
    [leads],
  );

  const cards: CardItem[] = useMemo(() => {
    const calledCount = leads.filter((l) => l.status === "called").length;
    const emailedCount = leads.filter((l) => l.status === "emailed").length;
    const consideringCount = leads.filter((l) => l.status === "considering").length;
    const revenue = leads.reduce((sum, l) => sum + (l.closed_amount || 0), 0);

    return [
      {
        key: "active",
        label: "Active Now",
        value: activeVisitors,
        Icon: Activity,
        cardClass: "border-green-500/30 bg-green-500/5",
        iconWrapClass: "bg-green-500/20",
        iconClass: "text-green-500",
        showPulseDot: true,
      },
      {
        key: "today",
        label: "New Today",
        value: newVisitorsToday,
        Icon: UserCheck,
        cardClass: "border-cyan-500/30 bg-cyan-500/5",
        iconWrapClass: "bg-cyan-500/20",
        iconClass: "text-cyan-500",
      },
      {
        key: "called",
        label: "📞 Called",
        value: calledCount,
        Icon: Phone,
        cardClass: "border-blue-500/30 bg-blue-500/5",
        iconWrapClass: "bg-blue-500/20",
        iconClass: "text-blue-500",
      },
      {
        key: "emailed",
        label: "✉️ Emailed",
        value: emailedCount,
        Icon: Mail,
        cardClass: "border-violet-500/30 bg-violet-500/5",
        iconWrapClass: "bg-violet-500/20",
        iconClass: "text-violet-500",
      },
      {
        key: "considering",
        label: "🤔 Considering",
        value: consideringCount,
        Icon: Target,
        cardClass: "border-amber-500/30 bg-amber-500/5",
        iconWrapClass: "bg-amber-500/20",
        iconClass: "text-amber-500",
      },
      {
        key: "revenue",
        label: "💰 Revenue",
        value: revenue,
        Icon: DollarSign,
        cardClass: "border-green-500/30 bg-green-500/5",
        iconWrapClass: "bg-green-500/20",
        iconClass: "text-green-500",
        formatValue: (v) => `$${v.toLocaleString()}`,
      },
    ];
  }, [activeVisitors, newVisitorsToday, leads]);

  const panelTitle =
    expanded === "active"
      ? "Active visitors (last 5 minutes)"
      : expanded === "today"
        ? "New visitors today"
        : expanded === "called"
          ? "Called leads"
          : expanded === "emailed"
            ? "Emailed leads"
            : expanded === "considering"
              ? "Considering leads"
              : "Closed leads (revenue)";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => {
          const isOpen = expanded === c.key;
          const displayValue = c.formatValue ? c.formatValue(c.value) : String(c.value);
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setExpanded(isOpen ? null : c.key)}
              aria-expanded={isOpen}
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm p-4 text-left transition-colors",
                c.cardClass,
                isOpen ? "ring-1 ring-primary/25" : "hover:bg-secondary/20",
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg relative flex-shrink-0", c.iconWrapClass)}>
                  <c.Icon className={cn("w-5 h-5", c.iconClass)} />
                  {c.showPulseDot && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-2xl font-bold leading-tight truncate", c.iconClass)}>{displayValue}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
                    isOpen && "rotate-180",
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-foreground">{panelTitle}</h3>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setExpanded(null)}
            >
              Collapse
            </button>
          </div>

          {(expanded === "active" || expanded === "today") && (
            loadingPanel ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading sessions…</span>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>First page</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>{expanded === "active" ? "Last active" : "Started"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(expanded === "active" ? activeSessions : todaySessions).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.session_id.slice(0, 8)}…</TableCell>
                    <TableCell className="text-sm">{s.first_page || "—"}</TableCell>
                    <TableCell className="text-sm truncate max-w-[240px]">{s.referrer || "Direct"}</TableCell>
                    <TableCell className="text-sm">
                      {expanded === "active" ? formatShort(s.last_activity_at) : formatShort(s.started_at)}
                    </TableCell>
                  </TableRow>
                ))}

                {((expanded === "active" ? activeSessions : todaySessions).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4 text-sm">
                      No records to show
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )
          )}

          {(expanded === "called" || expanded === "emailed" || expanded === "considering") && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(expanded === "called" ? calledLeads : expanded === "emailed" ? emailedLeads : consideringLeads).map(
                  (l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{l.email}</TableCell>
                      <TableCell className="text-sm">{l.full_name || "—"}</TableCell>
                      <TableCell className="text-sm">{l.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{formatShort(l.created_at)}</TableCell>
                    </TableRow>
                  ),
                )}

                {(
                  (expanded === "called" ? calledLeads : expanded === "emailed" ? emailedLeads : consideringLeads)
                    .length === 0
                ) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4 text-sm">
                      No records to show
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {expanded === "revenue" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedLeads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{l.email}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {(l.closed_amount ?? 0).toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="text-sm">{l.closed_at ? formatShort(l.closed_at) : "—"}</TableCell>
                  </TableRow>
                ))}

                {closedLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4 text-sm">
                      No records to show
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Showing up to 25 most recent records.
          </p>
        </div>
      )}
    </div>
  );
}
