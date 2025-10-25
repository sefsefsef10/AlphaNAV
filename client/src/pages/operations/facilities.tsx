import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Search,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { GenerateDocumentDialog } from "@/components/generate-document-dialog";

export default function FacilitiesPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: facilities = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  // Filter facilities
  const filteredFacilities = facilities.filter((facility) =>
    facility.fundName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    totalActive: facilities.filter((f) => f.status === "active").length,
    totalPrincipal: facilities
      .filter((f) => f.status === "active")
      .reduce((sum, f) => sum + (f.principalAmount || 0), 0),
    totalOutstanding: facilities
      .filter((f) => f.status === "active")
      .reduce((sum, f) => sum + (f.outstandingBalance || 0), 0),
    avgLTV: facilities.length > 0
      ? facilities.reduce((sum, f) => sum + (f.ltvRatio || 0), 0) / facilities.length
      : 0,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatInterestRate = (bps: number) => {
    return `${(bps / 100).toFixed(2)}%`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "prepaid":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Prepaid</Badge>;
      case "matured":
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Matured</Badge>;
      case "defaulted":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Defaulted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Facility Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage NAV lending facilities
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Facilities</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active">{stats.totalActive}</div>
            <p className="text-xs text-muted-foreground">Currently active loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-principal">
              {formatCurrency(stats.totalPrincipal)}
            </div>
            <p className="text-xs text-muted-foreground">Aggregate loan amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-outstanding">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">Current balance owed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg LTV Ratio</CardTitle>
            <Percent className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-ltv">
              {stats.avgLTV.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Portfolio average</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search facilities by fund name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Facilities List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No facilities found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search" : "No facilities have been created yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFacilities.map((facility) => {
            const utilizationPercent = facility.principalAmount > 0
              ? (facility.outstandingBalance / facility.principalAmount) * 100
              : 0;

            const daysToMaturity = facility.maturityDate
              ? Math.ceil((new Date(facility.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Card
                key={facility.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation(`/operations/facilities/${facility.id}`)}
                data-testid={`card-facility-${facility.id}`}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1" data-testid={`text-fund-name-${facility.id}`}>
                          {facility.fundName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {facility.lenderName} • Originated {new Date(facility.originationDate).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(facility.status)}
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Principal</div>
                        <div className="font-semibold" data-testid={`text-principal-${facility.id}`}>
                          {formatCurrency(facility.principalAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Outstanding</div>
                        <div className="font-semibold" data-testid={`text-outstanding-${facility.id}`}>
                          {formatCurrency(facility.outstandingBalance)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Interest Rate</div>
                        <div className="font-semibold" data-testid={`text-rate-${facility.id}`}>
                          {formatInterestRate(facility.interestRate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">LTV Ratio</div>
                        <div className="font-semibold" data-testid={`text-ltv-${facility.id}`}>
                          {facility.ltvRatio}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Maturity
                        </div>
                        <div className="font-semibold text-sm">
                          {daysToMaturity !== null && daysToMaturity > 0
                            ? `${daysToMaturity} days`
                            : daysToMaturity !== null && daysToMaturity <= 0
                            ? "Matured"
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Utilization Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className="font-medium">{utilizationPercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={utilizationPercent} className="h-2" />
                    </div>

                    {/* Payment Schedule Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {facility.paymentSchedule.charAt(0).toUpperCase() + facility.paymentSchedule.slice(1)} payments
                        </span>
                      </div>
                      <GenerateDocumentDialog
                        facilityId={facility.id}
                        facilityName={facility.fundName}
                      />
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
