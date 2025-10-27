import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Search, TrendingUp, DollarSign, Loader2, AlertCircle } from "lucide-react";

interface PortfolioCompany {
  id: string;
  companyName: string;
  industry: string | null;
  sector: string | null;
  geography: string | null;
  investmentDate: string | null;
  initialInvestment: string | null;
  currentValuation: string | null;
  ownershipPercentage: string | null;
  status: string;
}

export default function PortfolioCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  // Fetch portfolio companies
  const { data: companies = [], isLoading, error } = useQuery<PortfolioCompany[]>({
    queryKey: ["/api/portfolio/companies"],
  });

  // Get unique sectors for filter
  const sectors = Array.from(new Set(companies.map(c => c.sector).filter(Boolean)));

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === "all" || company.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const formatCurrency = (value: string | null) => {
    if (!value) return "N/A";
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (value: string | null) => {
    if (!value) return "N/A";
    return `${parseFloat(value).toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Portfolio Companies</h1>
        <p className="text-muted-foreground">
          AI-extracted portfolio companies from fund documents
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-companies">
              {companies.length}
            </div>
            <p className="text-xs text-muted-foreground">Across all funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Holdings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-holdings">
              {companies.filter(c => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently invested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              {formatCurrency(
                companies
                  .reduce((sum, c) => sum + (parseFloat(c.currentValuation || "0")), 0)
                  .toString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Current valuations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-companies"
                />
              </div>
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-sector-filter">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector!}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            {filteredCompanies.length} companies found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">Failed to load portfolio companies</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No companies found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Geography</TableHead>
                    <TableHead>Investment Date</TableHead>
                    <TableHead className="text-right">Initial Investment</TableHead>
                    <TableHead className="text-right">Current Valuation</TableHead>
                    <TableHead className="text-right">Ownership %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                      <TableCell className="font-medium">{company.companyName}</TableCell>
                      <TableCell>{company.sector || "N/A"}</TableCell>
                      <TableCell>{company.geography || "N/A"}</TableCell>
                      <TableCell>
                        {company.investmentDate
                          ? new Date(company.investmentDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(company.initialInvestment)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(company.currentValuation)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercentage(company.ownershipPercentage)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={company.status === "active" ? "default" : "secondary"}
                        >
                          {company.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
