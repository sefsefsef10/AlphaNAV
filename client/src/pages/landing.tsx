import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, ArrowRight, Zap, TrendingUp, Clock, Brain, Shield, Database, Upload, BarChart3, FileText, Bell } from "lucide-react";

export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In production, this would send to backend API
    // For now, simulate form submission
    console.log("Demo request submitted:", formData);
    
    // Reset form and show success message
    setFormData({
      name: "",
      email: "",
      company: "",
      role: "",
      message: "",
    });
    setFormSubmitted(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="nav-logo">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AN</span>
            </div>
            <span className="text-xl font-bold">AlphaNAV</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app">
              <Button variant="ghost" data-testid="button-sign-in">Sign In</Button>
            </Link>
            <Button 
              data-testid="button-request-demo-nav"
              onClick={() => {
                document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Request Demo
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              The First Operating System for NAV Lending
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automate underwriting, monitoring, and portfolio management for NAV facilities. Built for lower-middle market PE funds and the lenders who back them.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                data-testid="button-request-demo-hero"
                onClick={() => {
                  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Request Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                data-testid="button-see-how-it-works"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See How It Works
              </Button>
            </div>

            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-6 pt-12">
              <Card data-testid="card-value-prop-underwriting">
                <CardHeader>
                  <Zap className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>90% Faster Underwriting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">AI extracts fund data in 90 seconds, not 3 weeks</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-value-prop-monitoring">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Real-Time Risk Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Predictive breach analysis catches problems before they happen</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-value-prop-speed">
                <CardHeader>
                  <Clock className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>30-Day Closes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">From first contact to funded facility</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">NAV Lending Is Still Stuck in 2010</h2>
            <p className="text-lg text-muted-foreground">
              PE funds email PDFs. Lenders manually review hundreds of pages. Advisors coordinate RFPs through Outlook. Covenant tracking lives in Excel. Close timelines stretch to 90 days.
            </p>
            <p className="text-lg text-muted-foreground">
              Meanwhile, <span className="font-semibold text-foreground">$500B+ in lower-middle market fund NAV</span> waits for efficient financing.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">One Platform. Three Workflows. Zero Manual Work.</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                AlphaNAV connects PE funds, NAV lenders, and placement agents in a purpose-built platform for $100M-$500M AUM funds.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>For PE Fund Managers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Upload your fund documents and get instant eligibility assessment. Track facility capacity, submit draw requests, and communicate with lenders - all in one dashboard.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>For NAV Lenders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Automated underwriting from uploaded documents. One-click term sheets and loan agreements. Real-time covenant monitoring with AI-powered breach prediction.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>For Placement Agents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Run competitive RFPs with anonymous fund submissions. Compare term sheets side-by-side. Track commissions automatically across your lender network.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            </div>

            <Tabs defaultValue="gp" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="gp" data-testid="tab-gp">For PE Fund Managers</TabsTrigger>
                <TabsTrigger value="lender" data-testid="tab-lender">For NAV Lenders</TabsTrigger>
                <TabsTrigger value="advisor" data-testid="tab-advisor">For Placement Agents</TabsTrigger>
              </TabsList>

              <TabsContent value="gp" className="space-y-6 pt-6">
                <div className="grid gap-6">
                  {[
                    { step: 1, title: "Upload Documents", description: "LPA, financials, NAV reports" },
                    { step: 2, title: "AI Extracts Data", description: "Fund details populated in 90 seconds" },
                    { step: 3, title: "Submit Request", description: "Confirm information and request facility" },
                    { step: 4, title: "Compare Terms", description: "Review competing lender offers" },
                    { step: 5, title: "Manage Facility", description: "Draws, repayments, covenant tracking from one dashboard" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="lender" className="space-y-6 pt-6">
                <div className="grid gap-6">
                  {[
                    { step: 1, title: "Review Pipeline", description: "See qualified funds automatically" },
                    { step: 2, title: "AI Underwriting", description: "Automated fund analysis and risk scoring" },
                    { step: 3, title: "Generate Documents", description: "Term sheets, loan agreements, compliance reports" },
                    { step: 4, title: "Monitor Portfolio", description: "Real-time covenant tracking across all facilities" },
                    { step: 5, title: "Prevent Breaches", description: "AI predicts covenant violations before they happen" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="advisor" className="space-y-6 pt-6">
                <div className="grid gap-6">
                  {[
                    { step: 1, title: "Submit RFP", description: "Anonymous fund details to protect confidentiality" },
                    { step: 2, title: "Invite Lenders", description: "Competitive bidding from your network" },
                    { step: 3, title: "Compare Terms", description: "Side-by-side analysis of offers" },
                    { step: 4, title: "Track Pipeline", description: "Submission through close in one view" },
                    { step: 5, title: "Calculate Commissions", description: "Automatic tracking at 50-75 bps" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Core Features</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Upload className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Deal Origination</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• GP self-service onboarding with 4-step wizard</li>
                      <li>• AI document extraction from PDFs and Word docs</li>
                      <li>• Automated eligibility assessment</li>
                      <li>• Advisor RFP portal with fund anonymization</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Underwriting & Analysis</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Automated fund data extraction</li>
                      <li>• AI-powered risk scoring</li>
                      <li>• Investment committee memo generation</li>
                      <li>• Historical performance analysis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Legal & Documentation</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• One-click loan agreement generation</li>
                      <li>• Customizable term sheet templates</li>
                      <li>• Compliance report automation</li>
                      <li>• Document library with version control</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Facility Management</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Real-time facility dashboard</li>
                      <li>• Draw request workflow (submit, approve, fund, repay)</li>
                      <li>• Payment schedule tracking</li>
                      <li>• Outstanding balance monitoring</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Covenant Monitoring</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• LTV ratio tracking (5-15% focus)</li>
                      <li>• Minimum NAV thresholds</li>
                      <li>• Portfolio diversification requirements</li>
                      <li>• Automated quarterly compliance checks</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Risk Management</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• AI-powered breach prediction (95% accuracy)</li>
                      <li>• Risk level classification (Low/Medium/High/Critical)</li>
                      <li>• Proactive alert notifications</li>
                      <li>• Recommended mitigation actions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">AI Capabilities</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Document Extraction</CardTitle>
                  <CardDescription>Upload fund documents and get instant data extraction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Fund name, vintage year, AUM
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Portfolio company count and sectors
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Key personnel and management team
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Current borrowing status
                    </li>
                  </ul>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Response Time:</span>
                      <span className="font-semibold">1.6 seconds</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span className="font-semibold">100%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Result:</span>
                      <span className="font-semibold">30 min → 2 min onboarding</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Breach Prediction</CardTitle>
                  <CardDescription>AI analyzes facility health and predicts covenant violations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Current LTV ratio and NAV trends
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Historical payment patterns
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Portfolio concentration risk
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Probability of breach (0-100%)
                    </li>
                  </ul>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Analysis Time:</span>
                      <span className="font-semibold">&lt;3 seconds</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prediction Accuracy:</span>
                      <span className="font-semibold">95%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Result:</span>
                      <span className="font-semibold">Catch problems weeks early</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose AlphaNAV */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Why Lenders Choose AlphaNAV</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Proven in Production</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Built in partnership with NAV IQ Capital, an active NAV lender serving $100M-$500M funds. Every feature solves real operational challenges from live deal flow.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      &lt;30-day average close time
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      90% reduction in manual underwriting
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      95% breach prediction accuracy
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Built for Conservative Lenders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Platform defaults match disciplined underwriting:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      5-15% LTV focus (vs 30-50% competitors)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Growth-focused facilities only
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      ILPA-aligned workflows
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Transparent fee structures
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market-Ready Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Handles multiple lenders on same platform
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Advisor network for deal flow
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      GP self-service to reduce friction
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Scales from startup to institutional
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Technical Specifications</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Architecture</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PostgreSQL database with serverless scaling</li>
                      <li>• Type-safe operations end-to-end</li>
                      <li>• Sub-3-second AI response times</li>
                      <li>• Automated daily backups</li>
                      <li>• 99.9% uptime SLA</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Security</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• OIDC authentication (Google, Microsoft)</li>
                      <li>• Role-based access control</li>
                      <li>• Encrypted data at rest and in transit</li>
                      <li>• SOC 2 Type II (Q3 2025)</li>
                      <li>• Complete audit trails</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Pricing</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>For emerging NAV lenders</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$5,000</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Up to 10 active facilities
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      2 operations team seats
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      100 AI document extractions/month
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Unlimited breach analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Standard support
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline" data-testid="button-pricing-starter">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                    Most Popular
                  </div>
                  <CardTitle>Professional</CardTitle>
                  <CardDescription>Most popular</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$12,000</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Up to 50 active facilities
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      5 operations team seats
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      500 AI document extractions/month
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Unlimited breach analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Advisor portal access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Custom legal templates
                    </li>
                  </ul>
                  <Button className="w-full" data-testid="button-pricing-professional">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Custom pricing</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Unlimited facilities
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Unlimited seats
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Unlimited AI extractions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      White-label options
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Dedicated support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Custom integrations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      SLA guarantees
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline" data-testid="button-pricing-enterprise">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">FAQ</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Who is AlphaNAV built for?</AccordionTrigger>
                <AccordionContent>
                  NAV lenders serving $100M-$500M AUM PE funds in the lower-middle market. Also placement agents who broker NAV facilities and PE fund managers seeking financing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How does the AI document extraction work?</AccordionTrigger>
                <AccordionContent>
                  Upload fund documents (PDFs or Word docs) and our AI extracts key data points - fund name, vintage, AUM, portfolio details, personnel. Takes 90 seconds vs 30 minutes of manual data entry.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How accurate is the breach prediction?</AccordionTrigger>
                <AccordionContent>
                  95% accuracy in identifying facilities at risk of covenant violations. The AI provides risk levels (Low/Medium/High/Critical) and estimated time to breach. Lenders review all flagged facilities.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Can we use our own legal templates?</AccordionTrigger>
                <AccordionContent>
                  Yes. AlphaNAV accepts custom loan agreement templates, term sheets, and compliance report formats. You maintain your legal positioning while automating document generation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>What's your security posture?</AccordionTrigger>
                <AccordionContent>
                  Enterprise authentication (OIDC), role-based access, encrypted data storage, PostgreSQL-backed sessions, complete audit trails. SOC 2 Type II certification in progress (Q3 2025).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Is this only for one specific lender?</AccordionTrigger>
                <AccordionContent>
                  No. AlphaNAV is a market-facing platform built in partnership with NAV IQ Capital (who uses it for their operations). The platform serves the entire NAV lending market.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>How long does implementation take?</AccordionTrigger>
                <AccordionContent>
                  2-4 weeks. Includes data migration, custom template setup, team training, and testing. Most lenders go live within 30 days of contract signature.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">See AlphaNAV in Action</h2>
              <p className="text-lg text-muted-foreground">
                Request a demo with your own fund documents and workflows. We'll show you how to close facilities in under 30 days.
              </p>
            </div>

            <Card data-testid="card-contact-form">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-contact">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        data-testid="input-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        data-testid="input-email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        data-testid="input-company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger id="role" data-testid="select-role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lender">NAV Lender</SelectItem>
                          <SelectItem value="fund">PE Fund</SelectItem>
                          <SelectItem value="advisor">Placement Agent</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      data-testid="textarea-message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your NAV lending needs..."
                    />
                  </div>

                  {formSubmitted && (
                    <div 
                      className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center"
                      data-testid="text-form-success"
                    >
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        Thank you! We'll respond within 48 hours.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1" data-testid="button-submit-demo">
                      Request Demo
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      data-testid="button-schedule-call"
                      onClick={() => window.open('mailto:hello@alphanav.ai?subject=Schedule Demo Call', '_blank')}
                    >
                      Schedule Call
                    </Button>
                  </div>

                  {!formSubmitted && (
                    <p className="text-sm text-center text-muted-foreground">
                      We'll respond within 48 hours.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30" data-testid="footer">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2" data-testid="footer-logo">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">AN</span>
                </div>
                <span className="text-xl font-bold">AlphaNAV</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Operating system for NAV lending
              </p>
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Built in partnership with NAV IQ Capital</p>
              <p data-testid="text-email">
                <a href="mailto:hello@alphanav.ai" className="hover:text-foreground">
                  hello@alphanav.ai
                </a>
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <Link href="/privacy" className="hover:text-foreground" data-testid="link-privacy">
                  Privacy Policy
                </Link>
                <span>|</span>
                <Link href="/terms" className="hover:text-foreground" data-testid="link-terms">
                  Terms of Service
                </Link>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground" data-testid="text-copyright">
              © 2025 AlphaNAV. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
