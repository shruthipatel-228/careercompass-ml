import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Employees() {
  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("*, departments(name)")
        .order("full_name");
      return data ?? [];
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">View and manage all registered employees</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Employee Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !employees?.length ? (
              <div className="text-center py-8 text-muted-foreground">No employees registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Job Role</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Working Hrs/Week</TableHead>
                      <TableHead>Training Hrs</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium text-foreground">{emp.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                        <TableCell className="text-muted-foreground">{(emp.departments as any)?.name ?? "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.job_role}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.years_of_experience} yrs</TableCell>
                        <TableCell className="text-muted-foreground">{emp.working_hours_per_week}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.training_hours}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.satisfaction_score}/10</TableCell>
                        <TableCell>
                          <Badge variant={emp.is_active ? "default" : "secondary"}>
                            {emp.is_active ? "Active" : "Inactive"}
                          </Badge>
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
