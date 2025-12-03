import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.tsx';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state to satisfy TS
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: ''
  };

  // Explicitly declare props to satisfy TS in strict environments
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    let safeMessage = "An unexpected error occurred.";
    try {
        if (typeof error === 'string') safeMessage = error;
        else if (error instanceof Error) safeMessage = error.message;
        else safeMessage = String(error);
    } catch {
        safeMessage = "Critical System Error";
    }
    return { hasError: true, errorMessage: safeMessage };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global Error Caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center z-[9999] relative">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center border-2 border-red-500 mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Display Error</h1>
          <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm">
            We encountered a problem rendering the visuals. This may be due to browser security restrictions.
          </p>
          <div className="bg-gray-900 p-4 rounded-lg mb-6 max-w-sm w-full overflow-hidden">
             <p className="text-red-400 font-mono text-xs text-left truncate">{this.state.errorMessage}</p>
          </div>
          <Button onClick={this.handleReload} className="w-full max-w-xs flex items-center justify-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            Reload App
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default GlobalErrorBoundary;