import { TrendingUp, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface BreachPrediction {
  id: string;
  dealName: string;
  covenantType: string;
  currentValue: string;
  threshold: string;
  predictedValue: string;
  breachProbability: number;
  timeframe: string;
  riskLevel: "high" | "medium" | "low";
  notificationSent: boolean;
}

interface PredictiveBreachPanelProps {
  predictions: BreachPrediction[];
  onSendWarning: (id: string) => void;
}

export function PredictiveBreachPanel({ predictions, onSendWarning }: PredictiveBreachPanelProps) {
  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return "text-danger";
    if (prob >= 40) return "text-warning";
    return "text-success";
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return (
          <Badge variant="outline" className="bg-danger/20 text-danger border-danger/50">
            High Risk
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50">
            Medium Risk
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-success/20 text-success border-success/50">
            Low Risk
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Predictive Breach Detection</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            AI-Powered
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Machine learning predictions for covenant breaches in next 30-90 days
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />
            <p className="font-medium">No breach risks predicted</p>
            <p className="text-sm mt-1">All deals showing healthy trajectory</p>
          </div>
        ) : (
          predictions.map((pred) => (
            <div
              key={pred.id}
              className="p-4 rounded-lg border border-border space-y-3"
              data-testid={`prediction-${pred.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{pred.dealName}</p>
                    {getRiskBadge(pred.riskLevel)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pred.covenantType}
                  </p>
                </div>
                {pred.notificationSent ? (
                  <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Sent
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendWarning(pred.id)}
                    data-testid={`button-send-warning-${pred.id}`}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Alert
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Value</p>
                  <p className="font-mono font-medium">{pred.currentValue}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Predicted ({pred.timeframe})</p>
                  <p className="font-mono font-medium text-danger">{pred.predictedValue}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Threshold</p>
                  <p className="font-mono font-medium">{pred.threshold}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Breach Probability</p>
                  <p className={`font-mono font-bold ${getProbabilityColor(pred.breachProbability)}`}>
                    {pred.breachProbability}%
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className={getProbabilityColor(pred.breachProbability)}>
                    {pred.breachProbability}%
                  </span>
                </div>
                <Progress value={pred.breachProbability} className="h-2" />
              </div>

              {!pred.notificationSent && pred.breachProbability >= 40 && (
                <div className="flex items-start gap-2 p-2 rounded bg-warning/10 border border-warning/30">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-warning">
                    Recommend sending early warning to fund GP and internal team
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
