import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

// TODO: Remove mock data
const mockCovenants: Covenant[] = [
  {
    id: "1",
    dealName: "Sequoia Capital Fund XII",
    covenantType: "Debt/EBITDA Ratio",
    threshold: "≤ 3.5x",
    currentValue: "3.2x",
    status: "compliant",
    lastChecked: "2 hours ago",
  },
  {
    id: "2",
    dealName: "Tiger Global Private Investment",
    covenantType: "Interest Coverage",
    threshold: "≥ 2.0x",
    currentValue: "1.8x",
    status: "warning",
    lastChecked: "5 hours ago",
  },
  {
    id: "3",
    dealName: "Lightspeed Venture Partners",
    covenantType: "Debt/EBITDA Ratio",
    threshold: "≤ 4.0x",
    currentValue: "4.3x",
    status: "breach",
    lastChecked: "1 day ago",
  },
];

const mockHealthScores: HealthMetric[] = [
  {
    id: "1",
    dealName: "Sequoia Capital Fund XII",
    score: 85,
    trend: "up",
    category: "excellent",
    lastUpdate: "Updated 2 hours ago",
  },
  {
    id: "2",
    dealName: "Tiger Global Private Investment",
    score: 72,
    trend: "stable",
    category: "good",
    lastUpdate: "Updated 5 hours ago",
  },
  {
    id: "3",
    dealName: "Andreessen Horowitz Bio Fund",
    score: 68,
    trend: "down",
    category: "good",
    lastUpdate: "Updated 1 day ago",
  },
  {
    id: "4",
    dealName: "Lightspeed Venture Partners",
    score: 45,
    trend: "down",
    category: "fair",
    lastUpdate: "Updated 1 day ago",
  },
];

const mockAlerts: RiskAlert[] = [
  {
    id: "1",
    dealName: "Lightspeed Venture Partners",
    severity: "critical",
    message: "Debt/EBITDA ratio exceeded covenant threshold (4.3x vs 4.0x limit)",
    timestamp: "1 day ago",
    acknowledged: false,
  },
  {
    id: "2",
    dealName: "Tiger Global Private Investment",
    severity: "high",
    message: "Interest coverage approaching threshold (1.8x vs 2.0x minimum)",
    timestamp: "5 hours ago",
    acknowledged: false,
  },
  {
    id: "3",
    dealName: "Benchmark Capital Growth VI",
    severity: "medium",
    message: "Quarterly financial report overdue by 3 days",
    timestamp: "3 days ago",
    acknowledged: true,
  },
];

export default function MonitoringPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isRunning, setIsRunning] = useState(false);

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleRunMonitoring = () => {
    setIsRunning(true);
    console.log("Running quarterly monitoring checks...");
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
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
        <div className="flex items-center gap-2">
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
          <Button onClick={handleRunMonitoring} disabled={isRunning} data-testid="button-run-monitoring">
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Running...</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Run Checks</span>
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
              <p className="text-2xl font-bold font-mono tabular-nums">18</p>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                75%
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
              <p className="text-2xl font-bold font-mono tabular-nums">4</p>
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50">
                17%
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
              <p className="text-2xl font-bold font-mono tabular-nums">2</p>
              <Badge variant="outline" className="bg-danger/20 text-danger border-danger/50">
                8%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CovenantTracker covenants={mockCovenants} />
          <HealthScoreCard metrics={mockHealthScores} />
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
