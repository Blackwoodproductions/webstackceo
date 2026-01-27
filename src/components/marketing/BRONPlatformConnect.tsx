import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, Zap, Shield, Link2, Award, Target, Sparkles, Building
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRONDashboard } from "./BRONDashboard";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  // The dashboard now handles auth verification internally via the API
  // No more popup/iframe flow - everything is inline via the RSAPI

  useEffect(() => {
    // Notify parent that BRON is ready
    onConnectionComplete?.("bron");
  }, [onConnectionComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Link2, title: "Keyword Management", desc: "Full CRUD operations for keywords", color: "violet" },
          { icon: TrendingUp, title: "SERP Tracking", desc: "Real-time ranking position reports", color: "emerald" },
          { icon: Award, title: "Link Reports", desc: "Inbound & outbound link analysis", color: "amber" },
          { icon: Zap, title: "Content Management", desc: "Pages and articles overview", color: "blue" },
        ].map((feature, index) => (
          <Card 
            key={index} 
            className={`bg-gradient-to-br from-background to-${feature.color}-500/5 border-${feature.color}-500/20`}
          >
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${feature.color}-400/20 to-${feature.color}-500/20 flex items-center justify-center mb-3`}>
                <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <BRONDashboard selectedDomain={domain} />
    </motion.div>
  );
};

export default BRONPlatformConnect;
