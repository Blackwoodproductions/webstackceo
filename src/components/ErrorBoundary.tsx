/**
 * Enhanced Error Boundary
 * 
 * Global error boundary with:
 * - Standardized error display
 * - Diagnostic logging
 * - Recovery actions
 * - Storage cleanup for crash loops
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  /** Isolate errors to this boundary (don't propagate) */
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails: boolean;
}

interface StoredErrorReport {
  id: string;
  occurred_at: string;
  url: string;
  user_agent: string;
  message: string;
  stack?: string;
  component_stack?: string;
}

// ============================================================================
// Constants
// ============================================================================

const LAST_ERROR_STORAGE_KEY = 'webstack_last_error_v1';
const ERROR_COUNT_KEY = 'webstack_error_count';
const MAX_ERRORS_BEFORE_CLEANUP = 3;

// Storage keys that can cause crash loops
const POTENTIALLY_CORRUPT_KEYS = [
  'unified_google_token',
  'unified_google_expiry',
  'unified_google_profile',
  'gsc_access_token',
  'gsc_token_expiry',
  'gsc_google_profile',
  'ga_access_token',
  'ga_token_expiry',
  'vi_selected_domain',
  'vi_user_added_domains',
  'bron_auth_token',
  'persistentCache_',
];

// ============================================================================
// Error Boundary Component
// ============================================================================

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `err_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

    // Log to console (sanitized - no PII)
    console.error(`[ErrorBoundary] (${errorId}) Caught error:`, {
      message: error.message,
      name: error.name,
      // Don't log full stack in production to avoid PII
      stackPreview: error.stack?.slice(0, 500),
    });

    this.setState({ errorInfo, errorId });

    // Track error count for crash loop detection
    try {
      const countRaw = sessionStorage.getItem(ERROR_COUNT_KEY);
      const count = countRaw ? parseInt(countRaw, 10) + 1 : 1;
      sessionStorage.setItem(ERROR_COUNT_KEY, count.toString());
      
      // If we've hit too many errors, suggest cleanup
      if (count >= MAX_ERRORS_BEFORE_CLEANUP) {
        console.warn('[ErrorBoundary] Multiple errors detected - storage cleanup recommended');
      }
    } catch {
      // Ignore storage errors
    }

    // Persist diagnostic payload
    try {
      const report: StoredErrorReport = {
        id: errorId,
        occurred_at: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        message: error?.message || 'Unknown error',
        stack: error?.stack?.slice(0, 2000),
        component_stack: errorInfo?.componentStack?.slice(0, 2000),
      };
      localStorage.setItem(LAST_ERROR_STORAGE_KEY, JSON.stringify(report));
    } catch {
      // Ignore storage errors
    }
  }

  handleRetry = () => {
    // Reset error count on manual retry
    try {
      sessionStorage.removeItem(ERROR_COUNT_KEY);
    } catch {
      // Ignore
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    });
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
          // Truncate for clipboard
          stack: this.state.error?.stack?.slice(0, 1000),
          component_stack: this.state.errorInfo?.componentStack?.slice(0, 1000),
        },
        null,
        2
      );

      await navigator.clipboard.writeText(raw || fallback);
      console.info('[ErrorBoundary] Copied diagnostics to clipboard');
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to copy diagnostics:', e);
    }
  };

  handleClearStorage = () => {
    try {
      // Clear potentially corrupt keys
      POTENTIALLY_CORRUPT_KEYS.forEach(key => {
        // Handle prefix keys
        if (key.endsWith('_')) {
          Object.keys(localStorage).forEach(storageKey => {
            if (storageKey.startsWith(key)) {
              localStorage.removeItem(storageKey);
            }
          });
        } else {
          localStorage.removeItem(key);
        }
      });
      
      // Clear error tracking
      sessionStorage.removeItem(ERROR_COUNT_KEY);
      localStorage.removeItem(LAST_ERROR_STORAGE_KEY);
      
      console.info('[ErrorBoundary] Cleared potentially corrupt storage keys');
      
      // Reload page after cleanup
      window.location.reload();
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to clear storage:', e);
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

      // Check if we're in a crash loop
      let errorCount = 0;
      try {
        errorCount = parseInt(sessionStorage.getItem(ERROR_COUNT_KEY) || '0', 10);
      } catch {
        // Ignore
      }
      const isCrashLoop = errorCount >= MAX_ERRORS_BEFORE_CLEANUP;

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

            {/* Crash Loop Warning */}
            {isCrashLoop && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Multiple errors detected. Try clearing site data to break the crash loop.
                </p>
              </div>
            )}

            {/* Details (toggle) */}
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
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={this.handleCopyDiagnostics}
              >
                Copy diagnostics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleToggleDetails}
              >
                {this.state.showDetails ? 'Hide details' : 'Show details'}
              </Button>
              {isCrashLoop && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleClearStorage}
                  className="gap-2 text-warning border-warning/50 hover:bg-warning/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset site data
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
              <Button
                size="sm"
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
