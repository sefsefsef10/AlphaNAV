import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap, Activity, Clock, Target } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdvancedAnalytics() {
  const { data: platformMetrics, isLoading: metricsLoading, error: metricsError } = useQuery<{
    facilities: { total: number; active: number };
    covenants: { total: number };
    automation: {
      activitiesTracked: number;
      totalHoursSaved: number;
      totalCostSaved: number;
      activityBreakdown: Record<string, any>;
    };
  }>({
    queryKey: ['/api/analytics/platform-metrics'],
  });

  const { data: efficiencyTrends, isLoading: trendsLoading, error: trendsError } = useQuery<Array<{
    date: string;
    activities: number;
    totalTimeSaved: number;
    avgEfficiency: number;
  }>>({
    queryKey: ['/api/analytics/efficiency-trends'],
  });

  const activityBreakdown = platformMetrics?.automation.activityBreakdown || {};
  const activityData = Object.entries(activityBreakdown).map(([name, data]: [string, any]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: data.count,
    avgSavings: parseFloat(data.avgTimeSavingsPercentage),
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (metricsLoading || trendsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold">Loading analytics...</div>
            <p className="text-sm text-muted-foreground mt-2">Fetching platform metrics</p>
          </div>
        </div>
      </div>
    );
  }

  if (metricsError || trendsError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold text-destructive">Error loading analytics</div>
            <p className="text-sm text-muted-foreground mt-2">
              {metricsError ? (metricsError instanceof Error ? metricsError.message : 'Failed to fetch metrics') :
               trendsError ? (trendsError instanceof Error ? trendsError.message : 'Failed to fetch trends') :
               'Failed to load analytics data'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Advanced Analytics</h1>
        <p className="text-muted-foreground">Deep insights into platform performance and ROI</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Facilities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-facilities">
              {platformMetrics?.facilities.active ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {platformMetrics?.facilities.total ?? 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Covenants Monitored</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-covenants">
              {platformMetrics?.covenants.total ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Tracked</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-activities">
              {platformMetrics?.automation.activitiesTracked ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-savings">
              {formatCurrency(platformMetrics?.automation.totalCostSaved ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {platformMetrics?.automation.totalHoursSaved ?? 0} hours saved
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown" data-testid="tab-breakdown">Activity Breakdown</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Efficiency Trends</TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-comparison">Workflow Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activities by Type</CardTitle>
                <CardDescription>Distribution of tracked workflows</CardDescription>
              </CardHeader>
              <CardContent>
                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No activity data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Time Savings</CardTitle>
                <CardDescription>Efficiency by workflow type</CardDescription>
              </CardHeader>
              <CardContent>
                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: 'Savings %', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="avgSavings" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No activity data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Efficiency Trends</CardTitle>
              <CardDescription>Platform usage and time savings over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {efficiencyTrends && efficiencyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={efficiencyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" label={{ value: 'Hours Saved', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Efficiency %', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="totalTimeSaved" stroke="hsl(var(--chart-1))" name="Hours Saved" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="avgEfficiency" stroke="hsl(var(--chart-2))" name="Avg Efficiency %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No trend data available for the last 30 days
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid gap-4">
            {activityData.map((activity, idx) => (
              <Card key={activity.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{activity.name}</CardTitle>
                    <Badge variant="outline">{activity.count} activities</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Average Time Savings</span>
                      <span className="font-bold text-green-500">{activity.avgSavings.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${Math.min(activity.avgSavings, 100)}%` }} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
