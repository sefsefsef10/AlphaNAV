import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface LTVCalculatorProps {
  fundSize: number | null;
  defaultLoanAmount?: number;
}

export function LTVCalculator({ fundSize, defaultLoanAmount }: LTVCalculatorProps) {
  const [loanAmount, setLoanAmount] = useState(defaultLoanAmount || 0);
  const [navValue, setNavValue] = useState(fundSize || 0);
  
  useEffect(() => {
    if (fundSize) {
      setNavValue(fundSize);
      if (!defaultLoanAmount) {
        setLoanAmount(Math.round(fundSize * 0.5)); // Default to 50% LTV
      }
    }
  }, [fundSize, defaultLoanAmount]);

  const ltvRatio = navValue > 0 ? (loanAmount / navValue) * 100 : 0;

  const getLTVStatus = (ltv: number): { label: string; color: string; className: string } => {
    if (ltv <= 50) return { label: "Conservative", color: "green", className: "bg-green-500/10 text-green-500 border-green-500/20" };
    if (ltv <= 65) return { label: "Moderate", color: "blue", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    if (ltv <= 75) return { label: "Aggressive", color: "yellow", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" };
    return { label: "High Risk", color: "red", className: "bg-red-500/10 text-red-500 border-red-500/20" };
  };

  const status = getLTVStatus(ltvRatio);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card data-testid="card-ltv-calculator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          LTV Calculator
        </CardTitle>
        <CardDescription>
          Calculate loan-to-value ratio for NAV financing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* NAV Value Input */}
        <div className="space-y-2">
          <Label htmlFor="navValue">Current NAV (Fund Value)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="navValue"
              type="number"
              value={navValue}
              onChange={(e) => setNavValue(Number(e.target.value))}
              className="pl-9"
              data-testid="input-nav-value"
            />
          </div>
        </div>

        {/* Loan Amount Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="loanAmount">Loan Amount</Label>
            <span className="text-lg font-semibold" data-testid="text-loan-amount">
              {formatCurrency(loanAmount)}
            </span>
          </div>
          <Slider
            id="loanAmount"
            min={0}
            max={navValue}
            step={navValue / 100}
            value={[loanAmount]}
            onValueChange={(value) => setLoanAmount(value[0])}
            className="w-full"
            data-testid="slider-loan-amount"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>{formatCurrency(navValue)}</span>
          </div>
        </div>

        {/* LTV Ratio Display */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Loan-to-Value Ratio</span>
            <Badge variant="outline" className={status.className} data-testid="badge-ltv-status">
              {status.label}
            </Badge>
          </div>
          <div className="text-4xl font-bold" data-testid="text-ltv-ratio">
            {ltvRatio.toFixed(1)}%
          </div>
          
          {/* Risk Indicator */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="text-muted-foreground">
                {ltvRatio <= 50 && "Low risk. Conservative lending with strong coverage."}
                {ltvRatio > 50 && ltvRatio <= 65 && "Moderate risk. Standard NAV lending parameters."}
                {ltvRatio > 65 && ltvRatio <= 75 && "Elevated risk. Requires strong covenants and monitoring."}
                {ltvRatio > 75 && "High risk. Outside typical NAV lending parameters."}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Coverage Ratio</div>
            <div className="text-lg font-semibold" data-testid="text-coverage-ratio">
              {navValue > 0 ? (navValue / loanAmount).toFixed(2) : "0.00"}x
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Available Equity</div>
            <div className="text-lg font-semibold" data-testid="text-available-equity">
              {formatCurrency(navValue - loanAmount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
