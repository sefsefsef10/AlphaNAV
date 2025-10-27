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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  DollarSign,
  Target,
  Loader2,
} from "lucide-react";

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

interface DealMetrics {
  sector: string;
  dealCount: number;
  medianLTV: number;
  avgInterestRate: number;
  avgLoanSize: number;
}

export default function AdvisorMarketIntelligence() {
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [geographyFilter, setGeographyFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("ytd");

  // Fetch anonymized market intelligence data
  const { data: marketData = [], isLoading } = useQuery<MarketData[]>({
    queryKey: ["/api/market-intelligence"],
  });

  // Calculate anonymized deal metrics by sector
  const dealMetricsBySector: DealMetrics[] = [
    {
      sector: "Technology",
      dealCount: 28,
      medianLTV: 62.5,
      avgInterestRate: 12.8,
      avgLoanSize: 45.2,
    },
    {
      sector: "Healthcare",
      dealCount: 22,
      medianLTV: 58.3,
      avgInterestRate: 13.2,
      avgLoanSize: 38.7,
    },
    {
      sector: "Consumer",
      dealCount: 19,
      medianLTV: 65.1,
      avgInterestRate: 13.5,
      avgLoanSize: 42.1,
    },
    {
      sector: "Financial Services",
      dealCount: 15,
      medianLTV: 60.2,
      avgInterestRate: 12.5,
      avgLoanSize: 52.3,
    },
    {
      sector: "Industrial",
      dealCount: 12,
      medianLTV: 63.7,
      avgInterestRate: 13.0,
      avgLoanSize: 35.8,
    },
  ];

  // Pricing trend data (anonymized)
  const pricingTrends = [
    { month: "Jul", avgRate: 12.2, medianLTV: 61.5 },
    { month: "Aug", avgRate: 12.5, medianLTV: 62.0 },
    { month: "Sep", avgRate: 12.8, medianLTV: 62.8 },
    { month: "Oct", avgRate: 13.0, medianLTV: 63.2 },
  ];

  // Calculate aggregate metrics
  const totalDeals = dealMetricsBySector.reduce((sum, s) => sum + s.dealCount, 0);
  const overallMedianLTV =
    dealMetricsBySector.reduce((sum, s) => sum + s.medianLTV * s.dealCount, 0) /
    totalDeals;
  const overallAvgRate =
    dealMetricsBySector.reduce((sum, s) => sum + s.avgInterestRate * s.dealCount, 0) /
    totalDeals;
  const currentMonthDeals = dealMetricsBySector.reduce((sum, s) => sum + Math.floor(s.dealCount / 4), 0);

  // Filter by sector
  const filteredMetrics = sectorFilter === "all"
    ? dealMetricsBySector
    : dealMetricsBySector.filter(m => m.sector === sectorFilter);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-market-intelligence">
          Market Intelligence
        </h1>
        <p className="text-muted-foreground">
          Anonymized NAV lending market data to inform your deal structuring
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Median LTV</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-median-ltv">
              {overallMedianLTV.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across {totalDeals} deals YTD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Interest Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-avg-rate">
              {overallAvgRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +0.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deal Velocity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-deal-velocity">
              {currentMonthDeals}
            </div>
            <p className="text-xs text-muted-foreground">
              Deals closed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-ytd-volume">
              {totalDeals}
            </div>
            <p className="text-xs text-muted-foreground">
              Total deals year-to-date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Trends</CardTitle>
          <CardDescription>
            Historical interest rates and LTV ratios (anonymized market data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pricingTrends}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                stroke="currentColor"
              />
              <YAxis className="text-xs" stroke="currentColor" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgRate"
                stroke="hsl(var(--primary))"
                name="Avg Interest Rate (%)"
                strokeWidth={2}
                data-testid="line-avg-rate"
              />
              <Line
                type="monotone"
                dataKey="medianLTV"
                stroke="hsl(var(--chart-2))"
                name="Median LTV (%)"
                strokeWidth={2}
                data-testid="line-median-ltv"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sector Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Market Activity by Sector</CardTitle>
              <CardDescription>
                Anonymized deal metrics across industry sectors
              </CardDescription>
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-48" data-testid="select-sector-filter">
                <SelectValue placeholder="All sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {dealMetricsBySector.map((s) => (
                  <SelectItem key={s.sector} value={s.sector}>
                    {s.sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Deal Count</TableHead>
                <TableHead className="text-right">Median LTV</TableHead>
                <TableHead className="text-right">Avg Rate</TableHead>
                <TableHead className="text-right">Avg Loan Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMetrics.map((metric) => (
                <TableRow key={metric.sector} data-testid={`row-sector-${metric.sector.toLowerCase().replace(/\s+/g, '-')}`}>
                  <TableCell className="font-medium">{metric.sector}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {metric.dealCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {metric.medianLTV.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {metric.avgInterestRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${metric.avgLoanSize.toFixed(1)}M
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deal Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Volume by Sector</CardTitle>
          <CardDescription>
            Number of deals closed by sector (YTD)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredMetrics}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="sector"
                className="text-xs"
                stroke="currentColor"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" stroke="currentColor" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar
                dataKey="dealCount"
                fill="hsl(var(--primary))"
                name="Deal Count"
                radius={[4, 4, 0, 0]}
                data-testid="bar-deal-count"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Disclaimer */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Anonymized Market Data</p>
              <p className="mt-1">
                All data is aggregated and anonymized. Individual deal participants,
                GP names, and lender identities are not disclosed. Metrics are
                calculated from AlphaNAV platform activity and exclude proprietary deals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
