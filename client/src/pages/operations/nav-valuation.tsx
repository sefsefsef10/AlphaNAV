import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Target,
  Briefcase,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PortfolioCompany, Facility } from "@shared/schema";
import { formatCurrency } from "@/lib/export-utils";

interface ValuationResult {
  baseValuation: number;
  valuationRange: {
    low: number;
    mid: number;
    high: number;
  };
  methodology: string;
  assumptions: string[];
  confidence: number;
  aiInsights?: string;
}

interface StressTestScenario {
  name: string;
  description: string;
  revenueImpact: number;
  multipleImpact: number;
  marketConditions: string;
}

interface StressTestResult {
  scenario: StressTestScenario;
  valuationImpact: {
    baselineValuation: number;
    stressedValuation: number;
    percentageChange: number;
    dollarChange: number;
  };
  ltvImpact?: {
    baselineLTV: number;
    stressedLTV: number;
    breachesCovenants: boolean;
  };
}

interface PortfolioNAVAnalysis {
  totalNAV: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercentage: number;
  companyCount: number;
  topHoldings: Array<{
    companyId: string;
    companyName: string;
    fairValue: number;
    percentageOfNAV: number;
  }>;
  sectorConcentration: Record<string, number>;
  stressTestSummary?: {
    baselineNAV: number;
    worstCaseNAV: number;
    maxDrawdown: number;
  };
}

