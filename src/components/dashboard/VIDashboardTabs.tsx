import { memo } from 'react';
import { Eye, TrendingUp, FileText, MapPin, Activity, FileSearch, Target } from 'lucide-react';

export type DashboardTab = 
  | 'visitor-intelligence' 
  | 'bron' 
  | 'cade' 
  | 'gmb' 
  | 'social-signals' 
  | 'on-page-seo' 
  | 'landing-pages';

interface VIDashboardTabsProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

const tabs = [
  { id: 'visitor-intelligence' as DashboardTab, label: 'Visitor', icon: Eye, isPaid: false },
  { id: 'bron' as DashboardTab, label: 'Bron', icon: TrendingUp, isPaid: true },
  { id: 'cade' as DashboardTab, label: 'Cade', icon: FileText, isPaid: true },
  { id: 'gmb' as DashboardTab, label: 'Maps', icon: MapPin, isPaid: true },
  { id: 'social-signals' as DashboardTab, label: 'Social', icon: Activity, isPaid: true },
  { id: 'on-page-seo' as DashboardTab, label: 'SEO', icon: FileSearch, isPaid: true },
  { id: 'landing-pages' as DashboardTab, label: 'PPC', icon: Target, isPaid: true },
];

export const VIDashboardTabs = memo(function VIDashboardTabs({
  activeTab,
  setActiveTab,
}: VIDashboardTabsProps) {
  return (
    <div 
      className="absolute left-1/2 -bottom-px flex items-end gap-0 z-20" 
      style={{ transform: 'translateX(calc(-50% + 80px))' }}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{ zIndex: activeTab === tab.id ? 10 : 8 - index }}
          className={`relative flex flex-col items-center justify-center w-16 h-11 transition-all rounded-t-lg border-t border-x gap-0.5 ${
            activeTab === tab.id
              ? tab.isPaid 
                ? 'bg-gradient-to-b from-amber-500/10 to-background text-amber-500 border-amber-500/30'
                : 'bg-background text-primary border-border'
              : tab.isPaid
                ? 'bg-gradient-to-b from-amber-500/5 to-muted/30 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 border-transparent -ml-1 first:ml-0'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent -ml-1 first:ml-0'
          }`}
          title={tab.isPaid ? `${tab.label} (Premium Add-on)` : tab.label}
        >
          <tab.icon className={`w-4 h-4 ${tab.isPaid && activeTab === tab.id ? 'text-amber-500' : ''}`} />
          <span className="text-[9px] font-medium leading-none">{tab.label}</span>
          {/* Active tab bottom cover */}
          {activeTab === tab.id && (
            <span className={`absolute -bottom-px left-0 right-0 h-px ${tab.isPaid ? 'bg-gradient-to-r from-amber-500/20 via-background to-amber-500/20' : 'bg-background'}`} />
          )}
        </button>
      ))}
    </div>
  );
});

export default VIDashboardTabs;
