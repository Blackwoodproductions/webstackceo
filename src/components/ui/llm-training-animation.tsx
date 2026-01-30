import { memo } from "react";
import {
  Brain, Target, Sparkles, MessageSquare, TrendingUp, CheckCircle2, Zap,
  Radio, BarChart3
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// ─── LLM Training Loading Animation ─────────────────────────────────────────
export const LLMTrainingAnimation = memo(({ 
  title = "Preparing LLM Training",
  subtitle = "Analyzing keywords for AI placement optimization" 
}: { 
  title?: string;
  subtitle?: string;
}) => (
  <div 
    className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 to-fuchsia-950/20 backdrop-blur-sm p-8"
    style={{ contain: 'layout style paint' }}
    data-no-theme-transition
  >
    {/* Header with pulsing brain */}
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/40 flex items-center justify-center">
          <Brain className="w-7 h-7 text-violet-400" />
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-xl border-2 border-violet-500/40 animate-ping" style={{ animationDuration: '2s' }} />
      </div>
      <div>
        <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
          {title}
          <Sparkles className="w-4 h-4 text-amber-400" />
        </h4>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    
    {/* Training pipeline steps */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <TrainingStep 
        icon={Target} 
        label="Targeting Keywords" 
        sublabel="From BRON tracker"
        color="cyan"
        delay={0}
      />
      <TrainingStep 
        icon={MessageSquare} 
        label="Query Generation" 
        sublabel="12 training prompts"
        color="violet"
        delay={0.3}
      />
      <TrainingStep 
        icon={Radio} 
        label="LLM Broadcasting" 
        sublabel="Multi-model training"
        color="fuchsia"
        delay={0.6}
      />
      <TrainingStep 
        icon={TrendingUp} 
        label="Position Tracking" 
        sublabel="#1 prominence goal"
        color="emerald"
        delay={0.9}
      />
    </div>
    
    {/* Training models preview */}
    <div className="bg-background/30 rounded-xl border border-border/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">Training Models</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400">Initializing</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ModelCard name="Gemini Pro" status="waiting" />
        <ModelCard name="Gemini Flash" status="waiting" />
        <ModelCard name="Google Gemini" status="waiting" />
      </div>
    </div>
    
    {/* CSS Animation */}
    <style>{`
      @keyframes training-scan {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(200%); opacity: 0; }
      }
    `}</style>
  </div>
));
LLMTrainingAnimation.displayName = 'LLMTrainingAnimation';

// ─── Training Step Card ─────────────────────────────────────────────────────
const colorMap = {
  cyan: { bg: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/30', icon: 'text-cyan-400' },
  violet: { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/30', icon: 'text-violet-400' },
  fuchsia: { bg: 'from-fuchsia-500/10 to-fuchsia-500/5', border: 'border-fuchsia-500/30', icon: 'text-fuchsia-400' },
  emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/30', icon: 'text-emerald-400' },
};

const TrainingStep = memo(({ 
  icon: Icon, 
  label, 
  sublabel, 
  color, 
  delay 
}: { 
  icon: React.ElementType;
  label: string;
  sublabel: string;
  color: keyof typeof colorMap;
  delay: number;
}) => {
  const colors = colorMap[color];
  
  return (
    <div 
      className={`relative rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-3 overflow-hidden`}
      style={{ contain: 'layout style paint' }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
        </div>
      </div>
      {/* Scanning line */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.icon.includes('cyan') ? 'rgba(6,182,212,0.15)' : colors.icon.includes('violet') ? 'rgba(139,92,246,0.15)' : colors.icon.includes('fuchsia') ? 'rgba(217,70,239,0.15)' : 'rgba(16,185,129,0.15)'}, transparent)`,
          animation: 'training-scan 2.5s ease-in-out infinite',
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
});
TrainingStep.displayName = 'TrainingStep';

// ─── Model Card ─────────────────────────────────────────────────────────────
const ModelCard = memo(({ name, status }: { name: string; status: 'waiting' | 'active' | 'done' }) => (
  <div className="flex items-center gap-2 px-2.5 py-2 bg-muted/30 rounded-lg border border-border/30">
    <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
    <span className="text-[10px] font-medium text-foreground truncate">{name}</span>
    {status === 'done' ? (
      <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />
    ) : status === 'active' ? (
      <Zap className="w-3 h-3 text-amber-400 ml-auto shrink-0 animate-pulse" />
    ) : (
      <div className="w-3 h-3 rounded-full border border-muted-foreground/30 ml-auto shrink-0" />
    )}
  </div>
));
ModelCard.displayName = 'ModelCard';

// ─── Compact Training Info for Cards ────────────────────────────────────────
export const KeywordTrainingInfo = memo(({ 
  hasResults,
  prominentCount,
  mentionedCount,
  roundCount,
  lastTrainedAt,
  isTraining,
  trainingProgress,
}: {
  hasResults: boolean;
  prominentCount: number;
  mentionedCount: number;
  roundCount: number;
  lastTrainedAt?: string;
  isTraining: boolean;
  trainingProgress: number;
}) => {
  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    const hoursAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60));
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo > 0) return `${daysAgo}d ago`;
    if (hoursAgo > 0) return `${hoursAgo}h ago`;
    return 'Just now';
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      {/* Training status row */}
      <div className="flex items-center gap-2">
        {isTraining ? (
          <>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded">
              <Brain className="w-3 h-3 text-violet-400 animate-pulse" />
              <span className="text-[9px] font-medium text-violet-400">Training...</span>
            </div>
            <Progress value={trainingProgress} className="w-12 h-1.5" />
          </>
        ) : hasResults ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/30 border border-border/30 rounded">
            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">
              {lastTrainedAt ? getTimeAgo(lastTrainedAt) : 'Checked'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
            <Target className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] text-amber-400">Not trained</span>
          </div>
        )}
      </div>
      
      {/* Placement stats row */}
      <div className="flex items-center gap-1.5">
        {prominentCount > 0 ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 rounded text-[9px] text-emerald-400">
            <span>🏆</span>
            <span>{prominentCount} prominent</span>
          </div>
        ) : mentionedCount > 0 ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 rounded text-[9px] text-amber-400">
            <span>📌</span>
            <span>{mentionedCount} mentioned</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/20 rounded text-[9px] text-muted-foreground">
            <span>—</span>
            <span>No placement</span>
          </div>
        )}
        
        {roundCount > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/10 rounded text-[9px] text-violet-400">
            <Zap className="w-2.5 h-2.5" />
            <span>{roundCount}r</span>
          </div>
        )}
      </div>
    </div>
  );
});
KeywordTrainingInfo.displayName = 'KeywordTrainingInfo';
