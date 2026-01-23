import { motion } from "framer-motion";
import { Lock } from "lucide-react";

// Simple Stripe text badge component
const StripeLogo = ({ className = "h-6" }: { className?: string }) => (
  <span className={`font-bold tracking-tight ${className}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    stripe
  </span>
);

// Payment method card icons
const VisaIcon = () => (
  <svg className="h-6 w-auto" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#1A1F71" width="48" height="32" rx="4"/>
    <path fill="#FFFFFF" d="M19.5 21.5h-3l1.875-11.5h3l-1.875 11.5zm7.875-11.219c-.594-.234-1.524-.492-2.688-.492-2.953 0-5.039 1.57-5.055 3.82-.016 1.664 1.484 2.594 2.617 3.148 1.164.57 1.555.937 1.555 1.445-.016.781-.937 1.141-1.805 1.141-1.203 0-1.844-.18-2.836-.609l-.398-.188-.422 2.617c.703.328 2.008.609 3.359.625 3.141 0 5.18-1.555 5.211-3.953.016-1.32-.789-2.32-2.516-3.148-1.047-.531-1.688-.891-1.688-1.43 0-.484.547-.984 1.719-.984 1.023-.023 1.742.203 2.297.445l.281.125.422-2.562zm7.875-.281h-2.297c-.719 0-1.25.203-1.562.953l-4.422 10.547h3.125s.516-1.414.625-1.719h3.828c.094.398.375 1.719.375 1.719h2.766l-2.438-11.5zm-3.688 7.438c.25-.664 1.203-3.227 1.203-3.227-.016.031.25-.68.406-1.117l.203 1.008s.578 2.797.703 3.336h-2.516zM13.5 10l-2.938 7.859-.313-1.586c-.547-1.852-2.25-3.859-4.156-4.859l2.656 9.57h3.156l4.688-11.5h-3.094z"/>
    <path fill="#F9A533" d="M8.344 10H3.047L3 10.258c3.734.953 6.203 3.258 7.219 6.023L9.156 11c-.188-.734-.719-.968-1.312-.984z"/>
  </svg>
);

const MastercardIcon = () => (
  <svg className="h-6 w-auto" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#252525" width="48" height="32" rx="4"/>
    <circle fill="#EB001B" cx="18" cy="16" r="8"/>
    <circle fill="#F79E1B" cx="30" cy="16" r="8"/>
    <path fill="#FF5F00" d="M24 10.34a8 8 0 0 0-2.83 6.16A8 8 0 0 0 24 22.66a8 8 0 0 0 2.83-6.16A8 8 0 0 0 24 10.34z"/>
  </svg>
);

const AmexIcon = () => (
  <svg className="h-6 w-auto" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#006FCF" width="48" height="32" rx="4"/>
    <path fill="#FFFFFF" d="M7 21h2.5l.5-1.2h1l.5 1.2H14v-.9l.4.9h1.2l.4-.9v.9h5.8v-2h.2c.1 0 .2 0 .2.2v1.8h3v-.5c.5.3 1.1.5 2 .5h1.5l.5-1.2h1l.5 1.2h2.6v-1.1l.8 1.1h2.4v-6h-2.4v.9l-.6-.9h-2.4v.9l-.5-.9H25c-.8 0-1.5.2-2 .5v-.5h-2.3v.5c-.3-.4-.8-.5-1.3-.5H10l-.6 1.4-.6-1.4H6v.9l-.5-.9H3l-2 4.4v1.6h2.4l.5-1.2h1l.5 1.2H7zm26.8-1v-1.5l-1.9 2.5h-.4v-4h.9v2.5l1.8-2.5h.5v4h-.9zm-3.8 0h-2.2v-4h2.2v.8H29v.8h1.7v.8H29v.8h1v.8zm-3.2-3l-.8 1.8h1.6l-.8-1.8zm1.8 3H27l-.3-.8h-1.9l-.3.8h-1.1l1.7-4h1.2l1.8 4zm-6.1 0v-4h1.3c.8 0 1.4.4 1.4 1.2 0 .6-.4 1-.8 1.1l1 1.7h-1.1l-.9-1.6h-.3v1.6h-.6zm.9-2.2c.4 0 .6-.2.6-.5s-.2-.5-.6-.5h-.3v1h.3zm-3.5 2.2v-4h2.2v.8h-1.3v.8h1.3v.8h-1.3v.8h1.3v.8h-2.2zm-3.8 0l-1.1-2.5v2.5h-.9v-4h1.2l1.1 2.4 1-2.4h1.2v4H19v-2.5L18 21h-.9zm-4.3-3l-.8 1.8h1.6l-.8-1.8zm1.8 3h-1.6l-.3-.8h-1.9l-.3.8H8.2l1.7-4h1.2l1.8 4z"/>
  </svg>
);

const DiscoverIcon = () => (
  <svg className="h-6 w-auto" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#F8F8F8" width="48" height="32" rx="4"/>
    <path fill="#FF6000" d="M24 22c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6z"/>
    <path fill="#111" d="M3 13h2.5c1.5 0 2.5 1 2.5 2.5S7 18 5.5 18H3v-5zm1 4h1.3c1 0 1.7-.5 1.7-1.5S6.3 14 5.3 14H4v3zm5-4h1v5H9v-5zm3.5 2.6c-.6-.2-1-.4-1-.8 0-.3.3-.6.8-.6.4 0 .7.2 1 .4l.5-.8c-.4-.3-.9-.5-1.5-.5-1 0-1.8.7-1.8 1.6 0 .8.5 1.2 1.3 1.5.6.2 1 .4 1 .8 0 .4-.4.6-.9.6-.5 0-1-.3-1.3-.6l-.5.8c.5.4 1.1.7 1.8.7 1.1 0 1.9-.6 1.9-1.6 0-.8-.5-1.3-1.3-1.5zM17 15.5c0 .8-.5 1.5-1.5 1.5h-.5v1H14v-5h1.5c1 0 1.5.7 1.5 1.5v1zm-1-.5c0-.4-.2-.7-.6-.7h-.4v1.4h.4c.4 0 .6-.3.6-.7zM31.5 18H33l-1.5-2.3c.6-.2 1-.7 1-1.4 0-.9-.6-1.5-1.7-1.5H29v5.2h1v-2h.3l1.2 2zm-1.7-2.8h-.8v-1.4h.8c.5 0 .7.3.7.7s-.2.7-.7.7zm4.2.3v-2.6h-1v5.2h1v-2.6h2v2.6h1v-5.2h-1v2.6h-2zM44 13h-3v5h3v-.8h-2v-1.4h2v-.8h-2V14h2v-1z"/>
  </svg>
);

interface StripePaymentIconsProps {
  showSecureText?: boolean;
  showPoweredBy?: boolean;
  className?: string;
  compact?: boolean;
}

const StripePaymentIcons = ({ 
  showSecureText = true, 
  showPoweredBy = true,
  className = "",
  compact = false
}: StripePaymentIconsProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={`flex flex-col items-center gap-3 ${className}`}
    >
      {/* Payment method icons */}
      <div className="flex items-center gap-2">
        <VisaIcon />
        <MastercardIcon />
        <AmexIcon />
        <DiscoverIcon />
      </div>
      
      {/* Powered by Stripe */}
      {showPoweredBy && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs">Powered by</span>
          <StripeLogo className="h-5 text-foreground opacity-70" />
        </div>
      )}
      
      {/* Secure payment text */}
      {showSecureText && !compact && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>Secure, encrypted payments</span>
        </div>
      )}
    </motion.div>
  );
};

// Compact inline version for trust indicators
export const StripeSecureBadge = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
    <Lock className="w-3.5 h-3.5 text-primary" />
    <span className="text-xs font-medium text-foreground">Stripe Secure</span>
    <StripeLogo className="h-3.5 text-foreground opacity-70" />
  </div>
);

// Export components
export { StripeLogo, VisaIcon, MastercardIcon, AmexIcon, DiscoverIcon };
export default StripePaymentIcons;
