import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Target, RefreshCw, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundScoringTable, FundScore } from "@/components/fund-scoring-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Prospect } from "@shared/schema";

export default function OriginationPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: prospectsData = [] } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const funds: FundScore[] = prospectsData.map((prospect) => ({
    id: prospect.id,
    fundName: prospect.fundName,
    fundSize: prospect.fundSize || 0,
    stage: prospect.stage || "Unknown",
    loanNeedScore: prospect.loanNeedScore || 0,
    borrowerQualityScore: prospect.borrowerQualityScore || 0,
    engagementScore: prospect.engagementScore || 0,
    overallScore: prospect.overallScore || 0,
    recommendation: (prospect.recommendation as FundScore["recommendation"]) || "monitor",
    linkedInUrl: prospect.linkedInUrl || undefined,
  }));

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    console.log("Running predictive analysis...");
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const filteredFunds = funds.filter((fund) => {
    if (priorityFilter === "all") return true;
    return fund.recommendation === priorityFilter;
  });

  const highPriorityCount = funds.filter(f => f.recommendation === "high-priority").length;
  const mediumPriorityCount = funds.filter(f => f.recommendation === "medium-priority").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Deal Origination</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Predictive fund identification and engagement pipeline
          </p>
        </div>
        <Button onClick={handleRunAnalysis} disabled={isAnalyzing} data-testid="button-run-analysis" className="w-full sm:w-auto">
          {isAnalyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Target className="mr-2 h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Funds Identified</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">{funds.length}</p>
            <p className="text-xs text-muted-foreground mt-1">This quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">High Priority</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums">{highPriorityCount}</p>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                Ready
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums">{mediumPriorityCount}</p>
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50">
                Monitor
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Low Priority</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums">{funds.filter(f => f.recommendation === "low-priority").length}</p>
              <Badge variant="outline">Review</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Fund Scoring & Prioritization</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-priority-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high-priority">High Priority</SelectItem>
                  <SelectItem value="medium-priority">Medium Priority</SelectItem>
                  <SelectItem value="low-priority">Low Priority</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" data-testid="button-export-list" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FundScoringTable
            funds={filteredFunds}
            onEngage={(id) => console.log("Engage with fund:", id)}
            onViewLinkedIn={(url) => window.open(url, "_blank")}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scoring Methodology</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Loan Need Score</span>
                <span className="text-sm text-muted-foreground">33% weight</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Fund stage, capital deployment, liquidity needs, historical NAV facility usage
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Borrower Quality Score</span>
                <span className="text-sm text-muted-foreground">33% weight</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Creditworthiness, ILPA alignment, portfolio quality, management team experience
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engagement Score</span>
                <span className="text-sm text-muted-foreground">34% weight</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Network connections, previous interactions, responsiveness indicators, LP relationships
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium text-sm">Fund Databases</p>
                <p className="text-xs text-muted-foreground">Pitchbook, Preqin, Cambridge Associates</p>
              </div>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium text-sm">LinkedIn Network</p>
                <p className="text-xs text-muted-foreground">Connections and engagement data</p>
              </div>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium text-sm">Public Filings</p>
                <p className="text-xs text-muted-foreground">SEC Form D, fund documents</p>
              </div>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium text-sm">CRM Integration</p>
                <p className="text-xs text-muted-foreground">Folk, outreach tracking</p>
              </div>
              <Badge variant="outline">Configured</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
