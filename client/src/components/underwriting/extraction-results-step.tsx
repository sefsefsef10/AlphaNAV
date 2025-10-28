import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface ExtractionResultsStepProps {
  sessionId?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function ExtractionResultsStep({ sessionId, onNext, onBack }: ExtractionResultsStepProps) {
  // Fetch extraction results
  const { data: extraction, isLoading, error } = useQuery({
    queryKey: ["/api/underwriting/sessions", sessionId, "extraction"],
    enabled: !!sessionId,
  });

  // Simulate extraction in progress
  const isExtracting = !extraction && !error && isLoading;

  if (isLoading && !extraction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Extraction in Progress</CardTitle>
          <CardDescription>Analyzing uploaded documents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium mb-2">Extracting data points</p>
            <p className="text-sm text-muted-foreground">
              This typically takes 2-5 minutes depending on document size
            </p>
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Extraction Failed</h3>
          <p className="text-muted-foreground mb-4 text-center">
            Unable to extract data from documents
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} data-testid="button-back-error">
              Go Back
            </Button>
            <Button data-testid="button-retry">Retry Extraction</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Extraction Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Extraction Results</CardTitle>
              <CardDescription>47 data points extracted from uploaded documents</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-md bg-muted/50">
              <div className="text-2xl font-bold text-green-500">95%</div>
              <div className="text-sm text-muted-foreground">Overall Confidence</div>
            </div>
            <div className="text-center p-4 rounded-md bg-muted/50">
              <div className="text-2xl font-bold">47/47</div>
              <div className="text-sm text-muted-foreground">Data Points Extracted</div>
            </div>
            <div className="text-center p-4 rounded-md bg-muted/50">
              <div className="text-2xl font-bold text-yellow-500">3</div>
              <div className="text-sm text-muted-foreground">Low Confidence Fields</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extracted Data</CardTitle>
          <CardDescription>Review and correct any fields with low confidence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This will be populated with actual extraction data */}
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Extraction results will appear here</p>
              <p className="text-sm mt-2">Full implementation coming in next step</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} data-testid="button-continue-to-scoring">
          Continue to Eligibility Scoring
        </Button>
      </div>
    </div>
  );
}
