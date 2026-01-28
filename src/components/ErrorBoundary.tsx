import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails: boolean;
}

type StoredErrorReport = {
  id: string;
  occurred_at: string;
  url: string;
  user_agent: string;
  message: string;
  stack?: string;
  component_stack?: string;
};

const LAST_ERROR_STORAGE_KEY = 'webstack_last_error_v1';

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorId: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `err_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

    console.error(`[ErrorBoundary] (${errorId}) Caught error:`, error, errorInfo);
    this.setState({ errorInfo, errorId });

    // Persist a copyable diagnostic payload (helps debug user-reported crash loops)
    try {
      const report: StoredErrorReport = {
        id: errorId,
        occurred_at: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        component_stack: errorInfo?.componentStack || undefined,
      };
      localStorage.setItem(LAST_ERROR_STORAGE_KEY, JSON.stringify(report));
    } catch {
      // ignore
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null, showDetails: false });
    this.props.onReset?.();
  };

  handleToggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  handleCopyDiagnostics = async () => {
    try {
      const raw = localStorage.getItem(LAST_ERROR_STORAGE_KEY);
      const fallback = JSON.stringify(
        {
          id: this.state.errorId,
          occurred_at: new Date().toISOString(),
          url: window.location.href,
          message: this.state.error?.message,
          stack: this.state.error?.stack,
          component_stack: this.state.errorInfo?.componentStack,
        },
        null,
        2
      );

      const payload = raw || fallback;
      await navigator.clipboard.writeText(payload);
      console.info('[ErrorBoundary] Copied diagnostics to clipboard');
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to copy diagnostics:', e);
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
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
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground">
                  Error ID: <span className="font-mono text-foreground/80">{this.state.errorId}</span>
                </p>
              )}
            </div>

            {/* Details (toggle; always available so we can diagnose in production) */}
            {this.state.error && (this.state.showDetails || import.meta.env.DEV) && (
              <div className="p-4 rounded-lg bg-muted/50 text-left overflow-auto max-h-60">
                <p className="text-xs font-mono text-destructive break-words">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs font-mono text-muted-foreground mt-2 whitespace-pre-wrap">
                    {this.state.error.stack.slice(0, 1200)}
                  </pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-xs font-mono text-muted-foreground mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 1200)}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={this.handleCopyDiagnostics}
              >
                Copy diagnostics
              </Button>
              <Button
                variant="outline"
                onClick={this.handleToggleDetails}
              >
                {this.state.showDetails ? 'Hide details' : 'Show details'}
              </Button>
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
