import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Briefcase, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function RoleSelection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      await apiRequest("/api/auth/user/role", "PATCH", { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role selected",
        description: "Your account has been configured successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const roles = [
    {
      value: "operations",
      icon: Building2,
      title: "Operations / Lender",
      description: "Manage deal pipeline, underwriting, and portfolio monitoring",
      features: [
        "Access to full platform features",
        "AI-powered document extraction",
        "Covenant monitoring and breach prediction",
        "Legal document generation",
        "Portfolio analytics and reporting",
      ],
    },
    {
      value: "advisor",
      icon: Briefcase,
      title: "Advisor / Placement Agent",
      description: "Run competitive RFP processes and connect funds with lenders",
      features: [
        "Manage multiple fund mandates",
        "Anonymous deal distribution",
        "Commission tracking (50-75 bps)",
        "Lender network management",
        "Deal pipeline analytics",
      ],
    },
    {
      value: "gp",
      icon: Users,
      title: "GP / Fund Manager",
      description: "Access NAV financing for your private equity fund",
      features: [
        "Self-service onboarding",
        "AI document extraction from fund docs",
        "Real-time facility status tracking",
        "Secure document vault",
        "Direct lender communication",
      ],
    },
  ];

  const handleSelectRole = () => {
    if (selectedRole) {
      updateRoleMutation.mutate(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">AN</span>
            </div>
            <h1 className="text-3xl font-bold">AlphaNAV</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-2" data-testid="heading-role-selection">
            Welcome, {user?.firstName || user?.email}
          </h2>
          <p className="text-muted-foreground">
            Select your role to get started with AlphaNAV
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            
            return (
              <Card
                key={role.value}
                className={`cursor-pointer transition-all hover-elevate ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedRole(role.value)}
                data-testid={`card-role-${role.value}`}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-4 ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">✓</span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleSelectRole}
            disabled={!selectedRole || updateRoleMutation.isPending}
            data-testid="button-confirm-role"
          >
            {updateRoleMutation.isPending ? "Setting up..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
