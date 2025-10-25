import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";

export default function CovenantMonitoringPage() {
  const { data: facilities = [], isLoading: facilitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  // Aggregate covenant status across all facilities
  const aggregateCovStatus = facilities.reduce(
    (acc, facility) => {
      const covenants = facility.covenants || [];
      covenants.forEach((cov: any) => {
        if (cov.status === "compliant") acc.compliant++;
        else if (cov.status === "warning") acc.warning++;
        else if (cov.status === "breach") acc.breach++;
      });
      return acc;
    },
    { compliant: 0, warning: 0, breach: 0 }
  );

  const totalCovenants =
    aggregateCovStatus.compliant +
    aggregateCovStatus.warning +
    aggregateCovStatus.breach;

  const complianceRate = totalCovenants > 0
    ? (aggregateCovStatus.compliant / totalCovenants) * 100
    : 100;

  const getCovenantIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "breach":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCovenantBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            Compliant
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Warning
          </Badge>
        );
      case "breach":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            Breach
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatValue = (value: number, covenantType: string) => {
    // Format based on covenant type
    // LTV and coverage ratios are stored as integers (e.g., 65 = 65%)
    if (covenantType.includes("ltv")) {
      return `${value.toFixed(1)}%`;
    }
    // Debt/EBITDA and similar ratios are stored in basis points (150 = 1.50x)
    if (covenantType.includes("debt") || covenantType.includes("coverage") || covenantType.includes("ratio")) {
      return `${(value / 100).toFixed(2)}x`;
    }
    // Currency values
    if (covenantType.includes("liquidity") || covenantType.includes("cash")) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    }
    return value.toLocaleString();
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Covenant Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">
          Automated compliance tracking for NAV lending covenants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-compliance">
              {complianceRate.toFixed(1)}%
            </div>
            <Progress value={complianceRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {aggregateCovStatus.compliant} of {totalCovenants} covenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-compliant">
              {aggregateCovStatus.compliant}
            </div>
            <p className="text-xs text-muted-foreground">Meeting all requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-warnings">
              {aggregateCovStatus.warning}
            </div>
            <p className="text-xs text-muted-foreground">Approaching threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breaches</CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-breaches">
              {aggregateCovStatus.breach}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Covenant Details by Facility */}
      {facilitiesLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : facilities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No facilities found</h3>
            <p className="text-muted-foreground">
              Facilities with covenants will appear here for monitoring
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {facilities.map((facility) => {
            const covenants = facility.covenants || [];
            
            if (covenants.length === 0) {
              return null; // Skip facilities without covenants
            }

            return (
              <Card key={facility.id} data-testid={`card-facility-${facility.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{facility.fundName}</CardTitle>
                      <CardDescription>
                        {facility.lenderName} • {covenants.length} covenant(s)
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {facility.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {covenants.map((covenant: any) => {
                      const statusIcon = getCovenantIcon(covenant.status);
                      const statusBadge = getCovenantBadge(covenant.status);

                      return (
                        <div
                          key={covenant.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border"
                          data-testid={`covenant-${covenant.id}`}
                        >
                          <div className="mt-1">{statusIcon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h4 className="font-medium">
                                {covenant.covenantType
                                  .split("_")
                                  .map((word: string) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  )
                                  .join(" ")}
                              </h4>
                              {statusBadge}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Threshold
                                </div>
                                <div className="font-medium">
                                  {covenant.thresholdOperator.replace("_", " ")}{" "}
                                  {formatValue(covenant.thresholdValue, covenant.covenantType)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Current Value
                                </div>
                                <div className="font-medium">
                                  {covenant.currentValue
                                    ? formatValue(covenant.currentValue, covenant.covenantType)
                                    : "N/A"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Last Checked
                                </div>
                                <div className="font-medium">
                                  {covenant.lastChecked
                                    ? new Date(covenant.lastChecked).toLocaleDateString()
                                    : "Never"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Check Frequency
                                </div>
                                <div className="font-medium capitalize">
                                  {covenant.checkFrequency}
                                </div>
                              </div>
                            </div>

                            {covenant.status === "breach" && (
                              <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-red-500">
                                    <strong>Covenant Breach:</strong> This facility has violated
                                    the {covenant.covenantType.replace("_", " ")} covenant.
                                    Immediate action required.
                                    {covenant.breachNotified && " (Lender notified)"}
                                  </div>
                                </div>
                              </div>
                            )}

                            {covenant.status === "warning" && (
                              <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-yellow-500">
                                    <strong>Warning:</strong> Current value is approaching the
                                    covenant threshold. Monitor closely.
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
