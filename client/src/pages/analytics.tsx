import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  BarChart3,
  Clock,
  Building2,
  Shield,
} from "lucide-react";
import { formatCurrency } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PortfolioSummary {
  overview: {
    totalFacilities: number;
    activeFacilities: number;
    totalPrincipalAmount: number;
    totalOutstandingBalance: number;
    avgLtvRatio: number;
    avgInterestRate: number;
  };
  statusDistribution: Record<string, number>;
  covenantHealth: {
    total: number;
    compliant: number;
    warning: number;
    breach: number;
    compliantPercentage: number;
    warningPercentage: number;
    breachPercentage: number;
  };
  paymentPerformance: {
    totalCashFlows: number;
    paidCount: number;
    overdueCount: number;
    scheduledCount: number;
    paidPercentage: number;
    overduePercentage: number;
    scheduledPercentage: number;
    totalPaid: number;
    totalOverdue: number;
    totalScheduled: number;
  };
  riskMetrics: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    upcomingMaturities90Days: number;
    concentrationRatio: number;
    topFiveExposure: number;
  };
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted))',
};

export default function AnalyticsPage() {
  const { toast } = useToast();

  const { data: portfolioData, isLoading, error } = useQuery<PortfolioSummary>({
    queryKey: ['/api/analytics/portfolio-summary'],
  });

  // Calculate Operational Alpha ROI
  const calculateOperationalAlpha = () => {
    if (!portfolioData) return null;

    // Guard against zero AUM edge case
    const totalAUM = portfolioData.overview.totalPrincipalAmount;
    if (totalAUM === 0) return null;

    // Operational alpha assumptions (100 bps target)
    const targetOperationalAlpha = 1.0; // 100 basis points = 1%
    const automationRate = 0.90; // 90% automation achieved
    const avgLaborCostPerDeal = 50000; // $50k average manual processing cost per facility
    const platformCost = 100000; // Estimated annual platform cost

    // Calculate savings
    const potentialManualCost = portfolioData.overview.totalFacilities * avgLaborCostPerDeal;
    const actualCostWithAutomation = potentialManualCost * (1 - automationRate);
    const annualSavings = potentialManualCost - actualCostWithAutomation;

    // Calculate operational alpha in basis points
    const operationalAlphaBps = (annualSavings / totalAUM) * 10000;
    const operationalAlphaPercentage = operationalAlphaBps / 100;

    // ROI calculation
    const roi = ((annualSavings - platformCost) / platformCost) * 100;

    return {
      annualSavings,
      operationalAlphaBps,
      operationalAlphaPercentage,
      roi,
      automationRate: automationRate * 100,
      targetOperationalAlpha: targetOperationalAlpha * 100,
      achievementRate: (operationalAlphaBps / (targetOperationalAlpha * 100)) * 100,
      // Expose assumptions for transparency
      assumptions: {
        automationRate,
        avgLaborCostPerDeal,
        platformCost,
        totalFacilities: portfolioData.overview.totalFacilities,
        totalAUM,
      },
    };
  };

  const roiMetrics = calculateOperationalAlpha();

  // Export portfolio summary to CSV
  const exportPortfolioSummary = () => {
    if (!portfolioData) {
      toast({
        title: "No Data",
        description: "Portfolio summary data is not available",
        variant: "destructive",
      });
      return;
    }

    const csvData = [
      ['Portfolio Analytics Summary', ''],
      ['Generated', new Date().toLocaleString()],
      ['', ''],
      ['OVERVIEW METRICS', ''],
      ['Total Facilities', portfolioData.overview.totalFacilities],
      ['Active Facilities', portfolioData.overview.activeFacilities],
      ['Total Principal Amount', formatCurrency(portfolioData.overview.totalPrincipalAmount)],
      ['Total Outstanding Balance', formatCurrency(portfolioData.overview.totalOutstandingBalance)],
      ['Average LTV Ratio', `${portfolioData.overview.avgLtvRatio.toFixed(2)}%`],
      ['Average Interest Rate', `${portfolioData.overview.avgInterestRate.toFixed(2)}%`],
      ['', ''],
      ['STATUS DISTRIBUTION', ''],
      ...Object.entries(portfolioData.statusDistribution).map(([status, count]) => [
        status.charAt(0).toUpperCase() + status.slice(1),
        count,
      ]),
      ['', ''],
      ['COVENANT HEALTH', ''],
      ['Total Covenants', portfolioData.covenantHealth.total],
      ['Compliant', `${portfolioData.covenantHealth.compliant} (${portfolioData.covenantHealth.compliantPercentage.toFixed(1)}%)`],
      ['Warning', `${portfolioData.covenantHealth.warning} (${portfolioData.covenantHealth.warningPercentage.toFixed(1)}%)`],
      ['Breach', `${portfolioData.covenantHealth.breach} (${portfolioData.covenantHealth.breachPercentage.toFixed(1)}%)`],
      ['', ''],
      ['PAYMENT PERFORMANCE', ''],
      ['Total Cash Flows', portfolioData.paymentPerformance.totalCashFlows],
      ['Paid Count', `${portfolioData.paymentPerformance.paidCount} (${portfolioData.paymentPerformance.paidPercentage.toFixed(1)}%)`],
      ['Paid Amount', formatCurrency(portfolioData.paymentPerformance.totalPaid)],
      ['Overdue Count', `${portfolioData.paymentPerformance.overdueCount} (${portfolioData.paymentPerformance.overduePercentage.toFixed(1)}%)`],
      ['Overdue Amount', formatCurrency(portfolioData.paymentPerformance.totalOverdue)],
      ['Scheduled Count', `${portfolioData.paymentPerformance.scheduledCount} (${portfolioData.paymentPerformance.scheduledPercentage.toFixed(1)}%)`],
      ['Scheduled Amount', formatCurrency(portfolioData.paymentPerformance.totalScheduled)],
      ['', ''],
      ['RISK METRICS', ''],
      ['Risk Score', `${portfolioData.riskMetrics.riskScore}/100`],
      ['Risk Level', portfolioData.riskMetrics.riskLevel.toUpperCase()],
      ['Upcoming Maturities (90 days)', portfolioData.riskMetrics.upcomingMaturities90Days],
      ['Concentration Ratio (Top 5)', `${portfolioData.riskMetrics.concentrationRatio.toFixed(2)}%`],
      ['Top 5 Exposure', formatCurrency(portfolioData.riskMetrics.topFiveExposure)],
    ];

    if (roiMetrics) {
      csvData.push(
        ['', ''],
        ['OPERATIONAL ALPHA & ROI', ''],
        ['Annual Savings', formatCurrency(roiMetrics.annualSavings)],
        ['Operational Alpha (bps)', roiMetrics.operationalAlphaBps.toFixed(0)],
        ['Operational Alpha (%)', `${roiMetrics.operationalAlphaPercentage.toFixed(2)}%`],
        ['Target Achievement', `${roiMetrics.achievementRate.toFixed(1)}%`],
        ['Platform ROI', `${roiMetrics.roi.toFixed(1)}%`],
        ['Automation Rate', `${roiMetrics.automationRate.toFixed(1)}%`],
        ['', ''],
        ['ROI CALCULATION ASSUMPTIONS', ''],
        ['Automation Rate', `${(roiMetrics.assumptions.automationRate * 100).toFixed(0)}%`],
        ['Avg Labor Cost Per Facility', formatCurrency(roiMetrics.assumptions.avgLaborCostPerDeal)],
        ['Annual Platform Cost', formatCurrency(roiMetrics.assumptions.platformCost)],
        ['Total Facilities', roiMetrics.assumptions.totalFacilities],
        ['Total AUM', formatCurrency(roiMetrics.assumptions.totalAUM)]
      );
    }

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Portfolio analytics exported to CSV",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive risk metrics and operational alpha tracking
          </p>
        </div>
        <Card data-testid="card-loading">
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive risk metrics and operational alpha tracking
          </p>
        </div>
        <Card data-testid="card-error">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h3 className="font-semibold">Failed to load analytics data</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
            </div>
            <Button onClick={() => window.location.reload()} data-testid="button-reload">
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const statusChartData = Object.entries(portfolioData.statusDistribution).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const covenantChartData = [
    { name: 'Compliant', value: portfolioData.covenantHealth.compliant, color: COLORS.success },
    { name: 'Warning', value: portfolioData.covenantHealth.warning, color: COLORS.warning },
    { name: 'Breach', value: portfolioData.covenantHealth.breach, color: COLORS.danger },
  ];

  const paymentChartData = [
    { name: 'Paid', value: portfolioData.paymentPerformance.paidCount, amount: portfolioData.paymentPerformance.totalPaid },
    { name: 'Overdue', value: portfolioData.paymentPerformance.overdueCount, amount: portfolioData.paymentPerformance.totalOverdue },
    { name: 'Scheduled', value: portfolioData.paymentPerformance.scheduledCount, amount: portfolioData.paymentPerformance.totalScheduled },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'low': return 'outline';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-analytics">
            Portfolio Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive risk metrics and operational alpha tracking
          </p>
        </div>
        <Button onClick={exportPortfolioSummary} data-testid="button-export-analytics">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-facilities">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-total-facilities">
              {portfolioData.overview.totalFacilities}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioData.overview.activeFacilities} active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-principal">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-total-principal">
              {formatCurrency(portfolioData.overview.totalPrincipalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(portfolioData.overview.totalOutstandingBalance)} outstanding
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-ltv">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="metric-avg-ltv">
              {portfolioData.overview.avgLtvRatio.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioData.overview.avgInterestRate.toFixed(2)}% avg interest
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-risk-score">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${getRiskColor(portfolioData.riskMetrics.riskLevel)}`} data-testid="metric-risk-score">
              {portfolioData.riskMetrics.riskScore}/100
            </div>
            <Badge variant={getRiskBadgeVariant(portfolioData.riskMetrics.riskLevel)} className="mt-1" data-testid="badge-risk-level">
              {portfolioData.riskMetrics.riskLevel.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Operational Alpha ROI */}
      {roiMetrics && (
        <Card data-testid="card-operational-alpha">
          <CardHeader>
            <CardTitle>Operational Alpha & ROI</CardTitle>
            <CardDescription>
              Platform efficiency metrics and cost savings analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Annual Savings</span>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div className="text-2xl font-bold tabular-nums text-success" data-testid="metric-annual-savings">
                  {formatCurrency(roiMetrics.annualSavings)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {roiMetrics.automationRate.toFixed(0)}% automation × {formatCurrency(roiMetrics.assumptions.avgLaborCostPerDeal)}/facility
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Operational Alpha</span>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold tabular-nums" data-testid="metric-operational-alpha">
                  {roiMetrics.operationalAlphaBps.toFixed(0)} bps
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: {roiMetrics.targetOperationalAlpha.toFixed(0)} bps ({roiMetrics.achievementRate.toFixed(0)}% achieved)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Platform ROI</span>
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                <div className="text-2xl font-bold tabular-nums text-success" data-testid="metric-platform-roi">
                  {roiMetrics.roi.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Annual return on platform investment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Covenant Health */}
        <Card data-testid="card-covenant-health">
          <CardHeader>
            <CardTitle>Covenant Health</CardTitle>
            <CardDescription>
              {portfolioData.covenantHealth.total} total covenants monitored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={covenantChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {covenantChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <div className="text-sm font-medium">{portfolioData.covenantHealth.compliant}</div>
                  <div className="text-xs text-muted-foreground">Compliant</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <div>
                  <div className="text-sm font-medium">{portfolioData.covenantHealth.warning}</div>
                  <div className="text-xs text-muted-foreground">Warning</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <div>
                  <div className="text-sm font-medium">{portfolioData.covenantHealth.breach}</div>
                  <div className="text-xs text-muted-foreground">Breach</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Performance */}
        <Card data-testid="card-payment-performance">
          <CardHeader>
            <CardTitle>Payment Performance</CardTitle>
            <CardDescription>
              {portfolioData.paymentPerformance.totalCashFlows} total cash flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'value') return [`${value} payments`, 'Count'];
                      return [formatCurrency(Number(value)), 'Amount'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill={COLORS.primary} name="Count" />
                  <Bar dataKey="amount" fill={COLORS.success} name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-sm font-medium">{formatCurrency(portfolioData.paymentPerformance.totalPaid)}</div>
                <div className="text-xs text-muted-foreground">Paid ({portfolioData.paymentPerformance.paidPercentage.toFixed(1)}%)</div>
              </div>
              <div>
                <div className="text-sm font-medium text-destructive">{formatCurrency(portfolioData.paymentPerformance.totalOverdue)}</div>
                <div className="text-xs text-muted-foreground">Overdue ({portfolioData.paymentPerformance.overduePercentage.toFixed(1)}%)</div>
              </div>
              <div>
                <div className="text-sm font-medium">{formatCurrency(portfolioData.paymentPerformance.totalScheduled)}</div>
                <div className="text-xs text-muted-foreground">Scheduled ({portfolioData.paymentPerformance.scheduledPercentage.toFixed(1)}%)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics */}
      <Card data-testid="card-risk-metrics">
        <CardHeader>
          <CardTitle>Risk Concentration & Maturity</CardTitle>
          <CardDescription>
            Portfolio diversification and upcoming obligations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upcoming Maturities</span>
              </div>
              <div className="text-2xl font-bold tabular-nums" data-testid="metric-upcoming-maturities">
                {portfolioData.riskMetrics.upcomingMaturities90Days}
              </div>
              <p className="text-xs text-muted-foreground">
                Within next 90 days
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Concentration Ratio</span>
              </div>
              <div className="text-2xl font-bold tabular-nums" data-testid="metric-concentration-ratio">
                {portfolioData.riskMetrics.concentrationRatio.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Top 5 facilities
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Top 5 Exposure</span>
              </div>
              <div className="text-2xl font-bold tabular-nums" data-testid="metric-top-five-exposure">
                {formatCurrency(portfolioData.riskMetrics.topFiveExposure)}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined outstanding balance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
