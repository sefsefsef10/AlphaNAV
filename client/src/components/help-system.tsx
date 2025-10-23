import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  Users, 
  Building2, 
  BarChart3,
  FileText,
  Settings,
  DollarSign,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface HelpSystemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: "advisor" | "gp" | "operations";
}

export function HelpSystem({ open, onOpenChange, defaultRole = "operations" }: HelpSystemProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultRole);

  // Sync activeTab with defaultRole when dialog opens or role changes
  useEffect(() => {
    if (open) {
      setActiveTab(defaultRole);
    }
  }, [open, defaultRole]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-help-system">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            AlphaNAV Help & Guides
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="operations" data-testid="tab-operations-help">
              <Building2 className="h-4 w-4 mr-2" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="advisor" data-testid="tab-advisor-help">
              <Users className="h-4 w-4 mr-2" />
              Advisors
            </TabsTrigger>
            <TabsTrigger value="gp" data-testid="tab-gp-help">
              <BarChart3 className="h-4 w-4 mr-2" />
              GP Users
            </TabsTrigger>
            <TabsTrigger value="faq" data-testid="tab-faq-help">
              <Lightbulb className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-180px)] mt-4">
            {/* Operations Guide */}
            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Getting Started - Operations Team
                  </CardTitle>
                  <CardDescription>
                    Comprehensive guide for NAV IQ Capital operations team members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="dashboard">
                      <AccordionTrigger data-testid="accordion-dashboard-help">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Operations Dashboard
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Your central hub for managing all NAV lending operations.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Key Metrics</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><strong>Total Committed:</strong> Sum of all approved facility principal amounts</li>
                            <li><strong>Outstanding Balance:</strong> Current borrowed amount across all facilities</li>
                            <li><strong>Available Credit:</strong> Unused credit capacity (Committed - Outstanding)</li>
                            <li><strong>Portfolio Health:</strong> Calculated based on LTV ratios, covenant compliance, and facility status</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Actions</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><strong>Export Data:</strong> Download prospects, deals, or facilities as CSV files</li>
                            <li><strong>Search:</strong> Press <Badge variant="outline">Cmd+K</Badge> or <Badge variant="outline">Ctrl+K</Badge> for global search</li>
                            <li><strong>Filter:</strong> Use status filters to view specific deal stages or facility statuses</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="underwriting">
                      <AccordionTrigger data-testid="accordion-underwriting-help">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Underwriting Workflow
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Complete guide to the 90% automated underwriting process.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Deal Stages</h4>
                          <ol className="list-decimal pl-5 space-y-1 text-sm">
                            <li><strong>Submission:</strong> GP or advisor submits deal information</li>
                            <li><strong>Document Upload:</strong> System extracts data from financial statements</li>
                            <li><strong>AI Analysis:</strong> Automated scoring and risk assessment</li>
                            <li><strong>Manual Review:</strong> Operations team reviews flagged items</li>
                            <li><strong>IC Review:</strong> Investment committee approval</li>
                            <li><strong>Term Sheet:</strong> Generate and send term sheet to GP</li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Conservative LTV Positioning</h4>
                          <p className="text-sm">AlphaNAV targets <strong>5-15% LTV ratios</strong> for growth-focused facilities on lower-middle market PE funds ($100M-$500M AUM). This conservative approach minimizes default risk while supporting fund growth objectives.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="monitoring">
                      <AccordionTrigger data-testid="accordion-monitoring-help">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Portfolio Monitoring
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Continuous monitoring and covenant compliance tracking.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Covenant Types</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><strong>LTV Covenant:</strong> Maximum loan-to-NAV ratio (typically 15%)</li>
                            <li><strong>Minimum NAV:</strong> Fund must maintain minimum asset value</li>
                            <li><strong>Diversification:</strong> Portfolio concentration limits</li>
                            <li><strong>Liquidity:</strong> Minimum cash reserves required</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Breach Detection</h4>
                          <p className="text-sm">System automatically checks covenants quarterly and sends alerts when:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>LTV exceeds threshold (breach)</li>
                            <li>Approaching breach (warning at 90% of threshold)</li>
                            <li>Reporting deadline missed</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="notifications">
                      <AccordionTrigger data-testid="accordion-notifications-help">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Notification Preferences
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Customize your notification settings to stay informed.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Notification Types</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><strong>Deal Updates:</strong> New submissions, status changes, IC decisions</li>
                            <li><strong>Underwriting Alerts:</strong> Documents uploaded, AI analysis complete, manual review needed</li>
                            <li><strong>Portfolio Alerts:</strong> Covenant breaches, draw requests, repayment due</li>
                            <li><strong>System Announcements:</strong> Platform updates, maintenance windows</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Delivery Channels</h4>
                          <p className="text-sm">Configure email and in-app notifications independently. Choose instant alerts or daily/weekly digest options.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advisor Guide */}
            <TabsContent value="advisor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Getting Started - Placement Advisors
                  </CardTitle>
                  <CardDescription>
                    Guide for advisors running competitive NAV lending processes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="rfp-process">
                      <AccordionTrigger data-testid="accordion-rfp-help">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Running a Competitive RFP
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Maximize value for your GP clients with competitive NAV lending processes.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">RFP Workflow</h4>
                          <ol className="list-decimal pl-5 space-y-1 text-sm">
                            <li><strong>Create Deal:</strong> Enter GP fund information and requirements</li>
                            <li><strong>Anonymize Data:</strong> System automatically masks GP identity</li>
                            <li><strong>Invite Lenders:</strong> Select qualified NAV lenders to participate</li>
                            <li><strong>Track Responses:</strong> Monitor term sheet submissions</li>
                            <li><strong>Compare Terms:</strong> Side-by-side comparison of offers</li>
                            <li><strong>De-anonymize:</strong> Reveal GP identity to winning lender</li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Commission Tracking</h4>
                          <p className="text-sm">Advisors typically earn <strong>50-75 basis points</strong> on NAV facilities. System automatically tracks commission calculations based on facility size.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="term-comparison">
                      <AccordionTrigger data-testid="accordion-comparison-help">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Term Sheet Comparison
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Evaluate and compare lender proposals efficiently.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Key Terms to Compare</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><strong>Facility Size:</strong> Total committed amount</li>
                            <li><strong>Pricing:</strong> Interest rate (SOFR + spread)</li>
                            <li><strong>LTV Ratio:</strong> Maximum loan-to-NAV (5-15% typical)</li>
                            <li><strong>Fees:</strong> Upfront, commitment, unused line fees</li>
                            <li><strong>Covenants:</strong> Financial and operational restrictions</li>
                            <li><strong>Term:</strong> Facility duration and extension options</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="client-communication">
                      <AccordionTrigger data-testid="accordion-communication-help">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Client Communication
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Keep your GP clients informed throughout the process.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Best Practices</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Share anonymized term sheet summaries with GP</li>
                            <li>Provide recommendations based on total cost of capital</li>
                            <li>Coordinate introduction calls with top lenders</li>
                            <li>Track timeline and keep GP updated on progress</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GP Guide */}
            <TabsContent value="gp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Getting Started - GP Users
                  </CardTitle>
                  <CardDescription>
                    Guide for PE fund managers accessing NAV financing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="onboarding">
                      <AccordionTrigger data-testid="accordion-onboarding-help">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Self-Onboarding Process
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Quick and easy NAV financing application - typically approved in 48-72 hours.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Application Steps</h4>
                          <ol className="list-decimal pl-5 space-y-1 text-sm">
                            <li><strong>Fund Information:</strong> Basic details about your PE fund</li>
                            <li><strong>Document Upload:</strong> Latest financial statements (automatically extracted)</li>
                            <li><strong>Use of Proceeds:</strong> How you'll use the NAV facility</li>
                            <li><strong>Submit:</strong> Application goes to NAV IQ operations team</li>
                            <li><strong>Review:</strong> Automated analysis + manual review (90% automated)</li>
                            <li><strong>Term Sheet:</strong> Receive preliminary terms within 48-72 hours</li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Required Documents</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Most recent fund financial statements</li>
                            <li>Portfolio company valuations</li>
                            <li>Limited partnership agreement (LPA)</li>
                            <li>Fund organizational documents</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="facility-management">
                      <AccordionTrigger data-testid="accordion-facility-help">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Managing Your Facility
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Access your facility details and manage borrowing activity.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Facility Dashboard</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li><strong>Available Credit:</strong> How much you can draw</li>
                            <li><strong>Current LTV:</strong> Your loan-to-NAV ratio</li>
                            <li><strong>Covenant Status:</strong> Compliance with facility terms</li>
                            <li><strong>Document Vault:</strong> Access facility agreements and amendments</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Draw Requests</h4>
                          <p className="text-sm">Submit draw requests directly through the platform. Typical approval time: 24-48 hours for routine draws.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="reporting">
                      <AccordionTrigger data-testid="accordion-reporting-help">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Quarterly Reporting
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Stay compliant with quarterly reporting requirements.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Reporting Schedule</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Submit updated financial statements within 45 days of quarter end</li>
                            <li>Upload portfolio valuations and performance metrics</li>
                            <li>System automatically calculates covenant compliance</li>
                            <li>Receive confirmation or follow-up requests from lender</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="messaging">
                      <AccordionTrigger data-testid="accordion-messaging-help">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Communicating with Lender
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Stay in touch with your NAV IQ operations team.</p>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Messaging System</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Thread-based conversations for each topic</li>
                            <li>Attach documents to messages</li>
                            <li>Track request status and responses</li>
                            <li>Response time: typically within 24 business hours</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Common questions about AlphaNAV and NAV lending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq-1">
                      <AccordionTrigger data-testid="faq-what-is-nav">
                        What is NAV lending?
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p>NAV (Net Asset Value) lending provides credit facilities to private equity funds secured by the fund's underlying portfolio value. This allows GPs to:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Bridge capital calls between fundraises</li>
                          <li>Fund follow-on investments in portfolio companies</li>
                          <li>Return capital to LPs without selling assets</li>
                          <li>Smooth out cash flow timing</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-2">
                      <AccordionTrigger data-testid="faq-ltv-range">
                        What LTV ratios does AlphaNAV target?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>AlphaNAV targets conservative <strong>5-15% LTV ratios</strong> for growth-focused facilities on lower-middle market PE funds ($100M-$500M AUM). This positions us as the safest option for funds looking for flexible growth capital without aggressive leverage.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-3">
                      <AccordionTrigger data-testid="faq-approval-time">
                        How long does underwriting take?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>Our 90% automated underwriting process typically delivers preliminary term sheets within <strong>48-72 hours</strong> for straightforward deals. Complex structures or additional diligence may extend the timeline to 1-2 weeks.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-4">
                      <AccordionTrigger data-testid="faq-advisor-commission">
                        What commission do advisors earn?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>Placement advisors typically earn <strong>50-75 basis points</strong> on NAV facilities, paid at closing. Commission is calculated on the total committed facility amount.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-5">
                      <AccordionTrigger data-testid="faq-global-search">
                        How do I search across all deals and facilities?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>Press <Badge variant="outline">Cmd+K</Badge> (Mac) or <Badge variant="outline">Ctrl+K</Badge> (Windows) anywhere in the platform to open global search. Search by fund name, GP name, firm name, or contact name across all entities.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-6">
                      <AccordionTrigger data-testid="faq-export-data">
                        Can I export data to Excel/CSV?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>Yes! Operations users can export prospects, deals, and facilities to CSV from the operations dashboard. Click the "Export" buttons in the dashboard header to download data with proper formatting.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-7">
                      <AccordionTrigger data-testid="faq-covenant-breach">
                        What happens if I breach a covenant?
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p>Covenant breaches trigger automatic notifications to both GP and lender. Typical remediation steps:</p>
                        <ol className="list-decimal pl-5 space-y-1 text-sm">
                          <li>GP receives breach notification with details</li>
                          <li>Lender initiates conversation to understand circumstances</li>
                          <li>Work together on remediation plan (additional collateral, partial paydown, waiver request)</li>
                          <li>Document any waivers or amendments to facility agreement</li>
                        </ol>
                        <p className="text-sm">Most breaches are resolved collaboratively without major consequences.</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-8">
                      <AccordionTrigger data-testid="faq-operational-alpha">
                        What is "100 basis points of operational alpha"?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>AlphaNAV's operational efficiency target is to deliver <strong>100 basis points (1%)</strong> of cost savings compared to traditional NAV lenders through:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>90% automated underwriting (faster decisions, lower costs)</li>
                          <li>Streamlined quarterly monitoring and reporting</li>
                          <li>Reduced legal costs through templated documentation</li>
                          <li>Efficient portfolio management at scale</li>
                        </ul>
                        <p className="text-sm mt-2">These efficiency gains translate to better pricing and faster service for GPs.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
