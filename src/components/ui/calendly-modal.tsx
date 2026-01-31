import { memo, useState, useEffect } from "react";
import { X, Calendar, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Calendly URL for SEO Local book demo
const CALENDLY_URL = "https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo";

interface CalendlyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Inline Calendly embed modal - shows Calendly scheduler inside the app
 * instead of redirecting users to calendly.com
 */
export const CalendlyModal = memo(function CalendlyModal({
  open,
  onOpenChange,
}: CalendlyModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Reset loading state when modal opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-background border border-border overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        <VisuallyHidden>
          <DialogTitle>Book a Call</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Book a Call</h2>
              <p className="text-sm text-muted-foreground">Schedule a free consultation with our team</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full hover:bg-destructive/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendly Embed */}
        <div className="relative flex-1 h-full min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading scheduler...</p>
              </div>
            </div>
          )}
          <iframe
            src={`${CALENDLY_URL}?embed_type=Inline&hide_gdpr_banner=1&background_color=transparent&primary_color=06b6d4`}
            title="Schedule a call with SEO Local"
            width="100%"
            height="100%"
            frameBorder="0"
            onLoad={handleIframeLoad}
            style={{ 
              minHeight: "calc(90vh - 80px)",
              background: "transparent",
            }}
            allow="payment"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});

/**
 * Hook to manage Calendly modal state
 */
export function useCalendlyModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openCalendly = () => setIsOpen(true);
  const closeCalendly = () => setIsOpen(false);

  return {
    isOpen,
    setIsOpen,
    openCalendly,
    closeCalendly,
  };
}

/**
 * Button that opens the Calendly modal inline
 */
interface CalendlyButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hero" | "heroOutline" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const CalendlyButton = memo(function CalendlyButton({
  children,
  className,
  variant = "heroOutline",
  size = "lg",
}: CalendlyButtonProps) {
  const { isOpen, setIsOpen, openCalendly } = useCalendlyModal();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={openCalendly}
        className={className}
      >
        {children}
      </Button>
      <CalendlyModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
});

export default CalendlyModal;
