import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="nav-logo">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AN</span>
              </div>
              <span className="text-xl font-bold">AlphaNAV</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8" data-testid="heading-privacy">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-6">
              <strong>Last Updated:</strong> October 24, 2025
            </p>
            <p className="text-muted-foreground">
              AlphaNAV ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our NAV lending operations platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">1.1 Information You Provide</h3>
            <p className="text-muted-foreground mb-4">
              We collect information that you voluntarily provide when using our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Information:</strong> Name, email address, company name, role, and authentication credentials</li>
              <li><strong>Fund Documents:</strong> Limited partnership agreements, financial statements, NAV reports, and related documentation</li>
              <li><strong>Transaction Data:</strong> Facility details, draw requests, covenant information, and payment records</li>
              <li><strong>Communications:</strong> Messages sent through our platform, support requests, and demo inquiries</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">1.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers</li>
              <li><strong>Cookies:</strong> Session cookies for authentication and functional cookies for platform operation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Platform Operations:</strong> Provide, maintain, and improve our NAV lending platform services</li>
              <li><strong>AI Processing:</strong> Extract data from fund documents and perform covenant breach analysis</li>
              <li><strong>Legal Document Generation:</strong> Create term sheets, loan agreements, and compliance reports</li>
              <li><strong>Communication:</strong> Send notifications, updates, and respond to inquiries</li>
              <li><strong>Security:</strong> Monitor for fraud, unauthorized access, and platform abuse</li>
              <li><strong>Analytics:</strong> Understand usage patterns and improve user experience</li>
              <li><strong>Compliance:</strong> Meet legal obligations and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">3.1 Service Providers</h3>
            <p className="text-muted-foreground mb-4">
              We share information with third-party service providers who perform services on our behalf:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>AI Services:</strong> Google Gemini AI for document extraction and analysis</li>
              <li><strong>Database Hosting:</strong> Neon (PostgreSQL) for secure data storage</li>
              <li><strong>Authentication:</strong> Replit OIDC for identity verification</li>
              <li><strong>Email:</strong> Email service providers for notifications and communications</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">3.2 Platform Participants</h3>
            <p className="text-muted-foreground mb-4">
              Information is shared between authorized platform participants as necessary for NAV lending operations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Lenders receive fund information from GP users and placement agents</li>
              <li>Placement agents facilitate information exchange between funds and lenders</li>
              <li>GP users access their facility information and lender communications</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">3.3 Legal Requirements</h3>
            <p className="text-muted-foreground">
              We may disclose information if required by law, court order, or governmental request, or to protect our rights, property, or safety.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Encryption:</strong> Data encrypted at rest and in transit using industry-standard protocols</li>
              <li><strong>Access Controls:</strong> Role-based access control (RBAC) and authentication via OIDC</li>
              <li><strong>Session Management:</strong> Secure, PostgreSQL-backed sessions with automatic expiration</li>
              <li><strong>Monitoring:</strong> Continuous security monitoring and audit logging</li>
              <li><strong>Regular Updates:</strong> Security patches and updates applied promptly</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Fund documents and transaction records are retained for 7 years in accordance with financial industry standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your jurisdiction, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Portability:</strong> Request export of your data in a structured format</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@alphanav.com" className="text-primary hover:underline">privacy@alphanav.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Essential Cookies:</strong> Required for authentication and platform functionality</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Understand platform usage and improve performance</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You can manage cookie preferences through your browser settings, though disabling certain cookies may limit platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our platform and updating the "Last Updated" date. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="text-muted-foreground pl-6">
              <p><strong>AlphaNAV</strong></p>
              <p>Email: <a href="mailto:privacy@alphanav.com" className="text-primary hover:underline">privacy@alphanav.com</a></p>
              <p>General Inquiries: <a href="mailto:hello@alphanav.com" className="text-primary hover:underline">hello@alphanav.com</a></p>
            </div>
          </section>

          <section className="border-t pt-8 mt-12">
            <p className="text-sm text-muted-foreground italic">
              This Privacy Policy is designed to comply with GDPR, CCPA, and other applicable data protection regulations. 
              For specific questions about how this policy applies to your jurisdiction, please contact our privacy team.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 AlphaNAV. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/privacy">
                <a className="hover:text-foreground" data-testid="link-privacy-footer">Privacy Policy</a>
              </Link>
              <span>|</span>
              <Link href="/terms">
                <a className="hover:text-foreground" data-testid="link-terms-footer">Terms of Service</a>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
