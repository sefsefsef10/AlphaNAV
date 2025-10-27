import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Target, Search, Filter, Plus, RefreshCw, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealTable, Deal } from "@/components/deal-table";
import { FundScoringTable, FundScore } from "@/components/fund-scoring-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Prospect, Deal as DealType } from "@shared/schema";

function prospectToFundScore(prospect: Prospect): FundScore {
  return {
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
  };
}

function dealTypeToDeal(deal: DealType): Deal {
  const lastUpdateDate = new Date(deal.lastUpdate);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdateDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  let lastUpdateText = "";
  if (diffHours < 1) {
    lastUpdateText = "Just now";
  } else if (diffHours < 24) {
    lastUpdateText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    lastUpdateText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    lastUpdateText = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  return {
    id: deal.id,
    fundName: deal.fundName,
    status: deal.status as Deal["status"],
    amount: deal.amount || 0,
    stage: deal.stage,
    lastUpdate: lastUpdateText,
    riskScore: deal.riskScore || undefined,
  };
}

export default function DealPipelinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: prospectsData = [], isLoading: prospectsLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const { data: dealsData = [], isLoading: dealsLoading } = useQuery<DealType[]>({
    queryKey: ["/api/deals"],
  });

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    console.log("Running predictive analysis...");
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const prospects = prospectsData.map(prospectToFundScore);
  const deals = dealsData.map(dealTypeToDeal);

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = deal.fundName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProspects = prospects.filter((fund) => {
    if (priorityFilter === "all") return true;
    return fund.recommendation === priorityFilter;
  });

  const highPriorityCount = prospects.filter(f => f.recommendation === "high-priority").length;
  const mediumPriorityCount = prospects.filter(f => f.recommendation === "medium-priority").length;

  const statusCounts = {
    lead: deals.filter(d => d.status === "lead").length,
    underwriting: deals.filter(d => d.status === "underwriting").length,
    approved: deals.filter(d => d.status === "approved").length,
    monitoring: deals.filter(d => d.status === "monitoring").length,
  };

  if (prospectsLoading || dealsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Deal Pipeline</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Prospect identification through deal closure - end-to-end pipeline management
          </p>
        </div>
        <Button data-testid="button-new-deal" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">High-Priority Prospects</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold font-mono tabular-nums">{highPriorityCount}</p>
              <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                Hot
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">{statusCounts.lead}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">In Underwriting</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">{statusCounts.underwriting}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono tabular-nums">{statusCounts.monitoring}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prospects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="prospects" data-testid="tab-prospects">
            <Target className="mr-2 h-4 w-4" />
            Prospects & Origination
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            <Filter className="mr-2 h-4 w-4" />
            Active Deals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Predictive Fund Scoring & Identification</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered analysis of 200-500 funds for NAV loan opportunity
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Universe</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold font-mono tabular-nums">487</p>
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
                        Score 8+
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
                        Score 6-7
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold font-mono tabular-nums">42%</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

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
                  <Button variant="outline" data-testid="button-export-prospects" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FundScoringTable
                funds={filteredProspects}
                onEngage={(id) => console.log("Engage with fund:", id)}
                onViewLinkedIn={(url) => window.open(url, '_blank')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-deals"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="underwriting">Underwriting</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="button-export-deals" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Deal Pipeline</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredDeals.length} deals in pipeline
                  </p>
                </div>
                <Badge variant="outline">
                  {filteredDeals.length} / {deals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DealTable
                deals={filteredDeals}
                onViewDeal={(id: string) => console.log(`View deal ${id}`)}
                onEditDeal={(id: string) => console.log(`Edit deal ${id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
