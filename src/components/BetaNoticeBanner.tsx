import { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FlaskConical, X, MessageSquarePlus, Bug, Lightbulb, 
  AlertTriangle, Send, Loader2, Check, ChevronLeft
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("feedback");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageErrors, setPageErrors] = useState<PageError[]>([]);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

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

  return (
    <>
      {/* Right side vertical tab */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex items-center">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mr-1 bg-gradient-to-b from-violet-600/95 via-purple-600/95 to-cyan-600/95 backdrop-blur-sm border border-white/10 rounded-l-xl shadow-lg p-3"
            >
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openFeedbackDialog("feedback")}
                  className="text-white hover:bg-white/20 hover:text-white text-xs h-8 px-2 justify-start"
                >
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  Feedback
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openFeedbackDialog("feature_request")}
                  className="text-white hover:bg-white/20 hover:text-white text-xs h-8 px-2 justify-start"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Ideas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openFeedbackDialog("bug_report")}
                  className="text-white hover:bg-white/20 hover:text-white text-xs h-8 px-2 justify-start"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Bug
                </Button>
                {pageErrors.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openFeedbackDialog("error_report")}
                    className="text-orange-200 hover:bg-orange-500/20 hover:text-orange-100 text-xs h-8 px-2 justify-start animate-pulse"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {pageErrors.length} Error{pageErrors.length > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab handle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-col items-center gap-1 py-3 px-1.5 bg-gradient-to-b from-violet-500/90 to-cyan-500/90 text-white text-xs font-medium shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm rounded-l-lg border border-white/20 border-r-0"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <FlaskConical className="w-4 h-4 mb-1 rotate-90" />
          <span className="tracking-wider">BETA</span>
          <ChevronLeft className={`w-3 h-3 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
