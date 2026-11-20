import React, { Component, type ReactNode, type ErrorInfo } from 'react';

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallbackMessage?: string;
  readonly onReset?: () => void;
}

export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export interface ErrorFallbackProps {
  readonly error: Error | null;
  readonly fallbackMessage?: string;
  readonly onRetry: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  fallbackMessage = 'Something went wrong rendering this section.',
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-apple dark:border-rose-900/50 dark:bg-rose-950/30 dark:shadow-none transition-colors"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
        aria-hidden="true"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="mt-4 text-base font-bold text-rose-950 dark:text-rose-200">
        {fallbackMessage}
      </h3>

      {error?.message && (
        <p className="mt-1 text-xs text-rose-800 dark:text-rose-300 max-w-md">
          {error.message}
        </p>
      )}

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-elevated px-4 py-2 text-xs font-semibold text-rose-900 shadow-sm ring-1 ring-rose-300 hover:bg-nested active:scale-95 dark:text-rose-200 dark:ring-rose-800 transition focus-visible:outline-accent-blue"
      >
        <svg
          className="mr-1.5 h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </svg>
        Try Again
      </button>
    </div>
  );
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          fallbackMessage={this.props.fallbackMessage}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
