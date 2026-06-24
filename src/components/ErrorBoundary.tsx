import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ERROR_COPY } from '@/lib/errors';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
          <p className="text-4xl" aria-hidden="true">😬</p>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">{ERROR_COPY.system.boundaryTitle}</h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              {ERROR_COPY.system.boundaryBody}
            </p>
          </div>
          <Button onClick={() => window.location.href = '/'}>Back to home</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
