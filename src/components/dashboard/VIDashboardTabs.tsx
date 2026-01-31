// Dashboard navigation tabs with color-coded service categories
// High-end futuristic design with glassmorphism and elegant transitions
import { memo, useState } from 'react';
import { Eye, TrendingUp, FileText, MapPin, Activity, FileSearch, Target, BrainCircuit, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export type DashboardTab = 
  | 'visitor-intelligence' 
  | 'bron' 
  | 'aeo-geo'
  | 'cade' 
  | 'gmb' 
  | 'social-signals' 
  | 'on-page-seo' 
  | 'landing-pages'
  | 'web-builder';

interface VIDashboardTabsProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  variant?: 'default' | 'compact';
}

// Tab order: Visitor → Maps → PPC → Bron → AEO/GEO → Cade → Social → SEO → WEB
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
    isPaid: false,
    colorClass: 'sky' as const
  },
  { 
    id: 'landing-pages' as DashboardTab, 
    label: 'PPC', 
    description: 'Paid Ads',
    icon: Target, 
    isPaid: true,
    colorClass: 'rose' as const
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
    id: 'web-builder' as DashboardTab, 
    label: 'WEB', 
    description: 'AI Builder',
    icon: Globe, 
    isPaid: true,
    isHighlighted: true,
    colorClass: 'fuchsia' as const
  },
];

// Color configuration with HSL values for glow effects
const colorConfig = {
  cyan: {
    glow: '199 89% 48%',
    rgb: '6, 182, 212',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    textHover: 'group-hover:text-cyan-300',
    bg: 'bg-cyan-500/10',
    bgHover: 'group-hover:bg-cyan-500/20',
    iconBg: 'bg-cyan-500/20',
    gradient: 'from-cyan-500/30 via-cyan-400/10 to-transparent',
  },
  sky: {
    glow: '199 89% 60%',
    rgb: '56, 189, 248',
    border: 'border-sky-400/40',
    text: 'text-sky-400',
    textHover: 'group-hover:text-sky-300',
    bg: 'bg-sky-500/10',
    bgHover: 'group-hover:bg-sky-500/20',
    iconBg: 'bg-sky-500/20',
    gradient: 'from-sky-400/30 via-sky-400/10 to-transparent',
  },
  rose: {
    glow: '350 89% 60%',
    rgb: '244, 63, 94',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    textHover: 'group-hover:text-rose-300',
    bg: 'bg-rose-500/10',
    bgHover: 'group-hover:bg-rose-500/20',
    iconBg: 'bg-rose-500/20',
    gradient: 'from-rose-500/30 via-rose-400/10 to-transparent',
  },
  emerald: {
    glow: '160 84% 39%',
    rgb: '16, 185, 129',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    textHover: 'group-hover:text-emerald-300',
    bg: 'bg-emerald-500/10',
    bgHover: 'group-hover:bg-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
    gradient: 'from-emerald-500/30 via-emerald-400/10 to-transparent',
  },
  violet: {
    glow: '262 83% 58%',
    rgb: '139, 92, 246',
    border: 'border-violet-500/50',
    text: 'text-violet-400',
    textHover: 'group-hover:text-violet-300',
    bg: 'bg-violet-500/15',
    bgHover: 'group-hover:bg-violet-500/25',
    iconBg: 'bg-violet-500/25',
    gradient: 'from-violet-500/40 via-violet-400/15 to-transparent',
  },
  amber: {
    glow: '38 92% 50%',
    rgb: '245, 158, 11',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    textHover: 'group-hover:text-amber-300',
    bg: 'bg-amber-500/10',
    bgHover: 'group-hover:bg-amber-500/20',
    iconBg: 'bg-amber-500/20',
    gradient: 'from-amber-500/30 via-amber-400/10 to-transparent',
  },
  blue: {
    glow: '217 91% 60%',
    rgb: '59, 130, 246',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    textHover: 'group-hover:text-blue-300',
    bg: 'bg-blue-500/10',
    bgHover: 'group-hover:bg-blue-500/20',
    iconBg: 'bg-blue-500/20',
    gradient: 'from-blue-500/30 via-blue-400/10 to-transparent',
  },
  fuchsia: {
    glow: '292 84% 61%',
    rgb: '217, 70, 239',
    border: 'border-fuchsia-500/50',
    text: 'text-fuchsia-400',
    textHover: 'group-hover:text-fuchsia-300',
    bg: 'bg-fuchsia-500/15',
    bgHover: 'group-hover:bg-fuchsia-500/25',
    iconBg: 'bg-fuchsia-500/25',
    gradient: 'from-fuchsia-500/40 via-fuchsia-400/15 to-transparent',
  },
};

