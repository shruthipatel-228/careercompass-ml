import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, UserPlus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("employee");

  // Fetch all profiles and roles separately, then merge
  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id),
      }));
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const { data: { session: adminSession } } = await supabase.auth.getSession();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const newUserId = authData.user.id;

      if (adminSession) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }

      const { error: roleError } = await supabase.rpc("admin_assign_role", {
        _user_id: newUserId,
        _role: role,
      });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      toast.success("User created", { description: `${fullName} has been registered as ${role}` });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setOpen(false);
      setEmail(""); setPassword(""); setFullName(""); setRole("employee");
    },
    onError: (err: any) => toast.error("Error", { description: err.message }),
  });

  // Assign role to an existing user who has no role
  const assignRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase.rpc("admin_assign_role", {
        _user_id: userId,
        _role: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (err: any) => toast.error("Error", { description: err.message }),
  });

  const roleColor = (r: string) => {
    switch (r) {
      case "admin": return "bg-performance-poor text-destructive-foreground";
      case "hr": return "bg-primary text-primary-foreground";
      case "manager": return "bg-performance-average text-warning-foreground";
      case "employee": return "bg-performance-good text-success-foreground";
      default: return "bg-muted";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Create accounts and assign roles (Admin, HR, Manager, Employee)</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" /> Create User</Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Full Name *</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Password *</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Role *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createUser.isPending}>
                  {createUser.isPending ? "Creating..." : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5" /> All Registered Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !users?.length ? (
              <div className="text-center py-8 text-muted-foreground">No users registered yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-foreground">{u.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        {u.role ? (
                          <Badge className={roleColor(u.role.role)}>{u.role.role.toUpperCase()}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">No Role</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!u.role && (
                          <Select onValueChange={(v) => assignRole.mutate({ userId: u.user_id, newRole: v as AppRole })}>
                            <SelectTrigger className="w-32 h-8 bg-background">
                              <SelectValue placeholder="Assign role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hr">HR</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
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
