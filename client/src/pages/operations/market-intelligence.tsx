import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Activity, BarChart3, DollarSign, Users } from "lucide-react";

interface MarketData {
  id: string;
  dataType: string;
  asOfDate: string;
  geography: string | null;
  sector: string | null;
  metric: string;
  value: string;
  percentageChange: string | null;
  source: string | null;
  confidence: number | null;
}

interface CompetitorData {
  id: string;
  competitorName: string;
  competitorType: string;
  dealType: string | null;
  loanAmount: number | null;
  interestRate: string | null;
  ltv: string | null;
  sector: string | null;
  reportedDate: string | null;
  reliability: string;
}

export default function MarketIntelligencePage() {
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [geographyFilter, setGeographyFilter] = useState<string>("all");

  // Fetch market intelligence data
  const { data: marketData = [], isLoading: loadingMarket } = useQuery<MarketData[]>({
    queryKey: ["/api/market-intelligence"],
  });

  // Fetch competitor intelligence
  const { data: competitorData = [], isLoading: loadingCompetitors } = useQuery<CompetitorData[]>({
    queryKey: ["/api/competitor-intelligence"],
  });

  // Filter market data
  const filteredMarketData = marketData.filter(data => {
    const matchesMetric = metricFilter === "all" || data.dataType === metricFilter;
    const matchesGeography = geographyFilter === "all" || data.geography === geographyFilter;
    return matchesMetric && matchesGeography;
  });

  const formatValue = (metric: string, value: string) => {
    const num = parseFloat(value);
    if (metric.includes("rate") || metric.includes("ltv")) {
      return `${num.toFixed(2)}%`;
    }
    if (metric.includes("volume") || metric.includes("deal_count")) {
      return num.toLocaleString();
    }
    return `$${num.toLocaleString()}M`;
  };

  const getTrendIcon = (change: string | null) => {
    if (!change) return null;
    const num = parseFloat(change);
    if (num > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (num < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case "verified": return "default";
      case "likely": return "secondary";
      case "unverified": return "outline";
      default: return "outline";
    }
  };

  // Calculate key metrics
  const avgInterestRate = marketData
    .filter(d => d.metric === "avg_interest_rate")
    .reduce((sum, d) => sum + parseFloat(d.value), 0) / 
    (marketData.filter(d => d.metric === "avg_interest_rate").length || 1);

  const avgLTV = marketData
    .filter(d => d.metric === "median_ltv")
    .reduce((sum, d) => sum + parseFloat(d.value), 0) / 
    (marketData.filter(d => d.metric === "median_ltv").length || 1);

  const totalDeals = marketData
    .filter(d => d.metric === "deal_count")
    .reduce((sum, d) => sum + parseFloat(d.value), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Market Intelligence</h1>
        <p className="text-muted-foreground">
          Track market trends and competitor activity in NAV lending
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Interest Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-avg-rate">
              {avgInterestRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Market average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Median LTV</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-median-ltv">
              {avgLTV.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Across all deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Deals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-total-deals">
              {totalDeals.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">YTD volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitors Tracked</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-competitors">
              {new Set(competitorData.map(c => c.competitorName)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={metricFilter} onValueChange={setMetricFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-metric-filter">
                <SelectValue placeholder="Filter by metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metrics</SelectItem>
                <SelectItem value="interest_rates">Interest Rates</SelectItem>
                <SelectItem value="fund_valuations">Fund Valuations</SelectItem>
                <SelectItem value="deal_volume">Deal Volume</SelectItem>
                <SelectItem value="sector_performance">Sector Performance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={geographyFilter} onValueChange={setGeographyFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-geography-filter">
                <SelectValue placeholder="Filter by geography" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia">Asia</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Market Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
          <CardDescription>
            Latest market intelligence and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMarket ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredMarketData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No market data available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Geography</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>As Of Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarketData.slice(0, 20).map((data) => (
                    <TableRow key={data.id} data-testid={`row-market-${data.id}`}>
                      <TableCell className="font-medium">
                        {data.metric.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>{data.geography || "N/A"}</TableCell>
                      <TableCell>{data.sector || "N/A"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatValue(data.metric, data.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getTrendIcon(data.percentageChange)}
                          {data.percentageChange && (
                            <span className="tabular-nums">
                              {parseFloat(data.percentageChange).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{data.source || "Internal"}</TableCell>
                      <TableCell>
                        {new Date(data.asOfDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitor Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Activity</CardTitle>
          <CardDescription>
            Recent deals and market positioning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCompetitors ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : competitorData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No competitor data available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deal Type</TableHead>
                    <TableHead className="text-right">Loan Amount</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">LTV</TableHead>
                    <TableHead>Reliability</TableHead>
                    <TableHead>Reported Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitorData.slice(0, 10).map((comp) => (
                    <TableRow key={comp.id} data-testid={`row-competitor-${comp.id}`}>
                      <TableCell className="font-medium">{comp.competitorName}</TableCell>
                      <TableCell>{comp.competitorType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{comp.dealType?.replace(/_/g, ' ') || "N/A"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {comp.loanAmount
                          ? `$${(comp.loanAmount / 1000000).toFixed(1)}M`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {comp.interestRate ? `${parseFloat(comp.interestRate).toFixed(2)}%` : "N/A"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {comp.ltv ? `${parseFloat(comp.ltv).toFixed(1)}%` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReliabilityColor(comp.reliability) as any}>
                          {comp.reliability}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {comp.reportedDate
                          ? new Date(comp.reportedDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
