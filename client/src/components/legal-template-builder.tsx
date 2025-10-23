import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TemplateConfig {
  interestType: "fixed" | "variable";
  termLength: number;
  includeOID: boolean;
  includePIK: boolean;
  covenantDebtEBITDA: boolean;
  debtEBITDARatio?: number;
  amortizationSchedule: boolean;
  prepaymentPenalty: boolean;
  securityInterest: boolean;
}

interface GenerateDocumentPayload {
  documentType: string;
  config: TemplateConfig;
  facilityId?: string;
  dealId?: string;
  advisorDealId?: string;
}

export function LegalTemplateBuilder() {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<"loan_agreement" | "term_sheet" | "compliance_report">("loan_agreement");
  const [config, setConfig] = useState<TemplateConfig>({
    interestType: "fixed",
    termLength: 36,
    includeOID: false,
    includePIK: false,
    covenantDebtEBITDA: true,
    debtEBITDARatio: 3.5,
    amortizationSchedule: false,
    prepaymentPenalty: true,
    securityInterest: true,
  });

  const generateMutation = useMutation({
    mutationFn: async (payload: GenerateDocumentPayload) => {
      return await apiRequest("POST", "/api/generate-document", payload);
    },
    onSuccess: (data) => {
      // Download the generated document with correct extension based on format
      const mimeTypes: Record<string, string> = {
        markdown: 'text/markdown',
        html: 'text/html',
        pdf: 'application/pdf',
      };
      const extensions: Record<string, string> = {
        markdown: 'md',
        html: 'html',
        pdf: 'pdf',
      };
      
      const mimeType = mimeTypes[data.format] || 'text/plain';
      const extension = extensions[data.format] || 'txt';
      
      const blob = new Blob([data.content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Document Generated",
        description: `${data.title} has been generated and downloaded.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message,
      });
    },
  });

  const handleGenerateTemplate = () => {
    generateMutation.mutate({
      documentType,
      config,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Type & Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(value: any) => setDocumentType(value)}
            >
              <SelectTrigger id="document-type" data-testid="select-document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loan_agreement">Loan Agreement</SelectItem>
                <SelectItem value="term_sheet">Term Sheet</SelectItem>
                <SelectItem value="compliance_report">Compliance Report</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {documentType === 'loan_agreement' && 'Generate a complete NAV facility loan agreement with all terms and conditions.'}
              {documentType === 'term_sheet' && 'Generate a concise term sheet summarizing key deal terms.'}
              {documentType === 'compliance_report' && 'Generate a quarterly compliance report for an existing facility.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {documentType === 'compliance_report' && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Compliance reports use a standardized format and do not require configuration. 
              The report will automatically include all covenant compliance data, NAV analysis, 
              portfolio composition, and payment history for the specified facility.
            </p>
          </CardContent>
        </Card>
      )}

      {documentType !== 'compliance_report' && (
        <>
      <Card>
        <CardHeader>
          <CardTitle>Interest & Term Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interest-type">Interest Type</Label>
              <Select
                value={config.interestType}
                onValueChange={(value: "fixed" | "variable") =>
                  setConfig({ ...config, interestType: value })
                }
              >
                <SelectTrigger id="interest-type" data-testid="select-interest-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Rate</SelectItem>
                  <SelectItem value="variable">Variable Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="term-length">Term Length (months)</Label>
              <Input
                id="term-length"
                type="number"
                value={config.termLength}
                onChange={(e) =>
                  setConfig({ ...config, termLength: parseInt(e.target.value) })
                }
                data-testid="input-term-length"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-oid">Original Issue Discount (OID)</Label>
              <p className="text-sm text-muted-foreground">
                Include OID provisions in the agreement
              </p>
            </div>
            <Switch
              id="include-oid"
              checked={config.includeOID}
              onCheckedChange={(checked) =>
                setConfig({ ...config, includeOID: checked })
              }
              data-testid="switch-oid"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-pik">Payment-In-Kind (PIK)</Label>
              <p className="text-sm text-muted-foreground">
                Enable PIK interest option
              </p>
            </div>
            <Switch
              id="include-pik"
              checked={config.includePIK}
              onCheckedChange={(checked) =>
                setConfig({ ...config, includePIK: checked })
              }
              data-testid="switch-pik"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="amortization">Amortization Schedule</Label>
              <p className="text-sm text-muted-foreground">
                Include amortization requirements
              </p>
            </div>
            <Switch
              id="amortization"
              checked={config.amortizationSchedule}
              onCheckedChange={(checked) =>
                setConfig({ ...config, amortizationSchedule: checked })
              }
              data-testid="switch-amortization"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Covenants & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="covenant-debt">Debt/EBITDA Covenant</Label>
              <p className="text-sm text-muted-foreground">
                Set maximum debt-to-EBITDA ratio
              </p>
            </div>
            <Switch
              id="covenant-debt"
              checked={config.covenantDebtEBITDA}
              onCheckedChange={(checked) =>
                setConfig({ ...config, covenantDebtEBITDA: checked })
              }
              data-testid="switch-covenant"
            />
          </div>
          {config.covenantDebtEBITDA && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="debt-ratio">Maximum Ratio</Label>
              <Input
                id="debt-ratio"
                type="number"
                step="0.1"
                value={config.debtEBITDARatio}
                onChange={(e) =>
                  setConfig({ ...config, debtEBITDARatio: parseFloat(e.target.value) })
                }
                data-testid="input-debt-ratio"
              />
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="prepayment">Prepayment Penalty</Label>
              <p className="text-sm text-muted-foreground">
                Include prepayment penalty clause
              </p>
            </div>
            <Switch
              id="prepayment"
              checked={config.prepaymentPenalty}
              onCheckedChange={(checked) =>
                setConfig({ ...config, prepaymentPenalty: checked })
              }
              data-testid="switch-prepayment"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security">Security Interest</Label>
              <p className="text-sm text-muted-foreground">
                Require security interest in assets
              </p>
            </div>
            <Switch
              id="security"
              checked={config.securityInterest}
              onCheckedChange={(checked) =>
                setConfig({ ...config, securityInterest: checked })
              }
              data-testid="switch-security"
            />
          </div>
        </CardContent>
      </Card>
      </>
      )}

      <div className="flex justify-end gap-3">
        {documentType !== 'compliance_report' && (
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => {
              setConfig({
                interestType: "fixed",
                termLength: 36,
                includeOID: false,
                includePIK: false,
                covenantDebtEBITDA: true,
                debtEBITDARatio: 3.5,
                amortizationSchedule: false,
                prepaymentPenalty: true,
                securityInterest: true,
              });
              toast({
                title: "Configuration Reset",
                description: "All settings have been reset to defaults",
              });
            }}
            data-testid="button-reset-config"
          >
            Reset Configuration
          </Button>
        )}
        <Button 
          onClick={handleGenerateTemplate} 
          size="lg" 
          disabled={generateMutation.isPending}
          data-testid="button-generate-template"
        >
          {generateMutation.isPending ? (
            <>
              <FileText className="mr-2 h-4 w-4 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate {documentType === 'loan_agreement' ? 'Loan Agreement' : documentType === 'term_sheet' ? 'Term Sheet' : 'Compliance Report'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
