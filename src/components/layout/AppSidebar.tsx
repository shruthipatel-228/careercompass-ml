import {
  BarChart3, Users, ClipboardList, TrendingUp, Settings,
  Home, UserPlus, Building2, Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { hasRole } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ["admin", "hr", "manager", "employee"] as const },
    { title: "Employees", url: "/employees", icon: Users, roles: ["admin", "hr", "manager"] as const },
    { title: "Register Employee", url: "/register-employee", icon: UserPlus, roles: ["admin", "hr", "manager"] as const },
    { title: "Tasks", url: "/tasks", icon: ClipboardList, roles: ["admin", "hr", "manager", "employee"] as const },
    { title: "Predictions", url: "/predictions", icon: TrendingUp, roles: ["admin", "hr", "manager"] as const },
    { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["admin", "hr"] as const },
    { title: "Departments", url: "/departments", icon: Building2, roles: ["admin"] as const },
    { title: "User Management", url: "/user-management", icon: Shield, roles: ["admin"] as const },
    { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] as const },
  ];

  const visibleItems = navItems.filter((item) => item.roles.some((r) => hasRole(r)));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 px-4 py-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-sidebar-primary" />
                <span className="font-bold text-sidebar-foreground">EPP System</span>
              </div>
            )}
            {collapsed && <BarChart3 className="h-5 w-5 text-sidebar-primary mx-auto" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
