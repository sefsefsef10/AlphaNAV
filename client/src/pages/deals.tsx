import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DealTable, Deal } from "@/components/deal-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  const deals: Deal[] = facilities.map((facility) => {
    const statusMap: Record<string, Deal["status"]> = {
      "active": "monitoring",
      "pending": "underwriting",
      "approved": "approved",
      "closed": "closed",
    };

    const stageMap: Record<string, string> = {
      "active": "Post-Close Monitoring",
      "pending": "Due Diligence",
      "approved": "Documentation",
      "closed": "Closed - Paid Off",
    };

    const createdDate = new Date(facility.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let lastUpdate = "";
    if (diffHours < 24) {
      lastUpdate = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      lastUpdate = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      lastUpdate = `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      lastUpdate = `${months} month${months !== 1 ? 's' : ''} ago`;
    }

    return {
      id: facility.id,
      fundName: facility.fundName,
      status: statusMap[facility.status] || "lead",
      amount: facility.principalAmount || 0,
      stage: stageMap[facility.status] || "Initial Contact",
      lastUpdate,
      riskScore: undefined,
    };
  });

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = deal.fundName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Deal Flow</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage and track all deals through the pipeline
          </p>
        </div>
        <Button data-testid="button-new-deal" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deals by fund name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-deals"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="underwriting">Underwriting</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
          <span className="font-mono font-medium">{filteredDeals.length}</span>
          <span>deals</span>
        </div>
      </div>

      <DealTable
        deals={filteredDeals}
        onViewDeal={(id) => console.log("View deal:", id)}
        onEditDeal={(id) => console.log("Edit deal:", id)}
      />
    </div>
  );
}
