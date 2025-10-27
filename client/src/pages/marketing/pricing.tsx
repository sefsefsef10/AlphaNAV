import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Check, X } from "lucide-react";

export default function PricingPage() {
  const tiers = [
    {
      name: "Starter",
      price: "$499",
      description: "Perfect for boutique lenders getting started with NAV financing",
      facilities: "1-3 facilities",
      features: [
        { name: "GP self-onboarding portal", included: true },
        { name: "AI document extraction", included: true },
        { name: "Covenant monitoring (daily checks)", included: true },
        { name: "Basic portfolio analytics", included: true },
        { name: "Email notifications", included: true },
        { name: "Document vault", included: true },
        { name: "Automated legal document generation", included: false },
        { name: "Advisor workflow management", included: false },
        { name: "Advanced risk analytics", included: false },
        { name: "Dedicated support", included: false }
      ]
    },
    {
      name: "Professional",
      price: "$1,999",
      description: "For growing NAV lenders managing multiple facilities",
      facilities: "4-10 facilities",
      popular: true,
      features: [
        { name: "GP self-onboarding portal", included: true },
        { name: "AI document extraction", included: true },
        { name: "Covenant monitoring (daily + business hours)", included: true },
        { name: "Advanced portfolio analytics", included: true },
        { name: "Email notifications", included: true },
        { name: "Document vault", included: true },
        { name: "Automated legal document generation", included: true },
        { name: "Advisor workflow management", included: true },
        { name: "Advanced risk analytics", included: true },
        { name: "Priority support", included: true }
      ]
    },
    {
      name: "Enterprise",
      price: "$4,999",
      description: "For established NAV lenders with large portfolios",
      facilities: "Unlimited facilities",
      features: [
        { name: "GP self-onboarding portal", included: true },
        { name: "AI document extraction", included: true },
        { name: "Covenant monitoring (daily + business hours)", included: true },
        { name: "Advanced portfolio analytics", included: true },
        { name: "Email notifications", included: true },
        { name: "Document vault", included: true },
        { name: "Automated legal document generation", included: true },
        { name: "Advisor workflow management", included: true },
        { name: "Advanced risk analytics", included: true },
        { name: "Dedicated support + CSM", included: true },
        { name: "Custom integrations", included: true },
        { name: "SLA guarantees", included: true }
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
            <Link href="/marketing/solutions" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-solutions">
              Solutions
            </Link>
            <Link href="/marketing/pricing" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-pricing">
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
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="heading-pricing">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your NAV lending portfolio. All plans include a 14-day free trial with no credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {tiers.map((tier, index) => (
              <Card 
                key={index} 
                className={`relative hover-elevate ${tier.popular ? 'border-primary' : ''}`}
                data-testid={`card-tier-${tier.name.toLowerCase()}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold tabular-nums">{tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{tier.facilities}</div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Link href="/marketing/contact">
                    <Button 
                      className="w-full" 
                      variant={tier.popular ? "default" : "outline"}
                      data-testid={`button-select-${tier.name.toLowerCase()}`}
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-success flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">What counts as a facility?</h3>
                  <p className="text-sm text-muted-foreground">
                    A facility is a unique NAV lending arrangement with a PE fund. Each facility includes GP onboarding, 
                    covenant monitoring, draw requests, cash flow tracking, and document management.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades 
                    take effect at the end of your current billing cycle. We'll prorate any differences.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Do you offer annual billing?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! Annual billing is available with a 15% discount. Contact our sales team for custom annual arrangements 
                    and multi-year commitments.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted-foreground">
                    We accept all major credit cards (Visa, Mastercard, Amex) and ACH transfers for Enterprise customers. 
                    All payments are processed securely through Stripe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 bg-card/30 rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="heading-cta">
              Not sure which plan is right for you?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Schedule a call with our team to discuss your NAV lending operations and find the perfect plan
            </p>
            <Link href="/marketing/contact">
              <Button size="lg" data-testid="button-contact-sales">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
