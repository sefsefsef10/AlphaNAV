import { DollarSign, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import { KPICard } from "@/components/kpi-card";
import { PortfolioChart } from "@/components/portfolio-chart";
import { DealTable, Deal } from "@/components/deal-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// TODO: Remove mock data
const mockPortfolioData = [
  { month: "Jan", portfolio: 250, deployed: 180 },
  { month: "Feb", portfolio: 280, deployed: 210 },
  { month: "Mar", portfolio: 320, deployed: 250 },
  { month: "Apr", portfolio: 380, deployed: 300 },
  { month: "May", portfolio: 420, deployed: 340 },
  { month: "Jun", portfolio: 480, deployed: 390 },
];

const mockRecentDeals: Deal[] = [
  {
    id: "1",
    fundName: "Sequoia Capital Fund XII",
    status: "monitoring",
    amount: 45000000,
    stage: "Post-Close Monitoring",
    lastUpdate: "2 hours ago",
    riskScore: 2,
  },
  {
    id: "2",
    fundName: "Tiger Global Private Investment",
    status: "underwriting",
    amount: 62000000,
    stage: "Due Diligence",
    lastUpdate: "5 hours ago",
    riskScore: 4,
  },
  {
    id: "3",
    fundName: "Andreessen Horowitz Bio Fund",
    status: "approved",
    amount: 38000000,
    stage: "Documentation",
    lastUpdate: "1 day ago",
    riskScore: 3,
  },
];

export default function DashboardPage() {
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
          value="$480M"
          change={12.5}
          icon={DollarSign}
          iconColor="text-primary"
        />
        <KPICard
          title="Active Deals"
          value="24"
          change={8.3}
          icon={FileText}
          iconColor="text-success"
        />
        <KPICard
          title="Avg. Deal Size"
          value="$42M"
          change={-2.1}
          icon={TrendingUp}
          iconColor="text-warning"
        />
        <KPICard
          title="Risk Alerts"
          value="3"
          change={-25.0}
          icon={AlertTriangle}
          iconColor="text-danger"
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
                <span className="font-mono font-medium">12 deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "30%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Underwriting</span>
                <span className="font-mono font-medium">8 deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-warning" style={{ width: "50%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-mono font-medium">5 deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-success" style={{ width: "70%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monitoring</span>
                <span className="font-mono font-medium">15 deals</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-chart-2" style={{ width: "90%" }} />
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
            deals={mockRecentDeals}
            onViewDeal={(id) => console.log("View deal:", id)}
            onEditDeal={(id) => console.log("Edit deal:", id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
