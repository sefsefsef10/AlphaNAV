import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  TrendingDown,
  Activity,
  Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  LineChart,
  Line,
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

interface StressTestResults {
  baseline: {
    totalExposure: number;
    avgLtv: number;
    facilitiesAtRisk: number;
    breachCount: number;
  };
  moderate: {
    totalExposure: number;
    avgLtv: number;
    facilitiesAtRisk: number;
    breachCount: number;
    navDecline: number;
  };
  severe: {
    totalExposure: number;
    avgLtv: number;
    facilitiesAtRisk: number;
    breachCount: number;
    navDecline: number;
  };
  recommendations: Array<{
    facilityId: string;
    fundName: string;
    currentLtv: number;
    moderateStressLtv: number;
    severeStressLtv: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }>;
}

interface ConcentrationAnalysis {
  bySector: Array<{
    sector: string;
    exposure: number;
    facilityCount: number;
    percentage: number;
  }>;
  byVintage: Array<{
    vintage: string;
    exposure: number;
    facilityCount: number;
    percentage: number;
  }>;
  byGP: Array<{
    gp: string;
    exposure: number;
    facilityCount: number;
    percentage: number;
  }>;
  summary: {
    totalExposure: number;
    mostConcentratedSector: any;
    mostConcentratedVintage: any;
    mostConcentratedGP: any;
    herfindahlIndex: number;
  };
}

interface PerformanceMetrics {
  portfolioROI: {
    totalInvested: number;
    totalInterestEarned: number;
    totalPrincipalRepaid: number;
    roi: number;
    annualizedROI: number;
  };
  defaultMetrics: {
    totalFacilities: number;
    defaultedFacilities: number;
    defaultRate: number;
    totalDefaultedAmount: number;
    recoveryRate: number;
    totalRecoveredAmount: number;
    netLoss: number;
  };
  performanceByStatus: Record<string, {
    count: number;
    totalPrincipal: number;
    totalOutstanding: number;
    percentage: number;
  }>;
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
  const [activeTab, setActiveTab] = useState("overview");

  const { data: portfolioData, isLoading, error } = useQuery<PortfolioSummary>({
    queryKey: ['/api/analytics/portfolio-summary'],
  });

  const { data: stressTestData, isLoading: isLoadingStressTest } = useQuery<StressTestResults>({
    queryKey: ['/api/analytics/stress-test'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/analytics/stress-test');
      const data = await response.json() as StressTestResults;
      return data;
    },
    enabled: activeTab === 'stress-test',
  });

