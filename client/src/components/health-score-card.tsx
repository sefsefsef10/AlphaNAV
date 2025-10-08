import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface HealthMetric {
  id: string;
  dealName: string;
  score: number;
  trend: "up" | "down" | "stable";
  category: "excellent" | "good" | "fair" | "poor";
  lastUpdate: string;
}

interface HealthScoreCardProps {
  metrics: HealthMetric[];
}

const categoryConfig = {
  excellent: { color: "bg-success", text: "text-success", threshold: 80 },
  good: { color: "bg-chart-3", text: "text-chart-3", threshold: 60 },
  fair: { color: "bg-warning", text: "text-warning", threshold: 40 },
  poor: { color: "bg-danger", text: "text-danger", threshold: 0 },
};

export function HealthScoreCard({ metrics }: HealthScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Health Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const config = categoryConfig[metric.category];
            const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
            
            return (
              <div key={metric.id} className="space-y-2" data-testid={`health-score-${metric.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metric.dealName}</span>
                      <TrendIcon className={cn("h-3 w-3", 
                        metric.trend === "up" ? "text-success" : 
                        metric.trend === "down" ? "text-danger" : 
                        "text-muted-foreground"
                      )} />
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.lastUpdate}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-2xl font-bold font-mono tabular-nums", config.text)}>
                      {metric.score}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={metric.score} className="h-2" />
                  <div 
                    className={cn("absolute inset-y-0 left-0 h-2 rounded-full transition-all", config.color)}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
