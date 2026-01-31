import { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  FlaskConical, MessageSquarePlus, Bug, Lightbulb, 
  AlertTriangle, Send, Loader2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PageError {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: string;
}

const BetaNoticeBanner = memo(() => {
  const [isHovered, setIsHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("feedback");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageErrors, setPageErrors] = useState<PageError[]>([]);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Scroll positioning (staggered at 60% - lower than FREE tab at 40%)
  const [topPosition, setTopPosition] = useState('60%');
  const [tabOpacity, setTabOpacity] = useState(1);
  const throttleRef = useRef(false);

  // Handle scroll to stop above footer and fade out
  useEffect(() => {
    const handleScroll = () => {
      if (throttleRef.current) return;
      throttleRef.current = true;
      
      requestAnimationFrame(() => {
        const footer = document.querySelector('footer');
        if (!footer) {
          throttleRef.current = false;
          return;
        }

        const footerRect = footer.getBoundingClientRect();
        const elementHeight = 56;
        const buffer = 40;
        const defaultTop = window.innerHeight * 0.60;
        const fadeStartDistance = 150;
        
        const maxTop = footerRect.top - elementHeight - buffer;
        const distanceToFooter = footerRect.top - defaultTop - elementHeight;
        
        if (distanceToFooter < fadeStartDistance) {
          const fadeProgress = Math.max(0, distanceToFooter / fadeStartDistance);
          setTabOpacity(fadeProgress);
        } else {
          setTabOpacity(1);
        }
        
        if (defaultTop > maxTop) {
          setTopPosition(`${maxTop}px`);
        } else {
          setTopPosition('60%');
        }
        throttleRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Capture page errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setPageErrors(prev => [...prev.slice(-9), {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: new Date().toISOString(),
      }]);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      setPageErrors(prev => [...prev.slice(-9), {
        message: String(event.reason),
        timestamp: new Date().toISOString(),
      }]);
    };

    // Intercept console.error
    const originalError = console.error;
    console.error = (...args) => {
      setConsoleErrors(prev => [...prev.slice(-19), args.map(a => 
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' ')]);
      originalError.apply(console, args);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      console.error = originalError;
    };
  }, []);

  const openFeedbackDialog = useCallback((type: string) => {
    setFeedbackType(type);
    setDialogOpen(true);
    setSubmitted(false);
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const browserInfo = `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`;
      
      const { error } = await supabase.from('beta_feedback').insert([{
        feedback_type: feedbackType,
        message: message,
        page_url: window.location.href,
        browser_info: browserInfo,
        user_id: user?.id ?? undefined,
        user_email: (email || user?.email) ?? undefined,
        title: title || undefined,
        page_errors: pageErrors.length > 0 ? JSON.parse(JSON.stringify(pageErrors)) : undefined,
        console_errors: consoleErrors.length > 0 ? consoleErrors as unknown as any : undefined,
      }]);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Thank you for your feedback!");
      
      // Reset form after delay
      setTimeout(() => {
        setTitle("");
        setMessage("");
        setEmail("");
        setDialogOpen(false);
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackOptions = [
    { value: "feedback", label: "General Feedback", icon: MessageSquarePlus, color: "text-blue-400" },
    { value: "feature_request", label: "Feature Request", icon: Lightbulb, color: "text-amber-400" },
    { value: "bug_report", label: "Bug Report", icon: Bug, color: "text-red-400" },
    { value: "error_report", label: "Report Page Error", icon: AlertTriangle, color: "text-orange-400" },
  ];

  const currentOption = feedbackOptions.find(o => o.value === feedbackType) || feedbackOptions[0];

  // Hide when opacity is 0
  if (tabOpacity === 0) return null;

  return (
    <>
      {/* Right side vertical tab - Futuristic Design */}
      <div 
        className="fixed right-0 z-[100] flex items-center transition-all duration-500"
        style={{ top: topPosition, opacity: tabOpacity }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Futuristic Tab Handle - Horizontal layout with text on top - STATIC */}
        <button
          onClick={() => {
            setDialogOpen(true);
            setSubmitted(false);
          }}
          className="relative group"
        >
          {/* Outer glow ring - Violet themed - static */}
          <div
            className={`absolute -inset-1.5 rounded-l-2xl blur-lg transition-all duration-300 ${
              isHovered 
                ? 'opacity-100 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500' 
                : 'opacity-50 bg-violet-500/60'
            }`}
          />
          
          {/* Main button container - Horizontal layout */}
          <div
            className={`relative flex flex-col items-center gap-1.5 py-4 px-3 rounded-l-2xl border border-r-0 backdrop-blur-xl transition-all duration-300 overflow-hidden ${
              isHovered
                ? 'bg-gradient-to-br from-violet-600/95 via-purple-600/90 to-cyan-600/95 border-violet-400/50 shadow-[0_0_30px_rgba(139,92,246,0.4)] -translate-x-1.5 scale-105'
                : 'bg-gradient-to-br from-violet-700/80 via-purple-700/70 to-cyan-700/80 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
            }`}
            style={{ contain: 'layout style paint' }}
          >
            {/* BETA text - Horizontal on top, bigger */}
            <span className={`relative text-sm font-black uppercase tracking-widest transition-all duration-300 ${
              isHovered 
                ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                : 'bg-gradient-to-r from-violet-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent'
            }`}>
              BETA
            </span>
            
            {/* Icons row below text - no infinite animations */}
            <div className="flex items-center gap-1.5">
              {/* Flask icon */}
              <FlaskConical className={`w-5 h-5 transition-all duration-300 ${
                isHovered ? 'text-white' : 'text-violet-200'
              }`} />
              
              {/* Feedback icon */}
              <MessageSquarePlus className={`w-4 h-4 transition-all duration-300 ${
                isHovered ? 'text-cyan-300' : 'text-cyan-400'
              }`} />
            </div>
          </div>
        </button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <currentOption.icon className={`w-5 h-5 ${currentOption.color}`} />
              {submitted ? "Thank You!" : currentOption.label}
            </DialogTitle>
            <DialogDescription>
              {submitted 
                ? "Your feedback has been submitted. We appreciate your help!"
                : "Help us improve by sharing your thoughts, ideas, or reporting issues."
              }
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-muted-foreground text-center">
                We'll review your feedback and use it to make the platform better.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={feedbackType} onValueChange={setFeedbackType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feedbackOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <option.icon className={`w-4 h-4 ${option.color}`} />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input
                  placeholder="Brief summary..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  placeholder={
                    feedbackType === "feature_request" 
                      ? "Describe the feature you'd like to see..."
                      : feedbackType === "bug_report"
                      ? "What happened? What did you expect to happen?"
                      : "Share your thoughts..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We'll only use this to follow up on your feedback.
                </p>
              </div>

              {feedbackType === "error_report" && pageErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm font-medium text-orange-400 mb-2">
                    Detected {pageErrors.length} page error(s)
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                    {pageErrors.slice(-3).map((err, i) => (
                      <li key={i} className="truncate">{err.message}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    These will be included in your report automatically.
                  </p>
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !message.trim()}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

BetaNoticeBanner.displayName = "BetaNoticeBanner";

export default BetaNoticeBanner;
