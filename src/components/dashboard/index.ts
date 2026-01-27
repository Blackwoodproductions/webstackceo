// Dashboard components - modular, memoized, reusable
export { VIDashboardHeader } from './VIDashboardHeader';
export type { DashboardTab } from './VIDashboardHeader';
export { VIChatSidebar } from './VIChatSidebar';
export { VIDashboardTabs } from './VIDashboardTabs';
export { VIDashboardEffects } from '@/components/ui/vi-dashboard-effects';

// Re-export data hooks
export { useDashboardData } from '@/hooks/use-dashboard-data';
export { useLiveVisitors } from '@/hooks/use-live-visitors';
