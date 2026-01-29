import { useEffect } from "react";
import { BRONDashboard } from "./BRONDashboard";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
  isNewlyAddedDomain?: boolean;
  onAutoFillComplete?: () => void;
}

export const BRONPlatformConnect = ({ 
  domain, 
  onConnectionComplete,
  isNewlyAddedDomain,
  onAutoFillComplete,
}: BRONPlatformConnectProps) => {
  useEffect(() => {
    onConnectionComplete?.("bron");
  }, [onConnectionComplete]);

  return (
    <BRONDashboard 
      selectedDomain={domain} 
      isNewlyAddedDomain={isNewlyAddedDomain}
      onAutoFillComplete={onAutoFillComplete}
    />
  );
};

export default BRONPlatformConnect;
