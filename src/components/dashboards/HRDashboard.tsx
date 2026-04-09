import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, ClipboardList, UserCheck } from "lucide-react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";

export function HRDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["hr-stats"],
    queryFn: async () => {
      const [employees, tasks, predictions] = await Promise.all([
        supabase.from("employees").select("id, is_active"),
        supabase.from("tasks").select("id, status"),
        supabase.from("performance_predictions").select("prediction_class"),
      ]);
      return {
        totalEmployees: employees.data?.length ?? 0,
        activeEmployees: employees.data?.filter((e) => e.is_active).length ?? 0,
        completedTasks: tasks.data?.filter((t) => t.status === "completed").length ?? 0,
        predictions: predictions.data ?? [],
      };
    },
  });

  const predictionCounts = {
    good: stats?.predictions.filter((p) => p.prediction_class === "good").length ?? 0,
    average: stats?.predictions.filter((p) => p.prediction_class === "average").length ?? 0,
    poor: stats?.predictions.filter((p) => p.prediction_class === "poor").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Dashboard</h1>
        <p className="text-muted-foreground">Employee overview and performance insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{stats?.totalEmployees ?? 0}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle>
            <UserCheck className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{stats?.activeEmployees ?? 0}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            <ClipboardList className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{stats?.completedTasks ?? 0}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Predictions</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{stats?.predictions.length ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Performance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={predictionCounts} />
        </CardContent>
      </Card>
    </div>
  );
}
