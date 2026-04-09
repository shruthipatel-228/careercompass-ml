import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import RegisterEmployee from "./pages/RegisterEmployee";
import Tasks from "./pages/Tasks";
import Predictions from "./pages/Predictions";
import Analytics from "./pages/Analytics";
import Departments from "./pages/Departments";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute allowedRoles={["admin", "hr", "manager"]}><Employees /></ProtectedRoute>} />
            <Route path="/register-employee" element={<ProtectedRoute allowedRoles={["admin", "hr", "manager"]}><RegisterEmployee /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/predictions" element={<ProtectedRoute allowedRoles={["admin", "hr", "manager"]}><Predictions /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin", "hr"]}><Analytics /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute allowedRoles={["admin"]}><Departments /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={["admin"]}><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
