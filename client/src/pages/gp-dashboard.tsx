import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building2, Clock, FileText, DollarSign, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Prospect, Facility } from "@shared/schema";

export default function GPDashboard() {
  // Query for prospect (application status)
  const { data: prospects = [] } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  // Query for facilities (approved loans)
  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const latestProspect = prospects[0];
  const activeFacility = facilities.find(f => f.status === "active");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "eligible": return "bg-success text-success-foreground";
      case "needs-review": return "bg-warning text-warning-foreground";
      case "not-eligible": return "bg-destructive text-destructive-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getApplicationProgress = () => {
    if (!latestProspect) return 0;
    if (latestProspect.eligibilityStatus === "eligible") return 75;
    if (latestProspect.eligibilityStatus === "needs-review") return 50;
    return 25;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fund Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your application status and manage your facilities
        </p>
      </div>

      {/* Application Status */}
      {latestProspect && !activeFacility && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Your NAV IQ Capital application progress</CardDescription>
              </div>
              <Badge className={getStatusColor(latestProspect.eligibilityStatus || "")}>
                {latestProspect.eligibilityStatus || "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Application Progress</span>
                <span className="font-medium">{getApplicationProgress()}%</span>
              </div>
              <Progress value={getApplicationProgress()} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fund Name</p>
                <p className="font-medium">{latestProspect.fundName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="font-medium">{latestProspect.overallScore || 0}/10</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Recommendation</p>
                <p className="font-medium capitalize">{latestProspect.recommendation?.replace('-', ' ')}</p>
              </div>
            </div>

            {latestProspect.eligibilityNotes && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">{latestProspect.eligibilityNotes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm text-muted-foreground">
                Our team is reviewing your application. You'll hear from us within 48 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Facility */}
      {activeFacility && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Facility</CardTitle>
              <CardDescription>Your NAV lending facility overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-2xl font-bold tabular-nums">
                      ${(activeFacility.outstandingBalance / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {(activeFacility.interestRate / 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">LTV Ratio</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {activeFacility.ltvRatio}%
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Maturity Date</p>
                  <p className="font-medium">
                    {new Date(activeFacility.maturityDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" data-testid="button-request-draw">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Request Draw
                </Button>
                <Button variant="outline" className="flex-1" data-testid="button-view-documents">
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Covenant Compliance</CardTitle>
              <CardDescription>All covenants in good standing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium">Debt/EBITDA Ratio</p>
                    <p className="text-sm text-muted-foreground">Threshold: ≤ 3.5x</p>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success">
                    3.2x
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium">Interest Coverage</p>
                    <p className="text-sm text-muted-foreground">Threshold: ≥ 2.0x</p>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success">
                    2.4x
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">All covenants compliant</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Application Yet */}
      {!latestProspect && !activeFacility && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Application</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              You haven't started an application yet. Begin the onboarding process to apply for NAV financing.
            </p>
            <Button data-testid="button-start-application">
              <FileText className="mr-2 h-4 w-4" />
              Start Application
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate active-elevate-2 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarterly Report</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Due Soon</div>
            <p className="text-xs text-muted-foreground">Next submission: Feb 28, 2025</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate active-elevate-2 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No new messages</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate active-elevate-2 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24/7</div>
            <p className="text-xs text-muted-foreground">Contact your relationship manager</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
