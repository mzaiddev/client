import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../../features/auth/ThemeProvider";
import { formatCurrency } from "../../lib/utils";

function chartColors(theme: "light" | "dark") {
  return {
    grid: theme === "dark" ? "#334155" : "#d8dee6",
    text: theme === "dark" ? "#cbd5e1" : "#475569",
    in: "#159b74",
    out: "#e25555",
    balance: "#1594a3"
  };
}

export function InOutChart({ data }: { data: Array<{ month: string; IN: number; OUT: number }> }) {
  const { theme } = useTheme();
  const colors = chartColors(theme);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="month" stroke={colors.text} fontSize={12} />
          <YAxis stroke={colors.text} fontSize={12} tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Legend />
          <Bar dataKey="IN" fill={colors.in} radius={[6, 6, 0, 0]} />
          <Bar dataKey="OUT" fill={colors.out} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BalanceTrendChart({ data }: { data: Array<{ month: string; balance: number }> }) {
  const { theme } = useTheme();
  const colors = chartColors(theme);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="month" stroke={colors.text} fontSize={12} />
          <YAxis stroke={colors.text} fontSize={12} tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Area type="monotone" dataKey="balance" stroke={colors.balance} fill={colors.balance} fillOpacity={0.22} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
