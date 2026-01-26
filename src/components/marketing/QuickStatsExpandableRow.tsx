import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, ChevronDown, DollarSign, Mail, Phone, Target, UserCheck, Loader2, Radio } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import VisitorEngagementPanel from "./VisitorEngagementPanel";

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
    gradient: string;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    showPulseDot?: boolean;
    showLiveBadge?: boolean;
    formatValue?: (v: number) => string;
  };

  const [expanded, setExpanded] = useState<ExpandedKey | null>(null);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [activeSessions, setActiveSessions] = useState<VisitorSession[]>([]);
  const [todaySessions, setTodaySessions] = useState<VisitorSession[]>([]);

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

  useEffect(() => {
    if (expanded === "active") {
      fetchActiveSessions();
    } else if (expanded === "today") {
      fetchTodaySessions();
    }
  }, [expanded, fetchActiveSessions, fetchTodaySessions]);

  const calledLeads = useMemo(() => leads.filter((l) => l.status === "called").slice(0, 25), [leads]);
  const emailedLeads = useMemo(() => leads.filter((l) => l.status === "emailed").slice(0, 25), [leads]);
  const consideringLeads = useMemo(() => leads.filter((l) => l.status === "considering").slice(0, 25), [leads]);
  const closedLeads = useMemo(() => leads.filter((l) => l.status === "closed").slice(0, 25), [leads]);

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
        gradient: "from-green-500/15 to-emerald-500/10",
        iconBg: "bg-green-500/20",
        iconColor: "text-green-500",
        borderColor: "border-green-500/30",
        showPulseDot: true,
        showLiveBadge: true,
      },
      {
        key: "today",
        label: "New Today",
        value: newVisitorsToday,
        Icon: UserCheck,
        gradient: "from-cyan-500/15 to-blue-500/10",
        iconBg: "bg-cyan-500/20",
        iconColor: "text-cyan-500",
        borderColor: "border-cyan-500/30",
      },
      {
        key: "called",
        label: "📞 Called",
        value: calledCount,
        Icon: Phone,
        gradient: "from-blue-500/15 to-indigo-500/10",
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-500",
        borderColor: "border-blue-500/30",
      },
      {
        key: "emailed",
        label: "✉️ Emailed",
        value: emailedCount,
        Icon: Mail,
        gradient: "from-violet-500/15 to-purple-500/10",
        iconBg: "bg-violet-500/20",
        iconColor: "text-violet-500",
        borderColor: "border-violet-500/30",
      },
      {
        key: "considering",
        label: "🤔 Considering",
        value: consideringCount,
        Icon: Target,
        gradient: "from-amber-500/15 to-orange-500/10",
        iconBg: "bg-amber-500/20",
        iconColor: "text-amber-500",
        borderColor: "border-amber-500/30",
      },
      {
        key: "revenue",
        label: "💰 Revenue",
        value: revenue,
        Icon: DollarSign,
        gradient: "from-emerald-500/15 to-green-500/10",
        iconBg: "bg-emerald-500/20",
        iconColor: "text-emerald-500",
        borderColor: "border-emerald-500/30",
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
        {cards.map((c, i) => {
          const isOpen = expanded === c.key;
          const displayValue = c.formatValue ? c.formatValue(c.value) : String(c.value);
          return (
            <motion.button
              key={c.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setExpanded(isOpen ? null : c.key)}
              aria-expanded={isOpen}
              className={cn(
                "relative rounded-xl border bg-gradient-to-br text-card-foreground shadow-sm p-4 text-left transition-all overflow-hidden group",
                c.gradient,
                c.borderColor,
                isOpen ? "ring-2 ring-primary/30 shadow-lg" : "hover:shadow-md",
              )}
              >
                {/* Static grid pattern */}
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                    backgroundSize: '16px 16px'
                  }}
                />
                
              <div className="flex items-center gap-2 relative z-10">
                <div className={cn("p-2 rounded-lg relative flex-shrink-0", c.iconBg)}>
                  <c.Icon className={cn("w-5 h-5", c.iconColor)} />
                  {c.showPulseDot && (
                    <>
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500" />
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <motion.p 
                      className={cn("text-2xl font-bold leading-tight truncate", c.iconColor)}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.05, type: "spring" }}
                    >
                      {displayValue}
                    </motion.p>
                    {c.showLiveBadge && (
                      <motion.span
                        className="flex items-center gap-0.5 text-[8px] font-medium px-1 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Radio className="w-2 h-2" />
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {expanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="relative rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-4 overflow-hidden"
        >
          
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

          <div>
            {expanded === "active" && <VisitorEngagementPanel />}

            {expanded === "today" && (
              loadingPanel ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5 text-primary" />
                  </motion.div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading sessions…</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>First page</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.session_id.slice(0, 8)}…</TableCell>
                        <TableCell className="text-sm">{s.first_page || "—"}</TableCell>
                        <TableCell className="text-sm truncate max-w-[240px]">{s.referrer || "Direct"}</TableCell>
                        <TableCell className="text-sm">{formatShort(s.started_at)}</TableCell>
                      </TableRow>
                    ))}
                    {todaySessions.length === 0 && (
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
                  {(expanded === "called" ? calledLeads : expanded === "emailed" ? emailedLeads : consideringLeads).length === 0 && (
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
                      <TableCell className="text-sm font-medium text-emerald-500">
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
          </div>

          <p className="mt-3 text-xs text-muted-foreground relative z-10">
            Showing up to 25 most recent records.
          </p>
        </motion.div>
      )}
    </div>
  );
}
