import { MFASetup } from "@/components/mfa-setup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Key } from "lucide-react";

export default function SecuritySettings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Security Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account security and authentication settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* MFA Section */}
        <MFASetup />

        {/* Password Section - Coming Soon */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Password</CardTitle>
            </div>
            <CardDescription>
              Change your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Password management is handled through Replit Auth.
            </p>
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Enable Multi-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">
                Protect your account with an extra layer of security. MFA requires both your password and a code from your phone to sign in.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Keep Backup Codes Safe</h4>
              <p className="text-sm text-muted-foreground">
                Store your backup codes in a secure location. You'll need them if you lose access to your authenticator app.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Review Account Activity</h4>
              <p className="text-sm text-muted-foreground">
                Regularly check your account activity and sign out of sessions you don't recognize.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
