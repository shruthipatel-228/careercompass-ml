import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Props {
  data: { good: number; average: number; poor: number };
}

const COLORS = ["hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

export function PerformanceChart({ data }: Props) {
  const chartData = [
    { name: "Good", value: data.good },
    { name: "Average", value: data.average },
    { name: "Poor", value: data.poor },
  ];

  const total = data.good + data.average + data.poor;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No prediction data available yet
      </div>
    );
  }

  const renderLabel = ({ name, value, percent }: any) =>
    value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : "";

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <Pie
          data={chartData.filter((d) => d.value > 0)}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          dataKey="value"
          label={renderLabel}
          labelLine={true}
        >
          {chartData.filter((d) => d.value > 0).map((entry, i) => {
            const idx = chartData.findIndex((c) => c.name === entry.name);
            return <Cell key={i} fill={COLORS[idx]} />;
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}
