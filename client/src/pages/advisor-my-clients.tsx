import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  TrendingUp, 
  Calendar,
  DollarSign,
  CheckCircle2,
  Search
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import type { AdvisorDeal } from "@shared/schema";

export default function AdvisorMyClients() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: deals = [], isLoading } = useQuery<AdvisorDeal[]>({
    queryKey: ["/api/advisor-deals"],
  });

  // Get unique clients (by fund name)
  const clientsMap = new Map<string, {
    fundName: string;
    totalDeals: number;
    activeDeals: number;
    wonDeals: number;
    totalVolume: number;
    totalCommission: number;
    latestDealDate: Date;
    deals: AdvisorDeal[];
  }>();

  deals.forEach(deal => {
    const fundName = deal.gpFundName;
    if (!clientsMap.has(fundName)) {
      clientsMap.set(fundName, {
        fundName,
        totalDeals: 0,
        activeDeals: 0,
        wonDeals: 0,
        totalVolume: 0,
        totalCommission: 0,
        latestDealDate: new Date(deal.createdAt),
        deals: [],
      });
    }

    const client = clientsMap.get(fundName)!;
    client.totalDeals++;
    if (deal.status === "active") client.activeDeals++;
    if (deal.status === "won") client.wonDeals++;
    client.totalVolume += deal.loanAmount || 0;
    client.totalCommission += deal.commissionEarned || 0;
    if (new Date(deal.createdAt) > client.latestDealDate) {
      client.latestDealDate = new Date(deal.createdAt);
    }
    client.deals.push(deal);
  });

  const clients = Array.from(clientsMap.values())
    .sort((a, b) => b.latestDealDate.getTime() - a.latestDealDate.getTime());

  const filteredClients = clients.filter(client =>
    client.fundName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.activeDeals > 0).length;
  const totalVolume = clients.reduce((sum, c) => sum + c.totalVolume, 0);
  const totalCommissions = clients.reduce((sum, c) => sum + c.totalCommission, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
        <p className="text-muted-foreground mt-1">
          Manage your GP portfolio and track relationship performance
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalClients}</div>
            <p className="text-xs text-muted-foreground">{activeClients} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              ${(totalVolume / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Across all deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              ${(totalCommissions / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {deals.length > 0 ? Math.round((clients.reduce((sum, c) => sum + c.wonDeals, 0) / deals.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Of all deals submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by fund name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-clients"
        />
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery 
                  ? "Try adjusting your search query" 
                  : "Submit deals for your first client to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client, index) => (
            <Card key={index} className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => {
              // Navigate to first deal for this client
              if (client.deals.length > 0) {
                setLocation(`/advisor/deals/${client.deals[0].id}`);
              }
            }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {client.fundName}
                    </CardTitle>
                    <CardDescription>
                      {client.totalDeals} deal{client.totalDeals !== 1 ? 's' : ''} •
                      Last activity {client.latestDealDate.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {client.activeDeals > 0 && (
                    <Badge className="bg-primary text-primary-foreground">
                      {client.activeDeals} Active
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Deals</p>
                    <p className="text-lg font-semibold tabular-nums">{client.totalDeals}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Deals Won</p>
                    <p className="text-lg font-semibold tabular-nums">{client.wonDeals}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Volume</p>
                    <p className="text-lg font-semibold tabular-nums">
                      ${(client.totalVolume / 1000000).toFixed(1)}M
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Commissions</p>
                    <p className="text-lg font-semibold tabular-nums">
                      ${(client.totalCommission / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (client.deals.length > 0) {
                        setLocation(`/advisor/deals/${client.deals[0].id}`);
                      }
                    }}
                    data-testid={`button-view-deals-${index}`}
                  >
                    View Deals ({client.totalDeals})
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation("/advisor/submit-deal");
                    }}
                    data-testid={`button-submit-new-${index}`}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Submit New Deal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
