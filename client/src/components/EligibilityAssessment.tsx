import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface EligibilityCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warning" | "unknown";
  message: string;
  required: boolean;
}

interface EligibilityAssessmentProps {
  prospect: any;
}

export function EligibilityAssessment({ prospect }: EligibilityAssessmentProps) {
  const checks: EligibilityCheck[] = [
    {
      id: "fund-size",
      label: "Fund Size",
      status: prospect.fundSize && prospect.fundSize >= 100_000_000 && prospect.fundSize <= 500_000_000 
        ? "pass" 
        : prospect.fundSize 
          ? "warning" 
          : "unknown",
      message: prospect.fundSize 
        ? `$${(prospect.fundSize / 1_000_000).toFixed(0)}M - ${prospect.fundSize >= 100_000_000 && prospect.fundSize <= 500_000_000 ? "Target market" : "Outside target range ($100M-$500M)"}`
        : "Fund size not available",
      required: true,
    },
    {
      id: "vintage",
      label: "Vintage Year",
      status: prospect.vintage && prospect.vintage >= new Date().getFullYear() - 10 
        ? "pass" 
        : prospect.vintage 
          ? "warning" 
          : "unknown",
      message: prospect.vintage 
        ? `${prospect.vintage} - ${prospect.vintage >= new Date().getFullYear() - 10 ? "Recent vintage" : "Older vintage (>10 years)"}`
        : "Vintage year not available",
      required: false,
    },
    {
      id: "portfolio",
      label: "Portfolio Diversification",
      status: prospect.portfolioCount && prospect.portfolioCount >= 5 
        ? "pass" 
        : prospect.portfolioCount 
          ? "warning" 
          : "unknown",
      message: prospect.portfolioCount 
        ? `${prospect.portfolioCount} companies - ${prospect.portfolioCount >= 5 ? "Well diversified" : "Concentrated portfolio"}`
        : "Portfolio count not available",
      required: true,
    },
    {
      id: "gp-info",
      label: "GP Information",
      status: prospect.gpName || prospect.gpFirmName ? "pass" : "fail",
      message: prospect.gpName || prospect.gpFirmName 
        ? "GP information available" 
        : "GP information missing - required for underwriting",
      required: true,
    },
    {
      id: "track-record",
      label: "GP Track Record",
      status: prospect.gpTrackRecord ? "pass" : "warning",
      message: prospect.gpTrackRecord 
        ? "Track record documented" 
        : "Track record not documented",
      required: false,
    },
    {
      id: "sectors",
      label: "Sector Focus",
      status: prospect.sectors && prospect.sectors.length > 0 ? "pass" : "warning",
      message: prospect.sectors && prospect.sectors.length > 0
        ? `${prospect.sectors.length} sector(s) identified`
        : "Sector information not available",
      required: false,
    },
  ];

  const passedChecks = checks.filter(c => c.status === "pass").length;
  const requiredChecks = checks.filter(c => c.required);
  const passedRequired = requiredChecks.filter(c => c.status === "pass").length;
  const overallScore = (passedChecks / checks.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "fail":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getOverallStatus = (): { label: string; className: string } => {
    if (passedRequired === requiredChecks.length && overallScore >= 80) {
      return { label: "Eligible", className: "bg-green-500/10 text-green-500 border-green-500/20" };
    } else if (passedRequired >= requiredChecks.length - 1) {
      return { label: "Review Required", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" };
    } else {
      return { label: "Not Eligible", className: "bg-red-500/10 text-red-500 border-red-500/20" };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <Card data-testid="card-eligibility">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Eligibility Assessment</CardTitle>
            <CardDescription>
              NAV lending criteria for lower-middle market PE funds
            </CardDescription>
          </div>
          <Badge variant="outline" className={overallStatus.className} data-testid="badge-overall-status">
            {overallStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Eligibility Score</span>
            <span className="text-muted-foreground" data-testid="text-eligibility-score">
              {passedChecks}/{checks.length} checks passed
            </span>
          </div>
          <Progress value={overallScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Required criteria: {passedRequired}/{requiredChecks.length} met
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border"
              data-testid={`check-${check.id}`}
            >
              <div className="mt-0.5">{getStatusIcon(check.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{check.label}</span>
                  {check.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{check.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-sm">
            <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="text-muted-foreground">
              {overallStatus.label === "Eligible" && (
                "This prospect meets all required criteria for NAV lending. Proceed to underwriting."
              )}
              {overallStatus.label === "Review Required" && (
                "This prospect meets most criteria but requires additional review. Missing information should be obtained during due diligence."
              )}
              {overallStatus.label === "Not Eligible" && (
                "This prospect does not meet minimum required criteria. Consider declining or requesting additional documentation."
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
