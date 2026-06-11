import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Plus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { BalanceTrendChart, InOutChart } from "../../components/charts/LedgerCharts";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Field, Input, Select, Textarea } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { Table, TableWrap, Td, Th } from "../../components/ui/table";
import { useAuth } from "../auth/AuthProvider";
import { formatCurrency, formatDate } from "../../lib/utils";
import { api } from "../../services/api";
import { DashboardData } from "../../types";

type QuickTransactionInput = {
  amount: number;
  type: "IN" | "OUT";
  description: string;
};

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: any; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className={`rounded-md bg-muted p-3 ${tone || ""}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardData>("/reports/dashboard")).data
  });
  const form = useForm<QuickTransactionInput>({ defaultValues: { amount: 0, type: "IN", description: "" } });
  const mutation = useMutation({
    mutationFn: (values: QuickTransactionInput) => api.post("/transactions", { ...values, amount: Number(values.amount), date: new Date() }),
    onSuccess: () => {
      form.reset({ amount: 0, type: "IN", description: "" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    }
  });

  if (isLoading || !data) {
    return <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;
  }

  const isAdmin = user?.role === "admin";
  const balance = isAdmin ? data.totalBalance : data.balance?.currentBalance || 0;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-normal">{isAdmin ? "Admin Dashboard" : "Dashboard"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live balances, activity, and reporting snapshots.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isAdmin ? <StatCard title="Total Users" value={String(data.totalUsers)} icon={Users} /> : null}
        {isAdmin ? <StatCard title="Active Users" value={String(data.activeUsers)} icon={Users} /> : null}
        <StatCard title={isAdmin ? "Total Balance" : "Current Balance"} value={formatCurrency(balance)} icon={ArrowUpCircle} tone="text-primary" />
        <StatCard title="Total IN" value={formatCurrency(data.totalIn)} icon={ArrowUpCircle} tone="text-success" />
        <StatCard title="Total OUT" value={formatCurrency(data.totalOut)} icon={ArrowDownCircle} tone="text-danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Monthly IN vs OUT</CardTitle></CardHeader>
          <CardContent>{data.monthly.length ? <InOutChart data={data.monthly} /> : <EmptyState title="No chart data yet" />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Balance Trend</CardTitle></CardHeader>
          <CardContent>{data.balanceTrend.length ? <BalanceTrendChart data={data.balanceTrend} /> : <EmptyState title="No balance trend yet" />}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader><CardTitle>Latest Transactions</CardTitle></CardHeader>
          <CardContent>
            {data.recentTransactions.length ? (
              <TableWrap>
                <Table>
                  <thead><tr><Th>Description</Th><Th>User</Th><Th>Type</Th><Th>Amount</Th><Th>Date</Th></tr></thead>
                  <tbody>
                    {data.recentTransactions.map((tx) => (
                      <tr key={tx._id}>
                        <Td>{tx.description}</Td>
                        <Td>{typeof tx.userId === "object" ? tx.userId.name : "-"}</Td>
                        <Td><Badge className={tx.type === "IN" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}>{tx.type}</Badge></Td>
                        <Td>{formatCurrency(tx.amount)}</Td>
                        <Td>{formatDate(tx.date)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            ) : (
              <EmptyState title="No transactions yet" />
            )}
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader><CardTitle>Top Users By Balance</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {data.topUsers.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                  <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">@{item.username}</p></div>
                  <p className="font-semibold">{formatCurrency(item.balance)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Quick Add Transaction</CardTitle></CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                <Field label="Type"><Select {...form.register("type")}><option value="IN">IN</option><option value="OUT">OUT</option></Select></Field>
                <Field label="Amount"><Input type="number" min="1" step="0.01" {...form.register("amount", { valueAsNumber: true })} /></Field>
                <Field label="Description"><Textarea {...form.register("description", { required: true })} /></Field>
                <Button disabled={mutation.isPending}><Plus className="h-4 w-4" /> Add Transaction</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
