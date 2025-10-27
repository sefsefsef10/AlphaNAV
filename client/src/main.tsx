import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

// Initialize Sentry for frontend error tracking (production only)
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Mask all text to protect sensitive financial data
        blockAllMedia: true, // Block all media to prevent data exposure
        maskAllInputs: true, // Mask all input fields
      }),
    ],
    tracesSampleRate: 0.1, // Sample 10% of transactions for performance monitoring
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Always capture replays for errors
  });
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary 
    fallback={({ error, resetError }) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          fontFamily: 'Inter, system-ui, sans-serif',
          maxWidth: '600px',
          margin: '100px auto'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            We've been notified and are working on a fix. Please try refreshing the page.
          </p>
          <button 
            onClick={resetError}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try again
          </button>
          {import.meta.env.DEV && (
            <pre style={{ 
              marginTop: '24px', 
              padding: '16px', 
              background: '#f3f4f6', 
              borderRadius: '6px',
              textAlign: 'left',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {errorMessage}
            </pre>
          )}
        </div>
      );
    }}
    showDialog
  >
    <App />
  </Sentry.ErrorBoundary>
);
