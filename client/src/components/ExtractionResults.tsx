import { useState } from "react";
import { CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExtractionResultsProps {
  extraction: any;
  documentId: string;
  onCreateProspect: (documentId: string, overrides?: any) => void;
  isCreating: boolean;
}

export function ExtractionResults({ extraction, documentId, onCreateProspect, isCreating }: ExtractionResultsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [overrides, setOverrides] = useState<any>({});

  const getConfidenceLevel = (score: number): "high" | "medium" | "low" => {
    if (score >= 91) return "high";
    if (score >= 71) return "medium";
    return "low";
  };

  const getConfidenceBadge = (score: number) => {
    const level = getConfidenceLevel(score);
    const variants = {
      high: { icon: CheckCircle2, text: "High Confidence", className: "bg-green-500/10 text-green-500 border-green-500/20" },
      medium: { icon: AlertCircle, text: "Medium Confidence", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      low: { icon: XCircle, text: "Low Confidence", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    };
    const variant = variants[level];
    const Icon = variant.icon;
    
    return (
      <Badge variant="outline" className={`${variant.className} gap-1`} data-testid={`badge-confidence-${level}`}>
        <Icon className="w-3 h-3" />
        {variant.text} ({score}%)
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Not extracted";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleOverrideChange = (field: string, value: any) => {
    setOverrides((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCreateProspect = () => {
    onCreateProspect(documentId, Object.keys(overrides).length > 0 ? overrides : undefined);
  };

  return (
    <Card data-testid="extraction-results">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Extraction Results</CardTitle>
            <CardDescription>Review the AI-extracted data and make corrections if needed</CardDescription>
          </div>
          {getConfidenceBadge(extraction.confidence.overall)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Core Fund Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Core Fund Information</h3>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fundName">Fund Name</Label>
                {getConfidenceBadge(extraction.confidence.fundName)}
              </div>
              <Input
                id="fundName"
                value={overrides.fundName ?? extraction.fundName ?? ""}
                onChange={(e) => handleOverrideChange("fundName", e.target.value)}
                placeholder="Fund name"
                data-testid="input-fund-name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fundSize">AUM (Fund Size)</Label>
                  {getConfidenceBadge(extraction.confidence.fundSize)}
                </div>
                <div className="text-lg font-medium" data-testid="text-fund-size">
                  {formatCurrency(overrides.fundSize ?? extraction.fundSize)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="vintage">Vintage Year</Label>
                  {getConfidenceBadge(extraction.confidence.vintage)}
                </div>
                <div className="text-lg font-medium" data-testid="text-vintage">
                  {overrides.vintage ?? extraction.vintage ?? "Not extracted"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="portfolioCount">Portfolio Companies</Label>
                  {getConfidenceBadge(extraction.confidence.portfolioCount)}
                </div>
                <div className="text-lg font-medium" data-testid="text-portfolio-count">
                  {overrides.portfolioCount ?? extraction.portfolioCount ?? "Not extracted"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Investment Sectors</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {(overrides.sectors ?? extraction.sectors ?? []).map((sector: string, idx: number) => (
                  <Badge key={idx} variant="secondary" data-testid={`badge-sector-${idx}`}>
                    {sector}
                  </Badge>
                ))}
                {(!extraction.sectors || extraction.sectors.length === 0) && (
                  <span className="text-sm text-muted-foreground">No sectors extracted</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* GP Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">General Partner Information</h3>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>GP Name</Label>
                  {getConfidenceBadge(extraction.confidence.gpInfo)}
                </div>
                <div className="text-sm" data-testid="text-gp-name">
                  {overrides.gpName ?? extraction.gpName ?? "Not extracted"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>GP Firm Name</Label>
                <div className="text-sm" data-testid="text-gp-firm">
                  {overrides.gpFirmName ?? extraction.gpFirmName ?? "Not extracted"}
                </div>
              </div>
            </div>

            {extraction.gpTrackRecord && (
              <div className="space-y-2">
                <Label>Track Record</Label>
                <div className="text-sm text-muted-foreground" data-testid="text-gp-track-record">
                  {overrides.gpTrackRecord ?? extraction.gpTrackRecord}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Details */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" data-testid="button-toggle-advanced">
              Advanced Details
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fund Structure</Label>
                <div className="text-sm" data-testid="text-fund-structure">
                  {extraction.fundStructure ?? "Not extracted"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Investment Strategy</Label>
                <div className="text-sm" data-testid="text-strategy">
                  {extraction.strategy ?? "Not extracted"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Geography</Label>
                <div className="text-sm" data-testid="text-geography">
                  {extraction.geography ?? "Not extracted"}
                </div>
              </div>
            </div>

            {(extraction.contactName || extraction.contactEmail || extraction.contactPhone) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Contact Information</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {extraction.contactName && (
                      <div data-testid="text-contact-name">
                        <span className="font-medium">Name:</span> {extraction.contactName}
                      </div>
                    )}
                    {extraction.contactEmail && (
                      <div data-testid="text-contact-email">
                        <span className="font-medium">Email:</span> {extraction.contactEmail}
                      </div>
                    )}
                    {extraction.contactPhone && (
                      <div data-testid="text-contact-phone">
                        <span className="font-medium">Phone:</span> {extraction.contactPhone}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          data-testid="button-edit-toggle"
        >
          {isEditing ? "View Mode" : "Edit Mode"}
        </Button>
        <Button
          onClick={handleCreateProspect}
          disabled={isCreating}
          data-testid="button-create-prospect"
        >
          {isCreating ? "Creating..." : "Create Prospect"}
        </Button>
      </CardFooter>
    </Card>
  );
}
