import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Link2, TrendingUp, 
  Award, Sparkles, Zap, Target, Key, Eye, EyeOff, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { BronDashboard } from "./BronDashboard";
import { useUnifiedApiKey } from "@/hooks/use-unified-api-key";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const { apiKey, isLoading, isConnected, setApiKey } = useUnifiedApiKey();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasNotified = useRef(false);

  // Notify parent when connected
  useEffect(() => {
    if (isConnected && !hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
  }, [isConnected, onConnectionComplete]);

  const handleSaveKey = async () => {
    if (!inputKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await setApiKey(inputKey.trim());
      toast({
        title: "Connected Successfully",
        description: "Your API key has been saved. You won't need to enter it again.",
      });
      onConnectionComplete?.("bron");
    } catch (err) {
      toast({
        title: "Failed to Save",
        description: "Could not save your API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Connected - show dashboard directly (never show login box again)
  if (isConnected && domain) {
    return <BronDashboard domain={domain} onLogout={() => {}} />;
  }

  // Not connected - show API key input (one-time only)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Link2, title: "Keyword Clustering", desc: "AI-powered topical organization" },
          { icon: TrendingUp, title: "Deep Linking", desc: "Strategic internal link building" },
          { icon: Award, title: "Authority Growth", desc: "Increase domain authority metrics" },
          { icon: Zap, title: "Autopilot Links", desc: "Automated inbound link acquisition" },
        ].map((feature, index) => (
          <Card key={index} className="bg-gradient-to-br from-background to-secondary/20 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Key Input Card */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-background via-background to-emerald-500/5">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Connect to BRON & CADE</CardTitle>
          <CardDescription>
            Enter your API key once to connect both BRON and CADE dashboards. 
            This key will be saved permanently.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Enter your API key..."
              className="pr-10 bg-secondary/30 border-emerald-500/20 focus:border-emerald-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          <Button
            onClick={handleSaveKey}
            disabled={isSaving || !inputKey.trim()}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Connect Dashboards
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>One key powers both BRON and CADE integrations</span>
          </div>
        </CardContent>
      </Card>

      {/* No domain selected message */}
      {!domain && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-8 text-center">
            <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Select a domain from the dropdown above to view your dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info about the integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-lg bg-secondary/30">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-medium">AI-Powered</p>
          <p className="text-xs text-muted-foreground">Intelligent link strategies</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Award className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <p className="text-sm font-medium">Real Websites</p>
          <p className="text-xs text-muted-foreground">No PBNs, only quality sites</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Target className="w-6 h-6 mx-auto mb-2 text-teal-400" />
          <p className="text-sm font-medium">Targeted Links</p>
          <p className="text-xs text-muted-foreground">Relevant niche placements</p>
        </div>
      </div>

      {/* External link to BRON dashboard */}
      <div className="text-center">
        <Button
          variant="link"
          onClick={() => window.open("https://dashdev.imagehosting.space/", "_blank")}
          className="text-muted-foreground hover:text-emerald-400"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Open BRON Dashboard in New Tab
        </Button>
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
