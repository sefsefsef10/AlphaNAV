import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, KeyRound } from "lucide-react";

interface MFAVerificationProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export function MFAVerification({ onVerified, onCancel }: MFAVerificationProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Verified!",
        description: "Two-factor authentication successful.",
      });
      onVerified();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid code. Please try again.",
      });
      setCode("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      verifyMutation.mutate();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {useBackupCode
            ? "Enter one of your backup recovery codes"
            : "Enter the 6-digit code from your authenticator app"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">
              {useBackupCode ? "Backup Code" : "Verification Code"}
            </Label>
            <Input
              id="mfa-code"
              placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
              value={code}
              onChange={(e) => {
                if (useBackupCode) {
                  // Format backup code as XXXX-XXXX
                  let value = e.target.value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
                  if (value.length > 4 && !value.includes("-")) {
                    value = value.slice(0, 4) + "-" + value.slice(4);
                  }
                  setCode(value.slice(0, 9));
                } else {
                  // Only allow digits for TOTP
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                }
              }}
              maxLength={useBackupCode ? 9 : 6}
              autoComplete="one-time-code"
              autoFocus
              data-testid="input-mfa-code"
            />
          </div>

          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
            }}
            data-testid="button-toggle-backup"
          >
            <KeyRound className="h-3 w-3 mr-1" />
            {useBackupCode ? "Use authenticator app instead" : "Use backup code"}
          </Button>
        </CardContent>
        <CardFooter className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel-verify"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              verifyMutation.isPending ||
              (useBackupCode ? code.length !== 9 : code.length !== 6)
            }
            className="flex-1"
            data-testid="button-submit-verify"
          >
            Verify
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
