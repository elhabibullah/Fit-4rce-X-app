
import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

/**
 * ABSOLUTE PASS-THROUGH
 * This component contains zero logic and zero UI.
 * It strictly renders children to prevent any custom error screens from appearing.
 */
const GlobalErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  return <>{children}</>;
};

export default GlobalErrorBoundary;
