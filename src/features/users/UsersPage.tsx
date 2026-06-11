import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Plus, Power, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Field, Input, Select } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { TableSkeleton } from "../../components/ui/skeleton";
import { Table, TableWrap, Td, Th } from "../../components/ui/table";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../lib/utils";
import { api, downloadBlob } from "../../services/api";
import { Paginated, User } from "../../types";

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().min(2, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "user"]),
  initial_balance: z.coerce.number(),
  status: z.enum(["active", "inactive"])
});

type UserFormValues = z.infer<typeof userSchema>;

const defaults: UserFormValues = { name: "", username: "", password: "", role: "user", initial_balance: 0, status: "active" };

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search);
  const form = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: defaults });

  const query = useQuery({
    queryKey: ["users", debouncedSearch, status, page],
    queryFn: async () =>
      (
        await api.get<Paginated<{ users: User[] }>>("/users", {
          params: { search: debouncedSearch || undefined, status: status || undefined, page, limit: 10 }
        })
      ).data
  });

  useEffect(() => {
    if (!modalOpen) form.reset(defaults);
  }, [modalOpen, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const payload = { ...values, password: values.password || undefined };
      if (editing) return api.put(`/users/${editing.id || editing._id}`, payload);
      return api.post("/users", payload);
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: "active" | "inactive" }) => api.patch(`/users/${id}/status`, { status: next }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  function openEdit(user: User) {
    setEditing(user);
    form.reset({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      initial_balance: user.initial_balance,
      status: user.status
    });
    setModalOpen(true);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create accounts and monitor computed balances.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadBlob("/reports/export?type=users&format=excel", "users.xlsx")}><Download className="h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={() => downloadBlob("/reports/export?type=users&format=pdf", "users.pdf")}><Download className="h-4 w-4" /> PDF</Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add User</Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_220px]">
          <Input placeholder="Search name or username..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </CardContent>
      </Card>

      {query.isLoading ? <TableSkeleton /> : query.data?.users.length ? (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th><Th>Username</Th><Th>Initial</Th><Th>Total IN</Th><Th>Total OUT</Th><Th>Balance</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {query.data.users.map((user) => (
                <tr key={user.id || user._id}>
                  <Td><div className="font-medium">{user.name}</div><div className="text-xs text-muted-foreground">{user.role}</div></Td>
                  <Td>@{user.username}</Td>
                  <Td>{formatCurrency(user.initial_balance)}</Td>
                  <Td className="text-success">{formatCurrency(user.totalIn)}</Td>
                  <Td className="text-danger">{formatCurrency(user.totalOut)}</Td>
                  <Td className="font-semibold">{formatCurrency(user.currentBalance)}</Td>
                  <Td><Badge className={user.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>{user.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)}><Edit className="h-4 w-4" /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => statusMutation.mutate({ id: user.id || user._id!, next: user.status === "active" ? "inactive" : "active" })}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(user.id || user._id!)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      ) : <EmptyState title="No users found" description="Create a user or adjust your filters." />}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {query.data?.page || 1} of {query.data?.pages || 1}</span>
        <Button variant="outline" disabled={page >= (query.data?.pages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit User" : "Create User"}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <Field label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
          <Field label="Username" error={form.formState.errors.username?.message}><Input {...form.register("username")} /></Field>
          <Field label="Password" error={form.formState.errors.password?.message}><Input type="password" placeholder={editing ? "Leave blank to keep current" : ""} {...form.register("password")} /></Field>
          <Field label="Initial Balance"><Input type="number" step="0.01" {...form.register("initial_balance")} /></Field>
          <Field label="Role"><Select {...form.register("role")}><option value="user">User</option><option value="admin">Admin</option></Select></Field>
          <Field label="Status"><Select {...form.register("status")}><option value="active">Active</option><option value="inactive">Inactive</option></Select></Field>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save User"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
