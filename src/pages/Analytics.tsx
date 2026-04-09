import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Analytics() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [employees, tasks, predictions] = await Promise.all([
        supabase.from("employees").select("*, departments(name)"),
        supabase.from("tasks").select("*"),
        supabase.from("performance_predictions").select("*, employees(department_id, departments(name))"),
      ]);
      return {
        employees: employees.data ?? [],
        tasks: tasks.data ?? [],
        predictions: predictions.data ?? [],
      };
    },
  });

  const predictionCounts = {
    good: data?.predictions.filter((p) => p.prediction_class === "good").length ?? 0,
    average: data?.predictions.filter((p) => p.prediction_class === "average").length ?? 0,
    poor: data?.predictions.filter((p) => p.prediction_class === "poor").length ?? 0,
  };

  // Department-wise stats
  const deptMap = new Map<string, { name: string; employees: number; avgSatisfaction: number; avgCompletion: number }>();
  data?.employees.forEach((emp) => {
    const deptName = (emp.departments as any)?.name ?? "Unassigned";
    const existing = deptMap.get(deptName) ?? { name: deptName, employees: 0, avgSatisfaction: 0, avgCompletion: 0 };
    existing.employees++;
    existing.avgSatisfaction += (emp.satisfaction_score ?? 0);
    deptMap.set(deptName, existing);
  });

  const deptChartData = Array.from(deptMap.values()).map((d) => ({
    name: d.name,
    employees: d.employees,
    avgSatisfaction: d.employees > 0 ? Math.round((d.avgSatisfaction / d.employees) * 10) / 10 : 0,
  }));

  // Task stats
  const taskStats = [
    { name: "Pending", value: data?.tasks.filter((t) => t.status === "pending").length ?? 0 },
    { name: "In Progress", value: data?.tasks.filter((t) => t.status === "in_progress").length ?? 0 },
    { name: "Completed", value: data?.tasks.filter((t) => t.status === "completed").length ?? 0 },
    { name: "Overdue", value: data?.tasks.filter((t) => t.status === "overdue").length ?? 0 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive performance analytics and insights</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-foreground">Performance Distribution</CardTitle></CardHeader>
            <CardContent><PerformanceChart data={predictionCounts} /></CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><CardTitle className="text-foreground">Task Status Overview</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border md:col-span-2">
            <CardHeader><CardTitle className="text-foreground">Department Overview</CardTitle></CardHeader>
            <CardContent>
              {!deptChartData.length ? (
                <p className="text-center py-8 text-muted-foreground">No department data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="employees" fill="hsl(var(--primary))" name="Employees" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgSatisfaction" fill="hsl(var(--chart-good))" name="Avg Satisfaction" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
