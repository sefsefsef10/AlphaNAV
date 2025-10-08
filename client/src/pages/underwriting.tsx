import { useState } from "react";
import { FileText, Sparkles, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUpload } from "@/components/document-upload";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function UnderwritingPage() {
  const [fundName, setFundName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [generatedMemo, setGeneratedMemo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMemo = () => {
    setIsGenerating(true);
    // TODO: Implement AI memo generation
    setTimeout(() => {
      setGeneratedMemo(`
INVESTMENT COMMITTEE MEMORANDUM

Fund: ${fundName || "Not specified"}
Requested Amount: ${loanAmount ? `$${loanAmount}M` : "Not specified"}
Date: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
Based on the submitted documentation and automated analysis, this deal presents a moderate-risk opportunity with strong fundamentals.

KEY FINDINGS:
• Portfolio Quality Score: 8.2/10
• Historical Performance: Above industry average
• Management Team: Experienced with strong track record
• Risk Assessment: Medium (Score: 4.5/10)

FINANCIAL METRICS:
• Debt/EBITDA Ratio: 3.2x (within acceptable range)
• Interest Coverage: 2.8x
• Asset Quality: High-grade securities

RECOMMENDATION: 
Proceed to IC approval with standard covenant package. Recommend monitoring quarterly financial reports and annual portfolio reviews.

[This memo was automatically generated using AI-assisted analysis. Human review recommended for final approval.]
      `.trim());
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Underwriting</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Automated deal analysis and IC memo generation
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fund-name">Fund Name</Label>
                <Input
                  id="fund-name"
                  placeholder="e.g., Sequoia Capital Fund XII"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  data-testid="input-fund-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan-amount">Loan Amount ($ millions)</Label>
                <Input
                  id="loan-amount"
                  type="number"
                  placeholder="e.g., 45"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  data-testid="input-loan-amount"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload onUpload={(files) => console.log("Uploaded:", files)} />
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Required Documents:</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside">
                    <li>Financial statements (last 3 years)</li>
                    <li>Fund formation documents</li>
                    <li>Portfolio holdings report</li>
                    <li>Existing covenant agreements</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>AI-Generated IC Memo</CardTitle>
              <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
                <Sparkles className="mr-1 h-3 w-3" />
                AI-Powered
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {!generatedMemo ? (
                <div className="text-center py-12">
                  <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload documents and enter deal information to generate an automated IC memo
                  </p>
                  <Button
                    onClick={handleGenerateMemo}
                    disabled={isGenerating}
                    data-testid="button-generate-memo"
                  >
                    {isGenerating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate IC Memo
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <Textarea
                    value={generatedMemo}
                    onChange={(e) => setGeneratedMemo(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    data-testid="textarea-memo"
                  />
                  <Separator />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="flex-1" data-testid="button-regenerate">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button className="flex-1" data-testid="button-download-memo">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
