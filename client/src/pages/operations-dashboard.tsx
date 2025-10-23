import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  BarChart3,
} from "lucide-react";
import type { Prospect, AdvisorDeal, Facility, Notification } from "@shared/schema";

interface DashboardMetrics {
  totalProspects: number;
  activeDeals: number;
  activeFacilities: number;
  totalCommitted: number;
  totalOutstanding: number;
  averageLTV: number;
}

export default function OperationsDashboard() {
  // Fetch all data for dashboard
  const { data: prospects = [] } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const { data: deals = [] } = useQuery<AdvisorDeal[]>({
    queryKey: ["/api/advisor-deals"],
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications?userId=operations-team"],
  });

  // Calculate metrics
  const metrics: DashboardMetrics = {
    totalProspects: prospects.length,
    activeDeals: deals.filter((d) => d.status !== "closed" && d.status !== "rejected").length,
    activeFacilities: facilities.filter((f) => f.status === "active").length,
    totalCommitted: facilities.reduce((sum, f) => sum + f.principalAmount, 0),
    totalOutstanding: facilities.reduce((sum, f) => sum + f.outstandingBalance, 0),
    averageLTV: facilities.length > 0
      ? facilities.reduce((sum, f) => sum + f.ltvRatio, 0) / facilities.length
      : 0,
  };

  // Group deals by stage
  const underwritingQueue = deals.filter(
    (d) => d.status === "underwriting" || d.status === "diligence"
  );
  const pendingApproval = deals.filter((d) => d.status === "ic_review");
  const activeNegotiations = deals.filter((d) => d.status === "negotiation");

  // Filter alerts
  const criticalAlerts = notifications.filter(
    (n) => !n.isRead && n.priority === "high"
  );

  // Calculate portfolio health based on real metrics
  const calculatePortfolioHealth = (): {
    status: "Healthy" | "Warning" | "Critical";
    reasons: string[];
  } => {
    const reasons: string[] = [];
    
    // Check for defaulted facilities
    const defaultedCount = facilities.filter((f) => f.status === "defaulted").length;
    if (defaultedCount > 0) {
      reasons.push(`${defaultedCount} defaulted facility(ies)`);
    }

    // Check for high LTV ratios (>12% conservative threshold)
    const highLTVCount = facilities.filter((f) => f.ltvRatio > 12).length;
    if (highLTVCount > 0) {
      reasons.push(`${highLTVCount} facility(ies) with LTV >12%`);
    }

    // Check average LTV approaching limits (>10% warning)
    if (metrics.averageLTV > 10) {
      reasons.push(`Avg LTV ${metrics.averageLTV.toFixed(1)}% approaching limits`);
    }

    // Determine overall health status
    if (defaultedCount > 0 || highLTVCount > facilities.length * 0.3) {
      return { status: "Critical", reasons };
    } else if (highLTVCount > 0 || metrics.averageLTV > 10) {
      return { status: "Warning", reasons };
    } else {
      return { status: "Healthy", reasons: ["All facilities performing within parameters"] };
    }
  };

  const portfolioHealth = calculatePortfolioHealth();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-secondary text-secondary-foreground",
      approved: "bg-success text-success-foreground",
      eligible: "bg-success text-success-foreground",
      ineligible: "bg-destructive text-destructive-foreground",
      review_required: "bg-primary text-primary-foreground",
      underwriting: "bg-primary text-primary-foreground",
      diligence: "bg-primary text-primary-foreground",
      ic_review: "bg-primary text-primary-foreground",
      negotiation: "bg-primary text-primary-foreground",
      active: "bg-success text-success-foreground",
      closed: "bg-secondary text-secondary-foreground",
      rejected: "bg-destructive text-destructive-foreground",
    };
    return colors[status] || "bg-secondary text-secondary-foreground";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Operations Dashboard</h1>
        <p className="text-muted-foreground">
          NAV IQ Capital portfolio and pipeline management
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-active-deals">
              {metrics.activeDeals}
            </div>
            <p className="text-xs text-muted-foreground">
              {underwritingQueue.length} in underwriting queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-active-facilities">
              {metrics.activeFacilities}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.totalOutstanding)} outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Committed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-total-committed">
              {formatCurrency(metrics.totalCommitted)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.averageLTV.toFixed(1)}% avg LTV
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-prospects">
              {metrics.totalProspects}
            </div>
            <p className="text-xs text-muted-foreground">
              {prospects.filter((p) => p.eligibilityStatus === "eligible").length} eligible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-alerts">
              {criticalAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
            {portfolioHealth.status === "Healthy" && (
              <TrendingUp className="h-4 w-4 text-success" />
            )}
            {portfolioHealth.status === "Warning" && (
              <AlertTriangle className="h-4 w-4 text-primary" />
            )}
            {portfolioHealth.status === "Critical" && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold tabular-nums ${
                portfolioHealth.status === "Healthy"
                  ? "text-success"
                  : portfolioHealth.status === "Warning"
                  ? "text-primary"
                  : "text-destructive"
              }`}
              data-testid="metric-health"
            >
              {portfolioHealth.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioHealth.reasons[0] || "All facilities current"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            Deal Pipeline
          </TabsTrigger>
          <TabsTrigger value="underwriting" data-testid="tab-underwriting">
            Underwriting Queue ({underwritingQueue.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Alerts ({criticalAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="portfolio" data-testid="tab-portfolio">
            Portfolio
          </TabsTrigger>
        </TabsList>

        {/* Deal Pipeline */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Underwriting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Underwriting</CardTitle>
                <CardDescription>{underwritingQueue.length} deals</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {underwritingQueue.map((deal) => (
                      <Card key={deal.id} className="hover-elevate">
                        <CardContent className="pt-4">
                          <div className="space-y-1">
                            <div className="font-semibold">{deal.gpFundName}</div>
                            <div className="text-sm text-muted-foreground">
                              {deal.loanAmount ? formatCurrency(deal.loanAmount) : "N/A"}
                            </div>
                            <Badge className={getStatusColor(deal.status)}>
                              {deal.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {underwritingQueue.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No deals in underwriting
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* IC Review */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">IC Review</CardTitle>
                <CardDescription>{pendingApproval.length} deals</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {pendingApproval.map((deal) => (
                      <Card key={deal.id} className="hover-elevate">
                        <CardContent className="pt-4">
                          <div className="space-y-1">
                            <div className="font-semibold">{deal.gpFundName}</div>
                            <div className="text-sm text-muted-foreground">
                              {deal.loanAmount ? formatCurrency(deal.loanAmount) : "N/A"}
                            </div>
                            <Badge className={getStatusColor(deal.status)}>
                              {deal.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pendingApproval.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No deals pending IC review
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Active Negotiations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Negotiations</CardTitle>
                <CardDescription>{activeNegotiations.length} deals</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {activeNegotiations.map((deal) => (
                      <Card key={deal.id} className="hover-elevate">
                        <CardContent className="pt-4">
                          <div className="space-y-1">
                            <div className="font-semibold">{deal.gpFundName}</div>
                            <div className="text-sm text-muted-foreground">
                              {deal.loanAmount ? formatCurrency(deal.loanAmount) : "N/A"}
                            </div>
                            <Badge className={getStatusColor(deal.status)}>
                              {deal.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {activeNegotiations.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No active negotiations
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Underwriting Queue */}
        <TabsContent value="underwriting" className="space-y-4">
          {underwritingQueue.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg">All Caught Up!</h3>
                    <p className="text-muted-foreground">
                      No deals currently in the underwriting queue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            underwritingQueue.map((deal) => (
              <Card key={deal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{deal.gpFundName}</CardTitle>
                      <CardDescription>
                        Submitted {new Date(deal.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(deal.status)}>
                      {deal.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Loan Amount
                      </div>
                      <div className="text-2xl font-bold tabular-nums">
                        {deal.loanAmount ? formatCurrency(deal.loanAmount) : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Advisor
                      </div>
                      <div className="text-lg font-semibold">{deal.advisorId}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" data-testid={`button-review-${deal.id}`}>
                      <FileCheck className="mr-2 h-4 w-4" />
                      Review Application
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-assign-${deal.id}`}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Assign Underwriter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4">
          {criticalAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg">No Critical Alerts</h3>
                    <p className="text-muted-foreground">All systems operating normally</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            criticalAlerts.map((alert) => (
              <Card key={alert.id} className="border-destructive">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <CardTitle className="text-base">{alert.title}</CardTitle>
                    </div>
                    <Badge variant="destructive">High Priority</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{alert.message}</p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      data-testid={`button-resolve-${alert.id}`}
                    >
                      Take Action
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-dismiss-${alert.id}`}
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Portfolio Overview */}
        <TabsContent value="portfolio" className="space-y-4">
          {facilities.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg">No Active Facilities</h3>
                    <p className="text-muted-foreground">
                      Facilities will appear here once deals are closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            facilities.map((facility) => (
              <Card key={facility.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{facility.fundName}</CardTitle>
                      <CardDescription>
                        Facility ID: {facility.id}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(facility.status)}>
                      {facility.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Principal Amount
                      </div>
                      <div className="text-lg font-bold tabular-nums">
                        {formatCurrency(facility.principalAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Outstanding
                      </div>
                      <div className="text-lg font-bold tabular-nums">
                        {formatCurrency(facility.outstandingBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Interest Rate
                      </div>
                      <div className="text-lg font-bold tabular-nums">
                        {facility.interestRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Maturity
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(facility.maturityDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
