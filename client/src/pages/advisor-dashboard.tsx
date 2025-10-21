import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingUp, DollarSign, Target, Award } from "lucide-react";
import { Link } from "wouter";
import type { Advisor, AdvisorDeal } from "@shared/schema";

export default function AdvisorDashboard() {
  const mockAdvisorId = "mock-advisor-1";

  const { data: advisor, isLoading: advisorLoading } = useQuery<Advisor>({
    queryKey: ["/api/advisors", mockAdvisorId],
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery<AdvisorDeal[]>({
    queryKey: ["/api/advisor-deals"],
  });

  const mockAdvisor: Advisor = {
    id: mockAdvisorId,
    firmName: "Wheelahan Capital Advisors",
    advisorName: "Richard Wheelahan",
    email: "richard@wheelahan.com",
    phone: "+1 (415) 555-0123",
    linkedInUrl: "https://linkedin.com/in/richardwheel ahan",
    commissionRate: 50,
    status: "active",
    dealsSubmitted: 8,
    dealsWon: 3,
    totalVolume: 75000000,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
  };

  const mockDeals: AdvisorDeal[] = [
    {
      id: "deal-1",
      advisorId: mockAdvisorId,
      gpFundName: "Vista Growth Fund IV",
      gpContactName: null,
      gpContactEmail: null,
      gpContactPhone: null,
      isAnonymized: true,
      status: "active",
      loanAmount: 15000000,
      urgency: "urgent",
      submissionDeadline: new Date("2025-11-15"),
      fundAum: 250000000,
      fundVintage: 2020,
      fundPortfolioCount: 12,
      fundSectors: ["B2B SaaS", "FinTech"],
      borrowingPermitted: true,
      navIqStatus: "term-sheet-sent",
      navIqPricing: { range: "L+425-475", ltv: "12%" },
      navIqTermSheetDate: new Date("2025-10-28"),
      winner: null,
      commissionEarned: null,
      closeDate: null,
      daysToClose: null,
      advisorNotes: "Strong competitive interest from 17Capital and Hayfin",
      createdAt: new Date("2025-10-15"),
      updatedAt: new Date(),
    },
    {
      id: "deal-2",
      advisorId: mockAdvisorId,
      gpFundName: "Catalyst Ventures III",
      gpContactName: null,
      gpContactEmail: null,
      gpContactPhone: null,
      isAnonymized: true,
      status: "won",
      loanAmount: 25000000,
      urgency: "standard",
      submissionDeadline: new Date("2025-09-20"),
      fundAum: 350000000,
      fundVintage: 2019,
      fundPortfolioCount: 15,
      fundSectors: ["Healthcare IT", "Digital Health"],
      borrowingPermitted: true,
      navIqStatus: "won",
      navIqPricing: { range: "L+450", ltv: "10%" },
      navIqTermSheetDate: new Date("2025-09-10"),
      winner: "NAV IQ Capital",
      commissionEarned: 125000,
      closeDate: new Date("2025-10-05"),
      daysToClose: 25,
      advisorNotes: "NAV IQ won with best pricing and fastest execution",
      createdAt: new Date("2025-08-25"),
      updatedAt: new Date(),
    },
  ];

  const currentAdvisor = advisor || mockAdvisor;
  const currentDeals = deals.length > 0 ? deals : mockDeals;
  const activeDeals = currentDeals.filter(d => d.status === "active" || d.status === "term-sheet-sent");

  const winRate = currentAdvisor.dealsSubmitted > 0
    ? Math.round((currentAdvisor.dealsWon / currentAdvisor.dealsSubmitted) * 100)
    : 0;

  const totalCommissions = currentDeals
    .filter(d => d.commissionEarned)
    .reduce((sum, d) => sum + (d.commissionEarned || 0), 0);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "won":
        return "default";
      case "active":
      case "term-sheet-sent":
        return "secondary";
      case "lost":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getUrgencyBadgeVariant = (urgency: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (urgency) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-advisor-dashboard">
            Advisor Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentAdvisor.firmName} • {currentAdvisor.advisorName}
          </p>
        </div>
        <Link href="/advisor/submit-deal">
          <Button data-testid="button-submit-deal">
            <Plus className="mr-2 h-4 w-4" />
            Submit New Deal
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-deals-submitted">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Submitted</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-deals-submitted">
              {currentAdvisor.dealsSubmitted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime submissions</p>
          </CardContent>
        </Card>

        <Card data-testid="card-win-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-win-rate">
              {winRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentAdvisor.dealsWon} of {currentAdvisor.dealsSubmitted} won
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-volume">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-total-volume">
              {formatCurrency(currentAdvisor.totalVolume)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Closed loan volume</p>
          </CardContent>
        </Card>

        <Card data-testid="card-commissions-earned">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-commissions-earned">
              {formatCurrency(totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentAdvisor.commissionRate} bps avg rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-active-deals">
        <CardHeader>
          <CardTitle>Active Competitive Processes</CardTitle>
        </CardHeader>
        <CardContent>
          {activeDeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-active-deals">
                No active deals. Submit your first RFP to get started.
              </p>
              <Link href="/advisor/submit-deal">
                <Button className="mt-4" data-testid="button-submit-first-deal">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit New Deal
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>NAV IQ Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDeals.map((deal) => (
                  <TableRow key={deal.id} data-testid={`row-deal-${deal.id}`}>
                    <TableCell className="font-medium">
                      {deal.isAnonymized ? (
                        <div className="flex items-center gap-2">
                          <span data-testid={`text-fund-name-${deal.id}`}>{deal.gpFundName}</span>
                          <Badge variant="outline" className="text-xs" data-testid={`badge-anonymized-${deal.id}`}>
                            Anonymous
                          </Badge>
                        </div>
                      ) : (
                        <span data-testid={`text-fund-name-${deal.id}`}>{deal.gpFundName}</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums" data-testid={`text-loan-amount-${deal.id}`}>
                      {formatCurrency(deal.loanAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(deal.navIqStatus)} data-testid={`badge-status-${deal.id}`}>
                        {deal.navIqStatus.replace(/-/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUrgencyBadgeVariant(deal.urgency)} data-testid={`badge-urgency-${deal.id}`}>
                        {deal.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums" data-testid={`text-deadline-${deal.id}`}>
                      {formatDate(deal.submissionDeadline)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/advisor/deals/${deal.id}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-deal-${deal.id}`}>
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-recent-closings">
        <CardHeader>
          <CardTitle>Recent Closings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fund Name</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Close Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDeals
                .filter(d => d.status === "won")
                .slice(0, 5)
                .map((deal) => (
                  <TableRow key={deal.id} data-testid={`row-closed-deal-${deal.id}`}>
                    <TableCell className="font-medium" data-testid={`text-closed-fund-${deal.id}`}>
                      {deal.gpFundName}
                    </TableCell>
                    <TableCell data-testid={`text-winner-${deal.id}`}>
                      {deal.winner || "—"}
                    </TableCell>
                    <TableCell className="tabular-nums" data-testid={`text-closed-amount-${deal.id}`}>
                      {formatCurrency(deal.loanAmount)}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium" data-testid={`text-commission-${deal.id}`}>
                      {formatCurrency(deal.commissionEarned)}
                    </TableCell>
                    <TableCell className="tabular-nums" data-testid={`text-close-date-${deal.id}`}>
                      {formatDate(deal.closeDate)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
