import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { Building2, Clock, TrendingUp, Shield } from "lucide-react";

export default function OnboardingStart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fundName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/onboarding/sessions", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setLocation(`/onboarding/${data.id}/upload`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start onboarding session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fundName || !formData.contactName || !formData.contactEmail) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Apply for Growth Capital
          </h1>
          <p className="text-lg text-muted-foreground">
            Non-dilutive liquidity in under 30 days
          </p>
        </div>

        <OnboardingProgress currentStep={1} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conservative LTV</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">5-15%</div>
              <p className="text-xs text-muted-foreground">vs 30-50% traditional</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time to Fund</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">&lt;30 days</div>
              <p className="text-xs text-muted-foreground">From term sheet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fund Size</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">$100-500M</div>
              <p className="text-xs text-muted-foreground">AUM sweet spot</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LP Aligned</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">ILPA</div>
              <p className="text-xs text-muted-foreground">Transparent terms</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Fund Information</CardTitle>
            <CardDescription>
              Tell us about your fund. We'll respond within 48 hours with a fit assessment.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name *</Label>
                <Input
                  id="fundName"
                  placeholder="e.g., Acme Growth Capital II"
                  value={formData.fundName}
                  onChange={(e) => setFormData({ ...formData, fundName: e.target.value })}
                  required
                  data-testid="input-fund-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Your Name *</Label>
                <Input
                  id="contactName"
                  placeholder="John Smith"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  required
                  data-testid="input-contact-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@acmecapital.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                  data-testid="input-contact-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone (optional)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  data-testid="input-contact-phone"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={createSessionMutation.isPending}
                data-testid="button-start-onboarding"
              >
                {createSessionMutation.isPending ? "Starting..." : "Continue to Document Upload"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 p-4 bg-muted rounded-md">
          <h3 className="font-semibold mb-2">What You'll Need</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Latest fund NAV or quarterly report</li>
            <li>• Limited Partnership Agreement (LPA)</li>
            <li>• Portfolio company list with valuations</li>
            <li>• Recent financial statements (optional but helpful)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
