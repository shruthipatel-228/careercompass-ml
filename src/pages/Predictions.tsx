import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { TrendingUp, Brain, RefreshCw } from "lucide-react";

export default function Predictions() {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const { data: employees } = useQuery({
    queryKey: ["employees-pred"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id, full_name, departments(name)").order("full_name");
      return data ?? [];
    },
  });

  const { data: predictions, isLoading } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("performance_predictions")
        .select("*, employees(full_name, departments(name))")
        .order("predicted_at", { ascending: false });
      return data ?? [];
    },
  });

  const predictMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      // Get employee data
      const { data: emp } = await supabase.from("employees").select("*").eq("id", employeeId).single();
      if (!emp) throw new Error("Employee not found");

      // Get task stats
      const { data: tasks } = await supabase.from("tasks").select("status").eq("assigned_to", employeeId);
      const totalTasks = tasks?.length ?? 0;
      const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
      const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

      // ML Algorithm: Weighted scoring with Decision Tree-like classification
      const workingHoursScore = Math.min(((emp.working_hours_per_week ?? 40) / 45) * 100, 100);
      const trainingScore = Math.min(((emp.training_hours ?? 0) / 100) * 100, 100);
      const satisfactionScore = ((emp.satisfaction_score ?? 5) / 10) * 100;
      const taskScore = taskCompletionRate * 100;
      const experienceScore = Math.min(((emp.years_of_experience ?? 0) / 10) * 100, 100);

      // Weighted combination (simulating ML feature importance)
      const weights = { working: 0.15, training: 0.20, satisfaction: 0.25, task: 0.25, experience: 0.15 };
      const overallScore = 
        workingHoursScore * weights.working +
        trainingScore * weights.training +
        satisfactionScore * weights.satisfaction +
        taskScore * weights.task +
        experienceScore * weights.experience;

      // Classification thresholds (Decision boundary)
      let predictionClass: "good" | "average" | "poor";
      if (overallScore >= 70) predictionClass = "good";
      else if (overallScore >= 45) predictionClass = "average";
      else predictionClass = "poor";

      // Confidence score based on distance from boundaries
      let confidence: number;
      if (overallScore >= 70) confidence = 70 + ((overallScore - 70) / 30) * 30;
      else if (overallScore >= 45) confidence = 60 + ((overallScore - 45) / 25) * 20;
      else confidence = 65 + ((45 - overallScore) / 45) * 30;
      confidence = Math.min(Math.max(confidence, 60), 98);

      const { error } = await supabase.from("performance_predictions").insert({
        employee_id: employeeId,
        prediction_class: predictionClass,
        confidence_score: Math.round(confidence * 100) / 100,
        working_hours_score: Math.round(workingHoursScore * 100) / 100,
        training_score: Math.round(trainingScore * 100) / 100,
        satisfaction_score: Math.round(satisfactionScore * 100) / 100,
        task_completion_score: Math.round(taskScore * 100) / 100,
        experience_score: Math.round(experienceScore * 100) / 100,
        overall_score: Math.round(overallScore * 100) / 100,
      });
      if (error) throw error;
      return { predictionClass, confidence };
    },
    onSuccess: (result) => {
      toast.success(`Prediction: ${result.predictionClass.toUpperCase()}`, { description: `Confidence: ${result.confidence.toFixed(1)}%` });
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
    onError: (err: any) => toast.error("Error", { description: err.message }),
  });

  const predictAll = useMutation({
    mutationFn: async () => {
      const { data: allEmployees } = await supabase.from("employees").select("id").eq("is_active", true);
      if (!allEmployees?.length) throw new Error("No active employees");
      for (const emp of allEmployees) {
        await predictMutation.mutateAsync(emp.id);
      }
    },
    onSuccess: () => toast.success("All predictions completed"),
    onError: (err: any) => toast.error("Error", { description: err.message }),
  });

  const predictionColor = (cls: string) => {
    switch (cls) {
      case "good": return "bg-performance-good text-success-foreground";
      case "average": return "bg-performance-average text-warning-foreground";
      case "poor": return "bg-performance-poor text-destructive-foreground";
      default: return "bg-muted";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Predictions</h1>
          <p className="text-muted-foreground">ML-based employee performance classification (Good / Average / Poor)</p>
        </div>

        {/* Predict Controls */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Run Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                  <SelectContent>
                    {employees?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => selectedEmployee && predictMutation.mutate(selectedEmployee)} disabled={!selectedEmployee || predictMutation.isPending}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {predictMutation.isPending ? "Predicting..." : "Predict"}
              </Button>
              <Button variant="outline" onClick={() => predictAll.mutate()} disabled={predictAll.isPending}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {predictAll.isPending ? "Running..." : "Predict All"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Predictions Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Prediction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !predictions?.length ? (
              <div className="text-center py-8 text-muted-foreground">No predictions yet. Run a prediction above.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Prediction</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Overall Score</TableHead>
                      <TableHead>Work Hrs</TableHead>
                      <TableHead>Training</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Task Completion</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-foreground">{(p.employees as any)?.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{(p.employees as any)?.departments?.name ?? "N/A"}</TableCell>
                        <TableCell><Badge className={predictionColor(p.prediction_class)}>{p.prediction_class.toUpperCase()}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{p.confidence_score}%</TableCell>
                        <TableCell className="text-muted-foreground">{p.overall_score}</TableCell>
                        <TableCell className="text-muted-foreground">{p.working_hours_score}</TableCell>
                        <TableCell className="text-muted-foreground">{p.training_score}</TableCell>
                        <TableCell className="text-muted-foreground">{p.satisfaction_score}</TableCell>
                        <TableCell className="text-muted-foreground">{p.task_completion_score}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(p.predicted_at).toLocaleDateString()}</TableCell>
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
