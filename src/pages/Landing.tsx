import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Brain, Shield, Users, TrendingUp, ClipboardList, ArrowRight } from "lucide-react";

export default function Landing() {
  const features = [
    { icon: Brain, title: "AI-Powered Predictions", desc: "Classify employee performance using Google Gemini AI." },
    { icon: Users, title: "Team Management", desc: "Manage employees, departments and assignments easily." },
    { icon: ClipboardList, title: "Task Tracking", desc: "Assign, track and complete tasks across your organization." },
    { icon: TrendingUp, title: "Analytics Dashboard", desc: "Visualize performance trends and key metrics in real time." },
    { icon: Shield, title: "Role-Based Access", desc: "Admin, HR, Manager and Employee roles with secure permissions." },
    { icon: BarChart3, title: "Smart Reporting", desc: "Comprehensive reports for data-driven HR decisions." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">EPP System</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login?tab=signin"><Button variant="ghost">Sign In</Button></Link>
            <Link to="/login?tab=signup"><Button>Sign Up</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Brain className="h-4 w-4" /> Powered by Machine Learning
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            Employee Performance <br />
            <span className="text-primary">Prediction System</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Predict, manage, and improve employee performance with AI-driven insights and role-based dashboards.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login?tab=signup">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login?tab=signin">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need</h2>
          <p className="text-muted-foreground">A complete HR analytics platform with AI at its core.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <Card className="border-border bg-primary text-primary-foreground">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-primary-foreground/80 mb-6">Create an account and explore the EPP System today.</p>
            <Link to="/login?tab=signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EPP System — Employee Performance Prediction
      </footer>
    </div>
  );
}
