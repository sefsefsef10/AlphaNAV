import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send,
  TrendingUp,
  Users,
  Award
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { AdvisorDeal, LenderInvitation, TermSheet } from "@shared/schema";

export default function AdvisorActiveRFPs() {
  const [, setLocation] = useLocation();
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);

  // Query all advisor deals
  const { data: deals = [], isLoading } = useQuery<AdvisorDeal[]>({
    queryKey: ["/api/advisor-deals"],
  });

  const activeDealIds = deals.map(d => d.id);

  // Query lender invitations for all deals
  const { data: allInvitations = [] } = useQuery<LenderInvitation[]>({
    queryKey: ["/api/lender-invitations", { deals: activeDealIds.join(',') }],
    enabled: activeDealIds.length > 0,
  });

  // Query term sheets for all deals
  const { data: allTermSheets = [] } = useQuery<TermSheet[]>({
    queryKey: ["/api/term-sheets", { deals: activeDealIds.join(',') }],
    enabled: activeDealIds.length > 0,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won": return "bg-success text-success-foreground";
      case "lost": return "bg-destructive text-destructive-foreground";
      case "active": return "bg-primary text-primary-foreground";
      case "draft": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getNavIqStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-success text-success-foreground";
      case "declined": return "bg-destructive text-destructive-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDealInvitations = (dealId: string) => {
    return allInvitations.filter(inv => inv.advisorDealId === dealId);
  };

  const getDealTermSheets = (dealId: string) => {
    return allTermSheets.filter(ts => ts.advisorDealId === dealId);
  };

  const calculateProgress = (deal: AdvisorDeal) => {
    const invitations = getDealInvitations(deal.id);
    const termSheets = getDealTermSheets(deal.id);
    
    if (deal.status === "won") return 100;
    if (deal.status === "lost") return 0;
    
    const totalInvited = invitations.length + 1; // +1 for NAV IQ
    const totalResponded = invitations.filter(inv => inv.response).length + 
                          (deal.navIqStatus !== "pending" ? 1 : 0);
    const totalTermSheets = termSheets.length + 
                           (deal.navIqTermSheetDate ? 1 : 0);
    
    const responseProgress = (totalResponded / totalInvited) * 50;
    const termSheetProgress = (totalTermSheets / totalInvited) * 50;
    
    return Math.round(responseProgress + termSheetProgress);
  };

  const activeDells = deals.filter(d => d.status === "active");
  const wonDeals = deals.filter(d => d.status === "won");
  const draftDeals = deals.filter(d => d.status === "draft");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your RFPs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active RFPs</h1>
        <p className="text-muted-foreground mt-1">
          Track competitive processes and manage lender responses
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{activeDells.length}</div>
            <p className="text-xs text-muted-foreground">In market now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{wonDeals.length}</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              ${(deals.reduce((sum, d) => sum + (d.loanAmount || 0), 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Across all deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              ${(wonDeals.reduce((sum, d) => sum + (d.commissionEarned || 0), 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">From {wonDeals.length} deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Deals Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({activeDells.length})
          </TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">
            Drafts ({draftDeals.length})
          </TabsTrigger>
          <TabsTrigger value="won" data-testid="tab-won">
            Won ({wonDeals.length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({deals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeDells.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active RFPs</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  You don't have any active competitive processes. Submit a new deal to get started.
                </p>
                <Button onClick={() => setLocation("/advisor/submit-deal")} data-testid="button-submit-deal">
                  <Send className="mr-2 h-4 w-4" />
                  Submit New Deal
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeDells.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                invitations={getDealInvitations(deal.id)}
                termSheets={getDealTermSheets(deal.id)}
                progress={calculateProgress(deal)}
                onViewDetails={() => setLocation(`/advisor/deals/${deal.id}`)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftDeals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              invitations={getDealInvitations(deal.id)}
              termSheets={getDealTermSheets(deal.id)}
              progress={0}
              onViewDetails={() => setLocation(`/advisor/deals/${deal.id}`)}
            />
          ))}
        </TabsContent>

        <TabsContent value="won" className="space-y-4">
          {wonDeals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              invitations={getDealInvitations(deal.id)}
              termSheets={getDealTermSheets(deal.id)}
              progress={100}
              onViewDetails={() => setLocation(`/advisor/deals/${deal.id}`)}
            />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {deals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              invitations={getDealInvitations(deal.id)}
              termSheets={getDealTermSheets(deal.id)}
              progress={calculateProgress(deal)}
              onViewDetails={() => setLocation(`/advisor/deals/${deal.id}`)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DealCardProps {
  deal: AdvisorDeal;
  invitations: LenderInvitation[];
  termSheets: TermSheet[];
  progress: number;
  onViewDetails: () => void;
}

function DealCard({ deal, invitations, termSheets, progress, onViewDetails }: DealCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "won": return "bg-success text-success-foreground";
      case "lost": return "bg-destructive text-destructive-foreground";
      case "active": return "bg-primary text-primary-foreground";
      case "draft": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getNavIqStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-success text-success-foreground";
      case "declined": return "bg-destructive text-destructive-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const totalInvited = invitations.length + 1; // +1 for NAV IQ
  const responded = invitations.filter(inv => inv.response).length + 
                   (deal.navIqStatus !== "pending" ? 1 : 0);
  const termSheetCount = termSheets.length + (deal.navIqTermSheetDate ? 1 : 0);

  return (
    <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={onViewDetails}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {deal.isAnonymized ? "Confidential Fund" : deal.gpFundName}
            </CardTitle>
            <CardDescription>
              {deal.loanAmount ? `$${(deal.loanAmount / 1000000).toFixed(1)}M` : "Amount TBD"} • 
              {deal.urgency === "urgent" ? " Urgent" : " Standard"} Process
              {deal.submissionDeadline && ` • Due ${new Date(deal.submissionDeadline).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(deal.status)}>
              {deal.status}
            </Badge>
            {deal.winner && (
              <Badge variant="outline" className="bg-success/10 text-success">
                Won by {deal.winner}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {deal.status === "active" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">RFP Progress</span>
              <span className="font-medium tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Lenders Invited
            </p>
            <p className="text-lg font-semibold tabular-nums">{totalInvited}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Responses
            </p>
            <p className="text-lg font-semibold tabular-nums">{responded}/{totalInvited}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Term Sheets
            </p>
            <p className="text-lg font-semibold tabular-nums">{termSheetCount}</p>
          </div>
        </div>

        {/* NAV IQ Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">NAV IQ Capital</span>
          </div>
          <Badge className={getNavIqStatusColor(deal.navIqStatus)} variant="outline">
            {deal.navIqStatus}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            variant="outline"
            data-testid={`button-view-details-${deal.id}`}
          >
            View Details
          </Button>
          {termSheetCount > 1 && deal.status === "active" && (
            <Button 
              className="flex-1"
              data-testid={`button-compare-${deal.id}`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Compare Term Sheets
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
