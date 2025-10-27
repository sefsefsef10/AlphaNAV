import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DollarSign,
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { Facility, DrawRequest, CashFlow } from "@shared/schema";
import { insertDrawRequestSchema } from "@shared/schema";
import { FacilityDocuments } from "@/components/facility-documents";
import { FacilityMessaging } from "@/components/facility-messaging";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default function GPFacility() {
  const { toast } = useToast();
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);

  // Query for facilities
  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const activeFacility = facilities.find((f) => f.status === "active");

  // Query for draw requests (filtered by facility)
  const { data: drawRequests = [] } = useQuery<DrawRequest[]>({
    queryKey: ["/api/draw-requests"],
    enabled: !!activeFacility,
  });

  // Query for cash flows (payment schedule)
  const { data: cashFlows = [] } = useQuery<CashFlow[]>({
    queryKey: ["/api/cash-flows"],
    enabled: !!activeFacility,
  });

  const facilityDrawRequests = activeFacility
    ? drawRequests.filter((dr) => dr.facilityId === activeFacility.id)
    : [];

  const facilityCashFlows = activeFacility
    ? cashFlows.filter((cf) => cf.facilityId === activeFacility.id)
    : [];

  const totalDrawn = facilityDrawRequests
    .filter((dr) => dr.status === "disbursed")
    .reduce((sum, dr) => sum + dr.requestedAmount, 0);

  const pendingDraws = facilityDrawRequests.filter((dr) => dr.status === "pending");

  if (!activeFacility) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facility Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your NAV lending facility
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">No Active Facility</h3>
                <p className="text-muted-foreground">
                  You don't have an active facility yet. Complete your application to
                  get started.
                </p>
              </div>
              <Button data-testid="button-apply-facility">Apply for Facility</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCapital =
    activeFacility.principalAmount - activeFacility.outstandingBalance;
  const utilizationRate =
    (activeFacility.outstandingBalance / activeFacility.principalAmount) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facility Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage draws, repayments, and facility documents
          </p>
        </div>
        <Dialog open={drawDialogOpen} onOpenChange={setDrawDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-draw-request">
              <Plus className="mr-2 h-4 w-4" />
              New Draw Request
            </Button>
          </DialogTrigger>
          <DrawRequestDialog
            facilityId={activeFacility.id}
            availableCapital={availableCapital}
            onClose={() => setDrawDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Upgrade Prompt - Show if approaching/exceeding limits */}
      <UpgradePrompt />

      {/* Facility Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facility</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              ${(activeFacility.principalAmount / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              {activeFacility.interestRate}% interest rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              ${(activeFacility.outstandingBalance / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              {utilizationRate.toFixed(0)}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available to Draw
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-success">
              ${(availableCapital / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Ready for deployment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Draws</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {pendingDraws.length}
            </div>
            <p className="text-xs text-muted-foreground">
              ${pendingDraws.reduce((sum, dr) => sum + dr.requestedAmount, 0) / 1000000}M requested
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="draws" className="space-y-4">
        <TabsList>
          <TabsTrigger value="draws" data-testid="tab-draw-requests">
            Draw Requests
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-repayments">
            Repayments
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            Documents
          </TabsTrigger>
          <TabsTrigger value="messaging" data-testid="tab-messaging">
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draws" className="space-y-4">
          {facilityDrawRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg">No Draw Requests Yet</h3>
                    <p className="text-muted-foreground">
                      Request a draw to deploy capital from your facility
                    </p>
                  </div>
                  <Button
                    onClick={() => setDrawDialogOpen(true)}
                    data-testid="button-first-draw-request"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Draw Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            facilityDrawRequests.map((drawRequest) => (
              <DrawRequestCard key={drawRequest.id} drawRequest={drawRequest} />
            ))
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {facilityCashFlows.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg">No Payment Schedule</h3>
                    <p className="text-muted-foreground">
                      Your payment schedule will appear here once draws are disbursed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            facilityCashFlows.map((cashFlow) => (
              <PaymentCard key={cashFlow.id} cashFlow={cashFlow} />
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <FacilityDocuments facilityId={activeFacility.id} />
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          <FacilityMessaging
            facilityId={activeFacility.id}
            gpUserId="gp-user-1"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Draw Request Card Component
interface DrawRequestCardProps {
  drawRequest: DrawRequest;
}

function DrawRequestCard({ drawRequest }: DrawRequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "disbursed":
        return "bg-success text-success-foreground";
      case "approved":
        return "bg-primary text-primary-foreground";
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "disbursed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              ${(drawRequest.requestedAmount / 1000000).toFixed(1)}M Draw Request
            </CardTitle>
            <CardDescription>
              Requested on {new Date(drawRequest.requestDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(drawRequest.status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(drawRequest.status)}
              <span className="capitalize">{drawRequest.status}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Purpose</h4>
          <p className="text-muted-foreground">{drawRequest.purpose}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Requested By</p>
            <p className="font-medium">{drawRequest.requestedBy}</p>
          </div>
          {drawRequest.approvedBy && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Approved By</p>
              <p className="font-medium">{drawRequest.approvedBy}</p>
            </div>
          )}
        </div>

        {drawRequest.disbursedDate && (
          <div className="rounded-lg bg-success/10 border border-success p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-success">
                Disbursed on{" "}
                {new Date(drawRequest.disbursedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {drawRequest.rejectionReason && (
          <div className="rounded-lg bg-destructive/10 border border-destructive p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Rejection Reason
              </p>
              <p className="text-sm text-destructive/90">
                {drawRequest.rejectionReason}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Payment Card Component
interface PaymentCardProps {
  cashFlow: CashFlow;
}

function PaymentCard({ cashFlow }: PaymentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-success-foreground";
      case "overdue":
        return "bg-destructive text-destructive-foreground";
      case "waived":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              Payment Due: {new Date(cashFlow.dueDate).toLocaleDateString()}
            </CardTitle>
            <CardDescription>
              Total: ${(cashFlow.totalDue / 1000).toFixed(2)}K
            </CardDescription>
          </div>
          <Badge className={getStatusColor(cashFlow.status)}>
            <span className="capitalize">{cashFlow.status}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Principal</p>
            <p className="font-semibold tabular-nums">
              ${(cashFlow.principal / 1000).toFixed(2)}K
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Interest</p>
            <p className="font-semibold tabular-nums">
              ${(cashFlow.interest / 1000).toFixed(2)}K
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Paid Amount</p>
            <p className="font-semibold tabular-nums">
              ${(cashFlow.paidAmount / 1000).toFixed(2)}K
            </p>
          </div>
        </div>

        {cashFlow.paidDate && (
          <div className="mt-4 rounded-lg bg-success/10 border border-success p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm text-success">
                Paid on {new Date(cashFlow.paidDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Draw Request Dialog Component
interface DrawRequestDialogProps {
  facilityId: string;
  availableCapital: number;
  onClose: () => void;
}

function DrawRequestDialog({
  facilityId,
  availableCapital,
  onClose,
}: DrawRequestDialogProps) {
  const { toast } = useToast();

  const drawRequestFormSchema = insertDrawRequestSchema.extend({
    requestedAmount: z.coerce
      .number()
      .min(1, "Amount must be greater than 0")
      .max(availableCapital, `Cannot exceed available capital of $${(availableCapital / 1000000).toFixed(1)}M`),
    purpose: z.string().min(10, "Please provide at least 10 characters describing the purpose"),
  });

  type DrawRequestFormData = z.infer<typeof drawRequestFormSchema>;

  const form = useForm<DrawRequestFormData>({
    resolver: zodResolver(drawRequestFormSchema),
    defaultValues: {
      facilityId,
      requestedAmount: 0,
      purpose: "",
      status: "pending",
      requestedBy: "GP Fund Manager", // TODO: Get from auth context
      requestDate: new Date(),
    },
  });

  const createDrawRequestMutation = useMutation({
    mutationFn: async (data: DrawRequestFormData) => {
      return await apiRequest("POST", "/api/draw-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/draw-requests"] });
      toast({
        title: "Draw Request Submitted",
        description: "Your draw request is being reviewed by the NAV IQ team",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Submit Draw Request",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: DrawRequestFormData) => {
    createDrawRequestMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>New Draw Request</DialogTitle>
        <DialogDescription>
          Request to draw capital from your facility. Available:{" "}
          <span className="font-semibold text-success">
            ${(availableCapital / 1000000).toFixed(1)}M
          </span>
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="requestedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requested Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="1000000"
                      className="pl-9"
                      data-testid="input-draw-amount"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Enter amount in dollars (e.g., 1000000 for $1M)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the purpose of this draw request..."
                    className="resize-none"
                    rows={4}
                    data-testid="input-draw-purpose"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain how you plan to use these funds
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-draw"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createDrawRequestMutation.isPending}
              data-testid="button-submit-draw"
            >
              {createDrawRequestMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
