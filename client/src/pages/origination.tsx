import { useState } from "react";
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

// TODO: Remove mock data
const mockFunds: FundScore[] = [
  {
    id: "1",
    fundName: "Accel Partners Growth VII",
    fundSize: 850000000,
    stage: "Fund IV-V (Mature)",
    loanNeedScore: 9,
    borrowerQualityScore: 9,
    engagementScore: 8,
    overallScore: 8.7,
    recommendation: "high-priority",
    linkedInUrl: "https://linkedin.com/company/accel",
  },
  {
    id: "2",
    fundName: "Index Ventures Tech Fund",
    fundSize: 620000000,
    stage: "Fund III-IV (Growth)",
    loanNeedScore: 8,
    borrowerQualityScore: 8,
    engagementScore: 7,
    overallScore: 7.7,
    recommendation: "high-priority",
    linkedInUrl: "https://linkedin.com/company/indexventures",
  },
  {
    id: "3",
    fundName: "FirstMark Capital VI",
    fundSize: 475000000,
    stage: "Fund IV-V (Mature)",
    loanNeedScore: 7,
    borrowerQualityScore: 8,
    engagementScore: 6,
    overallScore: 7.0,
    recommendation: "medium-priority",
  },
  {
    id: "4",
    fundName: "Canaan Partners Bio Fund",
    fundSize: 320000000,
    stage: "Fund II-III (Established)",
    loanNeedScore: 6,
    borrowerQualityScore: 7,
    engagementScore: 6,
    overallScore: 6.3,
    recommendation: "medium-priority",
  },
  {
    id: "5",
    fundName: "NEA Venture Partners",
    fundSize: 1200000000,
    stage: "Fund V+ (Very Mature)",
    loanNeedScore: 5,
    borrowerQualityScore: 9,
    engagementScore: 5,
    overallScore: 6.3,
    recommendation: "monitor",
  },
  {
    id: "6",
    fundName: "Emergence Capital IV",
    fundSize: 280000000,
    stage: "Fund I-II (Early)",
    loanNeedScore: 4,
    borrowerQualityScore: 6,
    engagementScore: 5,
    overallScore: 5.0,
    recommendation: "low-priority",
  },
];

export default function OriginationPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    console.log("Running predictive analysis...");
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const filteredFunds = mockFunds.filter((fund) => {
    if (priorityFilter === "all") return true;
    return fund.recommendation === priorityFilter;
  });

  const highPriorityCount = mockFunds.filter(f => f.recommendation === "high-priority").length;
  const mediumPriorityCount = mockFunds.filter(f => f.recommendation === "medium-priority").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deal Origination</h1>
          <p className="text-muted-foreground mt-1">
            Predictive fund identification and engagement pipeline
          </p>
        </div>
        <Button onClick={handleRunAnalysis} disabled={isAnalyzing} data-testid="button-run-analysis">
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
            <p className="text-2xl font-bold font-mono tabular-nums">{mockFunds.length}</p>
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
            <p className="text-sm font-medium text-muted-foreground">Est. Conversion</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">22%</p>
            <p className="text-xs text-muted-foreground mt-1">Based on model</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fund Scoring & Prioritization</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-priority-filter">
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
              <Button variant="outline" data-testid="button-export-list">
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
