import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import { GlobalSearch } from "@/components/global-search";
import { HelpButton } from "@/components/help-button";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/pages/landing";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import RoleSelection from "@/pages/role-selection";
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
import AdvisorActiveRFPs from "@/pages/advisor-active-rfps";
import AdvisorMyClients from "@/pages/advisor-my-clients";
import GPDashboard from "@/pages/gp-dashboard";
import GPFacility from "@/pages/gp-facility";
import OperationsDashboard from "@/pages/operations-dashboard";
import NotificationPreferences from "@/pages/notification-preferences";
import ProspectsPage from "@/pages/operations/prospects";
import ProspectsUploadPage from "@/pages/operations/prospects-upload";
import ProspectDetailPage from "@/pages/operations/prospect-detail";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const isLandingPage = location === "/";
  const isOnboardingPage = location.startsWith("/onboarding");
  const isAdvisorPage = location.startsWith("/advisor");
  const isGPPage = location.startsWith("/gp");
  const isProfileSelection = location === "/app";
  const isRoleSelection = location === "/select-role";

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Redirect authenticated users without a role to role selection
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // If user doesn't have a role set, send to role selection
      if (!user.role || user.role === 'gp') {
        if (location !== "/select-role" && !isOnboardingPage) {
          setLocation("/select-role");
        }
      } else if (location === "/" || location === "/select-role") {
        // User has a role, redirect to appropriate dashboard
        const roleRoutes: Record<string, string> = {
          advisor: "/advisor",
          operations: "/dashboard",
          admin: "/dashboard",
        };
        const targetRoute = roleRoutes[user.role] || "/dashboard";
        setLocation(targetRoute);
      }
    }
  }, [isLoading, isAuthenticated, user, location, setLocation, isOnboardingPage]);

  // Landing page and legal pages (marketing site, no sidebar, no header)
  // Show landing if loading, not authenticated, or explicitly on landing/legal pages
  if (isLoading || !isAuthenticated || isLandingPage || location === "/privacy" || location === "/terms") {
    return (
      <>
        <Route path="/" component={LandingPage} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Toaster />
      </>
    );
  }

  // Role selection page (authenticated but no role set)
  if (isRoleSelection) {
    return (
      <>
        <Route path="/select-role" component={RoleSelection} />
        <Toaster />
      </>
    );
  }

  // Profile selection page (legacy, for backward compatibility)
  if (isProfileSelection) {
    return (
      <>
        <Route path="/app" component={ProfileSelection} />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("userRole");
                  setLocation("/app");
                }}
                data-testid="button-change-profile"
              >
                <Home className="h-4 w-4 mr-2" />
                Change Profile
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <HelpButton 
                defaultRole={
                  isAdvisorPage ? "advisor" : 
                  isGPPage ? "gp" : 
                  "operations"
                } 
              />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <GlobalSearch />
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/operations" component={OperationsDashboard} />
              <Route path="/deal-pipeline" component={DealPipelinePage} />
              <Route path="/underwriting" component={UnderwritingPage} />
              <Route path="/monitoring" component={MonitoringPage} />
              <Route path="/portfolio" component={PortfolioPage} />
              <Route path="/reports" component={ReportsPage} />
              <Route path="/legal" component={LegalPage} />
              <Route path="/lp-enablement" component={LPEnablementPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/notifications" component={NotificationPreferences} />
              <Route path="/operations/prospects" component={ProspectsPage} />
              <Route path="/operations/prospects/upload" component={ProspectsUploadPage} />
              <Route path="/operations/prospects/:id" component={ProspectDetailPage} />
              <Route path="/advisor" component={AdvisorDashboard} />
              <Route path="/advisor/submit-deal" component={AdvisorSubmitDeal} />
              <Route path="/advisor/active-rfps" component={AdvisorActiveRFPs} />
              <Route path="/advisor/clients" component={AdvisorMyClients} />
              <Route path="/gp" component={GPDashboard} />
              <Route path="/gp/facility" component={GPFacility} />
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
