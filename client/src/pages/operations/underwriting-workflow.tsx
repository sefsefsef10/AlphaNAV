import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Upload,
  FileText,
  BarChart3,
  Calculator,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// Step components (to be created)
import DocumentUploadStep from "@/components/underwriting/document-upload-step";
import ExtractionResultsStep from "@/components/underwriting/extraction-results-step";
import EligibilityScoringStep from "@/components/underwriting/eligibility-scoring-step";
import LtvCalculatorStep from "@/components/underwriting/ltv-calculator-step";

interface Step {
  id: number;
  name: string;
  description: string;
  icon: any;
  status: "pending" | "current" | "completed";
}

export default function UnderwritingWorkflowPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/operations/underwriting/:id");
  const rawId = params?.id;
  const isNewSession = rawId === "new";
  const sessionId = isNewSession ? undefined : rawId;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // Fetch underwriting session (only if we have a real session ID)
  const { data: session, isLoading: sessionLoading } = useQuery<any>({
    queryKey: ["/api/underwriting/sessions", sessionId],
    enabled: !!sessionId && !isNewSession,
  });

  const steps: Step[] = [
    {
      id: 1,
      name: "Upload Documents",
      description: "Upload PPM, financials, fund agreement",
      icon: Upload,
      status: currentStep === 1 ? "current" : currentStep > 1 ? "completed" : "pending",
    },
    {
      id: 2,
      name: "AI Extraction",
      description: "Extract 47+ data points",
      icon: FileText,
      status: currentStep === 2 ? "current" : currentStep > 2 ? "completed" : "pending",
    },
    {
      id: 3,
      name: "Eligibility Score",
      description: "10-point assessment",
      icon: BarChart3,
      status: currentStep === 3 ? "current" : currentStep > 3 ? "completed" : "pending",
    },
    {
      id: 4,
      name: "LTV Calculator",
      description: "Stress testing scenarios",
      icon: Calculator,
      status: currentStep === 4 ? "current" : currentStep > 4 ? "completed" : "pending",
    },
  ];

  // Sync current step with session status
  useEffect(() => {
    if (session) {
      setCurrentStep(session.currentStep || 1);
    }
  }, [session]);

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Mutation to update session step
  const updateStepMutation = useMutation({
    mutationFn: async (newStep: number) => {
      if (!sessionId) return;
      return await apiRequest(`/api/underwriting/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ currentStep: newStep }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/underwriting/sessions", sessionId] });
    },
    onError: (error: any) => {
      console.error("Error updating session step:", error);
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateStepMutation.mutate(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateStepMutation.mutate(prevStep);
    }
  };

  const handleComplete = () => {
    toast({
      title: "Underwriting Complete",
      description: "Session saved successfully",
    });
    setLocation("/operations/underwriting");
  };

  if (sessionLoading && sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Underwriting Workflow
          </h1>
          <p className="text-muted-foreground mt-2">
            {session?.fundName || "New Underwriting Session"}
          </p>
        </div>
        {sessionId && (
          <Badge variant="outline" data-testid="badge-session-id">
            Session: {sessionId.slice(0, 8)}...
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                Step {currentStep} of {steps.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" data-testid="progress-workflow" />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.id}
              className={
                step.status === "current"
                  ? "border-primary"
                  : step.status === "completed"
                    ? "border-green-500/50 bg-green-500/5"
                    : "opacity-60"
              }
              data-testid={`card-step-${step.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-md p-2 ${
                      step.status === "current"
                        ? "bg-primary text-primary-foreground"
                        : step.status === "completed"
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{step.name}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Current Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <DocumentUploadStep sessionId={sessionId} onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <ExtractionResultsStep sessionId={sessionId} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 3 && (
          <EligibilityScoringStep sessionId={sessionId} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 4 && (
          <LtvCalculatorStep sessionId={sessionId} onComplete={handleComplete} onBack={handleBack} />
        )}
      </div>

      {/* Workflow Status Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            {currentStep === steps.length ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">All steps complete - ready to finalize underwriting</span>
              </div>
            ) : (
              <span>Complete each step to proceed through the underwriting workflow</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
