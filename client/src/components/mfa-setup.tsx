import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MFAStatus {
  enabled: boolean;
  backupPhone?: string;
  smsEnabled: boolean;
  backupCodeCount: number;
}

interface MFAEnrollmentData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function MFASetup() {
  const { toast } = useToast();
  const [enrollmentData, setEnrollmentData] = useState<MFAEnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Get current MFA status
  const { data: mfaStatus, isLoading: statusLoading } = useQuery<MFAStatus>({
    queryKey: ["/api/mfa/status"],
  });

  // Generate MFA secret
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/mfa/generate", {
        method: "POST",
      });
      return response as MFAEnrollmentData;
    },
    onSuccess: (data) => {
      setEnrollmentData(data);
      setShowBackupCodes(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate MFA setup. Please try again.",
      });
    },
  });

  // Enable MFA
  const enableMutation = useMutation({
    mutationFn: async () => {
      if (!enrollmentData) throw new Error("No enrollment data");
      
      return apiRequest("/api/mfa/enable", {
        method: "POST",
        body: JSON.stringify({
          secret: enrollmentData.secret,
          verificationCode,
          backupCodes: enrollmentData.backupCodes,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Multi-factor authentication has been enabled.",
      });
      setShowBackupCodes(true);
      queryClient.invalidateQueries({ queryKey: ["/api/mfa/status"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Invalid verification code. Please try again.",
      });
    },
  });

  // Disable MFA
  const disableMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/mfa/disable", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "MFA Disabled",
        description: "Multi-factor authentication has been disabled.",
      });
      setEnrollmentData(null);
      setVerificationCode("");
      setShowBackupCodes(false);
      queryClient.invalidateQueries({ queryKey: ["/api/mfa/status"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disable MFA. Please try again.",
      });
    },
  });

  // Regenerate backup codes
  const regenerateCodesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/mfa/regenerate-codes", {
        method: "POST",
      });
      return response as { backupCodes: string[] };
    },
    onSuccess: (data) => {
      setEnrollmentData(prev => prev ? { ...prev, backupCodes: data.backupCodes } : null);
      setShowBackupCodes(true);
      toast({
        title: "Codes Regenerated",
        description: "New backup codes have been generated. Save them securely!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mfa/status"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to regenerate backup codes.",
      });
    },
  });

  const copyBackupCodes = () => {
    if (!enrollmentData) return;
    
    const codesText = enrollmentData.backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    
    toast({
      title: "Copied!",
      description: "Backup codes copied to clipboard.",
    });

    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const downloadBackupCodes = () => {
    if (!enrollmentData) return;
    
    const codesText = "AlphaNAV MFA Backup Codes\n\n" + 
                     enrollmentData.backupCodes.join("\n") +
                     "\n\nKeep these codes in a safe place. Each code can only be used once.";
    
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alphanav-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (statusLoading) {
    return <div className="text-muted-foreground">Loading MFA status...</div>;
  }

  // Already enabled - show status
  if (mfaStatus?.enabled && !enrollmentData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" data-testid="icon-mfa-enabled" />
              <CardTitle>Multi-Factor Authentication</CardTitle>
            </div>
            <Badge variant="default" className="bg-green-500" data-testid="badge-mfa-status">
              Enabled
            </Badge>
          </div>
          <CardDescription>
            Your account is protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-md">
            <div>
              <p className="font-medium">Backup Codes</p>
              <p className="text-sm text-muted-foreground">
                {mfaStatus.backupCodeCount} remaining
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => regenerateCodesMutation.mutate()}
              disabled={regenerateCodesMutation.isPending}
              data-testid="button-regenerate-codes"
            >
              Regenerate Codes
            </Button>
          </div>

          {mfaStatus.backupCodeCount < 3 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500">Low on backup codes</p>
                <p className="text-muted-foreground">
                  You have {mfaStatus.backupCodeCount} backup codes remaining. Regenerate them soon.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={() => disableMutation.mutate()}
            disabled={disableMutation.isPending}
            data-testid="button-disable-mfa"
          >
            Disable MFA
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show backup codes after enabling
  if (showBackupCodes && enrollmentData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Save Your Backup Codes</CardTitle>
          </div>
          <CardDescription>
            Store these codes in a safe place. Each can only be used once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-2">
            {enrollmentData.backupCodes.map((code, i) => (
              <div key={i} className="flex items-center justify-between">
                <span data-testid={`code-${i}`}>{code}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyBackupCodes}
              className="flex-1"
              data-testid="button-copy-codes"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copiedCodes ? "Copied!" : "Copy Codes"}
            </Button>
            <Button
              variant="outline"
              onClick={downloadBackupCodes}
              className="flex-1"
              data-testid="button-download-codes"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Make sure to save these codes before closing this window. You won't be able to see them again.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              setShowBackupCodes(false);
              setEnrollmentData(null);
            }}
            data-testid="button-done"
          >
            Done
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Setup flow - not enabled yet
  if (!enrollmentData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Multi-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Protect your account with two-factor authentication using an authenticator app like Google Authenticator or Authy.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            data-testid="button-setup-mfa"
          >
            Set Up MFA
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show QR code and verification
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>
          Scan this QR code with your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center p-4 bg-white rounded-md">
          <img
            src={enrollmentData.qrCodeUrl}
            alt="MFA QR Code"
            className="w-64 h-64"
            data-testid="img-qr-code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input
            id="verification-code"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            data-testid="input-verification-code"
          />
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code from your authenticator app to verify
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setEnrollmentData(null);
            setVerificationCode("");
          }}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={() => enableMutation.mutate()}
          disabled={verificationCode.length !== 6 || enableMutation.isPending}
          data-testid="button-verify-enable"
        >
          Verify & Enable
        </Button>
      </CardFooter>
    </Card>
  );
}
