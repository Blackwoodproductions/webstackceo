import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StoredErrorDiagnostics = {
  name?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  occurredAt: string;
  buildMode: 'dev' | 'prod';
};

const LAST_ERROR_KEY = 'webstack_last_error_v1';

function safeStoreDiagnostics(diag: StoredErrorDiagnostics) {
  try {
    localStorage.setItem(LAST_ERROR_KEY, JSON.stringify(diag));
  } catch {
    // ignore storage failures
  }
}

function safeReadDiagnostics(): StoredErrorDiagnostics | null {
  try {
    const raw = localStorage.getItem(LAST_ERROR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredErrorDiagnostics;
  } catch {
    return null;
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

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

    // Persist diagnostics so users can screenshot/copy even if logs aren't available.
    const diagnostics: StoredErrorDiagnostics = {
      name: error?.name,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      occurredAt: new Date().toISOString(),
      buildMode: import.meta.env.DEV ? 'dev' : 'prod',
    };
    safeStoreDiagnostics(diagnostics);
    
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const stored = safeReadDiagnostics();
      const detailsText = JSON.stringify(
        {
          runtime: 'web',
          ...stored,
          // Ensure current render state's message is included even if storage is blocked.
          message: this.state.error?.message || stored?.message || 'Unknown error',
          componentStack: this.state.errorInfo?.componentStack || stored?.componentStack,
        },
        null,
        2
      );

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

            {/* Error Details (available in all builds; safe + copyable) */}
            <div className="p-4 rounded-lg bg-muted/50 text-left overflow-auto max-h-60">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-mono text-muted-foreground">
                  Diagnostics
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(detailsText)}
                >
                  Copy details
                </Button>
              </div>
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                {detailsText.slice(0, 4000)}
              </pre>
            </div>

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
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
