import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Building2, TrendingUp, Award, AlertTriangle, BarChart3 } from "lucide-react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { Progress } from "@/components/ui/progress";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [employees, tasks, departments, predictions] = await Promise.all([
        supabase.from("employees").select("id, is_active, satisfaction_score, training_hours, working_hours_per_week, years_of_experience"),
        supabase.from("tasks").select("id, status"),
        supabase.from("departments").select("id", { count: "exact" }),
        supabase.from("performance_predictions").select("prediction_class, overall_score, confidence_score"),
      ]);
      return {
        employees: employees.data ?? [],
        tasks: tasks.data ?? [],
        totalDepartments: departments.count ?? 0,
        predictions: predictions.data ?? [],
      };
    },
  });

  const totalEmployees = stats?.employees.length ?? 0;
  const activeEmployees = stats?.employees.filter((e) => e.is_active).length ?? 0;
  const totalTasks = stats?.tasks.length ?? 0;
  const completedTasks = stats?.tasks.filter((t) => t.status === "completed").length ?? 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const predictionCounts = {
    good: stats?.predictions.filter((p) => p.prediction_class === "good").length ?? 0,
    average: stats?.predictions.filter((p) => p.prediction_class === "average").length ?? 0,
    poor: stats?.predictions.filter((p) => p.prediction_class === "poor").length ?? 0,
  };

  const totalPredictions = stats?.predictions.length ?? 0;
  const above50 = stats?.predictions.filter((p) => (p.overall_score ?? 0) > 50).length ?? 0;
  const below50 = totalPredictions - above50;
  const above50Pct = totalPredictions > 0 ? Math.round((above50 / totalPredictions) * 100) : 0;

  const avgSatisfaction = totalEmployees > 0
    ? (stats!.employees.reduce((sum, e) => sum + (e.satisfaction_score ?? 0), 0) / totalEmployees).toFixed(1)
    : "0";

  const avgTrainingHours = totalEmployees > 0
    ? Math.round(stats!.employees.reduce((sum, e) => sum + (e.training_hours ?? 0), 0) / totalEmployees)
    : 0;

  const highConfidence = stats?.predictions.filter((p) => p.confidence_score >= 0.8).length ?? 0;

  const statCards = [
    { title: "Total Employees", value: totalEmployees, icon: Users, color: "text-primary" },
    { title: "Active Employees", value: activeEmployees, icon: Users, color: "text-success" },
    { title: "Departments", value: stats?.totalDepartments ?? 0, icon: Building2, color: "text-warning" },
    { title: "Predictions Made", value: totalPredictions, icon: TrendingUp, color: "text-destructive" },
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

      {/* Performance Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Above 50% Score</CardTitle>
            <Award className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{above50}<span className="text-sm text-muted-foreground ml-1">/ {totalPredictions}</span></div>
            <Progress value={above50Pct} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{above50Pct}% of employees above threshold</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Below 50% Score</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{below50}<span className="text-sm text-muted-foreground ml-1">/ {totalPredictions}</span></div>
            <Progress value={totalPredictions > 0 ? Math.round((below50 / totalPredictions) * 100) : 0} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">Need improvement or training</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Key Metrics</CardTitle>
            <BarChart3 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Task Completion</span>
              <span className="font-medium text-foreground">{taskCompletionRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Satisfaction</span>
              <span className="font-medium text-foreground">{avgSatisfaction}/10</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Training Hours</span>
              <span className="font-medium text-foreground">{avgTrainingHours}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">High Confidence</span>
              <span className="font-medium text-foreground">{highConfidence} predictions</span>
            </div>
          </CardContent>
        </Card>
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
              { label: "Good Performers", count: predictionCounts.good, pct: totalPredictions > 0 ? Math.round((predictionCounts.good / totalPredictions) * 100) : 0, cls: "bg-performance-good" },
              { label: "Average Performers", count: predictionCounts.average, pct: totalPredictions > 0 ? Math.round((predictionCounts.average / totalPredictions) * 100) : 0, cls: "bg-performance-average" },
              { label: "Poor Performers", count: predictionCounts.poor, pct: totalPredictions > 0 ? Math.round((predictionCounts.poor / totalPredictions) * 100) : 0, cls: "bg-performance-poor" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.cls}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.count} ({item.pct}%)</span>
                </div>
                <Progress value={item.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
