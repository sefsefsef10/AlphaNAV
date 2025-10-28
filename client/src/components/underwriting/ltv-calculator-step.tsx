import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, TrendingDown, Calculator, DollarSign, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StressScenario {
  name: string;
  navStress: number;
  newNav: number;
  newLtv: number;
  breachRisk: "low" | "medium" | "high";
  exceedsCovenant: boolean;
}

interface LTVCalculation {
  id: string;
  sessionId: string;
  fundNav: number;
  targetLtv: string;
  maxLtv: string;
  requestedFacilitySize: number | null;
  maxFacilitySize: number;
  recommendedFacilitySize: number;
  baselineLtv: string;
  scenarios: StressScenario[];
  breachProbability: string;
  recommendedSofr: number;
  marketMedianPricing: number;
  pricingRationale: string;
  calculatedAt: string;
}

interface LtvCalculatorStepProps {
  sessionId: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function LtvCalculatorStep({
  sessionId,
  onComplete,
  onBack,
}: LtvCalculatorStepProps) {
  const [requestedSize, setRequestedSize] = useState<string>("");
  const [targetLtv, setTargetLtv] = useState<string>("15");
  const [maxLtv, setMaxLtv] = useState<string>("18");
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const { data: ltvCalc, isLoading, error, isError } = useQuery<LTVCalculation>({
    queryKey: ["/api/underwriting/sessions", sessionId, "ltv"],
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        targetLtv: parseFloat(targetLtv),
        maxLtv: parseFloat(maxLtv),
      };
      
      if (requestedSize && parseFloat(requestedSize) > 0) {
        payload.requestedFacilitySize = parseFloat(requestedSize);
      }
      
      return await apiRequest(`/api/underwriting/sessions/${sessionId}/ltv`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/underwriting/sessions", sessionId, "ltv"] });
      setIsCalculating(false);
      toast({
        title: "LTV Calculated",
        description: "Loan-to-value analysis has been successfully calculated.",
      });
    },
    onError: (error: any) => {
      console.error("Error calculating LTV:", error);
      setIsCalculating(false);
      toast({
        title: "Calculation Failed",
        description: error?.message || "Failed to calculate LTV. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCalculate = () => {
    setIsCalculating(true);
    calculateMutation.mutate();
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getRiskColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
    }
  };

  const getBreachProbabilityColor = (probability: number) => {
    if (probability <= 20) return "text-green-500";
    if (probability <= 40) return "text-yellow-500";
    return "text-destructive";
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="container-ltv-loading">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show calculate prompt if no LTV calculation exists
  const shouldCalculate = isError && error?.status === 404;

  if (shouldCalculate) {
    return (
      <div className="space-y-6" data-testid="container-ltv-calculate-prompt">
        <Alert>
          <Calculator className="h-4 w-4" />
          <AlertDescription>
            Calculate LTV and stress test scenarios to determine facility sizing and pricing.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              LTV Calculator Setup
            </CardTitle>
            <CardDescription>
              Configure facility parameters and stress test assumptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="input-requested-facility-size">Requested Facility Size ($)</Label>
                <Input
                  id="input-requested-facility-size"
                  data-testid="input-requested-facility-size"
                  type="number"
                  placeholder="e.g., 75000000"
                  value={requestedSize}
                  onChange={(e) => setRequestedSize(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use maximum target LTV
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-target-ltv">Target LTV (%)</Label>
                <Input
                  id="input-target-ltv"
                  data-testid="input-target-ltv"
                  type="number"
                  min="1"
                  max="100"
                  value={targetLtv}
                  onChange={(e) => setTargetLtv(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ideal facility size as % of NAV
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-max-ltv">Max Covenant LTV (%)</Label>
                <Input
                  id="input-max-ltv"
                  data-testid="input-max-ltv"
                  type="number"
                  min="1"
                  max="100"
                  value={maxLtv}
                  onChange={(e) => setMaxLtv(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Breach threshold for covenants
                </p>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full"
              data-testid="button-calculate-ltv"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {isCalculating ? "Calculating..." : "Calculate LTV & Stress Tests"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            Back
          </Button>
          <Button onClick={onComplete} disabled data-testid="button-complete-underwriting">
            Complete Underwriting
          </Button>
        </div>
      </div>
    );
  }

  if (!ltvCalc) {
    return (
      <Alert variant="destructive" data-testid="alert-ltv-error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading LTV calculation. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const baselineLtvNum = parseFloat(ltvCalc.baselineLtv);
  const breachProbNum = parseFloat(ltvCalc.breachProbability);
  const targetLtvNum = parseFloat(ltvCalc.targetLtv);
  const maxLtvNum = parseFloat(ltvCalc.maxLtv);

  return (
    <div className="space-y-6" data-testid="container-ltv-results">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fund NAV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono tabular-nums" data-testid="text-fund-nav">
              {formatCurrency(ltvCalc.fundNav)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommended Facility</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono tabular-nums" data-testid="text-recommended-facility">
              {formatCurrency(ltvCalc.recommendedFacilitySize)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {formatCurrency(ltvCalc.maxFacilitySize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baseline LTV</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono tabular-nums" data-testid="text-baseline-ltv">
              {baselineLtvNum.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {targetLtvNum}% | Max: {maxLtvNum}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breach Probability</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-mono tabular-nums ${getBreachProbabilityColor(breachProbNum)}`}
              data-testid="text-breach-probability"
            >
              {breachProbNum.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Under stress scenarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stress Test Scenarios Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Stress Test Scenarios
          </CardTitle>
          <CardDescription>
            LTV analysis under various market downturn scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead className="text-right">NAV Stress</TableHead>
                <TableHead className="text-right">Adjusted NAV</TableHead>
                <TableHead className="text-right">LTV</TableHead>
                <TableHead className="text-right">Risk</TableHead>
                <TableHead className="text-right">Covenant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ltvCalc.scenarios.map((scenario, idx) => (
                <TableRow key={idx} data-testid={`row-scenario-${idx}`}>
                  <TableCell className="font-medium" data-testid={`text-scenario-name-${idx}`}>
                    {scenario.name}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums" data-testid={`text-nav-stress-${idx}`}>
                    {scenario.navStress === 0 ? "—" : `${scenario.navStress}%`}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums" data-testid={`text-adjusted-nav-${idx}`}>
                    {formatCurrency(scenario.newNav)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums" data-testid={`text-scenario-ltv-${idx}`}>
                    {scenario.newLtv.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right" data-testid={`badge-risk-${idx}`}>
                    <Badge variant="outline" className={getRiskColor(scenario.breachRisk)}>
                      {scenario.breachRisk}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" data-testid={`icon-covenant-${idx}`}>
                    {scenario.exceedsCovenant ? (
                      <AlertCircle className="w-4 h-4 text-destructive inline" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500 inline" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Recommendations
          </CardTitle>
          <CardDescription>
            Interest rate spread recommendations based on risk profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recommended SOFR Spread</Label>
              <div className="text-3xl font-mono tabular-nums" data-testid="text-recommended-sofr">
                SOFR + {ltvCalc.recommendedSofr} bps
              </div>
              <p className="text-sm text-muted-foreground">
                ({(ltvCalc.recommendedSofr / 100).toFixed(2)}% annual spread)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Market Median Pricing</Label>
              <div className="text-3xl font-mono tabular-nums" data-testid="text-market-median">
                SOFR + {ltvCalc.marketMedianPricing} bps
              </div>
              <p className="text-sm text-muted-foreground">
                NAV lending market benchmark
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription data-testid="text-pricing-rationale">
              <strong>Pricing Rationale:</strong> {ltvCalc.pricingRationale}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Recalculate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Adjust Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input-requested-facility-size-2">Requested Facility Size ($)</Label>
              <Input
                id="input-requested-facility-size-2"
                data-testid="input-requested-facility-size-adjust"
                type="number"
                placeholder="e.g., 75000000"
                value={requestedSize}
                onChange={(e) => setRequestedSize(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-target-ltv-2">Target LTV (%)</Label>
              <Input
                id="input-target-ltv-2"
                data-testid="input-target-ltv-adjust"
                type="number"
                min="1"
                max="100"
                value={targetLtv}
                onChange={(e) => setTargetLtv(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-max-ltv-2">Max Covenant LTV (%)</Label>
              <Input
                id="input-max-ltv-2"
                data-testid="input-max-ltv-adjust"
                type="number"
                min="1"
                max="100"
                value={maxLtv}
                onChange={(e) => setMaxLtv(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            variant="outline"
            className="w-full"
            data-testid="button-recalculate-ltv"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {isCalculating ? "Recalculating..." : "Recalculate"}
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button onClick={onComplete} data-testid="button-complete-underwriting">
          Complete Underwriting
        </Button>
      </div>
    </div>
  );
}
