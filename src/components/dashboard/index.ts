// Dashboard components - modular, memoized, reusable
export { VIDashboardHeader } from './VIDashboardHeader';
export { VIChatSidebar } from './VIChatSidebar';
export { VIDashboardTabs, type DashboardTab } from './VIDashboardTabs';
export { VIDashboardEffects } from '@/components/ui/vi-dashboard-effects';
export { FeatureUpgradePrompt, type FeatureType } from './FeatureUpgradePrompt';
export { FeatureGate } from './FeatureGate';
export { WhiteLabelLogo } from './WhiteLabelLogo';
export { DomainSelectionDialog } from './DomainSelectionDialog';
export { DomainSearchDropdown } from './DomainSearchDropdown';
export { TrackingCodeGenerator } from './TrackingCodeGenerator';
export { VisitorEnrichmentCard } from './VisitorEnrichmentCard';

// Re-export data hooks
export { useDashboardData } from '@/hooks/use-dashboard-data';
export { useLiveVisitors } from '@/hooks/use-live-visitors';
export { useSubscriptionStatus, useFeatureAccess } from '@/hooks/use-subscription-status';
export { useUserDomains, type UserDomain } from '@/hooks/use-user-domains';
export { useVisitorEnrichments, useSessionEnrichment, triggerEnrichment, type VisitorEnrichment } from '@/hooks/use-visitor-enrichments';
