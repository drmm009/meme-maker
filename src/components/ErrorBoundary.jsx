import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallbackTitle = 'Something went wrong', fallbackMessage = 'An unexpected error occurred. Try going back and selecting a different template.' } = this.props;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '32px 24px',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={28} style={{ color: '#ef4444' }} />
        </div>

        <div>
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-main)',
            }}
          >
            {fallbackTitle}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              maxWidth: '340px',
              lineHeight: 1.5,
            }}
          >
            {fallbackMessage}
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre
            style={{
              fontSize: '0.72rem',
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.07)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              maxWidth: '480px',
              overflow: 'auto',
              textAlign: 'left',
              maxHeight: '120px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error.toString()}
          </pre>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={this.handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} />
            Try Again
          </button>
          {this.props.onBack && (
            <button
              className="btn btn-secondary"
              onClick={this.props.onBack}
            >
              ← Go Back
            </button>
          )}
        </div>
      </div>
    );
  }
}
