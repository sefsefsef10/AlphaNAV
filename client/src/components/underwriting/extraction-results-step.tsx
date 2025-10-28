import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, Edit2, Save, X } from "lucide-react";
import { useState } from "react";

interface ExtractionResultsStepProps {
  sessionId?: string;
  onNext: () => void;
  onBack: () => void;
}

interface ExtractedField {
  label: string;
  value: any;
  confidence?: number;
  field: string;
  type: "text" | "number" | "currency" | "percent" | "array" | "object";
  readOnly?: boolean;
}

export default function ExtractionResultsStep({ sessionId, onNext, onBack }: ExtractionResultsStepProps) {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Fetch extraction results
  const { data: extraction, isLoading, error } = useQuery({
    queryKey: ["/api/underwriting/sessions", sessionId, "extraction"],
    enabled: !!sessionId,
  });

  // Update extraction field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: any }) => {
      return await apiRequest("PATCH", `/api/underwriting/sessions/${sessionId}/extraction`, {
        field,
        value,
      });
    },
    onSuccess: () => {
      toast({
        title: "Field Updated",
        description: "Extraction data updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/underwriting/sessions", sessionId, "extraction"] });
      setEditingField(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValue(currentValue?.toString() || "");
  };

  const handleSaveEdit = (field: string, type: string) => {
    let parsedValue: any = editValue;
    
    if (type === "number" || type === "currency" || type === "percent") {
      parsedValue = editValue === "" ? null : parseFloat(editValue);
    }
    
    updateFieldMutation.mutate({ field, value: parsedValue });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const getConfidenceColor = (confidence?: number) => {
    if (confidence === undefined || confidence === null) return "text-muted-foreground";
    if (confidence >= 90) return "text-green-500";
    if (confidence >= 70) return "text-yellow-500";
    return "text-destructive";
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (confidence === undefined || confidence === null) return null;
    if (confidence >= 90) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">High</Badge>;
    if (confidence >= 70) return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>;
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Low</Badge>;
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">Not found</span>;
    
    switch (type) {
      case "currency":
        return `$${value.toLocaleString()}`;
      case "percent":
        return `${value}%`;
      case "number":
        return value.toLocaleString();
      case "array":
        // Handle arrays (portfolio companies or sectors)
        if (Array.isArray(value) && value.length > 0) {
          // Check if it's an array of objects (portfolio companies)
          if (typeof value[0] === "object" && value[0].name) {
            return (
              <div className="space-y-1 mt-2">
                {value.map((item: any, idx: number) => (
                  <div key={idx} className="text-xs p-2 bg-muted/30 rounded border border-border">
                    <span className="font-medium">{item.name || "Unknown"}</span>
                    {item.sector && <span className="text-muted-foreground ml-2">• {item.sector}</span>}
                    {item.value && <span className="text-muted-foreground ml-2">• ${item.value.toLocaleString()}</span>}
                  </div>
                ))}
              </div>
            );
          }
          // Array of strings (sectors)
          return (
            <div className="flex flex-wrap gap-1 mt-2">
              {value.map((item: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="text-muted-foreground italic">No data</span>;
      case "object":
        // Handle sector distribution object
        if (value && typeof value === "object") {
          return (
            <div className="space-y-1 mt-2">
              {Object.entries(value).map(([sector, percent]: [string, any]) => (
                <div key={sector} className="text-xs p-2 bg-muted/30 rounded border border-border flex justify-between">
                  <span className="font-medium">{sector}</span>
                  <span className="text-muted-foreground">{percent}%</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-muted-foreground italic">No data</span>;
      default:
        return value.toString();
    }
  };

  // Get confidence for a specific field
  const getFieldConfidence = (fieldName: string): number | undefined => {
    if (!extraction) return undefined;
    
    // fieldConfidence object contains specific field scores
    const fc = (extraction as any).fieldConfidence || {};
    return fc[fieldName];
  };

  // Organize extraction data by category
  const getFieldsByCategory = () => {
    if (!extraction) return {};

    return {
      "Fund Basics": [
        { label: "Fund Name", value: extraction.fundName, confidence: getFieldConfidence("fundName"), field: "fundName", type: "text" as const },
        { label: "Fund AUM", value: extraction.fundAUM, confidence: getFieldConfidence("fundAUM"), field: "fundAUM", type: "currency" as const },
        { label: "Fund Size (Legacy)", value: extraction.fundSize, confidence: getFieldConfidence("fundSize"), field: "fundSize", type: "currency" as const },
        { label: "Vintage Year", value: extraction.vintage, confidence: getFieldConfidence("vintage"), field: "vintage", type: "number" as const },
        { label: "GP Entity", value: extraction.gpEntity, confidence: getFieldConfidence("gpEntity"), field: "gpEntity", type: "text" as const },
        { label: "GP Name", value: extraction.gpName, confidence: getFieldConfidence("gpName"), field: "gpName", type: "text" as const },
        { label: "GP Firm Name", value: extraction.gpFirmName, confidence: getFieldConfidence("gpFirmName"), field: "gpFirmName", type: "text" as const },
        { label: "GP Track Record", value: extraction.gpTrackRecord, confidence: getFieldConfidence("gpTrackRecord"), field: "gpTrackRecord", type: "text" as const },
        { label: "Fund Structure", value: extraction.fundStructure, confidence: getFieldConfidence("fundStructure"), field: "fundStructure", type: "text" as const },
        { label: "Investment Strategy", value: extraction.strategy, confidence: getFieldConfidence("strategy"), field: "strategy", type: "text" as const },
        { label: "Geographic Focus", value: extraction.geography, confidence: getFieldConfidence("geography"), field: "geography", type: "text" as const },
        { label: "Fund Type", value: extraction.fundType, confidence: getFieldConfidence("fundType"), field: "fundType", type: "text" as const },
        { label: "Fund Status", value: extraction.fundStatus, confidence: getFieldConfidence("fundStatus"), field: "fundStatus", type: "text" as const },
        { label: "Investment Sectors", value: extraction.sectors, confidence: getFieldConfidence("sectors"), field: "sectors", type: "array" as const, readOnly: true },
      ],
      "Portfolio Analysis": [
        { label: "Portfolio Count (Legacy)", value: extraction.portfolioCount, confidence: getFieldConfidence("portfolioCount"), field: "portfolioCount", type: "number" as const },
        { label: "Portfolio Company Count", value: extraction.portfolioCompanyCount, confidence: getFieldConfidence("portfolioCompanyCount"), field: "portfolioCompanyCount", type: "number" as const },
        { label: "Portfolio Companies", value: extraction.portfolioCompanies, confidence: getFieldConfidence("portfolioCompanies"), field: "portfolioCompanies", type: "array" as const, readOnly: true },
        { label: "Sector Distribution", value: extraction.sectorDistribution, confidence: getFieldConfidence("sectorDistribution"), field: "sectorDistribution", type: "object" as const, readOnly: true },
        { label: "Largest Holding %", value: extraction.largestHoldingPercent, confidence: getFieldConfidence("largestHoldingPercent"), field: "largestHoldingPercent", type: "percent" as const },
        { label: "Top 3 Concentration %", value: extraction.topThreeConcentration, confidence: getFieldConfidence("topThreeConcentration"), field: "topThreeConcentration", type: "percent" as const },
      ],
      "Financial Performance": [
        { label: "Current NAV", value: extraction.currentNAV, confidence: getFieldConfidence("currentNAV"), field: "currentNAV", type: "currency" as const },
        { label: "Unrealized Value", value: extraction.unrealizedValue, confidence: getFieldConfidence("unrealizedValue"), field: "unrealizedValue", type: "currency" as const },
        { label: "Realized Value", value: extraction.realizedValue, confidence: getFieldConfidence("realizedValue"), field: "realizedValue", type: "currency" as const },
        { label: "Gross IRR", value: extraction.grossIRR, confidence: getFieldConfidence("grossIRR"), field: "grossIRR", type: "percent" as const },
        { label: "Net IRR", value: extraction.netIRR, confidence: getFieldConfidence("netIRR"), field: "netIRR", type: "percent" as const },
        { label: "MOIC", value: extraction.moic, confidence: getFieldConfidence("moic"), field: "moic", type: "number" as const },
        { label: "DPI", value: extraction.dpi, confidence: getFieldConfidence("dpi"), field: "dpi", type: "number" as const },
        { label: "RVPI", value: extraction.rvpi, confidence: getFieldConfidence("rvpi"), field: "rvpi", type: "number" as const },
      ],
      "Liquidity & Capital": [
        { label: "Cash Reserves", value: extraction.cashReserves, confidence: getFieldConfidence("cashReserves"), field: "cashReserves", type: "currency" as const },
        { label: "Total Debt", value: extraction.totalDebt, confidence: getFieldConfidence("totalDebt"), field: "totalDebt", type: "currency" as const },
        { label: "Capital Committed", value: extraction.capitalCommitted, confidence: getFieldConfidence("capitalCommitted"), field: "capitalCommitted", type: "currency" as const },
        { label: "Capital Called", value: extraction.capitalCalled, confidence: getFieldConfidence("capitalCalled"), field: "capitalCalled", type: "currency" as const },
      ],
      "GP Track Record": [
        { label: "Prior Fund Count", value: extraction.priorFundCount, confidence: getFieldConfidence("priorFundCount"), field: "priorFundCount", type: "number" as const },
        { label: "Prior Fund Avg AUM", value: extraction.priorFundAUM, confidence: getFieldConfidence("priorFundAUM"), field: "priorFundAUM", type: "currency" as const },
        { label: "Prior Fund Avg IRR", value: extraction.priorFundAvgIRR, confidence: getFieldConfidence("priorFundAvgIRR"), field: "priorFundAvgIRR", type: "percent" as const },
        { label: "Prior Fund Avg MOIC", value: extraction.priorFundAvgMOIC, confidence: getFieldConfidence("priorFundAvgMOIC"), field: "priorFundAvgMOIC", type: "number" as const },
        { label: "Years of Experience", value: extraction.yearsOfExperience, confidence: getFieldConfidence("yearsOfExperience"), field: "yearsOfExperience", type: "number" as const },
        { label: "Team Size", value: extraction.teamSize, confidence: getFieldConfidence("teamSize"), field: "teamSize", type: "number" as const },
      ],
      "Contact Information": [
        { label: "Contact Name", value: extraction.contactName, confidence: getFieldConfidence("contactName"), field: "contactName", type: "text" as const },
        { label: "Contact Email", value: extraction.contactEmail, confidence: getFieldConfidence("contactEmail"), field: "contactEmail", type: "text" as const },
        { label: "Contact Phone", value: extraction.contactPhone, confidence: getFieldConfidence("contactPhone"), field: "contactPhone", type: "text" as const },
      ],
    };
  };

  const calculateStats = () => {
    if (!extraction) return { overall: 0, lowConfidence: 0, extracted: 0 };

    const fieldsByCategory = getFieldsByCategory();
    const allFields = Object.values(fieldsByCategory).flat();
    const extracted = allFields.filter(f => f.value !== null && f.value !== undefined).length;
    const lowConfidence = extraction.lowConfidenceFields?.length || 0;
    const overall = extraction.extractionConfidence || 0;

    return { overall, lowConfidence, extracted, total: allFields.length };
  };

  const renderField = (field: ExtractedField) => {
    const isEditing = editingField === field.field;
    const isLowConfidence = extraction?.lowConfidenceFields?.includes(field.field);

    return (
      <div
        key={field.field}
        className={`flex items-start justify-between p-3 rounded-md border ${
          isLowConfidence ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/20"
        }`}
        data-testid={`field-${field.field}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Label className="text-sm font-medium">{field.label}</Label>
            {isLowConfidence && (
              <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
            )}
            {field.confidence !== undefined && (
              <div className="flex items-center gap-1">
                {getConfidenceBadge(field.confidence)}
                <span className={`text-xs tabular-nums ${getConfidenceColor(field.confidence)}`}>
                  {field.confidence}%
                </span>
              </div>
            )}
          </div>
          {isEditing && !field.readOnly ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8"
              type={field.type === "text" ? "text" : "number"}
              step={field.type === "currency" ? "0.01" : "any"}
              data-testid={`input-edit-${field.field}`}
            />
          ) : (
            <div className="text-sm font-mono">{formatValue(field.value, field.type)}</div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {isEditing && !field.readOnly ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSaveEdit(field.field, field.type)}
                disabled={updateFieldMutation.isPending}
                data-testid={`button-save-${field.field}`}
              >
                <Save className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                data-testid={`button-cancel-${field.field}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : !field.readOnly ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStartEdit(field.field, field.value)}
              data-testid={`button-edit-${field.field}`}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          ) : (
            <Badge variant="outline" className="text-xs">Read-only</Badge>
          )}
        </div>
      </div>
    );
  };

  if (isLoading && !extraction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Extraction in Progress</CardTitle>
          <CardDescription>Analyzing uploaded documents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium mb-2">Extracting 47 data points</p>
            <p className="text-sm text-muted-foreground">
              This typically takes 2-5 minutes depending on document size
            </p>
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Extraction Failed</h3>
          <p className="text-muted-foreground mb-4 text-center">
            Unable to extract data from documents
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} data-testid="button-back-error">
              Go Back
            </Button>
            <Button data-testid="button-retry">Retry Extraction</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = calculateStats();
  const fieldsByCategory = getFieldsByCategory();

  return (
    <div className="space-y-6">
      {/* Extraction Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Extraction Results</CardTitle>
              <CardDescription>{stats.total} data points processed from uploaded documents</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-md bg-muted/50">
              <div className={`text-2xl font-bold tabular-nums ${getConfidenceColor(stats.overall)}`}>
                {stats.overall}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Confidence</div>
            </div>
            <div className="text-center p-4 rounded-md bg-muted/50">
              <div className="text-2xl font-bold tabular-nums">{stats.extracted}/{stats.total}</div>
              <div className="text-sm text-muted-foreground">Data Points Extracted</div>
            </div>
            <div className="text-center p-4 rounded-md bg-muted/50">
              <div className={`text-2xl font-bold tabular-nums ${stats.lowConfidence > 0 ? "text-yellow-500" : "text-green-500"}`}>
                {stats.lowConfidence}
              </div>
              <div className="text-sm text-muted-foreground">Low Confidence Fields</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extracted Data</CardTitle>
          <CardDescription>
            Review and correct any fields. Low confidence fields are highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="Fund Basics" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="Fund Basics" data-testid="tab-fund-basics">Basics</TabsTrigger>
              <TabsTrigger value="Portfolio Analysis" data-testid="tab-portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="Financial Performance" data-testid="tab-financial">Financial</TabsTrigger>
              <TabsTrigger value="Liquidity & Capital" data-testid="tab-liquidity">Liquidity</TabsTrigger>
              <TabsTrigger value="GP Track Record" data-testid="tab-gp">GP Track</TabsTrigger>
              <TabsTrigger value="Contact Information" data-testid="tab-contact">Contact</TabsTrigger>
            </TabsList>

            {Object.entries(fieldsByCategory).map(([category, fields]) => (
              <TabsContent key={category} value={category} className="space-y-3 mt-4">
                {fields.map(renderField)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back to Upload
        </Button>
        <Button onClick={onNext} data-testid="button-continue-to-scoring">
          Continue to Eligibility Scoring
        </Button>
      </div>
    </div>
  );
}
