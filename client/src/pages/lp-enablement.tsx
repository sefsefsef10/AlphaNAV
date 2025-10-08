import { BookOpen, Video, FileText, CheckSquare, Upload, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ILPAAssessment } from "@/components/ilpa-assessment";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function LPEnablementPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">LP Enablement</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Educational resources and tools for ILPA-aligned NAV readiness
        </p>
      </div>

      <Tabs defaultValue="resources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
          <TabsTrigger value="assessment" data-testid="tab-assessment">Self-Assessment</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
          <TabsTrigger value="webinars" data-testid="tab-webinars">Webinars</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="hover-elevate cursor-pointer" data-testid="card-ilpa-guide">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">ILPA NAV Lending Guide</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comprehensive guide to ILPA principles for NAV facilities
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Essential</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ ILPA alignment best practices</p>
                  <p>✓ Covenant structure guidelines</p>
                  <p>✓ LP communication frameworks</p>
                </div>
                <Button variant="outline" className="w-full mt-4" data-testid="button-download-ilpa-guide">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-success/20">
                      <FileText className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">NAV Readiness Checklist</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Step-by-step checklist for NAV facility preparation
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Practical</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Documentation requirements</p>
                  <p>✓ Financial reporting setup</p>
                  <p>✓ Compliance checkpoints</p>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  Download Checklist
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <CheckSquare className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Business Plan Integration</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Integrate NAV lending into your fund's business strategy
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Strategic planning frameworks</p>
                  <p>✓ LP presentation materials</p>
                  <p>✓ Capital deployment scenarios</p>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  Download Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-chart-3/20">
                    <FileText className="h-5 w-5 text-chart-3" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Case Studies</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Real-world examples of successful NAV implementations
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Growth stage fund examples</p>
                  <p>✓ Buyout fund case studies</p>
                  <p>✓ Portfolio optimization stories</p>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  View Case Studies
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NAV Readiness Self-Assessment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Evaluate your fund's readiness for NAV lending facilities with our comprehensive assessment tool
              </p>
            </CardHeader>
            <CardContent>
              <ILPAAssessment />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-base">LP Communication Template</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Template for communicating NAV facility decisions to LPs
                </p>
                <Button variant="outline" className="w-full" data-testid="button-download-lp-template">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-base">Covenant Compliance Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Quarterly covenant compliance reporting template
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-base">NAV Policy Document</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Internal NAV lending policy template for fund operations
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-base">Financial Reporting Template</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Quarterly financial reporting format for lenders
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-base">Due Diligence Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Prepare for lender due diligence with this checklist
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-base">Business Plan Section</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  NAV lending section template for fund business plans
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webinars" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">NAV Lending 101</CardTitle>
                      <Badge variant="outline">1h 15m</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Introduction to NAV facilities for PE funds
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• Fundamentals of NAV lending</p>
                  <p>• When to consider a NAV facility</p>
                  <p>• Structuring considerations</p>
                </div>
                <Button className="w-full" data-testid="button-watch-webinar-1">
                  <Video className="mr-2 h-4 w-4" />
                  Watch Recording
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <Video className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">ILPA Alignment Best Practices</CardTitle>
                      <Badge variant="outline">45m</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      LP-friendly NAV facility implementation
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• ILPA principles overview</p>
                  <p>• Covenant best practices</p>
                  <p>• LP communication strategies</p>
                </div>
                <Button className="w-full">
                  <Video className="mr-2 h-4 w-4" />
                  Watch Recording
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Video className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">Compliance & Reporting</CardTitle>
                      <Badge variant="outline">1h</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Meeting quarterly compliance requirements
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• Financial reporting requirements</p>
                  <p>• Covenant tracking systems</p>
                  <p>• Automated compliance tools</p>
                </div>
                <Button className="w-full">
                  <Video className="mr-2 h-4 w-4" />
                  Watch Recording
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-chart-3/20">
                    <Video className="h-5 w-5 text-chart-3" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">Case Study Series</CardTitle>
                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50">
                        Live
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Next session: Dec 15, 2024 at 2:00 PM EST
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• Real-world implementation examples</p>
                  <p>• Q&A with fund managers</p>
                  <p>• Lessons learned and best practices</p>
                </div>
                <Button className="w-full" data-testid="button-register-webinar">
                  Register for Live Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
