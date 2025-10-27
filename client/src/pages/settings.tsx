import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillingSection from "@/components/billing-section";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" data-testid="tabs-settings">
        <TabsList data-testid="tabs-list-settings">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">Billing & Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6" data-testid="tab-content-profile">

          <Card data-testid="card-user-profile">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" defaultValue="John" data-testid="input-first-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" defaultValue="Doe" data-testid="input-last-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" data-testid="input-email" />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button data-testid="button-save-profile">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6" data-testid="tab-content-notifications">
          <Card data-testid="card-notifications">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Deal Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified about deal status changes</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" data-testid="checkbox-deal-alerts" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Risk Alerts</p>
                  <p className="text-sm text-muted-foreground">Receive alerts for covenant breaches</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" data-testid="checkbox-risk-alerts" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Report Generation</p>
                  <p className="text-sm text-muted-foreground">Notifications when reports are ready</p>
                </div>
                <input type="checkbox" className="h-4 w-4 rounded border-border" data-testid="checkbox-report-alerts" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 mt-6" data-testid="tab-content-billing">
          <BillingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
