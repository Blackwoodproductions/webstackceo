import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Search, Share2, Mail, Link2, Users, TrendingUp } from 'lucide-react';

interface VisitorSession {
  id: string;
  session_id: string;
  first_page: string | null;
  referrer: string | null;
  started_at: string;
  last_activity_at: string;
}

interface ReferrerBreakdownChartProps {
  sessions: VisitorSession[];
}

type ReferrerCategory = 'google' | 'bing' | 'social' | 'email' | 'referral' | 'direct';

const ReferrerBreakdownChart = ({ sessions }: ReferrerBreakdownChartProps) => {
  const referrerData = useMemo(() => {
    const categorize = (referrer: string | null): ReferrerCategory => {
      if (!referrer || referrer === '' || referrer === 'null') return 'direct';
      
      const ref = referrer.toLowerCase();
      
      // Search engines
      if (ref.includes('google.com') || ref.includes('google.')) return 'google';
      if (ref.includes('bing.com')) return 'bing';
      if (ref.includes('duckduckgo') || ref.includes('yahoo.com') || ref.includes('baidu.com')) return 'google'; // Group with search
      
      // Social media
      if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'social';
      if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) return 'social';
      if (ref.includes('linkedin.com')) return 'social';
      if (ref.includes('instagram.com')) return 'social';
      if (ref.includes('tiktok.com')) return 'social';
      if (ref.includes('youtube.com')) return 'social';
      if (ref.includes('reddit.com')) return 'social';
      if (ref.includes('pinterest.com')) return 'social';
      
      // Email
      if (ref.includes('mail.google.com') || ref.includes('outlook.')) return 'email';
      if (ref.includes('mail.') || ref.includes('webmail.')) return 'email';
      
      // Everything else is referral
      return 'referral';
    };

    const counts: Record<ReferrerCategory, number> = {
      google: 0,
      bing: 0,
      social: 0,
      email: 0,
      referral: 0,
      direct: 0,
    };

    sessions.forEach(session => {
      const category = categorize(session.referrer);
      counts[category]++;
    });

    const total = sessions.length || 1;

    return [
      { 
        key: 'google' as ReferrerCategory, 
        label: 'Google', 
        count: counts.google, 
        percentage: (counts.google / total) * 100,
        color: '#4285f4',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400',
        icon: Search,
      },
      { 
        key: 'direct' as ReferrerCategory, 
        label: 'Direct', 
        count: counts.direct, 
        percentage: (counts.direct / total) * 100,
        color: '#6b7280',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400',
        icon: Globe,
      },
      { 
        key: 'social' as ReferrerCategory, 
        label: 'Social', 
        count: counts.social, 
        percentage: (counts.social / total) * 100,
        color: '#e1306c',
        bgColor: 'bg-pink-500/20',
        textColor: 'text-pink-400',
        icon: Share2,
      },
      { 
        key: 'bing' as ReferrerCategory, 
        label: 'Bing', 
        count: counts.bing, 
        percentage: (counts.bing / total) * 100,
        color: '#00809d',
        bgColor: 'bg-teal-500/20',
        textColor: 'text-teal-400',
        icon: Search,
      },
      { 
        key: 'email' as ReferrerCategory, 
        label: 'Email', 
        count: counts.email, 
        percentage: (counts.email / total) * 100,
        color: '#ea4335',
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        icon: Mail,
      },
      { 
        key: 'referral' as ReferrerCategory, 
        label: 'Referral', 
        count: counts.referral, 
        percentage: (counts.referral / total) * 100,
        color: '#34a853',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        icon: Link2,
      },
    ].sort((a, b) => b.count - a.count);
  }, [sessions]);

  const total = sessions.length;
  const topSource = referrerData[0];

  // Calculate donut chart segments
  const donutSegments = useMemo(() => {
    let currentAngle = -90; // Start from top
    return referrerData.map(item => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...item,
        startAngle,
        endAngle: currentAngle,
      };
    });
  }, [referrerData]);

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Traffic Sources
        </h2>
        <Badge variant="outline" className="text-[10px]">
          {total.toLocaleString()}
        </Badge>
      </div>

      {/* Donut Chart - Top, larger */}
      <div className="relative flex items-center justify-center mb-4">
        <svg viewBox="0 0 100 100" className="w-32 h-32">
          {donutSegments.map((segment) => {
            if (segment.percentage < 0.5) return null;
            return (
              <path
                key={segment.key}
                d={describeArc(50, 50, 38, segment.startAngle, segment.endAngle - 0.5)}
                fill="none"
                stroke={segment.color}
                strokeWidth={10}
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
          <circle cx="50" cy="50" r="28" fill="hsl(var(--card))" />
        </svg>
        {/* Center text overlay */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-lg font-bold leading-tight">{topSource?.percentage.toFixed(0)}%</span>
          <span className="text-[9px] text-muted-foreground">{topSource?.label}</span>
        </div>
      </div>

      {/* Legend - Below chart, compact */}
      <div className="flex-1 flex flex-col justify-start space-y-1.5">
        {referrerData.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 py-0.5 px-1.5 rounded-md hover:bg-secondary/30 transition-colors">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <item.icon className={`w-3.5 h-3.5 ${item.textColor} flex-shrink-0`} />
            <span className="text-xs text-foreground font-medium flex-1">{item.label}</span>
            <span className="text-xs font-bold">{item.count}</span>
            <span className="text-[10px] text-muted-foreground w-7 text-right">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* Top source highlight - compact */}
      {topSource && topSource.count > 0 && (
        <div className={`mt-3 p-2.5 rounded-md ${topSource.bgColor} border border-border/30 flex items-center gap-2`}>
          <TrendingUp className={`w-4 h-4 ${topSource.textColor} flex-shrink-0`} />
          <span className="text-xs text-muted-foreground">Top Source:</span>
          <span className={`text-sm font-semibold ${topSource.textColor}`}>{topSource.label}</span>
          <span className="text-sm font-bold ml-auto">{topSource.count}</span>
          <span className="text-xs text-muted-foreground">({topSource.percentage.toFixed(0)}%)</span>
        </div>
      )}
    </Card>
  );
};

export default ReferrerBreakdownChart;
