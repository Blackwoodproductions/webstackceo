import { memo, useState, useEffect } from 'react';
import { Copy, Check, Code, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TrackingCodeGeneratorProps {
  domain: string;
  domainId?: string;
}

export const TrackingCodeGenerator = memo(function TrackingCodeGenerator({
  domain,
  domainId,
}: TrackingCodeGeneratorProps) {
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch tracking token for the domain
  useEffect(() => {
    const fetchTrackingToken = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('user_domains')
          .select('tracking_token, domain')
          .eq('is_active', true);
        
        if (domainId) {
          query = query.eq('id', domainId);
        } else {
          query = query.eq('domain', domain);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (error) throw error;
        
        if (data?.tracking_token) {
          setTrackingToken(data.tracking_token);
        }
      } catch (error) {
        console.error('[TrackingCodeGenerator] Error fetching token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (domain) {
      fetchTrackingToken();
    }
  }, [domain, domainId]);

  const getTrackingCode = () => {
    if (!trackingToken) return '';
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
    
    return `<!-- Webstack.ceo Visitor Intelligence Tracking Code for ${domain} -->
<script>
(function(w,d,s,t){
  w.WS_TRACKING_TOKEN='${trackingToken}';
  w.WS_DOMAIN='${domain}';
  w.WS_ENDPOINT='${supabaseUrl}/functions/v1/visitor-session-track';
  
  var sessionId=sessionStorage.getItem('ws_session_id');
  if(!sessionId){
    sessionId=Date.now()+'-'+Math.random().toString(36).substr(2,9);
    sessionStorage.setItem('ws_session_id',sessionId);
  }
  
  function track(action,data){
    var payload=Object.assign({
      action:action,
      session_id:sessionId,
      tracking_token:w.WS_TRACKING_TOKEN,
      domain:w.WS_DOMAIN
    },data||{});
    
    navigator.sendBeacon?
      navigator.sendBeacon(w.WS_ENDPOINT,JSON.stringify(payload)):
      fetch(w.WS_ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload),
        keepalive:true
      });
  }
  
  // Initialize session
  track('init',{
    first_page:location.pathname,
    referrer:document.referrer,
    user_agent:navigator.userAgent
  });
  
  // Track page views
  var lastPath='';
  function trackPageView(){
    if(location.pathname!==lastPath){
      lastPath=location.pathname;
      track('page_view',{
        page_path:location.pathname,
        page_title:document.title
      });
    }
  }
  
  // Listen for SPA navigation
  var pushState=history.pushState;
  history.pushState=function(){
    pushState.apply(history,arguments);
    trackPageView();
  };
  window.addEventListener('popstate',trackPageView);
  
  // Keep session alive
  setInterval(function(){
    track('touch',{});
  },30000);
  
  // Initial page view
  setTimeout(trackPageView,100);
})(window,document);
</script>
<!-- End Webstack.ceo Tracking Code -->`;
  };

  const handleCopy = async () => {
    const code = getTrackingCode();
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Tracking code copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading tracking code...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trackingToken) {
    return (
      <Card className="glass-card border-amber-500/30">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No tracking token found for this domain.</p>
            <p className="text-xs mt-1">Please ensure the domain is properly configured.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Code className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Tracking Code</CardTitle>
              <CardDescription className="text-xs">
                Install on {domain}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {trackingToken.substring(0, 8)}...
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <pre className="bg-background/80 border border-border/50 rounded-lg p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto">
            <code className="text-muted-foreground whitespace-pre-wrap break-all">
              {getTrackingCode().substring(0, 500)}...
            </code>
          </pre>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleCopy} 
            className="flex-1"
            variant={copied ? "secondary" : "default"}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Full Code
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1.5">
          <p className="font-medium">Installation Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-[11px]">
            <li>Copy the tracking code above</li>
            <li>Paste it before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag on your website</li>
            <li>Deploy your changes and visitor data will appear in your dashboard</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
});

export default TrackingCodeGenerator;
