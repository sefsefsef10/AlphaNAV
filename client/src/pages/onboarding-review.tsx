import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Edit2, Save } from "lucide-react";
import type { OnboardingSession } from "@shared/schema";

export default function OnboardingReview() {
  const [, params] = useRoute("/onboarding/:id/review");
  const sessionId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  const { data: session, isLoading } = useQuery<OnboardingSession>({
    queryKey: ["/api/onboarding/sessions", sessionId],
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (session?.extractedData) {
      setEditedData(session.extractedData);
    } else if (session) {
      setEditedData({
        fundName: "",
        vintage: null,
        aum: null,
        portfolioCompanyCount: null,
        sectors: [],
        keyPersonnel: [],
        borrowingPermitted: false,
        fundStatus: "",
        meetsEligibilityCriteria: false,
        eligibilityNotes: "Please enter your fund information below for review.",
        confidence: 0,
      });
    }
  }, [session]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/onboarding/sessions/${sessionId}/confirm`, { confirmedData: editedData });
      return await response.json();
    },
    onSuccess: () => {
      setLocation(`/onboarding/${sessionId}/complete`);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!editedData && session.extractedData) {
    return null;
  }

  if (!editedData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>
                We couldn't extract data from your documents. Please go back and upload different documents or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation(`/onboarding/${sessionId}/upload`)} data-testid="button-back-to-upload">
                Back to Upload
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { extractedData } = session;
  const data = extractedData as any;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Review & Confirm
          </h1>
          <p className="text-lg text-muted-foreground">
            Please enter your fund information below
          </p>
        </div>

        <OnboardingProgress currentStep={3} />

        <div className="mt-8 space-y-6">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">NAV IQ Capital Eligibility Criteria</CardTitle>
              <CardDescription>
                Please ensure your fund meets the following requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>US Growth / Buyout PE with <strong>$100M-$500M AUM</strong></p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p><strong>4+ year vintage</strong> (founded in 2021 or earlier), post-investment period preferred</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p><strong>5+ portfolio companies</strong> (diversified)</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>Borrowing permitted or amendable fund documentation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fund Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  data-testid="button-toggle-edit"
                >
                  {isEditing ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fund Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedData.fundName || ""}
                      onChange={(e) => setEditedData({ ...editedData, fundName: e.target.value })}
                      data-testid="input-edit-fund-name"
                    />
                  ) : (
                    <p className="text-sm text-foreground" data-testid="text-fund-name">{editedData.fundName || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Vintage Year</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.vintage || ""}
                      onChange={(e) => setEditedData({ ...editedData, vintage: parseInt(e.target.value) })}
                      data-testid="input-edit-vintage"
                    />
                  ) : (
                    <p className="text-sm text-foreground" data-testid="text-vintage">{editedData.vintage || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Assets Under Management (AUM)</Label>
                  {isEditing ? (
                    <Input
                      value={editedData.aum || ""}
                      onChange={(e) => setEditedData({ ...editedData, aum: e.target.value })}
                      placeholder="e.g., $250M"
                      data-testid="input-edit-aum"
                    />
                  ) : (
                    <p className="text-sm text-foreground" data-testid="text-aum">
                      {typeof editedData.aum === "number" ? `$${editedData.aum}M` : editedData.aum || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Portfolio Company Count</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.portfolioCompanyCount || ""}
                      onChange={(e) => setEditedData({ ...editedData, portfolioCompanyCount: parseInt(e.target.value) })}
                      data-testid="input-edit-portfolio-count"
                    />
                  ) : (
                    <p className="text-sm text-foreground" data-testid="text-portfolio-count">
                      {editedData.portfolioCompanyCount || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Investment Sectors</Label>
                  {isEditing ? (
                    <Input
                      value={Array.isArray(editedData.sectors) ? editedData.sectors.join(", ") : editedData.sectors || ""}
                      onChange={(e) => setEditedData({ ...editedData, sectors: e.target.value.split(",").map((s: string) => s.trim()) })}
                      placeholder="Healthcare, Technology, Consumer"
                      data-testid="input-edit-sectors"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(editedData.sectors) && editedData.sectors.length > 0 ? (
                        editedData.sectors.map((sector: string, index: number) => (
                          <Badge key={index} variant="secondary" data-testid={`badge-sector-${index}`}>
                            {sector}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Not provided</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fund Status</Label>
                  {isEditing ? (
                    <Input
                      value={editedData.fundStatus || ""}
                      onChange={(e) => setEditedData({ ...editedData, fundStatus: e.target.value })}
                      placeholder="e.g., Post-investment period"
                      data-testid="input-edit-fund-status"
                    />
                  ) : (
                    <p className="text-sm text-foreground" data-testid="text-fund-status">{editedData.fundStatus || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Borrowing Permitted</Label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editedData.borrowingPermitted || false}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, borrowingPermitted: checked })}
                        data-testid="switch-borrowing-permitted"
                      />
                      <span className="text-sm text-foreground">
                        {editedData.borrowingPermitted ? "Yes" : "No"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {editedData.borrowingPermitted ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">Yes</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm text-yellow-600 dark:text-yellow-400">Not confirmed</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {Array.isArray(editedData.keyPersonnel) && editedData.keyPersonnel.length > 0 && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Key Personnel</Label>
                    <p className="text-sm text-foreground">{editedData.keyPersonnel.join(", ")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                After you confirm this information:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Our team will review your application within 48 hours</li>
                <li>You'll receive a preliminary fit assessment via email</li>
                <li>If qualified, we'll schedule a call to discuss your specific needs</li>
                <li>We'll provide a term sheet within 1-2 weeks of the call</li>
              </ol>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setLocation(`/onboarding/${sessionId}/upload`)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-back-to-upload"
                >
                  Back to Upload
                </Button>
                <Button
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-submit"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm & Submit Application"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
