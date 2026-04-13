import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary capturou:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page center" style={{ padding: 40 }}>
          <h2>Algo deu errado</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            {this.state.error?.message ?? "Erro inesperado na aplicação."}
          </p>
          <button
            className="btn"
            style={{ marginTop: 16 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
