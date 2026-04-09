import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { HRDashboard } from "@/components/dashboards/HRDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { EmployeeDashboard } from "@/components/dashboards/EmployeeDashboard";

export default function Dashboard() {
  const { hasRole } = useAuth();

  const renderDashboard = () => {
    if (hasRole("admin")) return <AdminDashboard />;
    if (hasRole("hr")) return <HRDashboard />;
    if (hasRole("manager")) return <ManagerDashboard />;
    return <EmployeeDashboard />;
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
}
