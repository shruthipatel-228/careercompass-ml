import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Building2 } from "lucide-react";

export default function Departments() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await supabase.from("departments").select("*").order("name");
      return data ?? [];
    },
  });

  const createDept = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("departments").insert({ name, description: description || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Department created");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (err: any) => toast.error("Error", { description: err.message }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground">Manage company departments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Department</Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">New Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createDept.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-background" />
                </div>
                <Button type="submit" className="w-full" disabled={createDept.isPending}>
                  {createDept.isPending ? "Creating..." : "Create Department"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !departments?.length ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No departments yet. Create one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground">{d.description ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
