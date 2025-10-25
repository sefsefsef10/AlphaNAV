import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  FileText,
  DollarSign,
  Calendar,
  Building2,
} from "lucide-react";
import { useState } from "react";

export default function UnderwritingDashboardPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const { data: prospects = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/prospects"],
  });

  // Calculate risk score based on prospect data
  const calculateRiskScore = (prospect: any): { score: number; level: string; className: string } => {
    let score = 70; // Base score

    // Fund size check (sweet spot: $100M-$500M)
    if (prospect.fundSize >= 100_000_000 && prospect.fundSize <= 500_000_000) {
      score += 10;
    } else if (prospect.fundSize < 50_000_000 || prospect.fundSize > 1_000_000_000) {
      score -= 15;
    }

    // Portfolio diversification
    if (prospect.portfolioCount >= 10) score += 8;
    else if (prospect.portfolioCount >= 5) score += 4;
    else if (prospect.portfolioCount < 3) score -= 10;

    // Vintage check (prefer newer funds)
    const currentYear = new Date().getFullYear();
    const age = currentYear - (prospect.vintage || currentYear);
    if (age <= 5) score += 5;
    else if (age > 10) score -= 8;

    // GP information completeness
    if (prospect.gpName && prospect.gpFirmName && prospect.gpTrackRecord) score += 7;
    else if (!prospect.gpName || !prospect.gpFirmName) score -= 10;

    // Extraction confidence
    if (prospect.extractionConfidence >= 90) score += 5;
    else if (prospect.extractionConfidence < 70) score -= 5;

    // Determine level
    let level = "Medium";
    let className = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    
    if (score >= 85) {
      level = "Low Risk";
      className = "bg-green-500/10 text-green-500 border-green-500/20";
    } else if (score < 60) {
      level = "High Risk";
      className = "bg-red-500/10 text-red-500 border-red-500/20";
    }

    return { score: Math.min(Math.max(score, 0), 100), level, className };
  };

  // Filter prospects
  const filteredProspects = prospects.filter((prospect) => {
    const matchesSearch =
      !searchTerm ||
      prospect.fundName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.gpName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.gpFirmName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && prospect.stage === "prospect") ||
      (statusFilter === "underwriting" && prospect.stage === "underwriting") ||
      (statusFilter === "approved" && prospect.stage === "approved");

    const risk = calculateRiskScore(prospect);
    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "low" && risk.level === "Low Risk") ||
      (riskFilter === "medium" && risk.level === "Medium") ||
      (riskFilter === "high" && risk.level === "High Risk");

    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Calculate stats
  const stats = {
    total: prospects.length,
    pending: prospects.filter((p) => p.stage === "prospect").length,
    underwriting: prospects.filter((p) => p.stage === "underwriting").length,
    approved: prospects.filter((p) => p.stage === "approved").length,
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Underwriting Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review and assess prospects for NAV financing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All prospects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting initial review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Underwriting</CardTitle>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-underwriting">{stats.underwriting}</div>
            <p className="text-xs text-muted-foreground">Active analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-approved">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for facility</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by fund name, GP, or firm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="underwriting">In Underwriting</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-risk">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prospects List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No prospects found</h3>
            <p className="text-muted-foreground mb-4 text-center">
              {searchTerm || statusFilter !== "all" || riskFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by adding prospects to your pipeline"}
            </p>
            {!searchTerm && statusFilter === "all" && riskFilter === "all" && (
              <Button onClick={() => setLocation("/operations/prospects/upload")} data-testid="button-add-prospect">
                Add First Prospect
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProspects.map((prospect) => {
            const risk = calculateRiskScore(prospect);
            return (
              <Card
                key={prospect.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation(`/operations/prospects/${prospect.id}`)}
                data-testid={`card-prospect-${prospect.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1" data-testid={`text-fund-name-${prospect.id}`}>
                            {prospect.fundName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {prospect.gpFirmName || prospect.gpName || "GP information pending"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">AUM</div>
                            <div className="font-medium">{formatCurrency(prospect.fundSize)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Vintage</div>
                            <div className="font-medium">{prospect.vintage || "N/A"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Portfolio</div>
                            <div className="font-medium">{prospect.portfolioCount || "N/A"} companies</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Risk Score</div>
                            <div className="font-medium">{risk.score}/100</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Badges & Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={risk.className} data-testid={`badge-risk-${prospect.id}`}>
                        {risk.level}
                      </Badge>
                      <Badge variant="secondary" data-testid={`badge-stage-${prospect.id}`}>
                        {prospect.stage || "prospect"}
                      </Badge>
                      {prospect.source === "ai_extraction" && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          AI Extracted
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
