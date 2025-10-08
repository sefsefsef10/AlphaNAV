import { useState } from "react";
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

// TODO: Remove mock data
const mockDeals: Deal[] = [
  {
    id: "1",
    fundName: "Sequoia Capital Fund XII",
    status: "monitoring",
    amount: 45000000,
    stage: "Post-Close Monitoring",
    lastUpdate: "2 hours ago",
    riskScore: 2,
  },
  {
    id: "2",
    fundName: "Tiger Global Private Investment",
    status: "underwriting",
    amount: 62000000,
    stage: "Due Diligence",
    lastUpdate: "5 hours ago",
    riskScore: 4,
  },
  {
    id: "3",
    fundName: "Andreessen Horowitz Bio Fund",
    status: "approved",
    amount: 38000000,
    stage: "Documentation",
    lastUpdate: "1 day ago",
    riskScore: 3,
  },
  {
    id: "4",
    fundName: "Benchmark Capital Growth VI",
    status: "lead",
    amount: 55000000,
    stage: "Initial Contact",
    lastUpdate: "3 days ago",
  },
  {
    id: "5",
    fundName: "Accel India Fund V",
    status: "underwriting",
    amount: 28000000,
    stage: "Financial Review",
    lastUpdate: "1 week ago",
    riskScore: 5,
  },
  {
    id: "6",
    fundName: "Lightspeed Venture Partners",
    status: "monitoring",
    amount: 72000000,
    stage: "Quarterly Review",
    lastUpdate: "2 weeks ago",
    riskScore: 3,
  },
  {
    id: "7",
    fundName: "Greylock Partners XVI",
    status: "closed",
    amount: 41000000,
    stage: "Closed - Paid Off",
    lastUpdate: "1 month ago",
  },
];

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDeals = mockDeals.filter((deal) => {
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