export default function NAVValuationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("company");

  // Company valuation state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [currentRevenue, setCurrentRevenue] = useState<string>("");
  const [currentEBITDA, setCurrentEBITDA] = useState<string>("");
  const [revenueGrowthRate, setRevenueGrowthRate] = useState<string>("");
  const [industryMultiple, setIndustryMultiple] = useState<string>("");
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);

  // Stress test state
  const [stressTestCompanyId, setStressTestCompanyId] = useState<string>("");
  const [baselineValuation, setBaselineValuation] = useState<string>("");
  const [stressTestResults, setStressTestResults] = useState<StressTestResult[] | null>(null);

  // Portfolio state
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [portfolioNAV, setPortfolioNAV] = useState<PortfolioNAVAnalysis | null>(null);

  // Fetch companies
  const { data: companies = [] } = useQuery<PortfolioCompany[]>({
    queryKey: ["/api/portfolio-companies"],
  });

  // Fetch facilities
  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  // Fetch stress test scenarios
  const { data: scenarios = [] } = useQuery<StressTestScenario[]>({
    queryKey: ["/api/nav-valuation/scenarios"],
  });

  // Calculate company valuation mutation
  const calculateValuationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/nav-valuation/company", {
        companyId: selectedCompanyId,
        currentRevenue: currentRevenue ? parseFloat(currentRevenue) : undefined,
        currentEBITDA: currentEBITDA ? parseFloat(currentEBITDA) : undefined,
        revenueGrowthRate: revenueGrowthRate ? parseFloat(revenueGrowthRate) : undefined,
        industryMultiple: industryMultiple ? parseFloat(industryMultiple) : undefined,
      });
      return await response.json();
    },
    onSuccess: (data: ValuationResult) => {
      setValuationResult(data);
      toast({
        title: "Valuation Calculated",
        description: "Company valuation has been successfully calculated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate valuation",
        variant: "destructive",
      });
    },
  });

  // Perform stress test mutation
  const performStressTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/nav-valuation/stress-test", {
        companyId: stressTestCompanyId,
        baselineValuation: parseFloat(baselineValuation),
      });
      return await response.json();
    },
    onSuccess: (data: StressTestResult[]) => {
      setStressTestResults(data);
      toast({
        title: "Stress Test Complete",
        description: "Stress test scenarios have been calculated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Stress Test Failed",
        description: error.message || "Failed to perform stress test",
        variant: "destructive",
      });
    },
  });

  // Calculate portfolio NAV mutation
  const calculatePortfolioNAVMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/nav-valuation/portfolio", {
        facilityId: selectedFacilityId || undefined,
      });
      return await response.json();
    },
    onSuccess: (data: PortfolioNAVAnalysis) => {
      setPortfolioNAV(data);
      toast({
        title: "Portfolio NAV Calculated",
        description: "Portfolio NAV has been successfully calculated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate portfolio NAV",
        variant: "destructive",
      });
    },
  });

  // Perform portfolio stress test mutation
  const performPortfolioStressTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/nav-valuation/portfolio/stress-test", {
        facilityId: selectedFacilityId,
      });
      return await response.json();
    },
    onSuccess: (data: PortfolioNAVAnalysis) => {
      setPortfolioNAV(data);
      toast({
        title: "Portfolio Stress Test Complete",
        description: "Portfolio stress testing has been completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Stress Test Failed",
        description: error.message || "Failed to perform portfolio stress test",
        variant: "destructive",
      });
    },
  });

  const handleCalculateValuation = () => {
    if (!selectedCompanyId) {
      toast({
        title: "Company Required",
        description: "Please select a company to value",
        variant: "destructive",
      });
      return;
    }
    calculateValuationMutation.mutate();
  };

  const handlePerformStressTest = () => {
    if (!stressTestCompanyId || !baselineValuation) {
      toast({
        title: "Required Fields",
        description: "Please select a company and enter baseline valuation",
        variant: "destructive",
      });
      return;
    }
    performStressTestMutation.mutate();
  };

  const handleCalculatePortfolioNAV = () => {
    if (!selectedFacilityId) {
      toast({
        title: "Facility Required",
        description: "Please select a facility",
        variant: "destructive",
      });
      return;
    }
    calculatePortfolioNAVMutation.mutate();
  };

  const handlePerformPortfolioStressTest = () => {
    if (!selectedFacilityId) {
      toast({
        title: "Facility Required",
        description: "Please select a facility for stress testing",
        variant: "destructive",
      });
      return;
    }
    performPortfolioStressTestMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">NAV Valuation Module</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered valuation models, stress testing, and portfolio analysis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" data-testid="tab-company-valuation">
            <Calculator className="h-4 w-4 mr-2" />
            Company Valuation
          </TabsTrigger>
          <TabsTrigger value="stress-test" data-testid="tab-stress-test">
            <Activity className="h-4 w-4 mr-2" />
            Stress Testing
          </TabsTrigger>
          <TabsTrigger value="portfolio" data-testid="tab-portfolio-nav">
            <Briefcase className="h-4 w-4 mr-2" />
            Portfolio NAV
          </TabsTrigger>
          <TabsTrigger value="scenarios" data-testid="tab-scenarios">
            <Target className="h-4 w-4 mr-2" />
            Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Company Valuation Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Valuation Calculator</CardTitle>
              <CardDescription>
                Calculate enterprise value using revenue multiples and AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-select">Portfolio Company *</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger id="company-select" data-testid="select-company">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-revenue">Current Revenue ($)</Label>
                  <Input
                    id="current-revenue"
                    type="number"
                    placeholder="e.g., 50000000"
                    value={currentRevenue}
                    onChange={(e) => setCurrentRevenue(e.target.value)}
                    data-testid="input-current-revenue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-ebitda">Current EBITDA ($)</Label>
                  <Input
                    id="current-ebitda"
                    type="number"
                    placeholder="e.g., 12000000"
                    value={currentEBITDA}
                    onChange={(e) => setCurrentEBITDA(e.target.value)}
                    data-testid="input-current-ebitda"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="growth-rate">Revenue Growth Rate (%)</Label>
                  <Input
                    id="growth-rate"
                    type="number"
                    placeholder="e.g., 15"
                    value={revenueGrowthRate}
                    onChange={(e) => setRevenueGrowthRate(e.target.value)}
                    data-testid="input-growth-rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry-multiple">Industry Multiple</Label>
                  <Input
                    id="industry-multiple"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 8.5"
                    value={industryMultiple}
                    onChange={(e) => setIndustryMultiple(e.target.value)}
                    data-testid="input-industry-multiple"
                  />
                </div>
              </div>

              <Button
                onClick={handleCalculateValuation}
                disabled={calculateValuationMutation.isPending || !selectedCompanyId}
                className="w-full md:w-auto"
                data-testid="button-calculate-valuation"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {calculateValuationMutation.isPending ? "Calculating..." : "Calculate Valuation"}
              </Button>

              {valuationResult && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Valuation Results</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Base Valuation</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" data-testid="text-base-valuation">
                            {formatCurrency(valuationResult.baseValuation)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Valuation Range</CardTitle>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Low:</span>
                              <span className="font-medium">{formatCurrency(valuationResult.valuationRange.low)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mid:</span>
                              <span className="font-medium">{formatCurrency(valuationResult.valuationRange.mid)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">High:</span>
                              <span className="font-medium">{formatCurrency(valuationResult.valuationRange.high)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold" data-testid="text-confidence">
                              {valuationResult.confidence}%
                            </div>
                            <Progress value={valuationResult.confidence} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Methodology</h4>
                        <p className="text-sm text-muted-foreground">{valuationResult.methodology}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Key Assumptions</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {valuationResult.assumptions.map((assumption, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              {assumption}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {valuationResult.aiInsights && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>AI Insights:</strong> {valuationResult.aiInsights}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stress Test Tab */}
        <TabsContent value="stress-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Stress Testing</CardTitle>
              <CardDescription>
                Evaluate valuation resilience under adverse market conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stress-test-company">Portfolio Company *</Label>
                  <Select value={stressTestCompanyId} onValueChange={setStressTestCompanyId}>
                    <SelectTrigger id="stress-test-company" data-testid="select-stress-test-company">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseline-valuation">Baseline Valuation ($) *</Label>
                  <Input
                    id="baseline-valuation"
                    type="number"
                    placeholder="e.g., 100000000"
                    value={baselineValuation}
                    onChange={(e) => setBaselineValuation(e.target.value)}
                    data-testid="input-baseline-valuation"
                  />
                </div>
              </div>

              <Button
                onClick={handlePerformStressTest}
                disabled={performStressTestMutation.isPending || !stressTestCompanyId || !baselineValuation}
                className="w-full md:w-auto"
                data-testid="button-perform-stress-test"
              >
                <Activity className="h-4 w-4 mr-2" />
                {performStressTestMutation.isPending ? "Testing..." : "Run Stress Test"}
              </Button>

              {stressTestResults && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-semibold">Stress Test Results</h3>
                  
                  <div className="space-y-4">
                    {stressTestResults.map((result, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{result.scenario.name}</CardTitle>
                              <CardDescription>{result.scenario.description}</CardDescription>
                            </div>
                            <Badge 
                              variant={result.valuationImpact.percentageChange < 0 ? "destructive" : "default"}
                              data-testid={`badge-scenario-${index}`}
                            >
                              {result.valuationImpact.percentageChange > 0 ? '+' : ''}
                              {result.valuationImpact.percentageChange.toFixed(1)}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Baseline Valuation</p>
                              <p className="text-lg font-medium">
                                {formatCurrency(result.valuationImpact.baselineValuation)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Stressed Valuation</p>
                              <p className="text-lg font-medium">
                                {formatCurrency(result.valuationImpact.stressedValuation)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Impact</span>
                              <span className={result.valuationImpact.dollarChange < 0 ? "text-destructive font-medium" : "text-success font-medium"}>
                                {result.valuationImpact.dollarChange > 0 ? '+' : ''}
                                {formatCurrency(result.valuationImpact.dollarChange)}
                              </span>
                            </div>
                          </div>

                          {result.ltvImpact && (
                            <Alert variant={result.ltvImpact.breachesCovenants ? "destructive" : "default"}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Baseline LTV:</span>
                                    <span className="font-medium">{result.ltvImpact.baselineLTV.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Stressed LTV:</span>
                                    <span className="font-medium">{result.ltvImpact.stressedLTV.toFixed(1)}%</span>
                                  </div>
                                  {result.ltvImpact.breachesCovenants && (
                                    <p className="font-semibold mt-2">⚠️ Breaches LTV Covenant</p>
                                  )}
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="text-sm text-muted-foreground">
                            <strong>Market Conditions:</strong> {result.scenario.marketConditions}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio NAV Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio NAV Calculator</CardTitle>
              <CardDescription>
                Calculate total portfolio NAV with sector concentration and top holdings analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="facility-select">Facility *</Label>
                <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                  <SelectTrigger id="facility-select" data-testid="select-facility">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.fundName} - {formatCurrency(facility.principalAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleCalculatePortfolioNAV}
                  disabled={calculatePortfolioNAVMutation.isPending || !selectedFacilityId}
                  data-testid="button-calculate-portfolio-nav"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {calculatePortfolioNAVMutation.isPending ? "Calculating..." : "Calculate Portfolio NAV"}
                </Button>

                <Button
                  onClick={handlePerformPortfolioStressTest}
                  disabled={performPortfolioStressTestMutation.isPending || !selectedFacilityId}
                  variant="outline"
                  data-testid="button-portfolio-stress-test"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {performPortfolioStressTestMutation.isPending ? "Testing..." : "Run Stress Test"}
                </Button>
              </div>

              {portfolioNAV && (
                <div className="space-y-6">
                  <Separator />
                  <h3 className="text-lg font-semibold">Portfolio Analysis</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total NAV</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold" data-testid="text-total-nav">
                          {formatCurrency(portfolioNAV.totalNAV)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {portfolioNAV.companyCount} companies
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unrealized Gain</CardTitle>
                        {portfolioNAV.unrealizedGain >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${portfolioNAV.unrealizedGain >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(portfolioNAV.unrealizedGain)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {portfolioNAV.unrealizedGainPercentage > 0 ? '+' : ''}
                          {portfolioNAV.unrealizedGainPercentage.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(portfolioNAV.totalCost)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {portfolioNAV.stressTestSummary && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Stress Test Summary</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Baseline NAV</p>
                              <p className="font-medium">{formatCurrency(portfolioNAV.stressTestSummary.baselineNAV)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Worst Case NAV</p>
                              <p className="font-medium text-destructive">{formatCurrency(portfolioNAV.stressTestSummary.worstCaseNAV)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Max Drawdown</p>
                              <p className="font-medium text-destructive">{portfolioNAV.stressTestSummary.maxDrawdown.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Top Holdings</h4>
                      <div className="space-y-3">
                        {portfolioNAV.topHoldings.map((holding, index) => (
                          <div key={holding.companyId} className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <div>
                              <p className="font-medium text-sm">{holding.companyName}</p>
                              <p className="text-xs text-muted-foreground">
                                {holding.percentageOfNAV.toFixed(1)}% of portfolio
                              </p>
                            </div>
                            <p className="font-semibold">{formatCurrency(holding.fairValue)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Sector Concentration</h4>
                      <div className="space-y-3">
                        {Object.entries(portfolioNAV.sectorConcentration).map(([sector, percentage]) => (
                          <div key={sector} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{sector}</span>
                              <span className="font-medium">{percentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={percentage} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Stress Test Scenarios</CardTitle>
              <CardDescription>
                Predefined economic scenarios for stress testing valuations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.map((scenario, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={scenario.revenueImpact < 0 ? "destructive" : "default"}>
                            Revenue: {scenario.revenueImpact > 0 ? '+' : ''}{scenario.revenueImpact}%
                          </Badge>
                          <Badge variant={scenario.multipleImpact < 0 ? "destructive" : "default"}>
                            Multiple: {scenario.multipleImpact > 0 ? '+' : ''}{scenario.multipleImpact}%
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <strong>Market Conditions:</strong> {scenario.marketConditions}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
