import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Covenant {
  id: string;
  dealName: string;
  covenantType: string;
  threshold: string;
  currentValue: string;
  status: "compliant" | "warning" | "breach";
  lastChecked: string;
}

interface CovenantTrackerProps {
  covenants: Covenant[];
}

const statusConfig = {
  compliant: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/20",
    borderColor: "border-success/50",
    label: "Compliant",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/20",
    borderColor: "border-warning/50",
    label: "Warning",
  },
  breach: {
    icon: XCircle,
    color: "text-danger",
    bgColor: "bg-danger/20",
    borderColor: "border-danger/50",
    label: "Breach",
  },
};

export function CovenantTracker({ covenants }: CovenantTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Covenant Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {covenants.map((covenant) => {
            const config = statusConfig[covenant.status];
            const Icon = config.icon;
            
            return (
              <div
                key={covenant.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover-elevate"
                data-testid={`covenant-${covenant.id}`}
              >
                <div className={cn("p-2 rounded-lg", config.bgColor)}>
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium">{covenant.dealName}</h4>
                    <Badge variant="outline" className={cn("border", config.bgColor, config.borderColor, config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {covenant.covenantType}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Threshold: </span>
                      <span className="font-mono font-medium">{covenant.threshold}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current: </span>
                      <span className={cn("font-mono font-medium", config.color)}>
                        {covenant.currentValue}
                      </span>
                    </div>
                    <div className="text-muted-foreground ml-auto">
                      {covenant.lastChecked}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
