import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, FileSearch, Brain, Shield, BarChart3, FileText, Bell } from "lucide-react";

export default function SolutionsPage() {
  const workflows = [
    {
      icon: FileSearch,
      title: "GP Self-Onboarding",
      description: "Fund managers submit applications directly through a streamlined portal with AI-powered document extraction",
      features: [
        "Automated PPM and financial statement parsing",
        "Real-time eligibility assessment",
        "Digital document vault with version control",
        "Multi-step guided workflow"
      ]
    },
    {
      icon: Brain,
      title: "Automated Underwriting",
      description: "AI-driven analysis of fund metrics, covenant structures, and risk factors to accelerate deal decisioning",
      features: [
        "Fund AUM and vintage year extraction",
        "Automated covenant breach risk analysis",
        "LTV ratio and collateral quality scoring",
        "Comparable deal analysis"
      ]
    },
    {
      icon: Shield,
      title: "Covenant Monitoring",
      description: "Continuous compliance tracking with automated checks and urgent breach notifications",
      features: [
        "Scheduled compliance checks (daily and business hours)",
        "Three-tier status system (compliant, warning, breach)",
        "Automated notification triggers",
        "Historical compliance reporting"
      ]
    },
    {
      icon: BarChart3,
      title: "Portfolio Analytics",
      description: "Comprehensive risk metrics and operational alpha tracking across your NAV lending portfolio",
      features: [
        "Real-time covenant health dashboard",
        "Payment performance analytics",
        "Risk scoring and concentration analysis",
        "ROI and operational alpha calculations"
      ]
    },
    {
      icon: FileText,
      title: "Legal Document Generation",
      description: "Automated creation of loan agreements, term sheets, and compliance reports from facility data",
      features: [
        "Pre-configured templates for standard documents",
        "Dynamic field population from facility records",
        "Configurable covenant and pricing terms",
        "Markdown and PDF export options"
      ]
    },
    {
      icon: Bell,
      title: "Advisor Workflow",
      description: "Competitive RFP process management with anonymization and intelligent bid comparison",
      features: [
        "Lender anonymization for blind bidding",
        "Automated bid scoring and comparison",
        "Commission tracking and calculations",
        "Performance analytics dashboard"
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AN</span>
              </div>
              <span className="font-semibold text-lg">AlphaNAV</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/marketing/solutions" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-solutions">
              Solutions
            </Link>
            <Link href="/marketing/pricing" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-pricing">
              Pricing
            </Link>
            <Link href="/marketing/security" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-security">
              Security
            </Link>
            <Link href="/marketing/contact" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-contact">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/api/login">
              <Button variant="ghost" size="sm" data-testid="button-login-nav">
                Sign In
              </Button>
            </Link>
            <Link href="/marketing/contact">
              <Button size="sm" data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-8" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="max-w-3xl mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="heading-solutions">
              Complete NAV Lending Automation
            </h1>
            <p className="text-xl text-muted-foreground">
              From GP onboarding to portfolio monitoring, AlphaNAV automates every step of your NAV lending operations. 
              Built specifically for lower-middle market PE funds ($100M-$500M AUM) with the unique workflows and compliance requirements of NAV financing.
            </p>
          </div>

          <div className="space-y-8">
            {workflows.map((workflow, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-workflow-${index}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <workflow.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{workflow.title}</CardTitle>
                      <CardDescription className="text-base">{workflow.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid md:grid-cols-2 gap-3 pl-16">
                    {workflow.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-success mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 bg-card/30 rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="heading-cta">
              See AlphaNAV in Action
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Schedule a personalized demo to see how AlphaNAV can transform your NAV lending operations
            </p>
            <Link href="/marketing/contact">
              <Button size="lg" data-testid="button-demo">
                Request a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