  const { data: concentrationData, isLoading: isLoadingConcentration } = useQuery<ConcentrationAnalysis>({
    queryKey: ['/api/analytics/concentration'],
    enabled: activeTab === 'concentration',
  });

  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/analytics/performance-metrics'],
    enabled: activeTab === 'performance',
  });

  // Provide safe defaults for portfolioData to avoid undefined errors
  const safePortfolioData = portfolioData ? {
    ...portfolioData,
    paymentPerformance: portfolioData.paymentPerformance || {
      totalCashFlows: 0,
      paidCount: 0,
      overdueCount: 0,
      scheduledCount: 0,
      paidPercentage: 0,
      overduePercentage: 0,
      scheduledPercentage: 0,
      totalPaid: 0,
      totalOverdue: 0,
      totalScheduled: 0,
    },
    riskMetrics: portfolioData.riskMetrics || {
      riskScore: 0,
      riskLevel: 'low' as const,
      upcomingMaturities90Days: 0,
      concentrationRatio: 0,
      topFiveExposure: 0,
    },
  } : null;

  // Calculate Operational Alpha ROI
  const calculateOperationalAlpha = () => {
    if (!safePortfolioData) return null;

    const totalAUM = portfolioData.overview.totalPrincipalAmount;
    if (totalAUM === 0) return null;

    const targetOperationalAlpha = 1.0;
    const automationRate = 0.90;
    const avgLaborCostPerDeal = 50000;
    const platformCost = 100000;

    const potentialManualCost = portfolioData.overview.totalFacilities * avgLaborCostPerDeal;
    const actualCostWithAutomation = potentialManualCost * (1 - automationRate);
    const annualSavings = potentialManualCost - actualCostWithAutomation;

    const operationalAlphaBps = (annualSavings / totalAUM) * 10000;
    const operationalAlphaPercentage = operationalAlphaBps / 100;

    const roi = ((annualSavings - platformCost) / platformCost) * 100;

    return {
      annualSavings,
      operationalAlphaBps,
      operationalAlphaPercentage,
      roi,
      automationRate: automationRate * 100,
      targetOperationalAlpha: targetOperationalAlpha * 100,
      achievementRate: (operationalAlphaBps / (targetOperationalAlpha * 100)) * 100,
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
      ['Total Cash Flows', safePortfolioData.paymentPerformance.totalCashFlows],
      ['Paid Count', `${safePortfolioData.paymentPerformance.paidCount} (${safePortfolioData.paymentPerformance.paidPercentage.toFixed(1)}%)`],
      ['Paid Amount', formatCurrency(safePortfolioData.paymentPerformance.totalPaid)],
      ['Overdue Count', `${safePortfolioData.paymentPerformance.overdueCount} (${safePortfolioData.paymentPerformance.overduePercentage.toFixed(1)}%)`],
      ['Overdue Amount', formatCurrency(safePortfolioData.paymentPerformance.totalOverdue)],
      ['Scheduled Count', `${safePortfolioData.paymentPerformance.scheduledCount} (${safePortfolioData.paymentPerformance.scheduledPercentage.toFixed(1)}%)`],
      ['Scheduled Amount', formatCurrency(safePortfolioData.paymentPerformance.totalScheduled)],
      ['', ''],
      ['RISK METRICS', ''],
      ['Risk Score', `${safePortfolioData.riskMetrics.riskScore}/100`],
      ['Risk Level', safePortfolioData.riskMetrics.riskLevel.toUpperCase()],
      ['Upcoming Maturities (90 days)', safePortfolioData.riskMetrics.upcomingMaturities90Days],
      ['Concentration Ratio (Top 5)', `${safePortfolioData.riskMetrics.concentrationRatio.toFixed(2)}%`],
      ['Top 5 Exposure', formatCurrency(safePortfolioData.riskMetrics.topFiveExposure)],
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
      );
    }

    // Add stress test data if available
    if (stressTestData && activeTab === 'stress-test') {
      csvData.push(
        ['', ''],
        ['STRESS TEST RESULTS', ''],
        ['Baseline Avg LTV', `${stressTestData.baseline.avgLtv}%`],
        ['Moderate Stress Avg LTV (-20% NAV)', `${stressTestData.moderate.avgLtv}%`],
        ['Severe Stress Avg LTV (-40% NAV)', `${stressTestData.severe.avgLtv}%`],
        ['Baseline Breaches', stressTestData.baseline.breachCount],
        ['Moderate Stress Breaches', stressTestData.moderate.breachCount],
        ['Severe Stress Breaches', stressTestData.severe.breachCount],
      );
    }

    // Add concentration data if available
    if (concentrationData && activeTab === 'concentration') {
      csvData.push(
        ['', ''],
        ['CONCENTRATION ANALYSIS', ''],
        ['Herfindahl Index', concentrationData.summary.herfindahlIndex],
        ['', ''],
        ['TOP SECTORS', ''],
        ...concentrationData.bySector.slice(0, 5).map(s => [
          s.sector,
          formatCurrency(s.exposure),
          `${s.percentage.toFixed(1)}%`,
        ]),
      );
    }

    // Add performance data if available
    if (performanceData && activeTab === 'performance') {
      csvData.push(
        ['', ''],
        ['PERFORMANCE METRICS', ''],
        ['Portfolio ROI', `${performanceData.portfolioROI.roi.toFixed(2)}%`],
        ['Annualized ROI', `${performanceData.portfolioROI.annualizedROI.toFixed(2)}%`],
        ['Default Rate', `${performanceData.defaultMetrics.defaultRate.toFixed(2)}%`],
        ['Recovery Rate', `${performanceData.defaultMetrics.recoveryRate.toFixed(2)}%`],
        ['Total Interest Earned', formatCurrency(performanceData.portfolioROI.totalInterestEarned)],
        ['Total Principal Repaid', formatCurrency(performanceData.portfolioROI.totalPrincipalRepaid)],
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
    { name: 'Paid', value: safePortfolioData.paymentPerformance.paidCount, amount: safePortfolioData.paymentPerformance.totalPaid },
    { name: 'Overdue', value: safePortfolioData.paymentPerformance.overdueCount, amount: safePortfolioData.paymentPerformance.totalOverdue },
    { name: 'Scheduled', value: safePortfolioData.paymentPerformance.scheduledCount, amount: safePortfolioData.paymentPerformance.totalScheduled },
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

      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="stress-test" data-testid="tab-stress-test">
            <TrendingDown className="mr-2 h-4 w-4" />
            Stress Testing
          </TabsTrigger>
          <TabsTrigger value="concentration" data-testid="tab-concentration">
            <Activity className="mr-2 h-4 w-4" />
            Concentration
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">
            <Percent className="mr-2 h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                <div className={`text-2xl font-bold tabular-nums ${getRiskColor(safePortfolioData.riskMetrics.riskLevel)}`} data-testid="metric-risk-score">
                  {safePortfolioData.riskMetrics.riskScore}/100
                </div>
                <Badge variant={getRiskBadgeVariant(safePortfolioData.riskMetrics.riskLevel)} className="mt-1" data-testid="badge-risk-level">
                  {safePortfolioData.riskMetrics.riskLevel.toUpperCase()}
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
                  {safePortfolioData.paymentPerformance.totalCashFlows} total cash flows
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
                    <div className="text-sm font-medium">{formatCurrency(safePortfolioData.paymentPerformance.totalPaid)}</div>
                    <div className="text-xs text-muted-foreground">Paid ({safePortfolioData.paymentPerformance.paidPercentage.toFixed(1)}%)</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-destructive">{formatCurrency(safePortfolioData.paymentPerformance.totalOverdue)}</div>
                    <div className="text-xs text-muted-foreground">Overdue ({safePortfolioData.paymentPerformance.overduePercentage.toFixed(1)}%)</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{formatCurrency(safePortfolioData.paymentPerformance.totalScheduled)}</div>
                    <div className="text-xs text-muted-foreground">Scheduled ({safePortfolioData.paymentPerformance.scheduledPercentage.toFixed(1)}%)</div>
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
                    {safePortfolioData.riskMetrics.upcomingMaturities90Days}
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
                    {safePortfolioData.riskMetrics.concentrationRatio.toFixed(1)}%
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
                    {formatCurrency(safePortfolioData.riskMetrics.topFiveExposure)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined outstanding balance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stress Testing Tab */}
        <TabsContent value="stress-test" className="space-y-6">
          {isLoadingStressTest ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : stressTestData ? (
            <>
              <Card data-testid="card-stress-test-summary">
                <CardHeader>
                  <CardTitle>NAV Decline Stress Testing</CardTitle>
                  <CardDescription>
                    Portfolio resilience under baseline, -20%, and -40% NAV decline scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Baseline</span>
                        <Badge variant="outline">Current NAV</Badge>
                      </div>
                      <div className="text-2xl font-bold tabular-nums">{stressTestData.baseline.avgLtv}%</div>
                      <p className="text-xs text-muted-foreground">
                        {stressTestData.baseline.breachCount} covenant breaches
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Moderate Stress</span>
                        <Badge variant="secondary">-20% NAV</Badge>
                      </div>
                      <div className="text-2xl font-bold tabular-nums text-warning">
                        {stressTestData.moderate.avgLtv}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stressTestData.moderate.breachCount} covenant breaches
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Severe Stress</span>
                        <Badge variant="destructive">-40% NAV</Badge>
                      </div>
                      <div className="text-2xl font-bold tabular-nums text-destructive">
                        {stressTestData.severe.avgLtv}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stressTestData.severe.breachCount} covenant breaches
                      </p>
                    </div>
                  </div>

                  <div className="h-[300px] mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { scenario: 'Baseline', ltv: stressTestData.baseline.avgLtv, breaches: stressTestData.baseline.breachCount },
                          { scenario: 'Moderate (-20%)', ltv: stressTestData.moderate.avgLtv, breaches: stressTestData.moderate.breachCount },
                          { scenario: 'Severe (-40%)', ltv: stressTestData.severe.avgLtv, breaches: stressTestData.severe.breachCount },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="scenario" />
                        <YAxis yAxisId="left" label={{ value: 'Avg LTV (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Breaches', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="ltv" stroke={COLORS.primary} strokeWidth={2} name="Avg LTV (%)" />
                        <Line yAxisId="right" type="monotone" dataKey="breaches" stroke={COLORS.danger} strokeWidth={2} name="Breach Count" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-stress-test-recommendations">
                <CardHeader>
                  <CardTitle>Facility-Level Risk Assessment</CardTitle>
                  <CardDescription>
                    {stressTestData.recommendations.length} facilities analyzed under stress scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Fund Name</TableHead>
                          <TableHead className="text-right">Current LTV</TableHead>
                          <TableHead className="text-right">Moderate Stress</TableHead>
                          <TableHead className="text-right">Severe Stress</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stressTestData.recommendations.map((rec) => (
                          <TableRow key={rec.facilityId}>
                            <TableCell className="font-medium">{rec.fundName}</TableCell>
                            <TableCell className="text-right tabular-nums">{rec.currentLtv}%</TableCell>
                            <TableCell className="text-right tabular-nums">
                              <span className={rec.moderateStressLtv > 70 ? 'text-warning' : ''}>
                                {rec.moderateStressLtv}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <span className={rec.severeStressLtv > 80 ? 'text-destructive' : rec.severeStressLtv > 70 ? 'text-warning' : ''}>
                                {rec.severeStressLtv}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRiskBadgeVariant(rec.riskLevel)}>
                                {rec.riskLevel.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{rec.recommendation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-semibold">No Stress Test Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Unable to perform stress testing analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Concentration Analysis Tab */}
        <TabsContent value="concentration" className="space-y-6">
          {isLoadingConcentration ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : concentrationData ? (
            <>
              <Card data-testid="card-concentration-summary">
                <CardHeader>
                  <CardTitle>Portfolio Concentration Analysis</CardTitle>
                  <CardDescription>
                    Exposure breakdown by sector, vintage, and GP firm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Exposure</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums">
                        {formatCurrency(concentrationData.summary.totalExposure)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Herfindahl Index</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums">
                        {concentrationData.summary.herfindahlIndex}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {concentrationData.summary.herfindahlIndex < 1500 ? 'Low concentration' : 
                         concentrationData.summary.herfindahlIndex < 2500 ? 'Moderate concentration' : 
                         'High concentration'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Sector Concentration */}
                <Card data-testid="card-sector-concentration">
                  <CardHeader>
                    <CardTitle>By Sector</CardTitle>
                    <CardDescription>
                      {concentrationData.bySector.length} sectors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {concentrationData.bySector.slice(0, 5).map((sector) => (
                        <div key={sector.sector} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate">{sector.sector}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {sector.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${sector.percentage}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(sector.exposure)} · {sector.facilityCount} facilities
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Vintage Concentration */}
                <Card data-testid="card-vintage-concentration">
                  <CardHeader>
                    <CardTitle>By Vintage</CardTitle>
                    <CardDescription>
                      {concentrationData.byVintage.length} vintages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {concentrationData.byVintage.slice(0, 5).map((vintage) => (
                        <div key={vintage.vintage} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{vintage.vintage}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {vintage.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${vintage.percentage}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(vintage.exposure)} · {vintage.facilityCount} facilities
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* GP Concentration */}
                <Card data-testid="card-gp-concentration">
                  <CardHeader>
                    <CardTitle>By GP Firm</CardTitle>
                    <CardDescription>
                      {concentrationData.byGP.length} GPs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {concentrationData.byGP.slice(0, 5).map((gp) => (
                        <div key={gp.gp} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate">{gp.gp}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {gp.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${gp.percentage}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(gp.exposure)} · {gp.facilityCount} facilities
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-semibold">No Concentration Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Unable to perform concentration analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="performance" className="space-y-6">
          {isLoadingPerformance ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : performanceData ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card data-testid="card-portfolio-roi">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Portfolio ROI</CardTitle>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums text-success">
                      {performanceData.portfolioROI.roi.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performanceData.portfolioROI.annualizedROI.toFixed(2)}% annualized
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-interest-earned">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Interest Earned</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums">
                      {formatCurrency(performanceData.portfolioROI.totalInterestEarned)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total lifetime interest
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-default-rate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums">
                      {performanceData.defaultMetrics.defaultRate.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performanceData.defaultMetrics.defaultedFacilities} of {performanceData.defaultMetrics.totalFacilities} facilities
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-recovery-rate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums">
                      {performanceData.defaultMetrics.recoveryRate.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(performanceData.defaultMetrics.totalRecoveredAmount)} recovered
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-performance-details">
                <CardHeader>
                  <CardTitle>Performance Breakdown</CardTitle>
                  <CardDescription>
                    Detailed metrics by facility status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Total Principal</TableHead>
                          <TableHead className="text-right">Outstanding</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(performanceData.performanceByStatus).map(([status, data]) => (
                          <TableRow key={status}>
                            <TableCell className="font-medium capitalize">{status}</TableCell>
                            <TableCell className="text-right tabular-nums">{data.count}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(data.totalPrincipal)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(data.totalOutstanding)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {data.percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {performanceData.defaultMetrics.defaultedFacilities > 0 && (
                <Card data-testid="card-default-details">
                  <CardHeader>
                    <CardTitle>Default & Recovery Analysis</CardTitle>
                    <CardDescription>
                      Detailed breakdown of defaulted facilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Total Defaulted Amount</span>
                        <div className="text-2xl font-bold tabular-nums text-destructive">
                          {formatCurrency(performanceData.defaultMetrics.totalDefaultedAmount)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Total Recovered</span>
                        <div className="text-2xl font-bold tabular-nums text-success">
                          {formatCurrency(performanceData.defaultMetrics.totalRecoveredAmount)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Net Loss</span>
                        <div className="text-2xl font-bold tabular-nums text-destructive">
                          {formatCurrency(performanceData.defaultMetrics.netLoss)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-semibold">No Performance Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Unable to calculate performance metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
