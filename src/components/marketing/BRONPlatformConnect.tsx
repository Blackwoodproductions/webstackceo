import { useEffect } from "react";
import { BRONDashboard } from "./BRONDashboard";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  useEffect(() => {
    onConnectionComplete?.("bron");
  }, [onConnectionComplete]);

  return <BRONDashboard selectedDomain={domain} />;
};

export default BRONPlatformConnect;
