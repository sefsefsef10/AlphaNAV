import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download, DollarSign, BarChart3, Clock, Award } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function MarketIntelligence() {
  const [periodMonths, setPeriodMonths] = useState("18");
  const [segmentType, setSegmentType] = useState<string | undefined>();
  
  const { data: benchmarks } = useQuery<any[]>({
    queryKey: ['/api/market-intelligence/benchmarks', { periodMonths, segmentType }],
  });

  const { data: roiSummary } = useQuery<{
    totalActivities: number;
    totalTimeSavedHours: number;
    totalLaborCostSaved: number;
    avgTimeSavingsPercentage: number;
  }>({
    queryKey: ['/api/market-intelligence/roi-summary'],
  });

  const overallBenchmark = benchmarks?.find(b => b.segmentType === 'overall');
  
  const sectorBenchmarks = benchmarks?.filter(b => b.segmentType === 'by_sector') || [];
  const vintageBenchmarks = benchmarks?.filter(b => b.segmentType === 'by_vintage') || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatBasisPoints = (value: number) => `${value} bps`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Market Intelligence</h1>
          <p className="text-muted-foreground">Competitive benchmarks and platform analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodMonths} onValueChange={setPeriodMonths}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
              <SelectItem value="18">18 months</SelectItem>
              <SelectItem value="24">24 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-time-saved">
              {roiSummary?.totalTimeSavedHours?.toLocaleString() ?? '0'} hrs
            </div>
            <p className="text-xs text-muted-foreground">
              {roiSummary?.avgTimeSavingsPercentage ?? 0}% faster than manual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-cost-saved">
              {formatCurrency(roiSummary?.totalLaborCostSaved || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {roiSummary?.totalActivities || 0} activities tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Median LTV</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-median-ltv">
              {overallBenchmark?.medianLtv ? `${parseFloat(overallBenchmark.medianLtv).toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Market average across {overallBenchmark?.dealCount || 0} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Median Pricing</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-median-pricing">
              {overallBenchmark?.medianPricingSpread ? formatBasisPoints(overallBenchmark.medianPricingSpread) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Over SOFR
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing Benchmarks</TabsTrigger>
          <TabsTrigger value="sector" data-testid="tab-sector">By Sector</TabsTrigger>
          <TabsTrigger value="vintage" data-testid="tab-vintage">By Vintage</TabsTrigger>
          <TabsTrigger value="roi" data-testid="tab-roi">ROI Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Spread Distribution</CardTitle>
              <CardDescription>
                Market pricing by deal segment (last {periodMonths} months)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sectorBenchmarks.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={sectorBenchmarks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segmentValue" />
                    <YAxis label={{ value: 'Basis Points', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="p25PricingSpread" fill="hsl(var(--chart-1))" name="P25" />
                    <Bar dataKey="medianPricingSpread" fill="hsl(var(--chart-2))" name="Median" />
                    <Bar dataKey="p75PricingSpread" fill="hsl(var(--chart-3))" name="P75" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  No pricing data available for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sector" className="space-y-4">
          <div className="grid gap-4">
            {sectorBenchmarks.map((sector) => (
              <Card key={sector.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{sector.segmentValue}</CardTitle>
                    <Badge variant="outline">{sector.dealCount} deals</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Median LTV</p>
                      <p className="text-2xl font-bold">{sector.medianLtv ? `${parseFloat(sector.medianLtv).toFixed(1)}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Median Pricing</p>
                      <p className="text-2xl font-bold">{sector.medianPricingSpread ? formatBasisPoints(sector.medianPricingSpread) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Facility Size</p>
                      <p className="text-2xl font-bold">{sector.avgFacilitySize ? formatCurrency(sector.avgFacilitySize) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Time to Close</p>
                      <p className="text-2xl font-bold">{sector.avgTimeToClose || 0} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vintage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vintage Trends</CardTitle>
              <CardDescription>Deal volume and pricing by fund vintage year</CardDescription>
            </CardHeader>
            <CardContent>
              {vintageBenchmarks.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={vintageBenchmarks.sort((a, b) => 
                    parseInt(a.segmentValue) - parseInt(b.segmentValue)
                  )}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segmentValue" />
                    <YAxis yAxisId="left" label={{ value: 'Deal Count', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Pricing (bps)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="dealCount" stroke="hsl(var(--chart-1))" name="Deal Count" />
                    <Line yAxisId="right" type="monotone" dataKey="medianPricingSpread" stroke="hsl(var(--chart-2))" name="Median Pricing" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  No vintage data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Operational Alpha</CardTitle>
                <CardDescription>Platform efficiency vs manual processes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Underwriting</span>
                    <span className="text-sm font-bold text-green-500">95% faster</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '95%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Covenant Monitoring</span>
                    <span className="text-sm font-bold text-green-500">92% faster</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '92%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Draw Processing</span>
                    <span className="text-sm font-bold text-green-500">88% faster</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '88%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reporting</span>
                    <span className="text-sm font-bold text-green-500">90% faster</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '90%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value Delivered</CardTitle>
                <CardDescription>Cumulative savings and efficiency gains</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Time Saved</div>
                  <div className="text-3xl font-bold mt-1">
                    {roiSummary?.totalTimeSavedHours?.toLocaleString() ?? '0'} hours
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Cost Saved</div>
                  <div className="text-3xl font-bold mt-1">
                    {formatCurrency(roiSummary?.totalLaborCostSaved || 0)}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Basis Points Alpha</div>
                  <div className="text-3xl font-bold mt-1 text-green-500">+100 bps</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
