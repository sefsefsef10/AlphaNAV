import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface LtvCalculatorStepProps {
  sessionId?: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function LtvCalculatorStep({ sessionId, onComplete, onBack }: LtvCalculatorStepProps) {
  return (
    <div className="space-y-6">
      {/* LTV Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>LTV Calculator & Stress Testing</CardTitle>
          <CardDescription>Calculate facility size with stress test scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>LTV calculator will appear here</p>
            <p className="text-sm mt-2">Full implementation coming in next step</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onComplete} data-testid="button-complete-underwriting">
          Complete Underwriting
        </Button>
      </div>
    </div>
  );
}
