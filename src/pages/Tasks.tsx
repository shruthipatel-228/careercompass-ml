import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

export default function Tasks() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium" as string, due_date: "" });

  const isEmployee = !hasRole("admin") && !hasRole("hr") && !hasRole("manager");

  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id, full_name").order("full_name");
      return data ?? [];
    },
    enabled: !isEmployee,
  });

  const { data: myEmployee } = useQuery({
    queryKey: ["my-emp", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: isEmployee && !!user,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", isEmployee, myEmployee?.id],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*, employees!tasks_assigned_to_fkey(full_name)").order("created_at", { ascending: false });
      if (isEmployee && myEmployee) {
        q = q.eq("assigned_to", myEmployee.id);
      }
      const { data } = await q;
      return data ?? [];
    },
    enabled: isEmployee ? !!myEmployee : true,
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        title: form.title,
        description: form.description || null,
        assigned_to: form.assigned_to,
        assigned_by: user!.id,
        priority: form.priority as any,
        due_date: form.due_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setOpen(false);
      setForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
    },
    onError: (err: any) => toast.error("Error", { description: err.message }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-performance-good text-success-foreground";
      case "in_progress": return "bg-primary text-primary-foreground";
      case "pending": return "bg-performance-average text-warning-foreground";
      case "overdue": return "bg-performance-poor text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "bg-performance-poor text-destructive-foreground";
      case "high": return "bg-performance-average text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">{isEmployee ? "Your assigned tasks" : "Manage and assign tasks"}</p>
          </div>
          {!isEmployee && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Assign Task</Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createTask.mutate(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Assign To *</Label>
                    <Select value={form.assigned_to} onValueChange={(v) => setForm((p) => ({ ...p, assigned_to: v }))}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Priority</Label>
                      <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Due Date</Label>
                      <Input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="bg-background" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createTask.isPending}>
                    {createTask.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !tasks?.length ? (
              <div className="text-center py-8 text-muted-foreground">No tasks found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      {!isEmployee && <TableHead>Assigned To</TableHead>}
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                          </div>
                        </TableCell>
                        {!isEmployee && <TableCell className="text-muted-foreground">{(task.employees as any)?.full_name ?? "N/A"}</TableCell>}
                        <TableCell><Badge className={priorityColor(task.priority)}>{task.priority}</Badge></TableCell>
                        <TableCell><Badge className={statusColor(task.status)}>{task.status.replace("_", " ")}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          {isEmployee && task.status !== "completed" ? (
                            <div className="flex gap-1">
                              {task.status === "pending" && (
                                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: task.id, status: "in_progress" })}>
                                  Start
                                </Button>
                              )}
                              <Button size="sm" variant="default" onClick={() => updateStatus.mutate({ id: task.id, status: "completed" })}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Complete
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">View only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
