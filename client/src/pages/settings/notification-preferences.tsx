import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bell, MessageSquare, Mail, Smartphone, Plus, Trash2, TestTube } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NotificationPreference = {
  id: string;
  userId: string;
  channel: string;
  enabled: boolean;
  contactInfo: string | null;
  notificationTypes: string[] | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
};

const channelIcons = {
  slack: MessageSquare,
  sms: Smartphone,
  email: Mail,
  in_app: Bell,
};

const channelLabels = {
  slack: "Slack",
  sms: "SMS",
  email: "Email",
  in_app: "In-App",
};

export default function NotificationPreferences() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPreference, setNewPreference] = useState({
    channel: "sms",
    contactInfo: "",
    enabled: true,
  });

  const { data: preferences = [], isLoading } = useQuery<NotificationPreference[]>({
    queryKey: ['/api/notifications/preferences'],
  });

  const createPreferenceMutation = useMutation({
    mutationFn: async (pref: typeof newPreference) => {
      return apiRequest('/api/notifications/preferences', {
        method: 'POST',
        body: JSON.stringify(pref),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      setIsDialogOpen(false);
      setNewPreference({ channel: "sms", contactInfo: "", enabled: true });
      toast({
        title: "Preference added",
        description: "Notification channel configured successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add preference",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const togglePreferenceMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return apiRequest(`/api/notifications/preferences/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({
        title: "Preference updated",
        description: "Notification settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update preference",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deletePreferenceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/notifications/preferences/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({
        title: "Preference removed",
        description: "Notification channel removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove preference",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const testNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/notifications/preferences/${id}/test`, {
        method: 'POST',
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Test sent!" : "Test failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test failed",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    createPreferenceMutation.mutate(newPreference);
  };

  const getContactInfoPlaceholder = (channel: string) => {
    switch (channel) {
      case "sms":
        return "+15551234567";
      case "slack":
        return "#channel-name or @username";
      case "email":
        return "your@email.com";
      default:
        return "";
    }
  };

  const getContactInfoLabel = (channel: string) => {
    switch (channel) {
      case "sms":
        return "Phone Number (E.164 format)";
      case "slack":
        return "Slack Channel or Username";
      case "email":
        return "Email Address";
      default:
        return "Contact Information";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading preferences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground mt-1">
            Configure how you receive alerts about covenant breaches, deal updates, and system events
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-channel">
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Notification Channel</DialogTitle>
              <DialogDescription>
                Configure a new channel to receive notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Channel Type</Label>
                <Select
                  value={newPreference.channel}
                  onValueChange={(value) => setNewPreference({ ...newPreference, channel: value })}
                >
                  <SelectTrigger data-testid="select-channel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS (Text Message)</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{getContactInfoLabel(newPreference.channel)}</Label>
                <Input
                  data-testid="input-contact-info"
                  placeholder={getContactInfoPlaceholder(newPreference.channel)}
                  value={newPreference.contactInfo}
                  onChange={(e) => setNewPreference({ ...newPreference, contactInfo: e.target.value })}
                />
                {newPreference.channel === "sms" && (
                  <p className="text-xs text-muted-foreground">
                    Enter phone number in international format (e.g., +15551234567)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newPreference.contactInfo || createPreferenceMutation.isPending}
                data-testid="button-confirm-add"
              >
                Add Channel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {preferences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notification channels configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a channel to start receiving alerts
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {preferences.map((pref) => {
            const Icon = channelIcons[pref.channel as keyof typeof channelIcons] || Bell;
            return (
              <Card key={pref.id} data-testid={`card-preference-${pref.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {channelLabels[pref.channel as keyof typeof channelLabels] || pref.channel}
                        </CardTitle>
                        <CardDescription>
                          {pref.contactInfo || "No contact info"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testNotificationMutation.mutate(pref.id)}
                        disabled={!pref.enabled || testNotificationMutation.isPending}
                        data-testid={`button-test-${pref.id}`}
                      >
                        <TestTube className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePreferenceMutation.mutate(pref.id)}
                        disabled={deletePreferenceMutation.isPending}
                        data-testid={`button-delete-${pref.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Switch
                        checked={pref.enabled}
                        onCheckedChange={(enabled) => togglePreferenceMutation.mutate({ id: pref.id, enabled })}
                        data-testid={`switch-enabled-${pref.id}`}
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            All channels receive these types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Covenant Breach Alerts</div>
              <div className="text-sm text-muted-foreground">Immediate alerts when covenant thresholds are breached</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Deal Updates</div>
              <div className="text-sm text-muted-foreground">Updates on deal stage changes and status updates</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">System Events</div>
              <div className="text-sm text-muted-foreground">Document processing, fund admin sync results, and system notifications</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
