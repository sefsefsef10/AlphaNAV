import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { CheckCircle2, Mail, Calendar, FileText, ArrowRight } from "lucide-react";

export default function OnboardingComplete() {
  const [, params] = useRoute("/onboarding/:id/complete");
  const sessionId = params?.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Application Submitted
          </h1>
          <p className="text-lg text-muted-foreground">
            Thank you for applying to NAV IQ Capital
          </p>
        </div>

        <OnboardingProgress currentStep={4} />

        <div className="mt-8 space-y-6">
          <Card className="border-green-500/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Application Received!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Your application has been submitted successfully. Our team will review your information and respond within 48 hours.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-md text-center">
                  <Mail className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Email Confirmation</p>
                  <p className="text-xs text-muted-foreground mt-1">Check your inbox</p>
                </div>
                <div className="p-4 bg-muted rounded-md text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Application Review</p>
                  <p className="text-xs text-muted-foreground mt-1">Within 48 hours</p>
                </div>
                <div className="p-4 bg-muted rounded-md text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Initial Call</p>
                  <p className="text-xs text-muted-foreground mt-1">If qualified</p>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">What Happens Next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Preliminary Assessment</p>
                      <p className="text-xs text-muted-foreground">
                        We'll review your fund profile against our investment criteria
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fit Confirmation</p>
                      <p className="text-xs text-muted-foreground">
                        You'll receive an email with our initial assessment and next steps
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Discovery Call</p>
                      <p className="text-xs text-muted-foreground">
                        Schedule a call to discuss your specific needs and use of proceeds
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Term Sheet</p>
                      <p className="text-xs text-muted-foreground">
                        Receive a transparent term sheet with clear structure and pricing
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Application Reference: <span className="font-mono text-foreground">{sessionId}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/" data-testid="button-return-dashboard">
                      Return to Dashboard
                    </Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <a href="mailto:inquiries@naviqcapital.com" data-testid="button-contact-team">
                      Contact Our Team
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                If you have any questions about your application or the process, please don't hesitate to reach out:
              </p>
              <p className="font-medium text-foreground">
                Email: <a href="mailto:inquiries@naviqcapital.com" className="text-primary hover:underline">inquiries@naviqcapital.com</a>
              </p>
              <p className="text-xs mt-4">
                We're here to help ambitious GPs access the growth capital they need—without the wait.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
