import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Building2, TrendingUp } from "lucide-react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [employees, tasks, departments, predictions] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact" }),
        supabase.from("tasks").select("id", { count: "exact" }),
        supabase.from("departments").select("id", { count: "exact" }),
        supabase.from("performance_predictions").select("prediction_class"),
      ]);
      return {
        totalEmployees: employees.count ?? 0,
        totalTasks: tasks.count ?? 0,
        totalDepartments: departments.count ?? 0,
        predictions: predictions.data ?? [],
      };
    },
  });

  const predictionCounts = {
    good: stats?.predictions.filter((p) => p.prediction_class === "good").length ?? 0,
    average: stats?.predictions.filter((p) => p.prediction_class === "average").length ?? 0,
    poor: stats?.predictions.filter((p) => p.prediction_class === "poor").length ?? 0,
  };

  const statCards = [
    { title: "Total Employees", value: stats?.totalEmployees ?? 0, icon: Users, color: "text-primary" },
    { title: "Total Tasks", value: stats?.totalTasks ?? 0, icon: ClipboardList, color: "text-warning" },
    { title: "Departments", value: stats?.totalDepartments ?? 0, icon: Building2, color: "text-success" },
    { title: "Predictions Made", value: stats?.predictions.length ?? 0, icon: TrendingUp, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Complete overview of the Employee Performance Prediction System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.title} className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={predictionCounts} />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Good Performers", count: predictionCounts.good, cls: "bg-performance-good" },
              { label: "Average Performers", count: predictionCounts.average, cls: "bg-performance-average" },
              { label: "Poor Performers", count: predictionCounts.poor, cls: "bg-performance-poor" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.cls}`} />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <span className="text-lg font-semibold text-foreground">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
