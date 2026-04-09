import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, CheckCircle, AlertCircle, Award, TrendingUp } from "lucide-react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { Progress } from "@/components/ui/progress";

export function ManagerDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["manager-stats"],
    queryFn: async () => {
      const [employees, tasks, predictions] = await Promise.all([
        supabase.from("employees").select("id, satisfaction_score"),
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

  const teamSize = stats?.employees.length ?? 0;
  const totalTasks = stats?.tasks.length ?? 0;
  const completedTasks = stats?.tasks.filter((t) => t.status === "completed").length ?? 0;
  const pendingTasks = stats?.tasks.filter((t) => t.status === "pending").length ?? 0;
  const totalPredictions = stats?.predictions.length ?? 0;

  const predictionCounts = {
    good: stats?.predictions.filter((p) => p.prediction_class === "good").length ?? 0,
    average: stats?.predictions.filter((p) => p.prediction_class === "average").length ?? 0,
    poor: stats?.predictions.filter((p) => p.prediction_class === "poor").length ?? 0,
  };

  const above50 = stats?.predictions.filter((p) => (p.overall_score ?? 0) > 50).length ?? 0;
  const above50Pct = totalPredictions > 0 ? Math.round((above50 / totalPredictions) * 100) : 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-muted-foreground">Manage your team and track task progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{teamSize}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <ClipboardList className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{totalTasks}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{completedTasks}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{pendingTasks}</div></CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Above 50% Score</CardTitle>
            <Award className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{above50}<span className="text-sm text-muted-foreground ml-1">/ {totalPredictions}</span></div>
            <Progress value={above50Pct} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{above50Pct}% performing well</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Task Completion Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{taskCompletionRate}%</div>
            <Progress value={taskCompletionRate} className="mt-2 h-2" />
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
