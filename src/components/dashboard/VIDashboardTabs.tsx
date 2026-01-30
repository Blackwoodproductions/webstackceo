import { memo } from 'react';
import { Eye, TrendingUp, FileText, MapPin, Activity, FileSearch, Target, BrainCircuit } from 'lucide-react';

export type DashboardTab = 
  | 'visitor-intelligence' 
  | 'bron' 
  | 'aeo-geo'
  | 'cade' 
  | 'gmb' 
  | 'social-signals' 
  | 'on-page-seo' 
  | 'landing-pages';

interface VIDashboardTabsProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  variant?: 'default' | 'compact';
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
    id: 'aeo-geo' as DashboardTab, 
    label: 'AEO/GEO', 
    description: 'LLM Training',
    icon: BrainCircuit, 
    isPaid: true,
    isHighlighted: true
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
  variant = 'default',
}: VIDashboardTabsProps) {
  const isCompact = variant === 'compact';

  return (
    <div className="absolute inset-x-0 -bottom-px z-20 flex justify-center">
      <div
        className={
          isCompact
            ? 'flex items-end gap-0 px-2 overflow-x-auto'
            : 'flex items-end gap-1.5 px-2 overflow-x-auto'
        }
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isHighlighted = 'isHighlighted' in tab && tab.isHighlighted;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ zIndex: isActive ? 10 : 8 - index }}
            className={
              isCompact
                ? `relative flex flex-col items-center justify-center w-16 h-11 transition-all rounded-t-lg border-t border-x gap-0.5 ${
                    isActive
                      ? isHighlighted
                        ? 'bg-gradient-to-b from-violet-500/20 to-background text-violet-400 border-violet-500/50'
                        : tab.isPaid
                          ? 'bg-gradient-to-b from-amber-500/10 to-background text-amber-500 border-amber-500/30'
                          : 'bg-background text-primary border-border'
                      : isHighlighted
                        ? 'bg-gradient-to-b from-violet-500/10 to-muted/30 text-violet-400 hover:text-violet-300 hover:bg-violet-500/15 border-violet-500/30 -ml-1 first:ml-0'
                        : tab.isPaid
                          ? 'bg-gradient-to-b from-amber-500/5 to-muted/30 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 border-transparent -ml-1 first:ml-0'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent -ml-1 first:ml-0'
                  }`
                : `relative flex items-center gap-3 px-5 py-3.5 transition-all rounded-t-xl border-t border-x ${
                    isActive
                      ? isHighlighted
                        ? 'bg-gradient-to-b from-violet-500/20 to-background text-foreground border-violet-500/50 shadow-[0_-4px_12px_-4px_rgba(139,92,246,0.3)]'
                        : tab.isPaid 
                          ? 'bg-gradient-to-b from-amber-500/15 to-background text-foreground border-amber-500/40 shadow-[0_-4px_12px_-4px_rgba(245,158,11,0.2)]'
                          : 'bg-background text-foreground border-primary/30 shadow-[0_-4px_12px_-4px_rgba(6,182,212,0.15)]'
                      : isHighlighted
                        ? 'bg-gradient-to-b from-violet-500/10 to-muted/20 text-violet-400 hover:text-violet-300 hover:bg-violet-500/15 border-violet-500/30'
                        : tab.isPaid
                          ? 'bg-gradient-to-b from-amber-500/5 to-muted/20 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 border-transparent'
                          : 'bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent'
                  }`
            }
            title={isHighlighted ? `${tab.label} (LLM Training)` : tab.isPaid ? `${tab.label} (Premium Add-on)` : tab.label}
          >
            {isCompact ? (
              <>
                <tab.icon className={`w-4 h-4 ${isHighlighted ? 'text-violet-400' : tab.isPaid && isActive ? 'text-amber-500' : ''}`} />
                <span className="text-[9px] font-medium leading-none whitespace-nowrap">{tab.label}</span>
              </>
            ) : (
              <>
                {/* Icon container - larger */}
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  isActive
                    ? isHighlighted
                      ? 'bg-violet-500/30 text-violet-300'
                      : tab.isPaid
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-primary/20 text-primary'
                    : isHighlighted
                      ? 'bg-violet-500/20 text-violet-400'
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
              </>
            )}
            
            {/* Active tab bottom cover */}
            {isActive && (
              <span
                className={
                  isCompact
                    ? `absolute -bottom-px left-0 right-0 h-px ${
                        tab.isPaid
                          ? 'bg-gradient-to-r from-amber-500/20 via-background to-amber-500/20'
                          : 'bg-background'
                      }`
                    : `absolute -bottom-px left-1 right-1 h-px ${
                        tab.isPaid 
                          ? 'bg-gradient-to-r from-transparent via-background to-transparent' 
                          : 'bg-background'
                      }`
                }
              />
            )}
          </button>
        );
        })}
      </div>
    </div>
  );
});

export default VIDashboardTabs;
