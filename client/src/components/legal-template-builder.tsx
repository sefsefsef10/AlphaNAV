import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";

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

export function LegalTemplateBuilder() {
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

  const handleGenerateTemplate = () => {
    console.log("Generating template with config:", config);
    // TODO: Implement template generation
  };

  return (
    <div className="space-y-6">
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

      <div className="flex justify-end">
        <Button onClick={handleGenerateTemplate} size="lg" data-testid="button-generate-template">
          <Download className="mr-2 h-4 w-4" />
          Generate Legal Document
        </Button>
      </div>
    </div>
  );
}
