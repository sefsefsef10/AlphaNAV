import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FileText, Download, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GenerateDocumentDialogProps {
  facilityId: string;
  facilityName: string;
}

export function GenerateDocumentDialog({ facilityId, facilityName }: GenerateDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState("loan-agreement");
  const [config, setConfig] = useState({
    interestType: "fixed",
    termLength: 36,
    includeOID: false,
    includePIK: false,
    covenantDebtEBITDA: true,
    debtEBITDARatio: 3.5,
    amortizationSchedule: false,
    prepaymentPenalty: false,
    securityInterest: true,
  });
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/facilities/${facilityId}/generate-document`, {
        documentType,
        config,
      });
      return response;
    },
    onSuccess: (data: any) => {
      // Create a blob and download the document
      const blob = new Blob([data.document], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Document generated",
        description: `${data.filename} has been downloaded successfully.`,
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate document",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          data-testid={`button-generate-doc-${facilityId}`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Generate Legal Document</DialogTitle>
          <DialogDescription>
            Generate a legal document for {facilityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Type Selection */}
          <div className="space-y-3">
            <Label>Document Type</Label>
            <RadioGroup value={documentType} onValueChange={setDocumentType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="loan-agreement" id="loan-agreement" />
                <Label htmlFor="loan-agreement" className="font-normal cursor-pointer">
                  Loan Agreement (Full 25-page facility agreement)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="term-sheet" id="term-sheet" />
                <Label htmlFor="term-sheet" className="font-normal cursor-pointer">
                  Term Sheet (3-page summary of proposed terms)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compliance-report" id="compliance-report" />
                <Label htmlFor="compliance-report" className="font-normal cursor-pointer">
                  Compliance Report (Quarterly covenant compliance)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Configuration Options */}
          {(documentType === "loan-agreement" || documentType === "term-sheet") && (
            <>
              <div className="space-y-3">
                <Label>Interest Type</Label>
                <RadioGroup value={config.interestType} onValueChange={(value) => setConfig({ ...config, interestType: value as "fixed" | "variable" })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer">Fixed Rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="variable" id="variable" />
                    <Label htmlFor="variable" className="font-normal cursor-pointer">Variable Rate (SOFR + Margin)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="termLength">Term Length (months)</Label>
                <Input
                  id="termLength"
                  type="number"
                  value={config.termLength}
                  onChange={(e) => setConfig({ ...config, termLength: parseInt(e.target.value) || 36 })}
                  className="w-32"
                />
              </div>

              <div className="space-y-3">
                <Label>Additional Provisions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeOID"
                      checked={config.includeOID}
                      onCheckedChange={(checked) => setConfig({ ...config, includeOID: checked as boolean })}
                    />
                    <Label htmlFor="includeOID" className="font-normal cursor-pointer">
                      Include Original Issue Discount (OID)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePIK"
                      checked={config.includePIK}
                      onCheckedChange={(checked) => setConfig({ ...config, includePIK: checked as boolean })}
                    />
                    <Label htmlFor="includePIK" className="font-normal cursor-pointer">
                      Include Payment-In-Kind (PIK) Option
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="covenantDebtEBITDA"
                      checked={config.covenantDebtEBITDA}
                      onCheckedChange={(checked) => setConfig({ ...config, covenantDebtEBITDA: checked as boolean })}
                    />
                    <Label htmlFor="covenantDebtEBITDA" className="font-normal cursor-pointer">
                      Include Debt/EBITDA Covenant
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="amortizationSchedule"
                      checked={config.amortizationSchedule}
                      onCheckedChange={(checked) => setConfig({ ...config, amortizationSchedule: checked as boolean })}
                    />
                    <Label htmlFor="amortizationSchedule" className="font-normal cursor-pointer">
                      Include Amortization Schedule
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prepaymentPenalty"
                      checked={config.prepaymentPenalty}
                      onCheckedChange={(checked) => setConfig({ ...config, prepaymentPenalty: checked as boolean })}
                    />
                    <Label htmlFor="prepaymentPenalty" className="font-normal cursor-pointer">
                      Include Prepayment Penalty
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="securityInterest"
                      checked={config.securityInterest}
                      onCheckedChange={(checked) => setConfig({ ...config, securityInterest: checked as boolean })}
                    />
                    <Label htmlFor="securityInterest" className="font-normal cursor-pointer">
                      Include Security Interest Provisions
                    </Label>
                  </div>
                </div>
              </div>

              {config.covenantDebtEBITDA && (
                <div className="space-y-2">
                  <Label htmlFor="debtEBITDARatio">Maximum Debt/EBITDA Ratio</Label>
                  <Input
                    id="debtEBITDARatio"
                    type="number"
                    step="0.1"
                    value={config.debtEBITDARatio}
                    onChange={(e) => setConfig({ ...config, debtEBITDARatio: parseFloat(e.target.value) || 3.5 })}
                    className="w-32"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              generateMutation.mutate();
            }}
            disabled={generateMutation.isPending}
            data-testid="button-confirm-generate"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate & Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
