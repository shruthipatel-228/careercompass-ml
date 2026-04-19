import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, roles } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-foreground" />
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {roles[0] ?? "User"} Portal
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
