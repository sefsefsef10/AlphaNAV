import { DollarSign, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/kpi-card";
import { PortfolioChart } from "@/components/portfolio-chart";
import { DealTable, Deal } from "@/components/deal-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  // Fetch portfolio summary data
  const { data: portfolioSummary } = useQuery<any>({
    queryKey: ["/api/analytics/portfolio-summary"],
  });

  // Fetch facilities for recent deals
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  // Fetch prospects for pipeline data
  const { data: prospects = [] } = useQuery<any[]>({
    queryKey: ["/api/prospects"],
  });

  // Calculate KPIs from portfolio summary
  const totalPortfolio = portfolioSummary?.totalPrincipalAmount || 0;
  const activeDeals = portfolioSummary?.activeFacilities || 0;
  const avgDealSize = activeDeals > 0 ? totalPortfolio / activeDeals : 0;
  const riskAlerts = (portfolioSummary?.covenantHealth?.warning || 0) + (portfolioSummary?.covenantHealth?.breach || 0);

  // Create mock portfolio chart data (TODO: Replace with time-series data from backend)
  const mockPortfolioData = [
    { month: "Jan", portfolio: 250, deployed: 180 },
    { month: "Feb", portfolio: 280, deployed: 210 },
    { month: "Mar", portfolio: 320, deployed: 250 },
    { month: "Apr", portfolio: 380, deployed: 300 },
    { month: "May", portfolio: 420, deployed: 340 },
    { month: "Jun", portfolio: totalPortfolio / 1000000, deployed: (portfolioSummary?.totalOutstandingBalance || 0) / 1000000 },
  ];

  // Convert facilities to recent deals format
  const recentDeals: Deal[] = facilities.slice(0, 3).map((facility: any, index: number) => ({
    id: facility.id,
    fundName: facility.fundName,
    status: facility.status,
    amount: facility.principalAmount,
    stage: facility.status === "active" ? "Post-Close Monitoring" : facility.status === "pending" ? "Due Diligence" : "Documentation",
    lastUpdate: `${index * 2 + 2} hours ago`,
    riskScore: Math.floor(Math.random() * 5) + 1,
  }));

  // Calculate pipeline health from prospects
  const leadCount = prospects.filter((p: any) => p.status === "new" || p.status === "reviewing").length;
  const underwritingCount = prospects.filter((p: any) => p.status === "underwriting").length;
  const approvedCount = prospects.filter((p: any) => p.status === "approved").length;
  const monitoringCount = facilities.filter((f: any) => f.status === "active").length;
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Overview of portfolio performance and deal pipeline
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Portfolio"
          value={`$${Math.round(totalPortfolio / 1000000)}M`}
          change={12.5}
          icon={DollarSign}
          iconColor="text-primary"
          data-testid="kpi-total-portfolio"
        />
        <KPICard
          title="Active Deals"
          value={activeDeals.toString()}
          change={8.3}
          icon={FileText}
          iconColor="text-success"
          data-testid="kpi-active-deals"
        />
        <KPICard
          title="Avg. Deal Size"
          value={`$${Math.round(avgDealSize / 1000000)}M`}
          change={-2.1}
          icon={TrendingUp}
          iconColor="text-warning"
          data-testid="kpi-avg-deal-size"
        />
        <KPICard
          title="Risk Alerts"
          value={riskAlerts.toString()}
          change={-25.0}
          icon={AlertTriangle}
          iconColor="text-danger"
          data-testid="kpi-risk-alerts"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PortfolioChart data={mockPortfolioData} />
        
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lead Identification</span>
                <span className="font-mono font-medium" data-testid="pipeline-leads">{leadCount} deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min((leadCount / Math.max(prospects.length, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Underwriting</span>
                <span className="font-mono font-medium" data-testid="pipeline-underwriting">{underwritingCount} deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-warning" style={{ width: `${Math.min((underwritingCount / Math.max(prospects.length, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-mono font-medium" data-testid="pipeline-approved">{approvedCount} deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${Math.min((approvedCount / Math.max(prospects.length, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monitoring</span>
                <span className="font-mono font-medium" data-testid="pipeline-monitoring">{monitoringCount} deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-chart-2" style={{ width: `${Math.min((monitoringCount / Math.max(facilities.length, 1)) * 100, 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <DealTable 
            deals={recentDeals}
            onViewDeal={(id) => console.log("View deal:", id)}
            onEditDeal={(id) => console.log("Edit deal:", id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
