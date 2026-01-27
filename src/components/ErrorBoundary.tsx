import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LAST_ERROR_KEY = 'webstack_last_error_v1';

type PersistedError = {
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  at: string;
  path?: string;
};

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const persistLastError = (payload: PersistedError) => {
  try {
    localStorage.setItem(LAST_ERROR_KEY, safeStringify(payload));
  } catch {
    // ignore
  }
};

const readLastError = (): PersistedError | null => {
  try {
    const raw = localStorage.getItem(LAST_ERROR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedError;
  } catch {
    return null;
  }
};

const clearAppStorage = () => {
  // Be conservative: clear only known app keys that can become corrupted,
  // plus auth/token caches (they are re-created on next login).
  const localKeys = [
    LAST_ERROR_KEY,
    'vi_user_added_domains',
    'unified_google_profile',
    'gsc_google_profile',
    'unified_google_token',
    'unified_google_expiry',
    'unified_google_scopes',
    'ga_access_token',
    'ga_token_expiry',
    'gsc_access_token',
    'gsc_token_expiry',
    'google_ads_access_token',
    'google_ads_token_expiry',
    'gmb_access_token',
    'gmb_token_expiry',
    'bron_dashboard_auth',
  ];

  const sessionKeys = [
    'webstack_session_id',
    'chat_session_id',
    'visitor_referrer',
  ];

  try {
    localKeys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }

  try {
    sessionKeys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });

     // Persist a short error payload so production users can report it.
     persistLastError({
       message: error?.message || 'Unknown error',
       name: error?.name,
       stack: error?.stack,
       componentStack: errorInfo?.componentStack,
       at: new Date().toISOString(),
       path: typeof window !== 'undefined' ? window.location.pathname : undefined,
     });
    
    // You could send this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleResetSiteData = () => {
    clearAppStorage();
    // Hard reload to reset module state
    window.location.reload();
  };

  handleCopyErrorDetails = async () => {
    const payload = readLastError();
    const text = payload ? safeStringify(payload) : 'No persisted error found.';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore (clipboard may be blocked)
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                We encountered an unexpected error. This has been logged and we'll look into it.
              </p>
            </div>

            {/* Error Details (prod-safe summary) */}
            {readLastError()?.message && (
              <div className="p-4 rounded-lg bg-muted/40 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-muted-foreground break-words">
                  <span className="font-semibold">Error:</span> {readLastError()!.message}
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">
                  If this keeps happening, click “Reset site data”.
                </p>
              </div>
            )}

            {/* Error Details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="p-4 rounded-lg bg-muted/50 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-destructive break-words">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-xs font-mono text-muted-foreground mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
              <Button
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={this.handleResetSiteData}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset site data
              </Button>
              <Button
                variant="ghost"
                onClick={this.handleCopyErrorDetails}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy error
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
