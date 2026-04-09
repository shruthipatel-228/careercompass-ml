import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: employee } = useQuery({
    queryKey: ["my-employee", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: tasks } = useQuery({
    queryKey: ["my-tasks", employee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", employee!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!employee,
  });

  const completed = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const pending = tasks?.filter((t) => t.status === "pending").length ?? 0;
  const inProgress = tasks?.filter((t) => t.status === "in_progress").length ?? 0;

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-performance-good text-success-foreground";
      case "in_progress": return "bg-primary text-primary-foreground";
      case "pending": return "bg-performance-average text-warning-foreground";
      case "overdue": return "bg-performance-poor text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {employee?.full_name ?? "Employee"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{completed}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{inProgress}</div></CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{pending}</div></CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!tasks?.length ? (
            <p className="text-muted-foreground text-center py-8">No tasks assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    {task.due_date && <p className="text-xs text-muted-foreground mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>}
                  </div>
                  <Badge className={statusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
