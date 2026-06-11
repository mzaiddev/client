import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Lock, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Field, Input } from "../../components/ui/input";
import { useAuth } from "./AuthProvider";

const schema = z.object({
  username: z.string().min(2, "Username is required"),
  password: z.string().min(6, "Password is required"),
  remember: z.boolean().optional()
});

type LoginInput = z.infer<typeof schema>;

export function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(schema), defaultValues: { username: "", password: "", remember: true } });

  if (token) return <Navigate to="/" replace />;

  async function onSubmit(values: LoginInput) {
    setError("");
    try {
      await login(values);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(21,148,163,0.20),transparent_34%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div>
            <p className="text-sm font-semibold text-primary">LedgerPro</p>
            <CardTitle className="mt-1 text-2xl">Sign in to your ledger</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Secure access for admins and account users.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label="Username" error={form.formState.errors.username?.message}>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" autoComplete="username" {...form.register("username")} />
              </div>
            </Field>
            <Field label="Password" error={form.formState.errors.password?.message}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 pr-10" type={showPassword ? "text" : "password"} autoComplete="current-password" {...form.register("password")} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)}>
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="h-4 w-4 accent-primary" {...form.register("remember")} />
              Remember session
            </label>
            {error ? <p className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
            <Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Signing in..." : "Login"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
