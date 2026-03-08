import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', background: '#222', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h2>Sorry, there was an error in the UI.</h2>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        <summary>Click for error details</summary>
                        <br />
                        <pre style={{ color: '#ff8888' }}>
                            {this.state.error?.toString()}
                            {'\n\n'}
                            {this.state.error?.stack}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
