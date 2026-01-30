import { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FeatureUpgradePrompt, type FeatureType } from './FeatureUpgradePrompt';
import { useFeatureAccess } from '@/hooks/use-subscription-status';
import { useDomainFeatureAccess } from '@/hooks/use-domain-subscription';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatureGateProps {
  feature: FeatureType;
  children: ReactNode;
  /** The domain to check subscription for (enables domain-scoped gating) */
  domain?: string | null;
  /** If true, always show children (for demo/development) */
  bypassGate?: boolean;
  /** If true, bypass gate for admin users (super admin / admin) */
  isAdmin?: boolean;
}

/**
 * Wrapper component that conditionally renders feature content
 * or an upgrade prompt based on subscription status.
 * 
 * When domain is provided, checks subscription for that specific domain.
 * Otherwise falls back to user-level subscription check.
 * 
 * Usage:
 * <FeatureGate feature="bron" domain={selectedDomain}>
 *   <BRONPlatformConnect ... />
 * </FeatureGate>
 * 
 * For admin users who should bypass all gates:
 * <FeatureGate feature="bron" domain={selectedDomain} isAdmin={isSuperAdmin}>
 *   <BRONPlatformConnect ... />
 * </FeatureGate>
 */
export const FeatureGate = memo(function FeatureGate({
  feature,
  children,
  domain,
  bypassGate = false,
  isAdmin = false,
}: FeatureGateProps) {
  // Use domain-scoped access check when domain is provided
  const domainAccess = useDomainFeatureAccess(feature, domain);
  const userAccess = useFeatureAccess(feature);
  
  // Prefer domain-scoped check when domain is provided
  const hasAccess = domain ? domainAccess.hasAccess : userAccess.hasAccess;
  const isLoading = domain ? domainAccess.isLoading : userAccess.isLoading;

  // Bypass gate for development/demo or admin users
  if (bypassGate || isAdmin) {
    return <>{children}</>;
  }

  // Show loading skeleton while checking subscription
  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // If user has access, render the feature
  if (hasAccess) {
    return <>{children}</>;
  }

  // Otherwise, show upgrade prompt
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-[400px] p-8"
    >
      <FeatureUpgradePrompt feature={feature} />
    </motion.div>
  );
});

export default FeatureGate;

