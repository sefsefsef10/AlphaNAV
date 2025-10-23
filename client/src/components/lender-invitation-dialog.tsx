import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, X, Mail, Check, Clock, AlertCircle } from "lucide-react";

const invitationSchema = z.object({
  lenderName: z.string().min(1, "Lender name is required"),
  lenderEmail: z.string().email("Valid email is required"),
  lenderContact: z.string().min(1, "Contact person is required"),
});

type InvitationForm = z.infer<typeof invitationSchema>;

interface LenderInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  fundName: string;
}

export function LenderInvitationDialog({
  open,
  onOpenChange,
  dealId,
  fundName,
}: LenderInvitationDialogProps) {
  const { toast } = useToast();

  // Fetch existing invitations
  const { data: invitations = [] } = useQuery<any[]>({
    queryKey: ["/api/lender-invitations", dealId],
    queryFn: async () => {
      const response = await fetch(`/api/lender-invitations?advisorDealId=${dealId}`);
      if (!response.ok) throw new Error("Failed to fetch invitations");
      return response.json();
    },
    enabled: open,
  });

  const form = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      lenderName: "",
      lenderEmail: "",
      lenderContact: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InvitationForm) => {
      return await apiRequest("POST", "/api/lender-invitations", {
        advisorDealId: dealId,
        ...data,
        status: "pending",
        invitedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lender-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advisor-deals"] });
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${form.getValues("lenderName")}`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Send Invitation",
        description: error.message,
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiRequest("PATCH", `/api/lender-invitations/${invitationId}`, {
        invitedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lender-invitations"] });
      toast({
        title: "Invitation Resent",
        description: "The lender has been notified again",
      });
    },
  });

  const onSubmit = (data: InvitationForm) => {
    inviteMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="outline" className="gap-1"><Check className="h-3 w-3" />Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />Declined</Badge>;
      case "interested":
        return <Badge variant="default" className="gap-1"><Mail className="h-3 w-3" />Interested</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Invite Lenders - {fundName}</DialogTitle>
          <DialogDescription>
            Send invitations to lenders for this RFP. Lenders will receive anonymized deal information and can submit term sheets.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Invite Form */}
          <div>
            <h3 className="text-sm font-medium mb-4">Send New Invitation</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="lenderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lender Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Goldman Sachs" 
                          data-testid="input-lender-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lenderContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., John Smith" 
                          data-testid="input-lender-contact"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lenderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="john.smith@example.com" 
                          data-testid="input-lender-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={inviteMutation.isPending}
                  data-testid="button-send-invitation"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Right: Invited Lenders List */}
          <div>
            <h3 className="text-sm font-medium mb-4">
              Invited Lenders ({invitations.length})
            </h3>
            <ScrollArea className="h-[400px]">
              {invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No lenders invited yet</p>
                  <p className="text-xs mt-1">Send your first invitation to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation: any) => (
                    <div
                      key={invitation.id}
                      className="p-3 border rounded-lg space-y-2 hover-elevate"
                      data-testid={`invitation-${invitation.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{invitation.lenderName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {invitation.lenderContact}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {invitation.lenderEmail}
                          </p>
                        </div>
                        {getStatusBadge(invitation.status)}
                      </div>

                      {invitation.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => resendMutation.mutate(invitation.id)}
                          disabled={resendMutation.isPending}
                          data-testid={`button-resend-${invitation.id}`}
                        >
                          <Mail className="h-3 w-3 mr-2" />
                          Resend Invitation
                        </Button>
                      )}

                      {invitation.responseNotes && (
                        <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
                          "{invitation.responseNotes}"
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
