import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import ProfileSelection from "@/pages/profile-selection";
import DashboardPage from "@/pages/dashboard";
import DealPipelinePage from "@/pages/deal-pipeline";
import UnderwritingPage from "@/pages/underwriting";
import MonitoringPage from "@/pages/monitoring";
import PortfolioPage from "@/pages/portfolio";
import ReportsPage from "@/pages/reports";
import LegalPage from "@/pages/legal";
import LPEnablementPage from "@/pages/lp-enablement";
import SettingsPage from "@/pages/settings";
import OnboardingStart from "@/pages/onboarding-start";
import OnboardingUpload from "@/pages/onboarding-upload";
import OnboardingReview from "@/pages/onboarding-review";
import OnboardingComplete from "@/pages/onboarding-complete";
import AdvisorDashboard from "@/pages/advisor-dashboard";
import AdvisorSubmitDeal from "@/pages/advisor-submit-deal";
import NotFound from "@/pages/not-found";

function AppContent() {
  const [location] = useLocation();
  const isOnboardingPage = location.startsWith("/onboarding");
  const isAdvisorPage = location.startsWith("/advisor");
  const isProfileSelection = location === "/";

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Profile selection page (no sidebar, no header)
  if (isProfileSelection) {
    return (
      <>
        <Route path="/" component={ProfileSelection} />
        <Toaster />
      </>
    );
  }

  // Onboarding flow for GPs (no sidebar, no header)
  if (isOnboardingPage) {
    return (
      <>
        <Switch>
          <Route path="/onboarding" component={OnboardingStart} />
          <Route path="/onboarding/start" component={OnboardingStart} />
          <Route path="/onboarding/:id/upload" component={OnboardingUpload} />
          <Route path="/onboarding/:id/review" component={OnboardingReview} />
          <Route path="/onboarding/:id/complete" component={OnboardingComplete} />
        </Switch>
        <Toaster />
      </>
    );
  }

  // Advisor and Operations flows (with sidebar)
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/deal-pipeline" component={DealPipelinePage} />
              <Route path="/underwriting" component={UnderwritingPage} />
              <Route path="/monitoring" component={MonitoringPage} />
              <Route path="/portfolio" component={PortfolioPage} />
              <Route path="/reports" component={ReportsPage} />
              <Route path="/legal" component={LegalPage} />
              <Route path="/lp-enablement" component={LPEnablementPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/advisor" component={AdvisorDashboard} />
              <Route path="/advisor/submit-deal" component={AdvisorSubmitDeal} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
