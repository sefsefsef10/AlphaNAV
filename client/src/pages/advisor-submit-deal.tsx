import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { insertAdvisorDealSchema, type InsertAdvisorDeal } from "@shared/schema";
import { z } from "zod";

const dealFormSchema = insertAdvisorDealSchema.extend({
  gpFundName: z.string().min(1, "Fund name is required"),
  loanAmount: z.number().nullable(),
  fundAum: z.number().nullable(),
  fundVintage: z.number().nullable(),
  fundPortfolioCount: z.number().nullable(),
  selectedLenders: z.array(z.string()).optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

const AVAILABLE_LENDERS = [
  "NAV IQ Capital",
  "17Capital",
  "Hayfin",
  "Arcmont",
  "Whitehorse",
  "Intermediate Capital Group",
  "HPS Investment Partners",
];

export default function AdvisorSubmitDeal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const mockAdvisorId = "mock-advisor-1";

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      advisorId: mockAdvisorId,
      gpFundName: "",
      gpContactName: "",
      gpContactEmail: "",
      gpContactPhone: "",
      isAnonymized: true,
      loanAmount: null,
      fundAum: null,
      fundVintage: null,
      fundPortfolioCount: null,
      fundSectors: [],
      borrowingPermitted: null,
      urgency: "standard",
      submissionDeadline: null,
      advisorNotes: "",
      selectedLenders: ["NAV IQ Capital"],
    },
  });

  const createDealMutation = useMutation<any, Error, { dealData: InsertAdvisorDeal; lenders: string[] }>({
    mutationFn: async ({ dealData, lenders }) => {
      const response = await apiRequest("POST", "/api/advisor-deals", dealData);
      const deal = await response.json();
      return { deal, lenders };
    },
    onSuccess: async ({ deal, lenders }) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/advisor-deals"] });
      
      for (const lenderName of lenders) {
        await apiRequest("POST", "/api/lender-invitations", {
          advisorDealId: deal.id,
          lenderName,
        });
      }

      toast({
        title: "Deal Submitted Successfully",
        description: `RFP for ${deal.gpFundName} has been sent to ${lenders.length} lender(s).`,
      });

      navigate("/advisor");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit deal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DealFormData) => {
    // Only submit if we're on step 3 (final step)
    if (step !== 3) {
      console.log("Form submitted but not on step 3, ignoring");
      return;
    }
    
    const { selectedLenders, ...dealData } = data;
    console.log("onSubmit - selectedLenders:", selectedLenders);
    console.log("onSubmit - full data:", data);
    
    createDealMutation.mutate({
      dealData: {
        ...dealData,
        fundSectors: data.fundSectors || null,
        submissionDeadline: dealData.submissionDeadline || null,
      } as InsertAdvisorDeal,
      lenders: selectedLenders || [],
    });
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    const values = form.getValues();
    switch (step) {
      case 1:
        return values.gpFundName.trim().length > 0;
      case 2:
        return true;
      case 3:
        return (values.selectedLenders?.length || 0) > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/advisor")}
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-submit-deal">
            Submit Competitive RFP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of 3: {step === 1 ? "Fund Information" : step === 2 ? "Deal Terms" : "Lender Selection"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
            data-testid={`progress-step-${s}`}
          />
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card data-testid="card-fund-information">
            <CardHeader>
              <CardTitle>Fund Information</CardTitle>
              <CardDescription>
                Provide details about the PE fund seeking financing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gpFundName">Fund Name *</Label>
                <Input
                  id="gpFundName"
                  data-testid="input-fund-name"
                  {...form.register("gpFundName")}
                  placeholder="e.g., Vista Growth Fund IV"
                />
                {form.formState.errors.gpFundName && (
                  <p className="text-sm text-destructive">{form.formState.errors.gpFundName.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between space-x-2 p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="isAnonymized" className="text-base font-medium">
                    Anonymous Submission
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hide GP identity from lenders until winner is selected
                  </p>
                </div>
                <Switch
                  id="isAnonymized"
                  data-testid="switch-anonymized"
                  checked={form.watch("isAnonymized")}
                  onCheckedChange={(checked) => form.setValue("isAnonymized", checked)}
                />
              </div>

              {!form.watch("isAnonymized") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gpContactName">GP Contact Name</Label>
                    <Input
                      id="gpContactName"
                      data-testid="input-contact-name"
                      {...form.register("gpContactName")}
                      placeholder="John Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpContactEmail">GP Contact Email</Label>
                    <Input
                      id="gpContactEmail"
                      data-testid="input-contact-email"
                      type="email"
                      {...form.register("gpContactEmail")}
                      placeholder="john@fund.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpContactPhone">GP Contact Phone</Label>
                    <Input
                      id="gpContactPhone"
                      data-testid="input-contact-phone"
                      {...form.register("gpContactPhone")}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fundAum">Fund AUM ($M)</Label>
                  <Input
                    id="fundAum"
                    data-testid="input-fund-aum"
                    type="number"
                    {...form.register("fundAum", { 
                      setValueAs: (value) => value === "" ? null : Number(value)
                    })}
                    placeholder="250"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundVintage">Fund Vintage Year</Label>
                  <Input
                    id="fundVintage"
                    data-testid="input-fund-vintage"
                    type="number"
                    {...form.register("fundVintage", { 
                      setValueAs: (value) => value === "" ? null : Number(value)
                    })}
                    placeholder="2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundPortfolioCount">Portfolio Company Count</Label>
                  <Input
                    id="fundPortfolioCount"
                    data-testid="input-portfolio-count"
                    type="number"
                    {...form.register("fundPortfolioCount", { 
                      setValueAs: (value) => value === "" ? null : Number(value)
                    })}
                    placeholder="12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borrowingPermitted">Borrowing Permitted in LPA?</Label>
                  <Select
                    value={form.watch("borrowingPermitted") === null ? "unknown" : form.watch("borrowingPermitted") ? "yes" : "no"}
                    onValueChange={(value) => {
                      if (value === "unknown") {
                        form.setValue("borrowingPermitted", null);
                      } else {
                        form.setValue("borrowingPermitted", value === "yes");
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-borrowing-permitted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card data-testid="card-deal-terms">
            <CardHeader>
              <CardTitle>Deal Terms</CardTitle>
              <CardDescription>
                Specify the loan requirements and timeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount ($M)</Label>
                  <Input
                    id="loanAmount"
                    data-testid="input-loan-amount"
                    type="number"
                    {...form.register("loanAmount", { 
                      setValueAs: (value) => value === "" ? null : Number(value)
                    })}
                    placeholder="15"
                  />
                  {form.formState.errors.loanAmount && (
                    <p className="text-sm text-destructive">{form.formState.errors.loanAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select
                    value={form.watch("urgency")}
                    onValueChange={(value) => form.setValue("urgency", value)}
                  >
                    <SelectTrigger data-testid="select-urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submissionDeadline">Submission Deadline</Label>
                  <Input
                    id="submissionDeadline"
                    data-testid="input-deadline"
                    type="date"
                    {...form.register("submissionDeadline")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advisorNotes">Internal Notes (for your reference)</Label>
                <Textarea
                  id="advisorNotes"
                  data-testid="textarea-notes"
                  {...form.register("advisorNotes")}
                  placeholder="Add any internal notes about this deal, GP relationship, or competitive intelligence..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card data-testid="card-lender-selection">
            <CardHeader>
              <CardTitle>Select Lenders</CardTitle>
              <CardDescription>
                Choose which lenders to invite for this competitive RFP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {AVAILABLE_LENDERS.map((lender) => {
                  const selectedLenders = form.watch("selectedLenders") || [];
                  const isSelected = selectedLenders.includes(lender);

                  return (
                    <div
                      key={lender}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover-elevate"
                      data-testid={`lender-option-${lender.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Checkbox
                        id={`lender-${lender}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          console.log(`Checkbox ${lender} changed to:`, checked);
                          const current = form.getValues("selectedLenders") || [];
                          console.log("Current selectedLenders before update:", current);
                          const newValue = checked 
                            ? [...current, lender] 
                            : current.filter((l) => l !== lender);
                          console.log("Setting selectedLenders to:", newValue);
                          form.setValue("selectedLenders", newValue, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                        }}
                        data-testid={`checkbox-lender-${lender.toLowerCase().replace(/\s+/g, "-")}`}
                      />
                      <Label
                        htmlFor={`lender-${lender}`}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {lender}
                      </Label>
                    </div>
                  );
                })}
              </div>

              {form.watch("selectedLenders")?.length === 0 && (
                <p className="text-sm text-destructive">Please select at least one lender</p>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Selected: {form.watch("selectedLenders")?.length || 0} lenders</p>
                <p className="text-xs text-muted-foreground mt-1">
                  More lenders increase competition and may result in better terms
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            data-testid="button-previous-step"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              data-testid="button-next-step"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!canProceed() || createDealMutation.isPending}
              data-testid="button-submit-deal"
            >
              {createDealMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit RFP
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
