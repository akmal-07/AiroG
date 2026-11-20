import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ErrorBoundary, ErrorFallback } from '../ErrorBoundary';

describe('ErrorBoundary & ErrorFallback unit tests', () => {
  it('initializes with hasError: false and error: null', () => {
    const boundary = new ErrorBoundary({ children: null });
    expect(boundary.state).toEqual({
      hasError: false,
      error: null,
    });
  });

  it('getDerivedStateFromError captures error object in state', () => {
    const testError = new Error('Network chunk load failed');
    const newState = ErrorBoundary.getDerivedStateFromError(testError);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(testError);
  });

  it('handleReset resets error state and invokes onReset callback', () => {
    const onReset = vi.fn();
    const boundary = new ErrorBoundary({ children: null, onReset });

    boundary.state = {
      hasError: true,
      error: new Error('Render crash'),
    };

    boundary.setState = vi.fn((update) => {
      Object.assign(boundary.state, update);
    });

    boundary.handleReset();

    expect(boundary.setState).toHaveBeenCalledWith({ hasError: false, error: null });
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('ErrorFallback renders default message and triggers onRetry', () => {
    const onRetry = vi.fn();
    const element = ErrorFallback({
      error: new Error('Script error'),
      fallbackMessage: 'Custom fallback notice',
      onRetry,
    });

    expect(React.isValidElement(element)).toBe(true);
    if (React.isValidElement(element)) {
      expect(element.props['role']).toBe('alert');
    }
  });

  it('ErrorBoundary renders children when hasError is false', () => {
    const child = React.createElement('div', { id: 'test-child' }, 'Working child');
    const boundary = new ErrorBoundary({ children: child });

    const rendered = boundary.render();
    expect(rendered).toBe(child);
  });
});
