import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold mb-8" data-testid="heading-terms">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-6">
              <strong>Last Updated:</strong> October 24, 2025
            </p>
            <p className="text-muted-foreground">
              These Terms of Service ("Terms") govern your access to and use of AlphaNAV's NAV lending operations platform (the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By creating an account, accessing, or using the Platform, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Be bound by these Terms and our Privacy Policy</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Have the authority to enter into this agreement on behalf of your organization (if applicable)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              If you do not agree to these Terms, you may not access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Platform Description</h2>
            <p className="text-muted-foreground mb-4">
              AlphaNAV provides a software platform for NAV lending operations, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AI-powered fund document extraction and analysis</li>
              <li>Automated underwriting and eligibility assessment</li>
              <li>Legal document generation (term sheets, loan agreements, compliance reports)</li>
              <li>Facility management and covenant monitoring</li>
              <li>Risk analysis and breach prediction</li>
              <li>Communication tools for lenders, PE funds, and placement agents</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>Important:</strong> AlphaNAV is a technology platform provider. We do not provide financial advice, act as a lender, or broker loans. All lending decisions remain the responsibility of platform users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Roles</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">3.1 Account Registration</h3>
            <p className="text-muted-foreground mb-4">You must:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">3.2 User Roles</h3>
            <p className="text-muted-foreground mb-4">The Platform supports three user types:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Operations/Lenders:</strong> NAV lenders managing deal pipeline, underwriting, and portfolio monitoring</li>
              <li><strong>Advisors/Placement Agents:</strong> Brokers facilitating connections between funds and lenders</li>
              <li><strong>GP Users:</strong> Private equity fund managers seeking NAV financing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">4.1 Permitted Use</h3>
            <p className="text-muted-foreground mb-4">You may use the Platform to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Conduct legitimate NAV lending operations</li>
              <li>Upload and analyze fund documents</li>
              <li>Generate legal documents for real transactions</li>
              <li>Communicate with other authorized platform users</li>
              <li>Monitor facilities and covenant compliance</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">4.2 Prohibited Activities</h3>
            <p className="text-muted-foreground mb-4">You may NOT:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Upload false, misleading, or fraudulent information</li>
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Attempt to gain unauthorized access to the Platform or other users' accounts</li>
              <li>Reverse engineer, decompile, or extract source code</li>
              <li>Use the Platform for any unlawful or unethical purpose</li>
              <li>Interfere with or disrupt Platform operations</li>
              <li>Scrape, harvest, or collect user data without authorization</li>
              <li>Transmit viruses, malware, or harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. AI Services and Data Processing</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">5.1 AI Document Extraction</h3>
            <p className="text-muted-foreground mb-4">
              Our AI-powered document extraction service uses Google Gemini AI to analyze fund documents. By uploading documents:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You grant us permission to process documents using third-party AI services</li>
              <li>You confirm you have the right to upload and process these documents</li>
              <li>You acknowledge AI extraction may contain errors and should be reviewed</li>
              <li>Extracted data is subject to your review and confirmation before use</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">5.2 Breach Prediction</h3>
            <p className="text-muted-foreground">
              Our covenant breach prediction is provided for informational purposes only. While our AI achieves 95% prediction accuracy, it does not constitute financial advice. Users must conduct their own analysis and make independent lending decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">6.1 AlphaNAV Ownership</h3>
            <p className="text-muted-foreground mb-4">
              We own all rights to the Platform, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Software, code, and algorithms</li>
              <li>User interface and design</li>
              <li>Trademarks, logos, and branding</li>
              <li>Documentation and training materials</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">6.2 User Content</h3>
            <p className="text-muted-foreground mb-4">
              You retain ownership of documents and data you upload. By using the Platform, you grant us a license to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Store, process, and display your content as necessary to provide services</li>
              <li>Use aggregated, anonymized data to improve Platform performance</li>
              <li>Share content with authorized platform participants (e.g., lenders reviewing GP submissions)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Fees and Payment</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">7.1 Subscription Plans</h3>
            <p className="text-muted-foreground mb-4">
              Platform access requires an active subscription:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Starter:</strong> $5,000/month - Up to 10 facilities, 2 seats, 100 AI extractions/month</li>
              <li><strong>Professional:</strong> $12,000/month - Up to 50 facilities, 5 seats, 500 AI extractions/month</li>
              <li><strong>Enterprise:</strong> Custom pricing - Unlimited facilities, seats, and extractions</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">7.2 Payment Terms</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Fees are billed monthly in advance</li>
              <li>Payment is due upon invoice receipt</li>
              <li>Late payments may result in service suspension</li>
              <li>We reserve the right to change pricing with 30 days' notice</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">7.3 Refunds</h3>
            <p className="text-muted-foreground">
              Subscription fees are non-refundable except as required by law or at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data Security and Privacy</h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encryption at rest and in transit</li>
              <li>Role-based access control (RBAC)</li>
              <li>Regular security audits and penetration testing</li>
              <li>SOC 2 Type II certification (Q3 2025)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              See our <Link href="/privacy"><a className="text-primary hover:underline">Privacy Policy</a></Link> for detailed information about data handling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Service Level and Availability</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">9.1 Uptime</h3>
            <p className="text-muted-foreground">
              We target 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be announced in advance when possible.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">9.2 Support</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Starter:</strong> Standard support (email, 48-hour response time)</li>
              <li><strong>Professional:</strong> Priority support (email/phone, 24-hour response time)</li>
              <li><strong>Enterprise:</strong> Dedicated support (custom SLA)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimers and Limitations</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">10.1 No Financial Advice</h3>
            <p className="text-muted-foreground mb-4">
              <strong>IMPORTANT:</strong> AlphaNAV is a technology platform. We do not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide investment, legal, or financial advice</li>
              <li>Act as a lender or broker</li>
              <li>Guarantee loan approvals or terms</li>
              <li>Make lending decisions on behalf of users</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">10.2 AI Accuracy</h3>
            <p className="text-muted-foreground">
              While our AI services achieve high accuracy rates (100% document extraction, 95% breach prediction on test data), results may vary. Users must independently verify AI-generated outputs before relying on them.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">10.3 Warranty Disclaimer</h3>
            <p className="text-muted-foreground">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AlphaNAV shall not be liable for indirect, incidental, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed fees paid by you in the 12 months preceding the claim</li>
              <li>We are not liable for losses resulting from unauthorized access, data breaches by third parties, or force majeure events</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless AlphaNAV from claims arising from your use of the Platform, violation of these Terms, or infringement of third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">13.1 By You</h3>
            <p className="text-muted-foreground">
              You may terminate your account at any time by contacting us. No refunds will be provided for partial months.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">13.2 By Us</h3>
            <p className="text-muted-foreground mb-4">
              We may suspend or terminate your access if you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Violate these Terms</li>
              <li>Fail to pay fees when due</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Pose a security risk to the Platform</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">13.3 Effect of Termination</h3>
            <p className="text-muted-foreground">
              Upon termination, your access ceases immediately. You may request a data export within 30 days. We retain data as required by law or legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. Material changes will be communicated via email or Platform notification at least 30 days before taking effect. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Governing Law and Disputes</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">15.1 Governing Law</h3>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">15.2 Dispute Resolution</h3>
            <p className="text-muted-foreground mb-4">
              Disputes shall be resolved through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Negotiation:</strong> Good faith discussions for 30 days</li>
              <li><strong>Arbitration:</strong> Binding arbitration under AAA Commercial Rules if negotiation fails</li>
              <li><strong>Exceptions:</strong> Either party may seek injunctive relief in court for intellectual property violations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. General Provisions</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">16.1 Entire Agreement</h3>
            <p className="text-muted-foreground">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and AlphaNAV.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">16.2 Severability</h3>
            <p className="text-muted-foreground">
              If any provision is found unenforceable, the remaining provisions remain in full effect.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">16.3 No Waiver</h3>
            <p className="text-muted-foreground">
              Failure to enforce any provision does not constitute a waiver of that provision.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">16.4 Assignment</h3>
            <p className="text-muted-foreground">
              You may not assign these Terms without our written consent. We may assign these Terms freely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Contact Information</h2>
            <p className="text-muted-foreground mb-4">
              For questions about these Terms, contact us:
            </p>
            <div className="text-muted-foreground pl-6">
              <p><strong>AlphaNAV</strong></p>
              <p>Email: <a href="mailto:legal@alphanav.ai" className="text-primary hover:underline">legal@alphanav.ai</a></p>
              <p>General Inquiries: <a href="mailto:hello@alphanav.ai" className="text-primary hover:underline">hello@alphanav.ai</a></p>
            </div>
          </section>

          <section className="border-t pt-8 mt-12">
            <p className="text-sm text-muted-foreground italic">
              By using AlphaNAV, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
