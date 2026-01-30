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
  { 
    id: 'visitor-intelligence' as DashboardTab, 
    label: 'Visitor', 
    description: 'Live Analytics',
    icon: Eye, 
    isPaid: false 
  },
  { 
    id: 'bron' as DashboardTab, 
    label: 'Bron', 
    description: 'SEO Rankings',
    icon: TrendingUp, 
    isPaid: true 
  },
  { 
    id: 'cade' as DashboardTab, 
    label: 'Cade', 
    description: 'AI Content',
    icon: FileText, 
    isPaid: true 
  },
  { 
    id: 'gmb' as DashboardTab, 
    label: 'Maps', 
    description: 'Local SEO',
    icon: MapPin, 
    isPaid: true 
  },
  { 
    id: 'social-signals' as DashboardTab, 
    label: 'Social', 
    description: 'Social Media',
    icon: Activity, 
    isPaid: true 
  },
  { 
    id: 'on-page-seo' as DashboardTab, 
    label: 'SEO', 
    description: 'On-Page',
    icon: FileSearch, 
    isPaid: true 
  },
  { 
    id: 'landing-pages' as DashboardTab, 
    label: 'PPC', 
    description: 'Paid Ads',
    icon: Target, 
    isPaid: true 
  },
];

export const VIDashboardTabs = memo(function VIDashboardTabs({
  activeTab,
  setActiveTab,
}: VIDashboardTabsProps) {
  return (
    <div 
      className="absolute left-1/2 -bottom-px flex items-end gap-1.5 z-20" 
      style={{ transform: 'translateX(calc(-50% + 60px))' }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ zIndex: isActive ? 10 : 8 - index }}
            className={`relative flex items-center gap-3 px-5 py-3.5 transition-all rounded-t-xl border-t border-x ${
              isActive
                ? tab.isPaid 
                  ? 'bg-gradient-to-b from-amber-500/15 to-background text-foreground border-amber-500/40 shadow-[0_-4px_12px_-4px_rgba(245,158,11,0.2)]'
                  : 'bg-background text-foreground border-primary/30 shadow-[0_-4px_12px_-4px_rgba(6,182,212,0.15)]'
                : tab.isPaid
                  ? 'bg-gradient-to-b from-amber-500/5 to-muted/20 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 border-transparent'
                  : 'bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent'
            }`}
            title={tab.isPaid ? `${tab.label} (Premium Add-on)` : tab.label}
          >
            {/* Icon container - larger */}
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              isActive
                ? tab.isPaid
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-primary/20 text-primary'
                : 'bg-secondary/50'
            }`}>
              <tab.icon className="w-5 h-5" />
            </div>
            
            {/* Label - horizontal layout, larger text */}
            <span className={`text-sm font-semibold whitespace-nowrap ${
              isActive && tab.isPaid ? 'text-amber-400' : isActive ? 'text-foreground' : ''
            }`}>
              {tab.label}
            </span>
            
            {/* Active tab bottom cover */}
            {isActive && (
              <span className={`absolute -bottom-px left-1 right-1 h-px ${
                tab.isPaid 
                  ? 'bg-gradient-to-r from-transparent via-background to-transparent' 
                  : 'bg-background'
              }`} />
            )}
          </button>
        );
      })}
    </div>
  );
});

export default VIDashboardTabs;
