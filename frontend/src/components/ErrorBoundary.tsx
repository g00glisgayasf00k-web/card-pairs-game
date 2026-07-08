import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Catches render/runtime crashes so the app shows a readable error and recovery
 * options instead of an empty #root (which reveals the bare ♠ background).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ error, info });
    // Surface in the console / remote logs for debugging on device.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    try {
      localStorage.clear();
    } catch {
      /* storage may be unavailable */
    }
    window.location.reload();
  };

  render(): ReactNode {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash-screen" role="alert">
        <div className="crash-card">
          <div className="crash-icon" aria-hidden>
            ♠
          </div>
          <h1>Something broke</h1>
          <p className="crash-lead">
            The game hit an unexpected error. Try reloading — your progress is saved.
          </p>
          <div className="crash-actions">
            <button type="button" className="btn" onClick={this.handleReload}>
              Reload
            </button>
            <button type="button" className="btn ghost" onClick={this.handleReset}>
              Reset game data
            </button>
          </div>
          <details className="crash-details">
            <summary>Error details</summary>
            <pre>
              {error.message}
              {"\n\n"}
              {error.stack}
              {info?.componentStack ? `\n\nComponent stack:${info.componentStack}` : ""}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
