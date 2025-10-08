import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
}

export function KPICard({ title, value, change, icon: Icon, iconColor = "text-primary" }: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold font-mono tabular-nums">{value}</p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", {
              "text-success": isPositive,
              "text-danger": isNegative,
              "text-muted-foreground": !isPositive && !isNegative
            })}>
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              <span className="font-mono tabular-nums">{isPositive ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
