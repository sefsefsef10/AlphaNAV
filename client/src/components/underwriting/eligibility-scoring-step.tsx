import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Info, Calculator } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface EligibilityScore {
  id: string;
  sessionId: string;
  trackRecordScore: number;
  diversificationScore: number;
  liquidityScore: number;
  portfolioQualityScore: number;
  vintageScore: number;
  fundSizeScore: number;
  sectorRiskScore: number;
  geographicRiskScore: number;
  gpExperienceScore: number;
  structureRiskScore: number;
  totalScore: number;
  recommendation: string;
  riskFlags: string[];
  underwriterNotes: string | null;
  scoredAt: string;
  scoredBy: string;
}

interface EligibilityScoringStepProps {
  sessionId: string;
  onNext: () => void;
  onBack: () => void;
}

const scoreCategories = [
  { key: "trackRecordScore", label: "Track Record", icon: TrendingUp, description: "IRR, MOIC, and DPI metrics" },
  { key: "diversificationScore", label: "Diversification", icon: TrendingDown, description: "Portfolio company count and concentration" },
  { key: "liquidityScore", label: "Liquidity", icon: Calculator, description: "Cash reserves and debt ratios" },
  { key: "portfolioQualityScore", label: "Portfolio Quality", icon: CheckCircle, description: "Fund status and performance" },
  { key: "vintageScore", label: "Vintage", icon: Info, description: "Fund vintage year assessment" },
  { key: "fundSizeScore", label: "Fund Size", icon: TrendingUp, description: "AUM in target range" },
  { key: "sectorRiskScore", label: "Sector Risk", icon: AlertCircle, description: "Industry exposure assessment" },
  { key: "geographicRiskScore", label: "Geographic Risk", icon: AlertCircle, description: "Regional concentration" },
  { key: "gpExperienceScore", label: "GP Experience", icon: CheckCircle, description: "Years of experience and team" },
  { key: "structureRiskScore", label: "Structure Risk", icon: Info, description: "Fund structure assessment" },
];

export default function EligibilityScoringStep({
  sessionId,
  onNext,
  onBack,
}: EligibilityScoringStepProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const { data: score, isLoading, error, isError } = useQuery<EligibilityScore>({
    queryKey: ["/api/underwriting/sessions", sessionId, "eligibility-score"],
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/underwriting/sessions/${sessionId}/eligibility-score`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/underwriting/sessions", sessionId, "eligibility-score"] });
      setIsCalculating(false);
      toast({
        title: "Score Calculated",
        description: "Eligibility score has been successfully calculated.",
      });
    },
    onError: (error: any) => {
      console.error("Error calculating score:", error);
      setIsCalculating(false);
      toast({
        title: "Calculation Failed",
        description: error?.message || "Failed to calculate eligibility score. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCalculate = () => {
    setIsCalculating(true);
    calculateMutation.mutate();
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes("Strong Accept")) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (recommendation.includes("Accept")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (recommendation.includes("Review")) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  const getTotalScoreColor = (totalScore: number) => {
    if (totalScore >= 85) return "text-green-500";
    if (totalScore >= 70) return "text-blue-500";
    if (totalScore >= 55) return "text-yellow-500";
    return "text-destructive";
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="container-eligibility-loading">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const is404Error = isError && (error as any)?.status === 404;
  
  if (isError && !is404Error) {
    return (
      <Alert variant="destructive" data-testid="alert-eligibility-error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load eligibility score: {(error as any)?.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!score || is404Error) {
    return (
      <div className="space-y-6" data-testid="container-calculate-prompt">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Eligibility Scoring
            </CardTitle>
            <CardDescription>
              Calculate a comprehensive 10-point eligibility score based on the extracted fund data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert data-testid="alert-calculate-info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                The eligibility scoring system evaluates the fund across 10 critical dimensions, each scored 0-10 points,
                for a total score out of 100. This provides a quantitative assessment to support your underwriting decision.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scoreCategories.map((category) => (
                <div
                  key={category.key}
                  className="flex items-start gap-3 p-4 rounded-md border border-border bg-muted/20"
                  data-testid={`category-${category.key}`}
                >
                  <category.icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{category.label}</div>
                    <div className="text-sm text-muted-foreground">{category.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                data-testid="button-calculate-score"
                className="flex-1"
              >
                {isCalculating ? (
                  <>
                    <Calculator className="w-4 h-4 mr-2 animate-spin" />
                    Calculating Score...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Eligibility Score
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="container-eligibility-results">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Eligibility Assessment</CardTitle>
              <CardDescription>
                Comprehensive 10-point scoring across critical underwriting dimensions
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold tabular-nums ${getTotalScoreColor(score.totalScore)}`} data-testid="text-total-score">
                {score.totalScore}
              </div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Recommendation</span>
              <Badge variant="outline" className={getRecommendationColor(score.recommendation)} data-testid="badge-recommendation">
                {score.recommendation}
              </Badge>
            </div>
          </div>

          {score.riskFlags && score.riskFlags.length > 0 && (
            <Alert variant="destructive" data-testid="alert-risk-flags">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Risk Flags Identified:</div>
                <ul className="list-disc list-inside space-y-1">
                  {score.riskFlags.map((flag, idx) => (
                    <li key={idx} className="text-sm" data-testid={`risk-flag-${idx}`}>
                      {flag}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="font-medium text-sm">Score Breakdown</div>
            <div className="grid gap-4">
              {scoreCategories.map((category) => {
                const scoreValue = score[category.key as keyof EligibilityScore] as number;
                const percentage = (scoreValue / 10) * 100;
                
                return (
                  <div key={category.key} className="space-y-2" data-testid={`score-${category.key}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      <span className="text-sm font-mono tabular-nums" data-testid={`score-value-${category.key}`}>
                        {scoreValue}/10
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" data-testid={`progress-${category.key}`} />
                    <div className="text-xs text-muted-foreground">{category.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCalculate}
              disabled={isCalculating}
              data-testid="button-recalculate"
            >
              {isCalculating ? "Recalculating..." : "Recalculate"}
            </Button>
            <Button onClick={onNext} className="flex-1" data-testid="button-continue">
              Continue to LTV Calculation
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back to Extraction
        </Button>
      </div>
    </div>
  );
}
