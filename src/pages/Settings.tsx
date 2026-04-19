import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, ChevronDown, Info } from "lucide-react";

export default function Settings() {
  const [open, setOpen] = useState(false);

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
              <SettingsIcon className="h-5 w-5" /> About System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Employee Performance Prediction (EPP) System — an AI-powered platform that
              analyzes employee data to classify performance and support HR decisions.
            </p>

            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {open ? "Hide Model Details" : "View Model Details"}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-3">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">System</span>
                  <span className="font-medium text-foreground">Employee Performance Prediction</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">ML Model</span>
                  <span className="font-medium text-foreground">Google Gemini (AI Gateway)</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Classification</span>
                  <span className="font-medium text-foreground">3-Class (Good, Average, Poor)</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Features Used</span>
                  <span className="font-medium text-foreground text-right text-sm">Working Hours, Training, Satisfaction, Tasks, Experience, Tenure</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Authentication</span>
                  <span className="font-medium text-foreground">Role-Based (Admin, HR, Manager, Employee)</span>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
