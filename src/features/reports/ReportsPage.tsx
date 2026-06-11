import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { InOutChart } from "../../components/charts/LedgerCharts";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Input, Select } from "../../components/ui/input";
import { TableSkeleton } from "../../components/ui/skeleton";
import { Table, TableWrap, Td, Th } from "../../components/ui/table";
import { useAuth } from "../auth/AuthProvider";
import { formatCurrency } from "../../lib/utils";
import { api, downloadBlob } from "../../services/api";
import { MonthlyReport, Paginated, User } from "../../types";

export function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [userId, setUserId] = useState("");

  const usersQuery = useQuery({
    queryKey: ["users-report"],
    queryFn: async () => (await api.get<Paginated<{ users: User[] }>>("/users", { params: { limit: 100 } })).data.users,
    enabled: isAdmin
  });

  const reportQuery = useQuery({
    queryKey: ["monthly-report", month, year, userId],
    queryFn: async () => (await api.get<MonthlyReport>("/reports/monthly", { params: { month, year, userId: userId || undefined } })).data
  });

  const chartData = useMemo(() => {
    const report = reportQuery.data?.reports || [];
    return report.map((row) => ({ month: row.name, IN: row.totalIn, OUT: row.totalOut }));
  }, [reportQuery.data]);

  const exportQuery = `type=reports&month=${month}&year=${year}${userId ? `&userId=${userId}` : ""}`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monthly opening balance, total IN, total OUT, and closing balance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadBlob(`/reports/export?${exportQuery}&format=excel`, "monthly-report.xlsx")}><Download className="h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={() => downloadBlob(`/reports/export?${exportQuery}&format=pdf`, "monthly-report.pdf")}><Download className="h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-5 md:grid-cols-4">
          <Select value={month} onChange={(event) => setMonth(event.target.value)}>
            {Array.from({ length: 12 }).map((_, index) => <option key={index + 1} value={index + 1}>{new Date(2024, index).toLocaleString("en", { month: "long" })}</option>)}
          </Select>
          <Input type="number" value={year} onChange={(event) => setYear(event.target.value)} />
          {isAdmin ? (
            <Select value={userId} onChange={(event) => setUserId(event.target.value)}>
              <option value="">All users</option>
              {usersQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monthly Statistics</CardTitle></CardHeader>
        <CardContent>{chartData.length ? <InOutChart data={chartData} /> : <EmptyState title="No monthly statistics yet" />}</CardContent>
      </Card>

      {reportQuery.isLoading ? <TableSkeleton /> : reportQuery.data?.reports.length ? (
        <TableWrap>
          <Table>
            <thead>
              <tr><Th>User</Th><Th>Opening Balance</Th><Th>Total IN</Th><Th>Total OUT</Th><Th>Closing Balance</Th></tr>
            </thead>
            <tbody>
              {reportQuery.data.reports.map((row) => (
                <tr key={row.userId}>
                  <Td><div className="font-medium">{row.name}</div><div className="text-xs text-muted-foreground">@{row.username}</div></Td>
                  <Td>{formatCurrency(row.openingBalance)}</Td>
                  <Td className="text-success">{formatCurrency(row.totalIn)}</Td>
                  <Td className="text-danger">{formatCurrency(row.totalOut)}</Td>
                  <Td className="font-semibold">{formatCurrency(row.closingBalance)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      ) : <EmptyState title="No report data found" description="Try a different month, year, or user filter." />}
    </div>
  );
}
