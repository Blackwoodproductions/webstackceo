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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Secure Checkout
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Preparing checkout...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-destructive text-center">{error}</p>
              <Button onClick={fetchClientSecret} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {clientSecret && !loading && !error && (
            <div className="stripe-checkout-container">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret, onComplete: handleComplete }}
              >
                <EmbeddedCheckout className="min-h-[400px]" />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmbeddedCheckoutDialog;
