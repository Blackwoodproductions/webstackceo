import { memo, ReactNode, useMemo } from 'react';
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

// Memoized loading skeleton to prevent re-renders
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-8" style={{ contain: 'layout style paint' }}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
});

// Memoized upgrade prompt wrapper
const UpgradePromptWrapper = memo(function UpgradePromptWrapper({ feature }: { feature: FeatureType }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-[400px] p-8"
      style={{ contain: 'layout style' }}
    >
      <FeatureUpgradePrompt feature={feature} />
    </motion.div>
  );
});

/**
 * Wrapper component that conditionally renders feature content
 * or an upgrade prompt based on subscription status.
 * 
 * Optimized with:
 * - Instant cache hydration (no loading flash if cached)
 * - Request deduplication across tabs
 * - Memoized child components
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
  
  // Early bailout for admin/bypass
  if (bypassGate || isAdmin) {
    return <>{children}</>;
  }

  // Prefer domain-scoped check when domain is provided
  const hasAccess = domain ? domainAccess.hasAccess : userAccess.hasAccess;
  const isLoading = domain ? domainAccess.isLoading : userAccess.isLoading;

  // Show loading skeleton while checking subscription
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // If user has access, render the feature
  if (hasAccess) {
    return <>{children}</>;
  }

  // Otherwise, show upgrade prompt
  return <UpgradePromptWrapper feature={feature} />;
});

export default FeatureGate;
