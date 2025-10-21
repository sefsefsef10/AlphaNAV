import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Target } from "lucide-react";

export default function AdvisorActiveRFPs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Active RFPs</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your competitive RFP processes
          </p>
        </div>
        <Link href="/advisor/submit-deal">
          <Button data-testid="button-submit-new-deal">
            <Plus className="mr-2 h-4 w-4" />
            Submit New Deal
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Active Competitive Processes</CardTitle>
          </div>
          <CardDescription>
            View and manage all deals currently in the RFP process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No active RFPs at this time
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Submit a new deal to start a competitive process across multiple lenders
            </p>
            <Link href="/advisor/submit-deal">
              <Button data-testid="button-submit-first-deal">
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Deal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
