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
    isPaid: false,
    colorClass: 'cyan' as const
  },
  { 
    id: 'gmb' as DashboardTab, 
    label: 'Maps', 
    description: 'Local SEO',
    icon: MapPin, 
    isPaid: false, // Included with $15/domain
    colorClass: 'sky' as const
  },
  { 
    id: 'bron' as DashboardTab, 
    label: 'Bron', 
    description: 'SEO Rankings',
    icon: TrendingUp, 
    isPaid: true,
    colorClass: 'emerald' as const
  },
  { 
    id: 'aeo-geo' as DashboardTab, 
    label: 'AEO/GEO', 
    description: 'LLM Training',
    icon: BrainCircuit, 
    isPaid: true,
    isHighlighted: true,
    colorClass: 'violet' as const
  },
  { 
    id: 'cade' as DashboardTab, 
    label: 'Cade', 
    description: 'AI Content',
    icon: FileText, 
    isPaid: true,
    colorClass: 'amber' as const
  },
  { 
    id: 'social-signals' as DashboardTab, 
    label: 'Social', 
    description: 'Social Media',
    icon: Activity, 
    isPaid: true,
    colorClass: 'blue' as const
  },
  { 
    id: 'on-page-seo' as DashboardTab, 
    label: 'SEO', 
    description: 'On-Page',
    icon: FileSearch, 
    isPaid: true,
    colorClass: 'emerald' as const
  },
  { 
    id: 'landing-pages' as DashboardTab, 
    label: 'PPC', 
    description: 'Paid Ads',
    icon: Target, 
    isPaid: true,
    colorClass: 'rose' as const
  },
];

export const VIDashboardTabs = memo(function VIDashboardTabs({
  activeTab,
  setActiveTab,
  variant = 'default',
}: VIDashboardTabsProps) {
  const isCompact = variant === 'compact';

  return (
    <div 
      className="absolute inset-x-0 -bottom-px z-[150] flex justify-center pointer-events-none"
      style={{ contain: 'layout style' }}
    >
      <div
        className={`${
          isCompact
            ? 'flex items-end gap-0 px-2 overflow-x-auto'
            : 'flex items-end gap-1.5 px-2 overflow-x-auto'
        } pointer-events-auto`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          contain: 'layout',
        }}
      >
        {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isHighlighted = 'isHighlighted' in tab && tab.isHighlighted;
        const color = tab.colorClass;
        
        // Color-specific classes for each tab theme
        const colorStyles = {
          cyan: {
            active: 'bg-gradient-to-b from-cyan-500/20 to-background text-cyan-400 border-cyan-500/50',
            inactive: 'bg-muted/20 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 border-transparent',
            iconActive: 'bg-cyan-500/20 text-cyan-400',
            iconInactive: 'bg-secondary/50',
          },
          amber: {
            active: 'bg-gradient-to-b from-amber-500/15 to-background text-amber-400 border-amber-500/40',
            inactive: 'bg-gradient-to-b from-amber-500/5 to-muted/20 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 border-transparent',
            iconActive: 'bg-amber-500/20 text-amber-400',
            iconInactive: 'bg-secondary/50',
          },
          violet: {
            active: 'bg-gradient-to-b from-violet-500/20 to-background text-violet-400 border-violet-500/50',
            inactive: 'bg-gradient-to-b from-violet-500/10 to-muted/30 text-violet-400 hover:text-violet-300 hover:bg-violet-500/15 border-violet-500/30',
            iconActive: 'bg-violet-500/30 text-violet-300',
            iconInactive: 'bg-violet-500/20 text-violet-400',
          },
          blue: {
            active: 'bg-gradient-to-b from-blue-500/20 to-background text-blue-400 border-blue-500/50',
            inactive: 'bg-gradient-to-b from-blue-500/5 to-muted/20 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 border-transparent',
            iconActive: 'bg-blue-500/20 text-blue-400',
            iconInactive: 'bg-secondary/50',
          },
          emerald: {
            active: 'bg-gradient-to-b from-emerald-500/20 to-background text-emerald-400 border-emerald-500/50',
            inactive: 'bg-gradient-to-b from-emerald-500/5 to-muted/20 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent',
            iconActive: 'bg-emerald-500/20 text-emerald-400',
            iconInactive: 'bg-secondary/50',
          },
          rose: {
            active: 'bg-gradient-to-b from-rose-500/20 to-background text-rose-400 border-rose-500/50',
            inactive: 'bg-gradient-to-b from-rose-500/5 to-muted/20 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border-transparent',
            iconActive: 'bg-rose-500/20 text-rose-400',
            iconInactive: 'bg-secondary/50',
          },
          sky: {
            active: 'bg-gradient-to-b from-sky-400/20 to-background text-sky-400 border-sky-400/50',
            inactive: 'bg-gradient-to-b from-sky-400/5 to-muted/20 text-muted-foreground hover:text-sky-400 hover:bg-sky-400/10 border-transparent',
            iconActive: 'bg-sky-400/20 text-sky-400',
            iconInactive: 'bg-secondary/50',
          },
        };
        
        const styles = colorStyles[color];
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ zIndex: isActive ? 10 : 8 - index, contain: 'layout style' }}
            className={
              isCompact
                ? `relative flex flex-col items-center justify-center w-16 h-11 transition-all rounded-t-lg border-t border-x gap-0.5 ${
                    isActive ? styles.active : `${styles.inactive} -ml-1 first:ml-0`
                  }`
                : `relative flex items-center gap-3 px-5 py-3.5 transition-all rounded-t-xl border-t border-x ${
                    isActive ? styles.active : styles.inactive
                  }`
            }
            title={isHighlighted ? `${tab.label} (LLM Training)` : tab.isPaid ? `${tab.label} (Premium Add-on)` : tab.label}
          >
            {isCompact ? (
              <>
                <tab.icon className={`w-4 h-4 ${isActive ? styles.iconActive.split(' ')[1] : ''}`} />
                <span className="text-[9px] font-medium leading-none whitespace-nowrap">{tab.label}</span>
              </>
            ) : (
              <>
                {/* Icon container - larger */}
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  isActive ? styles.iconActive : styles.iconInactive
                }`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                
                {/* Label - horizontal layout, larger text */}
                <span className={`text-sm font-semibold whitespace-nowrap ${
                  isActive ? styles.active.split(' ').find(c => c.startsWith('text-')) : ''
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
                    ? 'absolute -bottom-px left-0 right-0 h-px bg-background'
                    : 'absolute -bottom-px left-1 right-1 h-px bg-background'
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
