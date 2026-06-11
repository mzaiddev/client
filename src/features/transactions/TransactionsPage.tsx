import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Field, Input, Select, Textarea } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { TableSkeleton } from "../../components/ui/skeleton";
import { Table, TableWrap, Td, Th } from "../../components/ui/table";
import { useAuth } from "../auth/AuthProvider";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency, formatDate, formatTransactionUser, getTransactionUserId } from "../../lib/utils";
import { api, downloadBlob } from "../../services/api";
import { Paginated, Transaction, User } from "../../types";

const txSchema = z.object({
  userId: z.string().optional(),
  amount: z.coerce.number().positive("Amount is required"),
  type: z.enum(["IN", "OUT"]),
  description: z.string().min(2, "Description is required"),
  date: z.string().min(1)
});

type TxFormValues = z.infer<typeof txSchema>;

const txDefaults: TxFormValues = {
  userId: "",
  amount: 0,
  type: "IN",
  description: "",
  date: new Date().toISOString().slice(0, 10)
};

export function TransactionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const debouncedSearch = useDebounce(search);
  const form = useForm<TxFormValues>({ resolver: zodResolver(txSchema), defaultValues: txDefaults });

  const usersQuery = useQuery({
    queryKey: ["users-all"],
    queryFn: async () => (await api.get<Paginated<{ users: User[] }>>("/users", { params: { limit: 100 } })).data.users,
    enabled: isAdmin
  });

  const txQuery = useQuery({
    queryKey: ["transactions", debouncedSearch, type, userId, startDate, endDate, minAmount, maxAmount, page],
    queryFn: async () =>
      (
        await api.get<Paginated<{ transactions: Transaction[] }>>("/transactions", {
          params: {
            search: debouncedSearch || undefined,
            type: type || undefined,
            userId: userId || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            minAmount: minAmount || undefined,
            maxAmount: maxAmount || undefined,
            page,
            limit: 10
          }
        })
      ).data
  });

  useEffect(() => {
    if (!modalOpen) form.reset(txDefaults);
  }, [modalOpen, form]);

  const saveMutation = useMutation({
    mutationFn: (values: TxFormValues) => {
      const payload = { ...values, amount: Number(values.amount), userId: values.userId || undefined };
      if (editing) return api.put(`/transactions/${editing._id}`, payload);
      return api.post("/transactions", payload);
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  function openEdit(tx: Transaction) {
    setEditing(tx);
    form.reset({
      userId: getTransactionUserId(tx.userId),
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      date: new Date(tx.date).toISOString().slice(0, 10)
    });
    setModalOpen(true);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Record money in and money out with audit-friendly filters.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadBlob("/reports/export?type=transactions&format=excel", "transactions.xlsx")}><Download className="h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={() => downloadBlob("/reports/export?type=transactions&format=pdf", "transactions.pdf")}><Download className="h-4 w-4" /> PDF</Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Transaction</Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-5 md:grid-cols-2 xl:grid-cols-6">
          <Input className="xl:col-span-2" placeholder="Search description, user, id..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          {isAdmin ? (
            <Select value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }}>
              <option value="">All users</option>
              {usersQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          ) : null}
          <Select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </Select>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <Input placeholder="Min amount" type="number" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} />
          <Input placeholder="Max amount" type="number" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} />
        </CardContent>
      </Card>

      {txQuery.isLoading ? <TableSkeleton /> : txQuery.data?.transactions.length ? (
        <TableWrap>
          <Table>
            <thead>
              <tr><Th>Transaction ID</Th><Th>User</Th><Th>Amount</Th><Th>Type</Th><Th>Description</Th><Th>Date</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {txQuery.data.transactions.map((tx) => (
                <tr key={tx._id}>
                  <Td className="font-mono text-xs">{tx._id.slice(-8)}</Td>
                  <Td>{formatTransactionUser(tx.userId)}</Td>
                  <Td className="font-semibold">{formatCurrency(tx.amount)}</Td>
                  <Td><Badge className={tx.type === "IN" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}>{tx.type}</Badge></Td>
                  <Td>{tx.description}</Td>
                  <Td>{formatDate(tx.date)}</Td>
                  <Td>
                    {isAdmin ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(tx)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(tx._id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">View only</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      ) : <EmptyState title="No transactions found" description="Add a transaction or adjust your filters." />}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {txQuery.data?.page || 1} of {txQuery.data?.pages || 1}</span>
        <Button variant="outline" disabled={page >= (txQuery.data?.pages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Transaction" : "Add Transaction"}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          {isAdmin ? (
            <Field label="User">
              <Select {...form.register("userId")}>
                <option value="">Use my account</option>
                {usersQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
          ) : null}
          <Field label="Type"><Select {...form.register("type")}><option value="IN">IN</option><option value="OUT">OUT</option></Select></Field>
          <Field label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min="1" step="0.01" {...form.register("amount")} /></Field>
          <Field label="Date"><Input type="date" {...form.register("date")} /></Field>
          <div className="md:col-span-2">
            <Field label="Description" error={form.formState.errors.description?.message}><Textarea {...form.register("description")} /></Field>
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Transaction"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
