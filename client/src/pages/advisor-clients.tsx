import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Users } from "lucide-react";

export default function AdvisorClients() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your GP relationships and portfolio
          </p>
        </div>
        <Button data-testid="button-add-client">
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Client Portfolio</CardTitle>
          </div>
          <CardDescription>
            View and manage all your PE fund clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No clients added yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Add your first PE fund client to start submitting deals on their behalf
            </p>
            <Link href="/advisor/submit-deal">
              <Button data-testid="button-submit-deal-for-client">
                <Plus className="mr-2 h-4 w-4" />
                Submit Deal for Client
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
