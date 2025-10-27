import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { TrendingUp, Shield, Zap, BarChart3, Clock, CheckCircle2 } from "lucide-react";

export default function MarketingHome() {
  const features = [
    {
      icon: Zap,
      title: "90% Automation Rate",
      description: "Automate underwriting, monitoring, and reporting workflows to achieve 100 basis points in operational alpha"
    },
    {
      icon: BarChart3,
      title: "Real-Time Portfolio Analytics",
      description: "Track covenant health, payment performance, and risk metrics across your NAV lending portfolio"
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "SOC 2 compliant infrastructure with role-based access control and comprehensive audit logging"
    },
    {
      icon: Clock,
      title: "Cut Turnaround Time by 70%",
      description: "AI-powered document extraction and automated compliance checks reduce deal processing from weeks to days"
    },
    {
      icon: TrendingUp,
      title: "Scalable Operations",
      description: "Handle 10x facility volume with the same operations team through intelligent workflow automation"
    },
    {
      icon: CheckCircle2,
      title: "Built for NAV Lending",
      description: "Purpose-built for lower-middle market PE funds ($100M-$500M AUM) with specialized covenant monitoring"
    }
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AN</span>
            </div>
            <span className="font-semibold text-lg">AlphaNAV</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/marketing/solutions" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-solutions">
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

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight" data-testid="heading-hero">
              Achieve 100 Basis Points in Operational Alpha
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              The only NAV lending platform built specifically for lower-middle market PE fund lenders. 
              Automate underwriting, monitoring, and reporting to scale operations without scaling headcount.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/marketing/contact">
                <Button size="lg" data-testid="button-hero-cta">
                  Request Demo
                </Button>
              </Link>
              <Link href="/marketing/solutions">
                <Button size="lg" variant="outline" data-testid="button-learn-more">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Setup in under 1 hour</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="heading-features">
              Built for NAV Lending Operations
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Purpose-built features that address the unique challenges of NAV financing for private equity funds
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="heading-roi">
              Proven ROI for NAV Lenders
            </h2>
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="space-y-2" data-testid="stat-automation">
                <div className="text-4xl font-bold text-primary tabular-nums">90%</div>
                <div className="text-sm text-muted-foreground">Automation Rate</div>
              </div>
              <div className="space-y-2" data-testid="stat-time-savings">
                <div className="text-4xl font-bold text-primary tabular-nums">70%</div>
                <div className="text-sm text-muted-foreground">Faster Processing</div>
              </div>
              <div className="space-y-2" data-testid="stat-alpha">
                <div className="text-4xl font-bold text-primary tabular-nums">100 bps</div>
                <div className="text-sm text-muted-foreground">Operational Alpha</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="heading-cta">
              Ready to Transform Your NAV Lending Operations?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join leading private equity lenders who are achieving operational excellence with AlphaNAV
            </p>
            <div className="pt-4">
              <Link href="/marketing/contact">
                <Button size="lg" data-testid="button-cta-bottom">
                  Schedule a Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">AN</span>
                </div>
                <span className="font-semibold">AlphaNAV</span>
              </div>
              <p className="text-sm text-muted-foreground">
                NAV lending operations platform for private equity fund lenders
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/marketing/solutions" className="hover-elevate inline-block">Solutions</Link></li>
                <li><Link href="/marketing/pricing" className="hover-elevate inline-block">Pricing</Link></li>
                <li><Link href="/marketing/security" className="hover-elevate inline-block">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/marketing/contact" className="hover-elevate inline-block">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover-elevate inline-block">Privacy Policy</a></li>
                <li><a href="#" className="hover-elevate inline-block">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 AlphaNAV. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
