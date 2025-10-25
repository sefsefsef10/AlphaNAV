import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, DollarSign, Calendar, Users } from "lucide-react";
import type { AdvisorDeal, LenderInvitation } from "@shared/schema";

export default function AdvisorDealDetail() {
  const [, params] = useRoute("/advisor/deals/:id");
  const [, setLocation] = useLocation();
  const dealId = params?.id;

  const { data: deal, isLoading: dealLoading } = useQuery<AdvisorDeal>({
    queryKey: [`/api/advisor-deals/${dealId}`],
    enabled: !!dealId,
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<LenderInvitation[]>({
    queryKey: [`/api/lender-invitations/${dealId}`],
    enabled: !!dealId,
  });

  if (!dealId) {
    return <div>Invalid deal ID</div>;
  }

  if (dealLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!deal) {
    return <div>Deal not found</div>;
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "lost": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "active": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "draft": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/advisor/active-rfps")}
          data-testid="button-back-to-rfps"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="heading-deal-detail">
            {deal.isAnonymized ? "Confidential Fund" : deal.gpFundName}
          </h1>
          <p className="text-muted-foreground mt-1">
            RFP Details
          </p>
        </div>
        <Badge className={getStatusColor(deal.status)} data-testid="badge-deal-status">
          {deal.status}
        </Badge>
      </div>

      {/* Deal Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fund Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Fund Name</p>
              <p className="font-medium" data-testid="text-fund-name">
                {deal.isAnonymized ? "Confidential" : deal.gpFundName}
              </p>
            </div>
            {deal.fundAum && (
              <div>
                <p className="text-sm text-muted-foreground">Fund AUM</p>
                <p className="font-medium" data-testid="text-fund-aum">
                  {formatCurrency(deal.fundAum)}
                </p>
              </div>
            )}
            {deal.fundVintage && (
              <div>
                <p className="text-sm text-muted-foreground">Vintage Year</p>
                <p className="font-medium" data-testid="text-vintage">
                  {deal.fundVintage}
                </p>
              </div>
            )}
            {deal.fundPortfolioCount && (
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Companies</p>
                <p className="font-medium" data-testid="text-portfolio-count">
                  {deal.fundPortfolioCount}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Deal Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deal.loanAmount && (
              <div>
                <p className="text-sm text-muted-foreground">Requested Amount</p>
                <p className="font-medium text-lg" data-testid="text-loan-amount">
                  {formatCurrency(deal.loanAmount)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Urgency Level</p>
              <p className="font-medium capitalize" data-testid="text-urgency">
                {deal.urgency}
              </p>
            </div>
            {deal.submissionDeadline && (
              <div>
                <p className="text-sm text-muted-foreground">Submission Deadline</p>
                <p className="font-medium" data-testid="text-deadline">
                  {new Date(deal.submissionDeadline).toLocaleDateString()}
                </p>
              </div>
            )}
            {deal.borrowingPermitted !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Borrowing Permitted</p>
                <p className="font-medium" data-testid="text-borrowing-permitted">
                  {deal.borrowingPermitted ? "Yes" : "No"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lender Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lender Invitations
            <Badge variant="secondary" data-testid="badge-invitation-count">
              {invitations.length} Invited
            </Badge>
          </CardTitle>
          <CardDescription>
            Track lender responses and term sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <Skeleton className="h-32" />
          ) : invitations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No lender invitations yet
            </p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`invitation-${invitation.lenderName.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div>
                    <p className="font-medium">{invitation.lenderName}</p>
                    {invitation.invitedAt && (
                      <p className="text-sm text-muted-foreground">
                        Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {invitation.response || "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internal Notes */}
      {deal.advisorNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">
              {deal.advisorNotes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
