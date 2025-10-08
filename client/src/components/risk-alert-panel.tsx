import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RiskAlert {
  id: string;
  dealName: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface RiskAlertPanelProps {
  alerts: RiskAlert[];
  onAcknowledge?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const severityConfig = {
  critical: {
    color: "text-danger",
    bgColor: "bg-danger/20",
    borderColor: "border-danger/50",
    label: "Critical",
  },
  high: {
    color: "text-warning",
    bgColor: "bg-warning/20",
    borderColor: "border-warning/50",
    label: "High",
  },
  medium: {
    color: "text-chart-4",
    bgColor: "bg-chart-4/20",
    borderColor: "border-chart-4/50",
    label: "Medium",
  },
  low: {
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
    label: "Low",
  },
};

export function RiskAlertPanel({ alerts, onAcknowledge, onViewDetails }: RiskAlertPanelProps) {
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Risk Alerts
        </CardTitle>
        {unacknowledgedCount > 0 && (
          <Badge variant="outline" className="bg-danger/20 text-danger border-danger/50">
            {unacknowledgedCount} new
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No active risk alerts</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const config = severityConfig[alert.severity];
              
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-lg border space-y-3",
                    alert.acknowledged ? "opacity-60" : "",
                    config.borderColor,
                    config.bgColor
                  )}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn("h-5 w-5 mt-0.5", config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium">{alert.dealName}</h4>
                        <Badge variant="outline" className={cn("border", config.borderColor, config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAcknowledge?.(alert.id)}
                        data-testid={`button-acknowledge-${alert.id}`}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetails?.(alert.id)}
                        data-testid={`button-view-${alert.id}`}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