export const VIDashboardTabs = memo(function VIDashboardTabs({
  activeTab,
  setActiveTab,
  variant = 'default',
}: VIDashboardTabsProps) {
  const isCompact = variant === 'compact';
  const [hoveredTab, setHoveredTab] = useState<DashboardTab | null>(null);

  return (
    <div 
      className="relative flex items-center z-[150]"
      style={{ contain: 'layout style' }}
    >
      <div
        className={`relative flex items-center ${
          isCompact ? 'gap-1.5' : 'gap-2'
        } overflow-x-auto`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          contain: 'layout',
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          const isHighlighted = 'isHighlighted' in tab && tab.isHighlighted;
          const color = colorConfig[tab.colorClass];
          const Icon = tab.icon;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              initial={false}
              animate={{
                scale: isActive ? 1.02 : isHovered ? 1.05 : 1,
                y: isActive ? -1 : isHovered ? -3 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              style={{ 
                zIndex: isActive ? 20 : isHovered ? 15 : 10 - index,
                contain: 'layout style',
              }}
              className={`group relative flex flex-row items-center justify-center ${
                isCompact 
                  ? 'min-w-[85px] py-2 px-4 gap-2' 
                  : 'min-w-[110px] py-2.5 px-5 gap-2.5'
              } rounded-xl backdrop-blur-xl transition-all duration-300 ${
                isActive 
                  ? `${color.border} ${color.bg} shadow-xl border-2` 
                  : `border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20`
              }`}
              title={isHighlighted ? `${tab.label} (Premium AI)` : tab.isPaid ? `${tab.label} (Premium)` : tab.label}
            >
              {/* Static glow effect for active tabs - no animations to prevent glitching */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden"
                  style={{
                    boxShadow: `0 0 25px -5px rgba(${color.rgb}, 0.5), 0 0 50px -10px rgba(${color.rgb}, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${color.gradient}`} />
                </div>
              )}

              {/* Icon container with glow */}
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`relative z-10 flex items-center justify-center ${
                  isCompact ? 'w-6 h-6' : 'w-7 h-7'
                } rounded-lg transition-all duration-300 ${
                  isActive 
                    ? color.iconBg 
                    : 'bg-white/5 group-hover:bg-white/15'
                }`}
                style={{
                  boxShadow: isActive 
                    ? `0 0 25px rgba(${color.rgb}, 0.5), 0 0 10px rgba(${color.rgb}, 0.3)` 
                    : isHovered ? `0 0 15px rgba(${color.rgb}, 0.2)` : 'none',
                }}
              >
                <Icon className={`${isCompact ? 'w-4 h-4' : 'w-4.5 h-4.5'} transition-colors duration-300 ${
                  isActive ? color.text : `text-muted-foreground ${color.textHover}`
                }`} />
              </motion.div>
              
              {/* Label with elegant typography */}
              <motion.span 
                className={`relative z-10 ${
                  isCompact ? 'text-[11px]' : 'text-sm'
                } font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap ${
                  isActive ? color.text : `text-muted-foreground ${color.textHover}`
                }`}
              >
                {tab.label}
              </motion.span>

              {/* Active tab indicator */}
              {isActive && (
                <motion.span
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-xl border-2 border-current opacity-30"
                  style={{ borderColor: `rgba(${color.rgb}, 0.6)` }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Static highlight on hover - no infinite animations */}
              {isHovered && !isActive && (
                <div 
                  className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, transparent 30%, rgba(${color.rgb}, 0.12) 50%, transparent 70%)`,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

export default VIDashboardTabs;
