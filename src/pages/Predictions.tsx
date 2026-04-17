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
      const { data, error } = await supabase.functions.invoke("predict-performance", {
        body: { employee_id: employeeId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { prediction_class: string; confidence_score: number; reasoning: string };
    },
    onSuccess: (result) => {
      toast.success(`AI Prediction: ${result.prediction_class.toUpperCase()}`, {
        description: `${result.reasoning} (Confidence: ${result.confidence_score.toFixed(1)}%)`,
      });
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
    onError: (err: any) => toast.error("Prediction failed", { description: err.message }),
  });

  const predictAll = useMutation({
    mutationFn: async () => {
      const { data: allEmployees } = await supabase.from("employees").select("id").eq("is_active", true);
      if (!allEmployees?.length) throw new Error("No active employees");
      for (const emp of allEmployees) {
        await predictMutation.mutateAsync(emp.id);
        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 500));
      }
    },
    onSuccess: () => toast.success("All AI predictions completed"),
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
          <p className="text-muted-foreground">AI-powered classification using Lovable AI (Google Gemini) — Good / Average / Poor</p>
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
