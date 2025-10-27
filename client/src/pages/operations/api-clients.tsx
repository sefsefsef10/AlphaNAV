import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Key, AlertCircle, CheckCircle2, Clock, XCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const createClientSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  organizationId: z.string().optional(),
  allowedScopes: z.array(z.string()).min(1, "At least one scope is required"),
  rateLimit: z.number().min(100).max(10000).default(1000),
  environment: z.enum(["production", "sandbox"]).default("production"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  webhookUrl: z.string().url().optional().or(z.literal("")),
});

const availableScopes = [
  { value: "read:facilities", label: "Read Facilities" },
  { value: "read:draws", label: "Read Draw Requests" },
  { value: "write:draws", label: "Create Draw Requests" },
  { value: "read:analytics", label: "Read Analytics" },
  { value: "read:covenants", label: "Read Covenants" },
];

export default function ApiClientsPage() {
  const { toast } = useToast();
  const [newClientSecret, setNewClientSecret] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read:facilities"]);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/oauth/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createClientSchema>) => {
      const response = await apiRequest("/api/oauth/clients", {
        method: "POST",
        body: JSON.stringify({ ...data, allowedScopes: selectedScopes }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/oauth/clients"] });
      setNewClientSecret(data.clientSecret);
      toast({
        title: "API Client Created",
        description: "Save the client secret - it will only be shown once!",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest(`/api/oauth/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oauth/clients"] });
      toast({
        title: "Client Updated",
        description: "API client status has been updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/oauth/clients/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oauth/clients"] });
      toast({
        title: "Client Deleted",
        description: "API client and all its tokens have been revoked",
      });
    },
  });

  const form = useForm<z.infer<typeof createClientSchema>>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      clientName: "",
      rateLimit: 1000,
      environment: "production",
    },
  });

  const onSubmit = (data: z.infer<typeof createClientSchema>) => {
    createMutation.mutate(data);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-clients" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Clients</h1>
          <p className="text-muted-foreground">
            Manage OAuth2 clients for public API access
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-client">
              <Plus className="h-4 w-4 mr-2" />
              Create Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create API Client</DialogTitle>
              <DialogDescription>
                Generate OAuth2 credentials for external system integration
              </DialogDescription>
            </DialogHeader>

            {newClientSecret ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                    ⚠️ Save these credentials now - the secret will not be shown again!
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Client ID</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={clients?.[0]?.clientId || ""}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(clients?.[0]?.clientId, "Client ID")}
                        data-testid="button-copy-client-id"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Client Secret</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newClientSecret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(newClientSecret, "Client Secret")}
                        data-testid="button-copy-client-secret"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setNewClientSecret(null);
                    setIsCreateDialogOpen(false);
                    form.reset();
                  }}
                  className="w-full"
                  data-testid="button-done"
                >
                  Done
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="My Application" data-testid="input-client-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="text-sm font-medium">Allowed Scopes</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableScopes.map((scope) => (
                        <div key={scope.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={scope.value}
                            checked={selectedScopes.includes(scope.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScopes([...selectedScopes, scope.value]);
                              } else {
                                setSelectedScopes(selectedScopes.filter((s) => s !== scope.value));
                              }
                            }}
                            className="rounded border-input"
                            data-testid={`checkbox-scope-${scope.value}`}
                          />
                          <label htmlFor={scope.value} className="text-sm">
                            {scope.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="rateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Limit (requests/hour)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-rate-limit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="environment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Environment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-environment">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="sandbox">Sandbox</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Client"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {clients && clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No API Clients Yet</p>
            <p className="text-muted-foreground text-center mb-4">
              Create your first OAuth2 client to enable external access to your NAV lending data
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients?.map((client: any) => (
            <Card key={client.id} data-testid={`card-client-${client.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {client.clientName}
                      {client.status === "active" ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : client.status === "suspended" ? (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Revoked
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {client.clientId}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {client.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({ id: client.id, status: "suspended" })
                        }
                        data-testid={`button-suspend-${client.id}`}
                      >
                        Suspend
                      </Button>
                    )}
                    {client.status === "suspended" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({ id: client.id, status: "active" })
                        }
                        data-testid={`button-activate-${client.id}`}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(client.id)}
                      data-testid={`button-delete-${client.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Environment</p>
                    <p className="font-medium capitalize">{client.environment}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate Limit</p>
                    <p className="font-medium">{client.rateLimit}/hour</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scopes</p>
                    <p className="font-medium">{client.allowedScopes?.length || 0} scopes</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Used</p>
                    <p className="font-medium">
                      {client.lastUsed
                        ? new Date(client.lastUsed).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                {client.allowedScopes && client.allowedScopes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {client.allowedScopes.map((scope: string) => (
                      <Badge key={scope} variant="outline" className="font-mono text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
