import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function RegisterEmployee() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", department_id: "", job_role: "",
    working_hours_per_week: "40", training_hours: "0",
    satisfaction_score: "5", years_of_experience: "0",
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await supabase.from("departments").select("*").order("name");
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.from("employees").insert({
        full_name: form.full_name,
        email: form.email,
        department_id: form.department_id || null,
        job_role: form.job_role,
        working_hours_per_week: parseFloat(form.working_hours_per_week),
        training_hours: parseFloat(form.training_hours),
        satisfaction_score: parseFloat(form.satisfaction_score),
        years_of_experience: parseFloat(form.years_of_experience),
      });
      if (error) throw error;
      toast.success("Success", { description: "Employee registered successfully" });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setForm({ full_name: "", email: "", department_id: "", job_role: "", working_hours_per_week: "40", training_hours: "0", satisfaction_score: "5", years_of_experience: "0" });
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Register Employee</h1>
          <p className="text-muted-foreground">Add a new employee to the system</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Department</Label>
                  <Select value={form.department_id} onValueChange={(v) => updateField("department_id", v)}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Job Role *</Label>
                  <Input value={form.job_role} onChange={(e) => updateField("job_role", e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Working Hours/Week</Label>
                  <Input type="number" min="0" max="80" value={form.working_hours_per_week} onChange={(e) => updateField("working_hours_per_week", e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Training Hours</Label>
                  <Input type="number" min="0" value={form.training_hours} onChange={(e) => updateField("training_hours", e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Satisfaction Score (0-10)</Label>
                  <Input type="number" min="0" max="10" step="0.1" value={form.satisfaction_score} onChange={(e) => updateField("satisfaction_score", e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Years of Experience</Label>
                  <Input type="number" min="0" step="0.5" value={form.years_of_experience} onChange={(e) => updateField("years_of_experience", e.target.value)} className="bg-background" />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Registering..." : "Register Employee"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
