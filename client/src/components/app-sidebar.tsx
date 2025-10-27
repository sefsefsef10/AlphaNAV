import { LayoutDashboard, GitBranch, FileText, Scale, TrendingUp, Activity, DollarSign, GraduationCap, Settings, Users, Target, Building2, BarChart3, Upload, Building, Database } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const operationsNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Prospects",
    url: "/operations/prospects",
    icon: Building2,
  },
  {
    title: "Deal Pipeline",
    url: "/deal-pipeline",
    icon: GitBranch,
  },
  {
    title: "Underwriting",
    url: "/operations/underwriting",
    icon: FileText,
  },
  {
    title: "Facilities",
    url: "/operations/facilities",
    icon: DollarSign,
  },
  {
    title: "Covenant Monitoring",
    url: "/operations/covenant-monitoring",
    icon: Activity,
  },
  {
    title: "AI Accuracy",
    url: "/operations/accuracy-metrics",
    icon: Target,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Portfolio",
    url: "/portfolio",
    icon: DollarSign,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: TrendingUp,
  },
  {
    title: "Legal Templates",
    url: "/legal",
    icon: Scale,
  },
  {
    title: "Batch Upload",
    url: "/operations/batch-upload",
    icon: Upload,
  },
  {
    title: "Portfolio Companies",
    url: "/operations/portfolio-companies",
    icon: Building,
  },
  {
    title: "Lender Directory",
    url: "/operations/lender-directory",
    icon: Building2,
  },
  {
    title: "Market Intelligence",
    url: "/operations/market-intelligence",
    icon: Database,
  },
];

const advisorNavItems = [
  {
    title: "Dashboard",
    url: "/advisor",
    icon: LayoutDashboard,
  },
  {
    title: "Active RFPs",
    url: "/advisor/active-rfps",
    icon: Target,
  },
  {
    title: "My Clients",
    url: "/advisor/clients",
    icon: Users,
  },
];

const externalNavItems = [
  {
    title: "LP Enablement",
    url: "/lp-enablement",
    icon: GraduationCap,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const isAdvisorFlow = location.startsWith("/advisor");
  
  const navItems = isAdvisorFlow ? advisorNavItems : operationsNavItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">AN</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold">AlphaNAV</h2>
            <p className="text-xs text-muted-foreground">
              {isAdvisorFlow ? "Advisor Portal" : "NAV Lending"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isAdvisorFlow ? "Advisor" : "Operations"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>External</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {externalNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings" data-testid="link-settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
