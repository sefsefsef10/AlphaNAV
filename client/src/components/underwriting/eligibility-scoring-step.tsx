import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface EligibilityScoringStepProps {
  sessionId?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function EligibilityScoringStep({ sessionId, onNext, onBack }: EligibilityScoringStepProps) {
  return (
    <div className="space-y-6">
      {/* Scoring Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eligibility Scoring</CardTitle>
              <CardDescription>10-point assessment across key risk factors</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              85/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Scoring dashboard will appear here</p>
            <p className="text-sm mt-2">Full implementation coming in next step</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} data-testid="button-continue-to-ltv">
          Continue to LTV Calculator
        </Button>
      </div>
    </div>
  );
}
