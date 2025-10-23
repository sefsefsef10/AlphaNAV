import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle2,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  FileText,
} from "lucide-react";
import type { TermSheet } from "@shared/schema";

interface TermSheetComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termSheets: TermSheet[];
  dealId: string;
  fundName: string;
}

export function TermSheetComparison({
  open,
  onOpenChange,
  termSheets,
  dealId,
  fundName,
}: TermSheetComparisonProps) {
  const { toast } = useToast();
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const selectWinnerMutation = useMutation({
    mutationFn: async (lenderName: string) => {
      return await apiRequest("PATCH", `/api/advisor-deals/${dealId}`, {
        status: "won",
        winner: lenderName,
      });
    },
    onSuccess: (_, lenderName) => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisor-deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/term-sheets"] });
      toast({
        title: "Deal Closed Successfully",
        description: `${lenderName} has been selected as the winner`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Close Deal",
        description: error.message,
      });
    },
  });

  if (termSheets.length === 0) {
    return null;
  }

  // Type guard to filter out null/undefined and narrow to number
  const isValidNumber = (value: number | null | undefined): value is number => {
    return typeof value === "number" && !isNaN(value) && isFinite(value);
  };

  // Calculate best values for comparison highlighting
  const rates = termSheets
    .map((ts) => {
      const parsed = parseFloat(ts.pricingRange?.split("-")[0] || "");
      return !isNaN(parsed) ? parsed : null;
    })
    .filter(isValidNumber);
  
  const amounts = termSheets.map((ts) => ts.loanAmount).filter(isValidNumber);
  const ltvs = termSheets.map((ts) => ts.ltvRatio).filter(isValidNumber);
  const termSheetTimelines = termSheets
    .map((ts) => ts.timelineToTermSheet)
    .filter(isValidNumber);
  const closeTimelines = termSheets
    .map((ts) => ts.timelineToClose)
    .filter(isValidNumber);

  const bestValues: {
    lowestRate: number | null;
    highestAmount: number | null;
    lowestLtv: number | null;
    fastestTermSheet: number | null;
    fastestClose: number | null;
  } = {
    lowestRate: rates.length > 0 ? Math.min(...rates) : null,
    highestAmount: amounts.length > 0 ? Math.max(...amounts) : null,
    lowestLtv: ltvs.length > 0 ? Math.min(...ltvs) : null,
    fastestTermSheet:
      termSheetTimelines.length > 0 ? Math.min(...termSheetTimelines) : null,
    fastestClose: closeTimelines.length > 0 ? Math.min(...closeTimelines) : null,
  };

  const handleSelectWinner = (lenderName: string) => {
    setSelectedWinner(lenderName);
    selectWinnerMutation.mutate(lenderName);
  };

  const isBestValue = (
    value: number | null | undefined,
    bestValue: number | null
  ) => {
    // Use explicit null check instead of falsy check to allow 0 as valid
    if (value === null || value === undefined || bestValue === null) return false;
    return value === bestValue;
  };

  const formatPricing = (pricing?: string | null) => {
    if (!pricing) return "Not specified";
    return pricing.includes("-") ? pricing : `${pricing}%`;
  };

  const formatAmount = (amount?: number | null) => {
    if (!amount) return "Not specified";
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const formatDays = (days?: number | null) => {
    if (!days) return "Not specified";
    return `${days} days`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Term Sheet Comparison</DialogTitle>
          <DialogDescription>
            Compare {termSheets.length} term sheets for {fundName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-12rem)]">
          <div className="space-y-6">
            {/* Lender Headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="font-medium text-muted-foreground">Lender</div>
              {termSheets.map((ts) => (
                <div key={ts.id} className="space-y-2">
                  <div className="font-semibold text-lg">{ts.lenderName}</div>
                  <Badge variant="outline" className="text-xs">
                    Submitted {new Date(ts.submittedAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Pricing Range */}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Interest Rate
                </div>
                <p className="text-xs text-muted-foreground">Annual pricing</p>
              </div>
              {termSheets.map((ts) => {
                const rate = parseFloat(ts.pricingRange?.split("-")[0] || "");
                const isBest = isBestValue(rate, bestValues.lowestRate);
                return (
                  <div
                    key={ts.id}
                    className={`p-3 rounded-lg border ${
                      isBest ? "border-success bg-success/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tabular-nums">
                        {formatPricing(ts.pricingRange)}
                      </span>
                      {isBest && <TrendingDown className="h-4 w-4 text-success" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Loan Amount */}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Loan Amount
                </div>
                <p className="text-xs text-muted-foreground">Maximum facility</p>
              </div>
              {termSheets.map((ts) => {
                const isBest = isBestValue(ts.loanAmount, bestValues.highestAmount);
                return (
                  <div
                    key={ts.id}
                    className={`p-3 rounded-lg border ${
                      isBest ? "border-success bg-success/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tabular-nums">
                        {formatAmount(ts.loanAmount)}
                      </span>
                      {isBest && <TrendingUp className="h-4 w-4 text-success" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LTV Ratio */}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  LTV Ratio
                </div>
                <p className="text-xs text-muted-foreground">
                  Loan-to-value percentage
                </p>
              </div>
              {termSheets.map((ts) => {
                const isBest = isBestValue(ts.ltvRatio, bestValues.lowestLtv);
                return (
                  <div
                    key={ts.id}
                    className={`p-3 rounded-lg border ${
                      isBest ? "border-success bg-success/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tabular-nums">
                        {ts.ltvRatio ? `${ts.ltvRatio}%` : "Not specified"}
                      </span>
                      {isBest && <CheckCircle2 className="h-4 w-4 text-success" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline to Term Sheet */}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Time to Term Sheet
                </div>
                <p className="text-xs text-muted-foreground">
                  Days to execute term sheet
                </p>
              </div>
              {termSheets.map((ts) => {
                const isBest = isBestValue(
                  ts.timelineToTermSheet,
                  bestValues.fastestTermSheet
                );
                return (
                  <div
                    key={ts.id}
                    className={`p-3 rounded-lg border ${
                      isBest ? "border-success bg-success/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tabular-nums">
                        {formatDays(ts.timelineToTermSheet)}
                      </span>
                      {isBest && <TrendingDown className="h-4 w-4 text-success" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline to Close */}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Time to Close
                </div>
                <p className="text-xs text-muted-foreground">
                  Days to funding
                </p>
              </div>
              {termSheets.map((ts) => {
                const isBest = isBestValue(ts.timelineToClose, bestValues.fastestClose);
                return (
                  <div
                    key={ts.id}
                    className={`p-3 rounded-lg border ${
                      isBest ? "border-success bg-success/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tabular-nums">
                        {formatDays(ts.timelineToClose)}
                      </span>
                      {isBest && <TrendingDown className="h-4 w-4 text-success" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Key Covenants */}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Key Covenants
                </div>
                <p className="text-xs text-muted-foreground">
                  Financial requirements
                </p>
              </div>
              {termSheets.map((ts) => (
                <div key={ts.id} className="p-3 rounded-lg border border-border">
                  {ts.keyCovenants && typeof ts.keyCovenants === "object" ? (
                    <ul className="space-y-1 text-sm">
                      {Object.entries(ts.keyCovenants as Record<string, unknown>).map(
                        ([key, value]) => (
                          <li key={key} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{key}:</span>{" "}
                            {String(value)}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No covenants specified
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Other Terms */}
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium">Other Terms</div>
                <p className="text-xs text-muted-foreground">
                  Additional conditions
                </p>
              </div>
              {termSheets.map((ts) => (
                <div key={ts.id} className="p-3 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    {ts.otherTerms || "No additional terms"}
                  </p>
                </div>
              ))}
            </div>

            {/* Winner Selection */}
            <div className="grid gap-4 items-start pt-4 border-t" style={{ gridTemplateColumns: `200px repeat(${termSheets.length}, 1fr)` }}>
              <div className="space-y-1">
                <div className="font-medium">Select Winner</div>
                <p className="text-xs text-muted-foreground">
                  Close this deal
                </p>
              </div>
              {termSheets.map((ts) => (
                <Button
                  key={ts.id}
                  onClick={() => handleSelectWinner(ts.lenderName)}
                  disabled={selectWinnerMutation.isPending}
                  data-testid={`button-select-winner-${ts.lenderName}`}
                  className="w-full"
                >
                  {selectedWinner === ts.lenderName &&
                  selectWinnerMutation.isPending ? (
                    "Closing..."
                  ) : (
                    <>
                      <Award className="mr-2 h-4 w-4" />
                      Select Winner
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
