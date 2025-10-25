import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, FileText, Calendar, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function ProspectsPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: prospects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/prospects"],
  });

  const filteredProspects = prospects?.filter((p: any) => {
    const query = searchQuery.toLowerCase();
    return (
      p.fundName?.toLowerCase().includes(query) ||
      p.gpName?.toLowerCase().includes(query) ||
      p.gpFirmName?.toLowerCase().includes(query)
    );
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return null;
    if (confidence >= 91) return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">High</Badge>;
    if (confidence >= 71) return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>;
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Low</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prospects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your NAV lending prospects and pipeline
          </p>
        </div>
        <Button onClick={() => setLocation("/operations/prospects/upload")} data-testid="button-new-prospect">
          <Plus className="w-4 h-4 mr-2" />
          New Prospect
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by fund name, GP, or firm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-prospects"
        />
      </div>

      {/* Stats */}
      {!isLoading && prospects && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Prospects</CardDescription>
              <CardTitle className="text-3xl" data-testid="stat-total-prospects">{prospects.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>AI Extracted</CardDescription>
              <CardTitle className="text-3xl" data-testid="stat-ai-extracted">
                {prospects.filter((p: any) => p.source === "ai_extraction").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Confidence</CardDescription>
              <CardTitle className="text-3xl" data-testid="stat-avg-confidence">
                {Math.round(
                  prospects.reduce((sum: number, p: any) => sum + (p.extractionConfidence || 0), 0) /
                  prospects.length || 0
                )}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total AUM</CardDescription>
              <CardTitle className="text-2xl" data-testid="stat-total-aum">
                {formatCurrency(
                  prospects.reduce((sum: number, p: any) => sum + (p.fundSize || 0), 0)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Prospects List */}
      <div className="space-y-4">
        {isLoading && (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        )}

        {!isLoading && filteredProspects?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No prospects found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Get started by uploading a fund document"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setLocation("/operations/prospects/upload")} data-testid="button-upload-first">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {filteredProspects?.map((prospect: any) => (
          <Card
            key={prospect.id}
            className="hover-elevate cursor-pointer transition-all"
            onClick={() => setLocation(`/operations/prospects/${prospect.id}`)}
            data-testid={`card-prospect-${prospect.id}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{prospect.fundName}</CardTitle>
                    {prospect.extractionConfidence && getConfidenceBadge(prospect.extractionConfidence)}
                    {prospect.source === "ai_extraction" && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        AI Extracted
                      </Badge>
                    )}
                  </div>
                  {prospect.gpFirmName && (
                    <CardDescription className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {prospect.gpFirmName}
                      {prospect.gpName && ` • ${prospect.gpName}`}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    AUM
                  </div>
                  <div className="font-medium" data-testid={`text-aum-${prospect.id}`}>
                    {formatCurrency(prospect.fundSize)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Vintage
                  </div>
                  <div className="font-medium" data-testid={`text-vintage-${prospect.id}`}>
                    {prospect.vintage || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Portfolio Cos.</div>
                  <div className="font-medium" data-testid={`text-portfolio-${prospect.id}`}>
                    {prospect.portfolioCount || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Stage</div>
                  <Badge variant="secondary" data-testid={`badge-stage-${prospect.id}`}>
                    {prospect.stage || "prospect"}
                  </Badge>
                </div>
              </div>
              {prospect.sectors && prospect.sectors.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {prospect.sectors.slice(0, 5).map((sector: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {sector}
                    </Badge>
                  ))}
                  {prospect.sectors.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{prospect.sectors.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
