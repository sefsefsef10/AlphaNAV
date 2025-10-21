import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, BarChart3 } from "lucide-react";

export default function ProfileSelection() {
  const [, setLocation] = useLocation();

  const handleRoleSelection = (role: string, path: string) => {
    localStorage.setItem("userRole", role);
    setLocation(path);
  };

  const roles = [
    {
      id: "advisor",
      title: "Advisor / Placement Agent",
      description: "Manage competitive RFP processes across multiple lenders for your GP clients",
      icon: Users,
      path: "/advisor",
      features: [
        "Submit multi-lender RFPs",
        "Anonymized deal flow",
        "Term sheet comparison",
        "Commission tracking (50-75 bps)"
      ],
      testId: "card-role-advisor"
    },
    {
      id: "gp",
      title: "GP / Fund Manager",
      description: "Self-onboard and access NAV financing directly for your PE fund",
      icon: Building2,
      path: "/onboarding",
      features: [
        "Direct self-onboarding",
        "Automated eligibility scoring",
        "Conservative 5-15% LTV",
        "Growth-focused facilities"
      ],
      testId: "card-role-gp"
    },
    {
      id: "lender",
      title: "NAV IQ Capital Team",
      description: "Internal operations dashboard for underwriting, monitoring, and reporting",
      icon: BarChart3,
      path: "/deal-pipeline",
      features: [
        "Deal pipeline management",
        "Underwriting workflows",
        "Portfolio monitoring",
        "Reporting & analytics"
      ],
      testId: "card-role-lender"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">AN</span>
            </div>
            <h1 className="text-4xl font-bold">AlphaNAV</h1>
          </div>
          <p className="text-xl text-muted-foreground">NAV Lending Operations Platform</p>
          <p className="text-sm text-muted-foreground mt-2">Select your profile to get started</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card 
                key={role.id} 
                className="hover-elevate cursor-pointer group"
                onClick={() => handleRoleSelection(role.id, role.path)}
                data-testid={role.testId}
              >
                <CardHeader className="space-y-0 pb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm pt-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    data-testid={`button-select-${role.id}`}
                  >
                    Continue as {role.title.split(" / ")[0]}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Serving lower-middle market PE funds ($100M-$500M AUM) • Conservative 5-15% LTV • ILPA-aligned
          </p>
        </div>
      </div>
    </div>
  );
}
