import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51R4sfFDhwTkpKWXv5ck5aYHtAfJXyTxBMKEDqlm0OW4sVMlqMCEcJxYAfCx8IVwkWwXNxF2TwJswl0YhKfhDVd1i00HfPMPwLZ');

interface EmbeddedCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmbeddedCheckoutDialog({ open, onOpenChange }: EmbeddedCheckoutDialogProps) {
  const { items, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClientSecret = useCallback(async () => {
    if (items.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const lineItems = items.map(item => ({
        priceId: item.priceId,
        quantity: item.quantity,
      }));

      const { data, error: fnError } = await supabase.functions.invoke('create-cart-checkout', {
        body: { lineItems, embedded: true },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.clientSecret) throw new Error('No client secret returned');

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  }, [items]);

  // Fetch client secret when dialog opens
  useEffect(() => {
    if (open && items.length > 0 && !clientSecret) {
      fetchClientSecret();
    }
  }, [open, items.length, clientSecret, fetchClientSecret]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setError(null);
    }
  }, [open]);

  const handleComplete = useCallback(() => {
    clearCart();
    onOpenChange(false);
    // Redirect will happen automatically via return_url
  }, [clearCart, onOpenChange]);

  if (items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Your Cart is Empty
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-center py-8">
            Add some services to your cart to checkout.
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue Shopping
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-b from-card via-card to-background border-primary/20">
        {/* Decorative header gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-cyan-500" />
        
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/50">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent font-bold">
                Secure Checkout
              </span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Powered by Stripe
              </p>
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-violet-500 blur-xl opacity-50 animate-pulse" />
                <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">Preparing checkout...</p>
                <p className="text-xs text-muted-foreground mt-1">Setting up secure payment</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-destructive text-center font-medium">{error}</p>
              <Button onClick={fetchClientSecret} variant="outline" className="gap-2">
                <Loader2 className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {clientSecret && !loading && !error && (
            <div className="stripe-checkout-container mt-2 rounded-xl overflow-hidden border border-border/50 bg-background">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret, onComplete: handleComplete }}
              >
                <EmbeddedCheckout className="min-h-[400px]" />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
        
        {/* Security badge */}
        <div className="px-6 pb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>256-bit SSL Encrypted • PCI Compliant</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmbeddedCheckoutDialog;
