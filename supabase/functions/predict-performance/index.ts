import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TaskRow = {
  status: "pending" | "in_progress" | "completed" | "overdue";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const round2 = (value: number) => Math.round(value * 100) / 100;

const scoreWorkingHours = (hours: number) => {
  if (hours >= 38 && hours <= 45) return 95;
  if (hours >= 35 && hours < 38) return 85;
  if (hours > 45 && hours <= 48) return 80;
  if (hours >= 32 && hours < 35) return 70;
  if (hours > 48 && hours <= 52) return 60;
  return 45;
};

const scoreTraining = (hours: number) => clamp((hours / 40) * 100);

const scoreSatisfaction = (score: number) => clamp(score * 10);

const scoreExperience = (years: number) => {
  if (years >= 10) return 95;
  if (years >= 7) return 88;
  if (years >= 5) return 78;
  if (years >= 3) return 68;
  if (years >= 1) return 58;
  return 45;
};

const scoreTenure = (years: number) => {
  if (years >= 5) return 90;
  if (years >= 3) return 80;
  if (years >= 1) return 70;
  if (years > 0) return 60;
  return 50;
};

const scoreTasks = (tasks: TaskRow[]) => {
  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    return {
      totalTasks,
      completedTasks: 0,
      overdueTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      taskCompletionRate: 0,
      onTimeRate: 0,
      taskScore: 60,
    };
  }

  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const overdueTasks = tasks.filter((task) => task.status === "overdue").length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;

  const onTimeCompletions = tasks.filter((task) => (
    task.status === "completed" && task.completed_at && task.due_date && new Date(task.completed_at) <= new Date(task.due_date)
  )).length;

  const taskCompletionRate = completedTasks / totalTasks;
  const onTimeRate = completedTasks > 0 ? onTimeCompletions / completedTasks : 0;
  const overdueRate = overdueTasks / totalTasks;
  const activeRate = (pendingTasks + inProgressTasks) / totalTasks;

  const taskScore = clamp(
    50 +
      (taskCompletionRate * 30) +
      (onTimeRate * 15) -
      (overdueRate * 35) -
      (activeRate * 5)
  );

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    inProgressTasks,
    pendingTasks,
    taskCompletionRate,
    onTimeRate,
    taskScore,
  };
};

const classifyPerformance = (overallScore: number, taskScore: number, satisfactionScore: number) => {
  if (overallScore >= 72 && taskScore >= 65 && satisfactionScore >= 70) return "good";
  if (overallScore >= 50) return "average";
  return "poor";
};

const buildReasoning = (predictionClass: string, overallScore: number, taskScore: number, satisfactionScore: number) => {
  if (predictionClass === "good") {
    return `Strong overall profile with an overall score of ${round2(overallScore)}. Task execution (${round2(taskScore)}) and satisfaction (${round2(satisfactionScore)}) support a good-performance classification.`;
  }

  if (predictionClass === "average") {
    return `Balanced performance with an overall score of ${round2(overallScore)}. Some indicators are positive, but task execution or supporting factors are not strong enough yet for a good-performance classification.`;
  }

  return `Current indicators point to weaker performance with an overall score of ${round2(overallScore)}. Low task delivery, low satisfaction, or overdue work are pulling the result down.`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { employee_id } = await req.json();
    if (!employee_id) throw new Error("employee_id is required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: emp, error: empErr } = await supabase
      .from("employees")
      .select("*, departments(name)")
      .eq("id", employee_id)
      .single();

    if (empErr || !emp) throw new Error("Employee not found");

    const { data: tasks, error: taskErr } = await supabase
      .from("tasks")
      .select("status, due_date, completed_at, created_at")
      .eq("assigned_to", employee_id);

    if (taskErr) throw taskErr;

    const taskMetrics = scoreTasks((tasks ?? []) as TaskRow[]);

    const tenureYears = emp.date_of_joining
      ? (Date.now() - new Date(emp.date_of_joining).getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 0;

    const workingHoursScore = scoreWorkingHours(Number(emp.working_hours_per_week ?? 40));
    const trainingScore = scoreTraining(Number(emp.training_hours ?? 0));
    const satisfactionScore = scoreSatisfaction(Number(emp.satisfaction_score ?? 5));
    const experienceScore = scoreExperience(Number(emp.years_of_experience ?? 0));
    const tenureScore = scoreTenure(tenureYears);

    const overallScore = clamp(
      (taskMetrics.taskScore * 0.4) +
      (satisfactionScore * 0.2) +
      (trainingScore * 0.15) +
      (workingHoursScore * 0.1) +
      (experienceScore * 0.1) +
      (tenureScore * 0.05)
    );

    const predictionClass = classifyPerformance(overallScore, taskMetrics.taskScore, satisfactionScore);

    const dataCompleteness = [
      emp.working_hours_per_week,
      emp.training_hours,
      emp.satisfaction_score,
      emp.years_of_experience,
      emp.date_of_joining,
    ].filter((value) => value !== null && value !== undefined).length;

    const confidenceScore = clamp(
      65 + (dataCompleteness * 4) + Math.min(taskMetrics.totalTasks, 5) * 2,
      60,
      98
    );

    const reasoning = buildReasoning(predictionClass, overallScore, taskMetrics.taskScore, satisfactionScore);

    const { error: insertErr } = await supabase.from("performance_predictions").insert({
      employee_id,
      prediction_class: predictionClass,
      confidence_score: round2(confidenceScore),
      overall_score: round2(overallScore),
      working_hours_score: round2(workingHoursScore),
      training_score: round2(trainingScore),
      satisfaction_score: round2(satisfactionScore),
      task_completion_score: round2(taskMetrics.taskScore),
      experience_score: round2(experienceScore),
    });

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({
      success: true,
      prediction_class: predictionClass,
      confidence_score: round2(confidenceScore),
      reasoning,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-performance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});