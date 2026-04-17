import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { employee_id } = await req.json();
    if (!employee_id) throw new Error("employee_id is required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch employee data
    const { data: emp, error: empErr } = await supabase
      .from("employees")
      .select("*, departments(name)")
      .eq("id", employee_id)
      .single();
    if (empErr || !emp) throw new Error("Employee not found");

    // Fetch task stats
    const { data: tasks } = await supabase
      .from("tasks")
      .select("status, priority, due_date, completed_at, created_at")
      .eq("assigned_to", employee_id);

    const totalTasks = tasks?.length ?? 0;
    const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
    const overdueTasks = tasks?.filter((t) => t.status === "overdue").length ?? 0;
    const inProgressTasks = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // Compute on-time completion rate
    const onTimeCompletions = tasks?.filter((t) =>
      t.status === "completed" && t.completed_at && t.due_date &&
      new Date(t.completed_at) <= new Date(t.due_date)
    ).length ?? 0;
    const onTimeRate = completedTasks > 0 ? onTimeCompletions / completedTasks : 0;

    const tenureYears = emp.date_of_joining
      ? (Date.now() - new Date(emp.date_of_joining).getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 0;

    const employeeData = {
      full_name: emp.full_name,
      job_role: emp.job_role,
      department: emp.departments?.name ?? "N/A",
      working_hours_per_week: emp.working_hours_per_week ?? 40,
      training_hours: emp.training_hours ?? 0,
      satisfaction_score: emp.satisfaction_score ?? 5,
      years_of_experience: emp.years_of_experience ?? 0,
      tenure_years: Math.round(tenureYears * 10) / 10,
      total_tasks_assigned: totalTasks,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      overdue_tasks: overdueTasks,
      task_completion_rate: Math.round(taskCompletionRate * 100) / 100,
      on_time_completion_rate: Math.round(onTimeRate * 100) / 100,
    };

    // Call Lovable AI with structured tool-calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an HR performance analytics AI. Analyze employee data and classify performance as 'good', 'average', or 'poor'. 
Consider: task completion rate, on-time delivery, satisfaction, training investment, working hours (40-45 is ideal, <35 or >50 is concerning), experience, and tenure.
Score each dimension 0-100 and produce an overall weighted score. Provide a confidence level (60-98%) based on data quality and signal strength. Be objective and data-driven.`,
          },
          {
            role: "user",
            content: `Analyze this employee and classify their performance:\n\n${JSON.stringify(employeeData, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_performance",
              description: "Return performance classification with detailed scores",
              parameters: {
                type: "object",
                properties: {
                  prediction_class: { type: "string", enum: ["good", "average", "poor"] },
                  confidence_score: { type: "number", description: "Confidence 60-98" },
                  overall_score: { type: "number", description: "Overall score 0-100" },
                  working_hours_score: { type: "number" },
                  training_score: { type: "number" },
                  satisfaction_score: { type: "number" },
                  task_completion_score: { type: "number" },
                  experience_score: { type: "number" },
                  reasoning: { type: "string", description: "Brief explanation (1-2 sentences)" },
                },
                required: [
                  "prediction_class", "confidence_score", "overall_score",
                  "working_hours_score", "training_score", "satisfaction_score",
                  "task_completion_score", "experience_score", "reasoning",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_performance" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return a classification");
    const result = JSON.parse(toolCall.function.arguments);

    // Insert prediction
    const { error: insertErr } = await supabase.from("performance_predictions").insert({
      employee_id,
      prediction_class: result.prediction_class,
      confidence_score: Math.round(result.confidence_score * 100) / 100,
      overall_score: Math.round(result.overall_score * 100) / 100,
      working_hours_score: Math.round(result.working_hours_score * 100) / 100,
      training_score: Math.round(result.training_score * 100) / 100,
      satisfaction_score: Math.round(result.satisfaction_score * 100) / 100,
      task_completion_score: Math.round(result.task_completion_score * 100) / 100,
      experience_score: Math.round(result.experience_score * 100) / 100,
    });
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({
      success: true,
      prediction_class: result.prediction_class,
      confidence_score: result.confidence_score,
      reasoning: result.reasoning,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("predict-performance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
