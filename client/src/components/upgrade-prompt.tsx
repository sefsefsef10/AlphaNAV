import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionStatus {
  upgradePrompt: {
    show: boolean;
    message?: string;
    tierName?: string;
    nextTier?: string;
  };
  subscription: {
    tier: string;
    limits: {
      maxFacilities: number;
      maxUsers: number;
      maxStorage: number;
      aiExtractions: number;
      canUpgrade: boolean;
      nextTier?: string;
    };
    usage?: {
      currentUsage: number;
      limit: number;
      percentage: number;
      exceeded: boolean;
      approaching: boolean;
    };
  };
}

export function UpgradePrompt() {
  const { data, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/check"],
  });

  if (isLoading || !data) {
    return null;
  }

  const { upgradePrompt, subscription } = data;

  // Don't show prompt if not needed
  if (!upgradePrompt.show) {
    return null;
  }

  const { usage } = subscription;
  const isExceeded = usage?.exceeded || false;
  const isApproaching = usage?.approaching || false;

  return (
    <Alert
      variant={isExceeded ? "destructive" : "default"}
      className="mb-6"
      data-testid="alert-upgrade-prompt"
    >
      {isExceeded ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <TrendingUp className="h-4 w-4" />
      )}
      <AlertTitle data-testid="text-upgrade-title">
        {isExceeded ? "Facility Limit Reached" : "Approaching Facility Limit"}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p data-testid="text-upgrade-message">{upgradePrompt.message}</p>
        
        {usage && usage.limit > 0 && (
          <div className="space-y-2" data-testid="container-usage-progress">
            <div className="flex justify-between text-sm">
              <span>Facilities Used</span>
              <span className="font-medium">
                {usage.currentUsage} / {usage.limit}
              </span>
            </div>
            <Progress
              value={usage.percentage}
              className="h-2"
              data-testid="progress-usage"
            />
          </div>
        )}

        {subscription.limits.canUpgrade && subscription.limits.nextTier && (
          <div className="flex gap-2 mt-4">
            <Button
              asChild
              variant={isExceeded ? "default" : "outline"}
              size="sm"
              data-testid="button-upgrade-plan"
            >
              <Link href="/billing">
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to {subscription.limits.nextTier.charAt(0).toUpperCase() + subscription.limits.nextTier.slice(1)}
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              data-testid="button-view-pricing"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function FacilityLimitBadge() {
  const { data } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/check"],
  });

  if (!data || !data.subscription.usage) {
    return null;
  }

  const { usage, limits } = data.subscription;
  const percentage = usage.percentage;
  const isUnlimited = limits.maxFacilities === -1;

  return (
    <div className="flex items-center gap-2 text-sm" data-testid="container-facility-limit">
      <span className="text-muted-foreground">Facilities:</span>
      <span className="font-medium" data-testid="text-facility-count">
        {usage.currentUsage} / {isUnlimited ? "Unlimited" : usage.limit}
      </span>
      {!isUnlimited && usage.approaching && (
        <span
          className="text-xs text-orange-500 dark:text-orange-400"
          data-testid="badge-approaching-limit"
        >
          ({Math.round(percentage)}% used)
        </span>
      )}
      {!isUnlimited && usage.exceeded && (
        <span
          className="text-xs text-destructive font-medium"
          data-testid="badge-limit-exceeded"
        >
          Limit reached
        </span>
      )}
    </div>
  );
}
