import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Eye, Database, FileCheck, Users } from "lucide-react";

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "SOC 2 Type II Compliance",
      description: "Our infrastructure meets the highest standards for security, availability, and confidentiality with annual third-party audits"
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256) with customer-managed encryption keys available for Enterprise customers"
    },
    {
      icon: Eye,
      title: "Role-Based Access Control",
      description: "Granular permissions ensure users only access data relevant to their role (Operations, GP, Advisor, Admin) with multi-tenant isolation"
    },
    {
      icon: Database,
      title: "Secure Data Storage",
      description: "PostgreSQL databases hosted on SOC 2 compliant infrastructure with automated backups, point-in-time recovery, and geographic redundancy"
    },
    {
      icon: FileCheck,
      title: "Comprehensive Audit Logging",
      description: "All system actions are logged with immutable audit trails for compliance, forensics, and regulatory reporting"
    },
    {
      icon: Users,
      title: "Multi-Factor Authentication",
      description: "Support for SSO, OAuth 2.0, and OIDC with MFA enforcement options and session management controls"
    }
  ];

  const complianceItems = [
    "GDPR compliant data processing",
    "SOC 2 Type II certified",
    "Regular penetration testing",
    "Vulnerability scanning and patching",
    "Business continuity and disaster recovery",
    "Data retention and deletion policies",
    "Security incident response procedures",
    "Employee background checks and training"
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
            <Link href="/marketing/pricing" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-pricing">
              Pricing
            </Link>
            <Link href="/marketing/security" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-security">
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="heading-security">
              Enterprise-Grade Security & Compliance
            </h1>
            <p className="text-xl text-muted-foreground">
              Built from the ground up with security and compliance at the core. AlphaNAV protects your sensitive financial data 
              with industry-leading security controls and certifications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-security-${index}`}>
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

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Compliance & Certifications</CardTitle>
                <CardDescription>
                  We maintain the highest standards for data security and regulatory compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {complianceItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span className="text-success mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Data Privacy</CardTitle>
                <CardDescription>
                  Your data is your data. We never share, sell, or use customer data for any purpose beyond providing our service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Multi-Tenant Isolation</h4>
                  <p className="text-sm text-muted-foreground">
                    Strict data separation ensures GP users only access their own facilities, with Operations and Admin roles 
                    maintaining appropriate oversight privileges
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Data Residency</h4>
                  <p className="text-sm text-muted-foreground">
                    US-based data centers with optional EU data residency for Enterprise customers requiring geographic data controls
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Data Portability</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your data in standard formats (CSV, JSON) at any time with comprehensive CSV exports for compliance reporting
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/30">
            <CardHeader>
              <CardTitle className="text-2xl">Security Documentation</CardTitle>
              <CardDescription>
                Need more details about our security practices?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We provide comprehensive security documentation including our SOC 2 report, penetration test summaries, 
                and detailed security white papers to Enterprise customers under NDA.
              </p>
              <Link href="/marketing/contact">
                <Button data-testid="button-request-docs">
                  Request Security Documentation
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="mt-16 bg-card/30 rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="heading-cta">
              Have Security Questions?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our security team is available to answer any questions about our practices, certifications, or compliance requirements
            </p>
            <Link href="/marketing/contact">
              <Button size="lg" data-testid="button-contact-security">
                Contact Security Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
