import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, ClipboardList, UserCheck, Award, AlertTriangle } from "lucide-react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { Progress } from "@/components/ui/progress";

export function HRDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["hr-stats"],
    queryFn: async () => {
      const [employees, tasks, predictions] = await Promise.all([
        supabase.from("employees").select("id, is_active, satisfaction_score"),
        supabase.from("tasks").select("id, status"),
        supabase.from("performance_predictions").select("prediction_class, overall_score"),
      ]);
      return {
        employees: employees.data ?? [],
        tasks: tasks.data ?? [],
        predictions: predictions.data ?? [],
      };
    },
  });

  const totalEmployees = stats?.employees.length ?? 0;
  const activeEmployees = stats?.employees.filter((e) => e.is_active).length ?? 0;
  const completedTasks = stats?.tasks.filter((t) => t.status === "completed").length ?? 0;
  const totalPredictions = stats?.predictions.length ?? 0;

  const predictionCounts = {
    good: stats?.predictions.filter((p) => p.prediction_class === "good").length ?? 0,
    average: stats?.predictions.filter((p) => p.prediction_class === "average").length ?? 0,
    poor: stats?.predictions.filter((p) => p.prediction_class === "poor").length ?? 0,
  };

  const above50 = stats?.predictions.filter((p) => (p.overall_score ?? 0) > 50).length ?? 0;
  const below50 = totalPredictions - above50;
  const above50Pct = totalPredictions > 0 ? Math.round((above50 / totalPredictions) * 100) : 0;

  const avgSatisfaction = totalEmployees > 0
    ? (stats!.employees.reduce((sum, e) => sum + (e.satisfaction_score ?? 0), 0) / totalEmployees).toFixed(1)
    : "0";

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
          <CardContent><div className="text-3xl font-bold text-foreground">{totalEmployees}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle>
            <UserCheck className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{activeEmployees}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            <ClipboardList className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{completedTasks}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Satisfaction</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{avgSatisfaction}<span className="text-sm text-muted-foreground">/10</span></div></CardContent>
        </Card>
      </div>

      {/* Score Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-foreground">Score Breakdown</CardTitle>
            <Award className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-performance-good" />
                <span className="text-sm text-foreground">Above 50% Score</span>
              </div>
              <span className="text-lg font-bold text-foreground">{above50} <span className="text-xs text-muted-foreground">({above50Pct}%)</span></span>
            </div>
            <Progress value={above50Pct} className="h-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-performance-poor" />
                <span className="text-sm text-foreground">Below 50% Score</span>
              </div>
              <span className="text-lg font-bold text-foreground">{below50} <span className="text-xs text-muted-foreground">({totalPredictions > 0 ? 100 - above50Pct : 0}%)</span></span>
            </div>
            <Progress value={totalPredictions > 0 ? 100 - above50Pct : 0} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={predictionCounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
