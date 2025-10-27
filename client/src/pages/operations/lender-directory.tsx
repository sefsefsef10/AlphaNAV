import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Search, Mail, Phone, ExternalLink, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Lender {
  id: string;
  lenderName: string;
  lenderType: string;
  tier: string | null;
  aum: number | null;
  geography: string | null;
  minDealSize: number | null;
  maxDealSize: number | null;
  typicalLtv: string | null;
  typicalRate: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  relationship: string;
  lastContact: string | null;
  status: string;
  createdAt: string;
}

export default function LenderDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch lenders
  const { data: lenders = [], isLoading } = useQuery<Lender[]>({
    queryKey: ["/api/lenders"],
  });

  // Filter lenders
  const filteredLenders = lenders.filter(lender => {
    const matchesSearch = lender.lenderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lender.contactName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRelationship = relationshipFilter === "all" || lender.relationship === relationshipFilter;
    return matchesSearch && matchesRelationship;
  });

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case "preferred": return "default";
      case "active": return "secondary";
      case "warm": return "outline";
      case "cold": return "outline";
      default: return "outline";
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? "compact" : "standard",
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lender Directory</h1>
          <p className="text-muted-foreground">
            Manage relationships with lending partners
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-lender">
              <Plus className="h-4 w-4 mr-2" />
              Add Lender
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Lender</DialogTitle>
              <DialogDescription>
                Add a new lending partner to your directory
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              Feature coming soon - full CRUD operations for lender management
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lenders</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-lenders">
              {lenders.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferred</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-preferred-lenders">
              {lenders.filter(l => l.relationship === "preferred").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-lenders">
              {lenders.filter(l => l.relationship === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warm Leads</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-warm-lenders">
              {lenders.filter(l => l.relationship === "warm").length}
            </div>
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
                  placeholder="Search lenders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-lenders"
                />
              </div>
            </div>
            <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-relationship-filter">
                <SelectValue placeholder="Filter by relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relationships</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lenders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lenders</CardTitle>
          <CardDescription>
            {filteredLenders.length} lenders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredLenders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No lenders found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lender Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">AUM</TableHead>
                    <TableHead className="text-right">Deal Size Range</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Last Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLenders.map((lender) => (
                    <TableRow key={lender.id} data-testid={`row-lender-${lender.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lender.lenderName}</div>
                          {lender.tier && (
                            <div className="text-xs text-muted-foreground">
                              {lender.tier.replace('_', ' ').toUpperCase()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lender.lenderType.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {lender.contactName && (
                            <div className="text-sm">{lender.contactName}</div>
                          )}
                          {lender.contactEmail && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lender.contactEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(lender.aum)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lender.minDealSize && lender.maxDealSize
                          ? `${formatCurrency(lender.minDealSize)} - ${formatCurrency(lender.maxDealSize)}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRelationshipColor(lender.relationship) as any}>
                          {lender.relationship}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lender.lastContact
                          ? formatDistanceToNow(new Date(lender.lastContact), { addSuffix: true })
                          : "Never"}
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
