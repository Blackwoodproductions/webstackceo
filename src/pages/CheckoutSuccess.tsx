import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Order Confirmed | Webstack.ceo"
        description="Thank you for your purchase!"
        canonical="/checkout-success"
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your purchase. We've received your order and will begin processing it right away.
            You'll receive an email confirmation shortly.
          </p>

          {sessionId && (
            <p className="text-sm text-muted-foreground mb-8">
              Order Reference: <code className="bg-secondary px-2 py-1 rounded">{sessionId.slice(0, 20)}...</code>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gradient-to-r from-primary to-violet-500">
              <Link to="/visitor-intelligence-dashboard">
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="mt-12 p-6 bg-secondary/50 rounded-xl border border-border">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground text-left space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                You'll receive an email confirmation with your receipt
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Our team will set up your services within 24-48 hours
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Access your dashboard to track progress and view analytics
              </li>
            </ul>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
