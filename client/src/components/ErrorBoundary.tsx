import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="status-page">
          <section className="status-card wide" aria-labelledby="error-title">
            <span className="status-mark danger" aria-hidden="true">
              <AlertTriangle size={20} />
            </span>
            <div className="eyebrow">Something went wrong</div>
            <h1 id="error-title">An unexpected error occurred.</h1>
            <p>
              Reloading usually restores the demo. Session data in this tab is
              kept when possible.
            </p>
            <pre>{this.state.error?.stack}</pre>
            <button
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              <RotateCcw size={16} />
              Reload page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
