import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Target,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

interface ValidationRun {
  id: string;
  datasetId: string;
  accuracyOverall: string;
  accuracyFundName: boolean;
  accuracyFundSize: boolean;
  accuracyVintage: boolean;
  accuracyPortfolioCount: boolean;
  accuracySectors: string;
  accuracyGpName: boolean;
  accuracyGpFirmName: boolean;
  confidenceOverall: number;
  processingTimeMs: number;
  runAt: string;
}

interface AccuracyMetrics {
  totalRuns: number;
  averageAccuracy: number;
  passed95Percent: number;
  recentRuns: ValidationRun[];
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted))',
};

export default function AccuracyMetricsPage() {
  const { toast } = useToast();
  const [isRunningValidation, setIsRunningValidation] = useState(false);

  const { data: metricsData, isLoading, error } = useQuery<AccuracyMetrics>({
    queryKey: ['/api/automation/accuracy-metrics'],
  });

  // Run validation on all datasets
  const handleRunValidation = async () => {
    try {
      setIsRunningValidation(true);
      const response = await fetch('/api/automation/validate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const data = await response.json();

      toast({
        title: "Validation Complete",
        description: `Ran ${data.totalTests} tests. Passed: ${data.passed}, Failed: ${data.failed}`,
      });

      // Refresh metrics
      queryClient.invalidateQueries({ queryKey: ['/api/automation/accuracy-metrics'] });
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRunningValidation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading accuracy metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load accuracy metrics"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metricsData || metricsData.totalRuns === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-accuracy-metrics">
              AI Accuracy Metrics
            </h1>
            <p className="text-muted-foreground">
              Track AI extraction accuracy and validation performance
            </p>
          </div>
          <Button
            onClick={handleRunValidation}
            disabled={isRunningValidation}
            data-testid="button-run-validation"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningValidation ? 'animate-spin' : ''}`} />
            Run Validation Tests
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Validation Data</CardTitle>
            <CardDescription>
              No validation runs have been performed yet. Click "Run Validation Tests" to start tracking AI accuracy.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Prepare chart data from recent runs
  const chartData = metricsData.recentRuns.map((run, index) => ({
    name: `Run ${metricsData.totalRuns - metricsData.recentRuns.length + index + 1}`,
    accuracy: parseFloat(run.accuracyOverall),
    confidence: run.confidenceOverall,
    processingTime: run.processingTimeMs,
  })).reverse();

  // Calculate field-level accuracy statistics
  const fieldAccuracyStats = metricsData.recentRuns.reduce((acc, run) => {
    return {
      fundName: acc.fundName + (run.accuracyFundName ? 1 : 0),
      fundSize: acc.fundSize + (run.accuracyFundSize ? 1 : 0),
      vintage: acc.vintage + (run.accuracyVintage ? 1 : 0),
      portfolioCount: acc.portfolioCount + (run.accuracyPortfolioCount ? 1 : 0),
      gpName: acc.gpName + (run.accuracyGpName ? 1 : 0),
      gpFirmName: acc.gpFirmName + (run.accuracyGpFirmName ? 1 : 0),
    };
  }, {
    fundName: 0,
    fundSize: 0,
    vintage: 0,
    portfolioCount: 0,
    gpName: 0,
    gpFirmName: 0,
  });

  const fieldAccuracyData = Object.entries(fieldAccuracyStats).map(([field, correct]) => ({
    field: field.replace(/([A-Z])/g, ' $1').trim(),
    accuracy: (correct / metricsData.recentRuns.length) * 100,
  }));

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-accuracy-metrics">
            AI Accuracy Metrics
          </h1>
          <p className="text-muted-foreground">
            Track AI extraction accuracy and validation performance
          </p>
        </div>
        <Button
          onClick={handleRunValidation}
          disabled={isRunningValidation}
          data-testid="button-run-validation"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunningValidation ? 'animate-spin' : ''}`} />
          Run Validation Tests
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Validation Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-runs">
              {metricsData.totalRuns}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tests executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-avg-accuracy">
              {metricsData.averageAccuracy.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate (95%+)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-pass-rate">
              {metricsData.passed95Percent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meeting 95% threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {metricsData.averageAccuracy >= 95 ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            {metricsData.averageAccuracy >= 95 ? (
              <Badge variant="default" className="bg-success text-success-foreground">
                Passing
              </Badge>
            ) : (
              <Badge variant="destructive">
                Below Target
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Target: 95%+ accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Accuracy Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Trend</CardTitle>
            <CardDescription>Recent validation run accuracy scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Accuracy %"
                  dot={{ fill: COLORS.primary, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke={COLORS.warning}
                  strokeWidth={2}
                  name="Confidence %"
                  dot={{ fill: COLORS.warning, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Field-Level Accuracy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Field-Level Accuracy</CardTitle>
            <CardDescription>Accuracy by extracted field</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fieldAccuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="field"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="accuracy"
                  fill={COLORS.primary}
                  name="Accuracy %"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Validation Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Validation Runs</CardTitle>
          <CardDescription>
            Last {metricsData.recentRuns.length} validation test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Run Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Overall Accuracy
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Confidence
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Processing Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricsData.recentRuns.slice().reverse().map((run) => {
                  const accuracy = parseFloat(run.accuracyOverall);
                  const passed = accuracy >= 95;
                  
                  return (
                    <tr key={run.id} className="border-b border-border hover-elevate">
                      <td className="py-3 px-4 text-sm" data-testid={`run-time-${run.id}`}>
                        {new Date(run.runAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium" data-testid={`run-accuracy-${run.id}`}>
                        {accuracy.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {run.confidenceOverall}%
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {run.processingTimeMs}ms
                      </td>
                      <td className="py-3 px-4">
                        {passed ? (
                          <Badge variant="default" className="bg-success text-success-foreground" data-testid={`run-status-${run.id}`}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pass
                          </Badge>
                        ) : (
                          <Badge variant="destructive" data-testid={`run-status-${run.id}`}>
                            <XCircle className="h-3 w-3 mr-1" />
                            Fail
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
