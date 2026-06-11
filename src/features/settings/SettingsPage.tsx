import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Field, Input, Select } from "../../components/ui/input";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../auth/ThemeProvider";
import { formatCurrency } from "../../lib/utils";
import { api } from "../../services/api";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal(""))
});

type SettingsForm = z.infer<typeof schema>;

export function SettingsPage() {
  const { user, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  const form = useForm<SettingsForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || "", password: "" }
  });

  const mutation = useMutation({
    mutationFn: (values: SettingsForm) => api.patch("/users/profile", { name: values.name, password: values.password || undefined }),
    onSuccess: async () => {
      form.reset({ name: form.getValues("name"), password: "" });
      await refresh();
    }
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage profile, password, theme, and account details.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <Field label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
              <Field label="Change Password" error={form.formState.errors.password?.message}><Input type="password" placeholder="Leave blank to keep current password" {...form.register("password")} /></Field>
              {mutation.isSuccess ? <p className="rounded-md bg-success/10 p-3 text-sm text-success">Settings updated successfully.</p> : null}
              <div><Button disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Settings"}</Button></div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>Theme Settings</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <Select value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark")}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
              <div className="flex gap-2">
                <Button variant={theme === "light" ? "primary" : "outline"} onClick={() => setTheme("light")}><Sun className="h-4 w-4" /> Light</Button>
                <Button variant={theme === "dark" ? "primary" : "outline"} onClick={() => setTheme("dark")}><Moon className="h-4 w-4" /> Dark</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Username</span><span className="font-medium">@{user?.username}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Role</span><span className="font-medium">{user?.role}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Status</span><span className="font-medium">{user?.status}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Opening Balance</span><span className="font-medium">{formatCurrency(user?.initial_balance)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Current Balance</span><span className="font-medium">{formatCurrency(user?.balance?.currentBalance)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
