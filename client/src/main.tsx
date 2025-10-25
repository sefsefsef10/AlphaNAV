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

createRoot(document.getElementById("root")!).render(<App />);
