import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PortfolioChartProps {
  data: Array<{
    month: string;
    portfolio: number;
    deployed: number;
  }>;
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              name="Total Portfolio"
            />
            <Line
              type="monotone"
              dataKey="deployed"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={false}
              name="Deployed Capital"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
