import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, DollarSign, Plus, Building2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PipelineDeal {
  id: string;
  fundName: string;
  dealSize: number;
  stage: string;
  priority: string;
  advisorName?: string;
  gpName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const STAGES = [
  { id: "lead", name: "Lead", color: "bg-blue-500" },
  { id: "qualification", name: "Qualification", color: "bg-purple-500" },
  { id: "due_diligence", name: "Due Diligence", color: "bg-yellow-500" },
  { id: "term_sheet", name: "Term Sheet", color: "bg-orange-500" },
  { id: "closing", name: "Closing", color: "bg-green-500" },
  { id: "won", name: "Won", color: "bg-emerald-600" },
  { id: "lost", name: "Lost", color: "bg-red-500" },
];

const PRIORITY_COLORS = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function PipelineBoard() {
  const { toast } = useToast();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    fundName: "",
    dealSize: "",
    priority: "medium",
    advisorName: "",
    gpName: "",
    notes: "",
  });

  const { data: deals = [], isLoading } = useQuery<PipelineDeal[]>({
    queryKey: ['/api/pipeline/deals'],
  });

  const createDealMutation = useMutation({
    mutationFn: async (deal: typeof newDeal) => {
      return apiRequest('/api/pipeline/deals', {
        method: 'POST',
        body: JSON.stringify({
          ...deal,
          dealSize: parseFloat(deal.dealSize),
          stage: selectedStage || "lead",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/deals'] });
      setIsDialogOpen(false);
      setNewDeal({
        fundName: "",
        dealSize: "",
        priority: "medium",
        advisorName: "",
        gpName: "",
        notes: "",
      });
      toast({
        title: "Deal created",
        description: "Deal added to pipeline successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create deal",
        description: error.message || "An error occurred while creating the deal",
        variant: "destructive",
      });
    },
  });

  const moveDealMutation = useMutation({
    mutationFn: async ({ dealId, newStage }: { dealId: string; newStage: string }) => {
      return apiRequest(`/api/pipeline/deals/${dealId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: newStage }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/deals'] });
      toast({
        title: "Deal moved",
        description: "Deal stage updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to move deal",
        description: error.message || "An error occurred while moving the deal",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDealsForStage = (stageId: string) => {
    return deals.filter(deal => deal.stage === stageId);
  };

  const handleCreateDeal = () => {
    if (!newDeal.fundName || !newDeal.dealSize) {
      toast({
        title: "Missing fields",
        description: "Please fill in fund name and deal size",
        variant: "destructive",
      });
      return;
    }
    createDealMutation.mutate(newDeal);
  };

  const handleMoveDeal = (dealId: string, newStage: string) => {
    moveDealMutation.mutate({ dealId, newStage });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Deal Pipeline</h1>
          <p className="text-muted-foreground">Kanban board for managing deal flow</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-deal">
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
              <DialogDescription>Add a new deal to the pipeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fundName">Fund Name</Label>
                <Input
                  id="fundName"
                  value={newDeal.fundName}
                  onChange={(e) => setNewDeal({ ...newDeal, fundName: e.target.value })}
                  data-testid="input-fund-name"
                />
              </div>
              <div>
                <Label htmlFor="dealSize">Deal Size ($)</Label>
                <Input
                  id="dealSize"
                  type="number"
                  value={newDeal.dealSize}
                  onChange={(e) => setNewDeal({ ...newDeal, dealSize: e.target.value })}
                  data-testid="input-deal-size"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newDeal.priority}
                  onValueChange={(value) => setNewDeal({ ...newDeal, priority: value })}
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="advisorName">Advisor Name (Optional)</Label>
                <Input
                  id="advisorName"
                  value={newDeal.advisorName}
                  onChange={(e) => setNewDeal({ ...newDeal, advisorName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gpName">GP Name (Optional)</Label>
                <Input
                  id="gpName"
                  value={newDeal.gpName}
                  onChange={(e) => setNewDeal({ ...newDeal, gpName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleCreateDeal} 
                className="w-full"
                disabled={createDealMutation.isPending}
                data-testid="button-create-deal"
              >
                {createDealMutation.isPending ? "Creating..." : "Create Deal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {STAGES.map((stage) => {
          const stageDeals = getDealsForStage(stage.id);
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.dealSize, 0);
          
          return (
            <Card key={stage.id} className="min-h-[400px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <CardTitle className="text-sm">{stage.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{stageDeals.length}</Badge>
                </div>
                {stageValue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stageValue)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {stageDeals.map((deal) => (
                  <Card 
                    key={deal.id} 
                    className="hover-elevate cursor-pointer"
                    data-testid={`card-deal-${deal.id}`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{deal.fundName}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(deal.dealSize)}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${PRIORITY_COLORS[deal.priority as keyof typeof PRIORITY_COLORS]}`}
                        >
                          {deal.priority}
                        </Badge>
                      </div>
                      
                      {(deal.advisorName || deal.gpName) && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {deal.advisorName && (
                            <p className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {deal.advisorName}
                            </p>
                          )}
                          {deal.gpName && (
                            <p className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {deal.gpName}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {deal.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {deal.notes}
                        </p>
                      )}
                      
                      <div className="flex gap-1 flex-wrap">
                        {STAGES.filter(s => s.id !== stage.id).map((targetStage) => (
                          <Button
                            key={targetStage.id}
                            size="sm"
                            variant="ghost"
                            className="text-xs px-2 py-1 h-6"
                            onClick={() => handleMoveDeal(deal.id, targetStage.id)}
                            data-testid={`button-move-${deal.id}-to-${targetStage.id}`}
                          >
                            <ChevronRight className="h-3 w-3 mr-1" />
                            {targetStage.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
