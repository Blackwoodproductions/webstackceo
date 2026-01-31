import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Plus, Trash2, Edit2, Eye, EyeOff, RefreshCw,
  Calendar, Tag, Sparkles, Zap, CheckCircle2, AlertCircle, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  changes: string[];
  icon: string;
  highlight: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  aggregation_start: string | null;
  aggregation_end: string | null;
}

const typeColors: Record<string, string> = {
  feature: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  improvement: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  fix: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  announcement: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

const iconOptions = [
  "Sparkles", "Shield", "BarChart3", "Rocket", "Brain", "Target", 
  "TrendingUp", "CheckCircle2", "Zap", "Globe", "Eye", "MessageCircle", "Image"
];

const AdminChangelogTab = memo(() => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<ChangelogEntry> | null>(null);
  const [saving, setSaving] = useState(false);
  const [aggregating, setAggregating] = useState(false);
  const [changesText, setChangesText] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("changelog_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle Json type
      const transformedData = (data || []).map(entry => ({
        ...entry,
        changes: Array.isArray(entry.changes) ? entry.changes as string[] : []
      }));
      
      setEntries(transformedData);
    } catch (error) {
      console.error("Error fetching changelog:", error);
      toast.error("Failed to load changelog entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openCreateDialog = () => {
    setCurrentEntry({
      title: "",
      description: "",
      type: "improvement",
      changes: [],
      icon: "Zap",
      highlight: false,
      is_published: false,
    });
    setChangesText("");
    setEditDialog(true);
  };

  const openEditDialog = (entry: ChangelogEntry) => {
    setCurrentEntry(entry);
    setChangesText(entry.changes.join("\n"));
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!currentEntry?.title || !currentEntry?.description) {
      toast.error("Title and description are required");
      return;
    }

    setSaving(true);
    try {
      const changesArray = changesText.split("\n").filter(c => c.trim());
      
      if (currentEntry.id) {
        // Update existing
        const { error } = await supabase
          .from("changelog_entries")
          .update({
            title: currentEntry.title,
            description: currentEntry.description,
            type: currentEntry.type,
            changes: changesArray,
            icon: currentEntry.icon,
            highlight: currentEntry.highlight,
            is_published: currentEntry.is_published,
            published_at: currentEntry.is_published ? new Date().toISOString() : null,
          })
          .eq("id", currentEntry.id);

        if (error) throw error;
        toast.success("Changelog entry updated");
      } else {
        // Get next version
        const latestVersion = entries[0]?.version || "2.5.0";
        const parts = latestVersion.split(".").map(Number);
        parts[2] = (parts[2] || 0) + 1;
        const newVersion = parts.join(".");

        const { error } = await supabase
          .from("changelog_entries")
          .insert({
            version: newVersion,
            title: currentEntry.title,
            description: currentEntry.description,
            type: currentEntry.type || "improvement",
            changes: changesArray,
            icon: currentEntry.icon || "Zap",
            highlight: currentEntry.highlight || false,
            is_published: currentEntry.is_published || false,
            published_at: currentEntry.is_published ? new Date().toISOString() : null,
            aggregation_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            aggregation_end: new Date().toISOString(),
          });

        if (error) throw error;
        toast.success("Changelog entry created");
      }

      setEditDialog(false);
      fetchEntries();
    } catch (error) {
      console.error("Error saving changelog:", error);
      toast.error("Failed to save changelog entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this changelog entry?")) return;

    try {
      const { error } = await supabase
        .from("changelog_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Changelog entry deleted");
      fetchEntries();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete changelog entry");
    }
  };

  const togglePublish = async (entry: ChangelogEntry) => {
    try {
      const { error } = await supabase
        .from("changelog_entries")
        .update({
          is_published: !entry.is_published,
          published_at: !entry.is_published ? new Date().toISOString() : null,
        })
        .eq("id", entry.id);

      if (error) throw error;
      toast.success(entry.is_published ? "Entry unpublished" : "Entry published");
      fetchEntries();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update publish status");
    }
  };

  const triggerAggregation = async () => {
    setAggregating(true);
    try {
      const { data, error } = await supabase.functions.invoke("aggregate-changelog", {
        body: {}
      });

      if (error) throw error;
      toast.success(data?.message || "Aggregation check complete");
      fetchEntries();
    } catch (error) {
      console.error("Aggregation error:", error);
      toast.error("Aggregation failed");
    } finally {
      setAggregating(false);
    }
  };

  const stats = {
    total: entries.length,
    published: entries.filter(e => e.is_published).length,
    features: entries.filter(e => e.type === "feature").length,
    thisMonth: entries.filter(e => {
      const created = new Date(e.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: stats.total, icon: FileText, color: "bg-cyan-500" },
          { label: "Published", value: stats.published, icon: Eye, color: "bg-emerald-500" },
          { label: "Features", value: stats.features, icon: Sparkles, color: "bg-violet-500" },
          { label: "This Month", value: stats.thisMonth, icon: Calendar, color: "bg-amber-500" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Bar */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Changelog Manager
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={triggerAggregation}
                disabled={aggregating}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${aggregating ? 'animate-spin' : ''}`} />
                {aggregating ? 'Checking...' : 'Run Aggregation'}
              </Button>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-1" />
                New Entry
              </Button>
              <Button size="icon" variant="outline" onClick={fetchEntries}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No changelog entries found</p>
              <Button size="sm" className="mt-4" onClick={openCreateDialog}>
                Create First Entry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Version</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[80px]">Changes</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          v{entry.version}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium truncate">{entry.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeColors[entry.type] || ""}>
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{entry.changes.length}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePublish(entry)}
                          className={entry.is_published ? "text-emerald-400" : "text-muted-foreground"}
                        >
                          {entry.is_published ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), "MMM d")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(entry)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {currentEntry?.id ? "Edit Changelog Entry" : "Create Changelog Entry"}
            </DialogTitle>
          </DialogHeader>

          {currentEntry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={currentEntry.title || ""}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
                    placeholder="What's new..."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={currentEntry.type || "improvement"}
                    onValueChange={(value) => setCurrentEntry({ ...currentEntry, type: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="fix">Bug Fix</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={currentEntry.description || ""}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, description: e.target.value })}
                  placeholder="Describe the update..."
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Changes (one per line)</Label>
                <Textarea
                  value={changesText}
                  onChange={(e) => setChangesText(e.target.value)}
                  placeholder="Added new feature X&#10;Fixed bug in Y&#10;Improved performance of Z"
                  rows={5}
                  className="mt-2 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={currentEntry.icon || "Zap"}
                    onValueChange={(value) => setCurrentEntry({ ...currentEntry, icon: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={currentEntry.highlight || false}
                      onCheckedChange={(checked) => setCurrentEntry({ ...currentEntry, highlight: checked })}
                    />
                    <Label>Highlight</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={currentEntry.is_published || false}
                      onCheckedChange={(checked) => setCurrentEntry({ ...currentEntry, is_published: checked })}
                    />
                    <Label>Published</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AdminChangelogTab.displayName = "AdminChangelogTab";

export default AdminChangelogTab;