import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, CreditCard, Calendar, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: string;
  maxFacilities: number;
  maxUsers: number;
  maxStorage: number;
  aiExtractions: number;
  features: string[];
}

interface UsageSummary {
  usage: Record<string, number>;
  limits: {
    maxFacilities: number;
    maxUsers: number;
    maxStorage: number;
    aiExtractions: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export default function BillingSection() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: subscriptionData, isLoading: isLoadingSubscription, error: subscriptionError } = useQuery<{ subscription: Subscription | null }>({
    queryKey: ['/api/subscription'],
  });

  const { data: plansData, isLoading: isLoadingPlans, error: plansError } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  const { data: usageData, isLoading: isLoadingUsage, error: usageError } = useQuery<UsageSummary>({
    queryKey: ['/api/subscription/usage'],
  });

  const subscription = subscriptionData?.subscription || null;
  const plans = (plansData || []) as SubscriptionPlan[];
  const usage = usageData;

  // Show loading state while any critical data is loading
  if (isLoadingSubscription || isLoadingPlans || isLoadingUsage) {
    return (
      <div className="space-y-6">
        <Card data-testid="card-loading">
          <CardHeader>
            <CardTitle>Loading Billing Information...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if critical data failed to load
  if (subscriptionError || plansError || usageError) {
    return (
      <div className="space-y-6">
        <Card data-testid="card-error">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Billing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We couldn't load your billing information. Please try refreshing the page.
              </p>
              {subscriptionError && (
                <p className="text-sm text-destructive" data-testid="text-subscription-error">
                  Subscription error: {subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error'}
                </p>
              )}
              {plansError && (
                <p className="text-sm text-destructive" data-testid="text-plans-error">
                  Plans error: {plansError instanceof Error ? plansError.message : 'Unknown error'}
                </p>
              )}
              {usageError && (
                <p className="text-sm text-destructive" data-testid="text-usage-error">
                  Usage metrics error: {usageError instanceof Error ? usageError.message : 'Unknown error'}
                </p>
              )}
              <Button onClick={() => window.location.reload()} data-testid="button-reload">
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upgradeMutation = useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      return await apiRequest('PUT', '/api/subscription', { tier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
      toast({
        title: "Subscription updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/subscription', { cancelAtPeriodEnd: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: "Subscription canceled",
        description: "Your subscription will be canceled at the end of the current billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckout = async (tier: SubscriptionTier) => {
    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/subscription/checkout', { tier });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/subscription/portal');
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Portal access failed",
        description: error instanceof Error ? error.message : "Failed to access billing portal",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1" data-testid="badge-subscription-active"><CheckCircle2 className="w-3 h-3" />Active</Badge>;
      case 'trialing':
        return <Badge variant="secondary" className="gap-1" data-testid="badge-subscription-trial"><TrendingUp className="w-3 h-3" />Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive" className="gap-1" data-testid="badge-subscription-past-due"><AlertCircle className="w-3 h-3" />Past Due</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="gap-1" data-testid="badge-subscription-canceled"><XCircle className="w-3 h-3" />Canceled</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-subscription-incomplete">{status}</Badge>;
    }
  };

  const getTierDisplay = (tier: SubscriptionTier) => {
    const tierMap = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return tierMap[tier] || tier;
  };

  const calculateUsagePercent = (used: number, limit: number) => {
    return Math.min(100, (used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      {subscription ? (
        <>
          <Card data-testid="card-current-subscription">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>
                    {getTierDisplay(subscription.tier)} Plan
                  </CardDescription>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Billing Period:</span>
                  <span className="font-medium" data-testid="text-billing-period">
                    {format(new Date(subscription.currentPeriodStart), 'MMM d')} - {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                  </span>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive" data-testid="text-cancel-warning">
                      Cancels on {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBillingPortal}
                  disabled={isProcessing}
                  data-testid="button-billing-portal"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
                
                {!subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {usage && (
            <Card data-testid="card-usage-metrics">
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>
                  Current usage for billing period ending {format(new Date(usage.period.end), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Facilities</span>
                    <span className="font-medium" data-testid="text-facilities-usage">
                      {usage.usage.facilities || 0} / {usage.limits.maxFacilities}
                    </span>
                  </div>
                  <Progress 
                    value={calculateUsagePercent(usage.usage.facilities || 0, usage.limits.maxFacilities)} 
                    data-testid="progress-facilities"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">AI Extractions</span>
                    <span className="font-medium" data-testid="text-ai-usage">
                      {usage.usage.ai_extractions || 0} / {usage.limits.aiExtractions}
                    </span>
                  </div>
                  <Progress 
                    value={calculateUsagePercent(usage.usage.ai_extractions || 0, usage.limits.aiExtractions)} 
                    data-testid="progress-ai"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage Used</span>
                    <span className="font-medium" data-testid="text-storage-usage">
                      {((usage.usage.storage_gb || 0) / 1024).toFixed(2)} GB / {usage.limits.maxStorage} GB
                    </span>
                  </div>
                  <Progress 
                    value={calculateUsagePercent(usage.usage.storage_gb || 0, usage.limits.maxStorage * 1024)} 
                    data-testid="progress-storage"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card data-testid="card-no-subscription">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              Choose a plan to get started with AlphaNAV
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card data-testid="card-subscription-plans">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            {subscription ? 'Upgrade or downgrade your subscription' : 'Select a plan to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.tier === plan.tier;
              const canUpgrade = subscription && (
                (subscription.tier === 'starter' && (plan.tier === 'professional' || plan.tier === 'enterprise')) ||
                (subscription.tier === 'professional' && plan.tier === 'enterprise')
              );
              const canDowngrade = subscription && (
                (subscription.tier === 'enterprise' && (plan.tier === 'professional' || plan.tier === 'starter')) ||
                (subscription.tier === 'professional' && plan.tier === 'starter')
              );

              return (
                <Card 
                  key={plan.id} 
                  className={isCurrentPlan ? 'border-primary' : ''}
                  data-testid={`card-plan-${plan.tier}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {isCurrentPlan && <Badge variant="default" data-testid={`badge-current-${plan.tier}`}>Current</Badge>}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold" data-testid={`text-price-${plan.tier}`}>
                        ${(plan.price / 100).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2" data-testid={`feature-facilities-${plan.tier}`}>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>{plan.maxFacilities === -1 ? 'Unlimited' : plan.maxFacilities} Facilities</span>
                      </li>
                      <li className="flex items-center gap-2" data-testid={`feature-users-${plan.tier}`}>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>{plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers} Users</span>
                      </li>
                      <li className="flex items-center gap-2" data-testid={`feature-storage-${plan.tier}`}>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>{plan.maxStorage} GB Storage</span>
                      </li>
                      <li className="flex items-center gap-2" data-testid={`feature-ai-${plan.tier}`}>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>{plan.aiExtractions === -1 ? 'Unlimited' : plan.aiExtractions} AI Extractions/mo</span>
                      </li>
                    </ul>

                    {!subscription && (
                      <Button 
                        className="w-full" 
                        onClick={() => handleCheckout(plan.tier)}
                        disabled={isProcessing}
                        data-testid={`button-subscribe-${plan.tier}`}
                      >
                        Subscribe
                      </Button>
                    )}

                    {canUpgrade && (
                      <Button 
                        className="w-full" 
                        onClick={() => upgradeMutation.mutate(plan.tier)}
                        disabled={upgradeMutation.isPending}
                        data-testid={`button-upgrade-${plan.tier}`}
                      >
                        Upgrade
                      </Button>
                    )}

                    {canDowngrade && (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => upgradeMutation.mutate(plan.tier)}
                        disabled={upgradeMutation.isPending}
                        data-testid={`button-downgrade-${plan.tier}`}
                      >
                        Downgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
