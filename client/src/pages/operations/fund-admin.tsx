import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, TestTube, Eye, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { FundAdminConnection } from "@shared/schema";

export default function FundAdminPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<FundAdminConnection | null>(null);

  const { data: connections, isLoading } = useQuery<FundAdminConnection[]>({
    queryKey: ["/api/fund-admin-connections"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/fund-admin-connections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-admin-connections"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Connection created",
        description: "Fund admin connection created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create connection",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest("POST", `/api/fund-admin-connections/${connectionId}/sync`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-admin-connections"] });
      toast({
        title: "Sync started",
        description: "Fund admin sync started successfully",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest("POST", `/api/fund-admin-connections/${connectionId}/test`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest("DELETE", `/api/fund-admin-connections/${connectionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-admin-connections"] });
      toast({
        title: "Connection deleted",
        description: "Fund admin connection deleted successfully",
      });
    },
  });

  const handleCreateConnection = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      facilityId: formData.get("facilityId"),
      providerId: formData.get("providerId"),
      providerName: formData.get("providerName"),
      providerType: "fund_admin",
      connectionType: formData.get("connectionType"),
      syncFrequency: formData.get("syncFrequency"),
      status: "active",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-fund-admin">
            Fund Administrator Integrations
          </h1>
          <p className="text-muted-foreground mt-1">
            Sync NAV data from SS&C Intralinks, Alter Domus, Apex, and other fund administrators
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-connection">
              <Plus className="w-4 h-4 mr-2" />
              New Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fund Admin Connection</DialogTitle>
              <DialogDescription>
                Connect to a fund administrator to automatically sync NAV data
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateConnection}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="facilityId">Facility ID</Label>
                  <Input
                    id="facilityId"
                    name="facilityId"
                    placeholder="Enter facility ID"
                    required
                    data-testid="input-facility-id"
                  />
                </div>
                <div>
                  <Label htmlFor="providerName">Provider</Label>
                  <Select name="providerName" required>
                    <SelectTrigger data-testid="select-provider-name">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SSC_Intralinks">SS&C Intralinks</SelectItem>
                      <SelectItem value="Alter_Domus">Alter Domus</SelectItem>
                      <SelectItem value="Apex">Apex Fund Services</SelectItem>
                      <SelectItem value="Manual">Manual Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="providerId">Provider ID</Label>
                  <Input
                    id="providerId"
                    name="providerId"
                    placeholder="Enter provider ID"
                    required
                    data-testid="input-provider-id"
                  />
                </div>
                <div>
                  <Label htmlFor="connectionType">Connection Type</Label>
                  <Select name="connectionType" defaultValue="api">
                    <SelectTrigger data-testid="select-connection-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="sftp">SFTP</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="syncFrequency">Sync Frequency</Label>
                  <Select name="syncFrequency" defaultValue="daily">
                    <SelectTrigger data-testid="select-sync-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                  {createMutation.isPending ? "Creating..." : "Create Connection"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!connections || connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No connections configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a connection to a fund administrator to start syncing NAV data automatically
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Create First Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {connection.providerName.replace(/_/g, " ")}
                      </CardTitle>
                      <Badge 
                        variant={connection.status === "active" ? "default" : "secondary"}
                        data-testid={`badge-status-${connection.id}`}
                      >
                        {connection.status}
                      </Badge>
                      {connection.lastSyncStatus && (
                        <Badge 
                          variant={connection.lastSyncStatus === "success" ? "default" : "destructive"}
                          data-testid={`badge-sync-status-${connection.id}`}
                        >
                          {connection.lastSyncStatus === "success" ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {connection.lastSyncStatus}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Facility ID:</span>{" "}
                        <span className="font-mono">{connection.facilityId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Connection Type:</span>{" "}
                        <span className="font-medium">{connection.connectionType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sync Frequency:</span>{" "}
                        <span className="font-medium">{connection.syncFrequency}</span>
                      </div>
                      {connection.lastSync && (
                        <div>
                          <span className="text-muted-foreground">Last Sync:</span>{" "}
                          <span className="font-medium">
                            {format(new Date(connection.lastSync), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testMutation.mutate(connection.id)}
                      disabled={testMutation.isPending}
                      data-testid={`button-test-${connection.id}`}
                    >
                      <TestTube className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncMutation.mutate(connection.id)}
                      disabled={syncMutation.isPending}
                      data-testid={`button-sync-${connection.id}`}
                    >
                      <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedConnection(connection)}
                      data-testid={`button-view-${connection.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this connection?")) {
                          deleteMutation.mutate(connection.id);
                        }
                      }}
                      data-testid={`button-delete-${connection.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
