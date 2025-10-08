import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import DashboardPage from "@/pages/dashboard";
import DealsPage from "@/pages/deals";
import UnderwritingPage from "@/pages/underwriting";
import MonitoringPage from "@/pages/monitoring";
import ReportsPage from "@/pages/reports";
import LegalPage from "@/pages/legal";
import OriginationPage from "@/pages/origination";
import LPEnablementPage from "@/pages/lp-enablement";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/deals" component={DealsPage} />
      <Route path="/underwriting" component={UnderwritingPage} />
      <Route path="/monitoring" component={MonitoringPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/legal" component={LegalPage} />
      <Route path="/origination" component={OriginationPage} />
      <Route path="/lp-enablement" component={LPEnablementPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-border">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
