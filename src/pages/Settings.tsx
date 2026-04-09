import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">System configuration</p>
        </div>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" /> System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">System</span>
              <span className="font-medium text-foreground">Employee Performance Prediction</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">ML Model</span>
              <span className="font-medium text-foreground">Weighted Decision Tree Classifier</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Classification</span>
              <span className="font-medium text-foreground">3-Class (Good, Average, Poor)</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Features Used</span>
              <span className="font-medium text-foreground">5 (Working Hours, Training, Satisfaction, Tasks, Experience)</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Authentication</span>
              <span className="font-medium text-foreground">Role-Based (Admin, HR, Manager, Employee)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
