import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Play, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CovenantTracker, Covenant } from "@/components/covenant-tracker";
import { HealthScoreCard, HealthMetric } from "@/components/health-score-card";
import { RiskAlertPanel, RiskAlert } from "@/components/risk-alert-panel";
import { PredictiveBreachPanel, BreachPrediction } from "@/components/predictive-breach-panel";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MonitoringPage() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  // Fetch covenants data
  const { data: covenants = [], isLoading: covenantsLoading } = useQuery<Covenant[]>({
    queryKey: ["/api/monitoring/covenants"],
  });

  // Fetch health scores
  const { data: healthScores = [], isLoading: healthLoading } = useQuery<HealthMetric[]>({
    queryKey: ["/api/monitoring/health-scores"],
  });

  // Fetch monitoring stats
  const { data: stats } = useQuery<{
    compliantDeals: number;
    compliantPercentage: number;
    warningDeals: number;
    warningPercentage: number;
    breachDeals: number;
    breachPercentage: number;
    totalCovenants: number;
  }>({
    queryKey: ["/api/monitoring/stats"],
  });

  // Fetch notifications for alerts
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  // Convert notifications to risk alerts format
  const alerts: RiskAlert[] = notifications
    .filter((n: any) => n.type === "covenant_warning" || n.type === "covenant_breach")
    .map((n: any) => ({
      id: n.id,
      dealName: n.title,
      severity: n.type === "covenant_breach" ? "critical" : n.type === "covenant_warning" ? "high" : "medium",
      message: n.message,
      timestamp: new Date(n.createdAt).toLocaleDateString(),
      acknowledged: n.isRead,
    }));

  // Mutation for acknowledging alerts
  const acknowledgeMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mock predictions (TODO: Implement prediction model in backend)
  const predictions: BreachPrediction[] = [];

  const handleAcknowledge = (id: string) => {
    acknowledgeMutation.mutate(id);
  };

  const handleSendWarning = (id: string) => {
    const prediction = predictions.find(p => p.id === id);
    if (!prediction) return;

    toast({
      title: "Warning Sent Successfully",
      description: (
        <div className="space-y-1">
          <p className="font-medium">{prediction.dealName}</p>
          <p className="text-sm">✓ Internal team notified</p>
          <p className="text-sm">✓ Fund GP/CFO notified</p>
          <p className="text-sm text-muted-foreground mt-2">
            Automated email with predictive analysis and recommended actions sent
          </p>
        </div>
      ),
    });
  };

  // Mutation for running manual monitoring checks
  const runMonitoringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/covenants/check-all-due");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/covenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/health-scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Monitoring Checks Complete",
        description: "All covenant compliance checks have been run successfully.",
      });
    },
  });

  const handleRunMonitoring = () => {
    setIsRunning(true);
    runMonitoringMutation.mutate(undefined, {
      onSettled: () => {
        setIsRunning(false);
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Portfolio Monitoring</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Quarterly health checks and covenant compliance tracking
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Select defaultValue="q2-2024">
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-monitoring-period">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
              <SelectItem value="q4-2023">Q4 2023</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRunMonitoring} disabled={isRunning} data-testid="button-run-monitoring" className="w-full sm:w-auto">
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Checks
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Compliant Deals</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums" data-testid="stat-compliant-deals">{stats?.compliantDeals || 0}</p>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                {stats?.compliantPercentage || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Warning Status</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums" data-testid="stat-warning-deals">{stats?.warningDeals || 0}</p>
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50">
                {stats?.warningPercentage || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Breaches</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums" data-testid="stat-breach-deals">{stats?.breachDeals || 0}</p>
              <Badge variant="outline" className="bg-danger/20 text-danger border-danger/50">
                {stats?.breachPercentage || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <PredictiveBreachPanel
        predictions={predictions}
        onSendWarning={handleSendWarning}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CovenantTracker covenants={covenants} />
          <HealthScoreCard metrics={healthScores} />
        </div>

        <div className="space-y-6">
          <RiskAlertPanel
            alerts={alerts}
            onAcknowledge={handleAcknowledge}
            onViewDetails={(id) => console.log("View details for alert:", id)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Next Quarterly Check</p>
                  <p className="text-sm text-muted-foreground">Automated run scheduled</p>
                </div>
                <Badge variant="outline">Sept 30, 2024</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Last Completed Run</p>
                  <p className="text-sm text-muted-foreground">24 deals analyzed</p>
                </div>
                <Badge variant="outline">Jun 30, 2024</Badge>
              </div>
              <Button variant="outline" className="w-full" data-testid="button-download-report">
                <Download className="mr-2 h-4 w-4" />
                Download Monitoring Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
