import { 
  Sparkles, Zap, FileText, TrendingUp, Clock, Target,
  ArrowRight, CheckCircle2, Brain, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CADEActivationPitchProps {
  domain?: string;
}

const features = [
  { icon: FileText, label: "AI Blog Posts", description: "Auto-generated SEO articles", color: "violet" },
  { icon: Target, label: "FAQ Generation", description: "Schema-ready Q&A content", color: "cyan" },
  { icon: TrendingUp, label: "Rank Tracking", description: "Monitor keyword positions", color: "emerald" },
  { icon: Clock, label: "Scheduled Publishing", description: "Set it and forget it", color: "amber" },
] as const;

const benefits = [
  "10x faster content creation",
  "SEO-optimized from day one",
  "Automatic internal linking",
  "WordPress, Shopify & Wix support",
];

export const CADEActivationPitch = ({ domain }: CADEActivationPitchProps) => {
  const handleContactSupport = () => {
    window.open("mailto:support@webstack.ceo?subject=Activate CADE for " + (domain || "my domain"), "_blank");
  };

  const handleLearnMore = () => {
    window.open("/features/automated-blog", "_blank");
  };

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900"
      style={{ contain: "layout paint" }}
    >
      {/* Static ambient background - no animations */}
      <div 
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 30% 20%, hsl(var(--primary) / 0.25), transparent 50%),
            radial-gradient(ellipse 60% 40% at 75% 80%, rgba(6,182,212,0.18), transparent 50%)
          `,
        }}
      />
      {/* Subtle grid */}
      <div 
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Content - compact single-viewport layout */}
      <div className="relative z-10 flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
        {/* Top row: Hero badge + Title + CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Title area */}
          <div className="flex items-center gap-5">
            {/* Brain icon */}
            <div className="relative flex-shrink-0">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-500/30">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-amber-400" />
            </div>
            <div>
              <Badge className="mb-2 border-violet-500/40 bg-violet-500/20 px-3 py-1 text-xs text-violet-300">
                <Sparkles className="mr-1.5 h-3 w-3" />
                AI Content Automation
              </Badge>
              <h1 className="text-2xl font-bold leading-tight text-white lg:text-3xl">
                Activate <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">CADE</span> for {domain || "your site"}
              </h1>
            </div>
          </div>

          {/* Right: CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={handleContactSupport}
              size="lg"
              className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 text-base font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600"
            >
              <Zap className="mr-2 h-4 w-4" />
              Activate CADE Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLearnMore}
              size="sm"
              className="text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              See How It Works
            </Button>
          </div>
        </div>

        {/* Middle row: Features (4 compact cards) + Benefits (inline list) */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {features.map((feature) => {
              const colorClasses = {
                violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
                cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
                emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
              }[feature.color];

              return (
                <div
                  key={feature.label}
                  className={`flex flex-col gap-2 rounded-xl border p-4 backdrop-blur-sm transition-colors hover:bg-white/5 ${colorClasses}`}
                >
                  <feature.icon className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.label}</p>
                    <p className="text-xs text-slate-400">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits sidebar */}
          <div className="flex flex-col gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-300">What You Get</p>
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row: Stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/10 pt-5 lg:justify-start">
          {[
            { value: "500+", label: "Websites Powered", color: "text-violet-400" },
            { value: "50K+", label: "Articles Generated", color: "text-cyan-400" },
            { value: "4.9★", label: "User Rating", color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CADEActivationPitch;
