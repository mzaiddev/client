import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../features/auth/AuthProvider";
import { useTheme } from "../../features/auth/ThemeProvider";
import { useDebounce } from "../../hooks/useDebounce";
import { cn, formatCurrency } from "../../lib/utils";
import { api } from "../../services/api";
import { Transaction, User } from "../../types";

const baseNav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: WalletCards },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings }
];

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const { user } = useAuth();
  const nav = user?.role === "admin" ? [baseNav[0], { label: "Users", href: "/users", icon: Users }, ...baseNav.slice(1)] : baseNav;
  return (
    <>
      <div className={cn("fixed inset-0 z-30 bg-black/40 lg:hidden", open ? "block" : "hidden")} onClick={close} />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div>
            <p className="text-lg font-bold">LedgerPro</p>
            <p className="text-xs text-muted-foreground">Accounting workspace</p>
          </div>
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={close}
              className={({ isActive }) =>
                cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition hover:bg-muted", isActive && "bg-primary text-primary-foreground hover:bg-primary")
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t p-4 text-sm">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-muted-foreground">{user?.role === "admin" ? "Administrator" : "User account"}</p>
        </div>
      </aside>
    </>
  );
}

function GlobalSearch() {
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 250);
  const { data } = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: async () => (await api.get<{ users: User[]; transactions: Transaction[] }>("/reports/search", { params: { q: debounced } })).data,
    enabled: debounced.length > 1
  });

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" placeholder="Search users, transactions, descriptions..." value={term} onChange={(event) => setTerm(event.target.value)} />
      {debounced.length > 1 && data ? (
        <div className="absolute left-0 right-0 top-12 z-30 max-h-80 overflow-y-auto rounded-lg border bg-card p-2 shadow-soft">
          {[...(data.users || []), ...(data.transactions || [])].length === 0 ? <p className="p-3 text-sm text-muted-foreground">No results found</p> : null}
          {data.users?.map((user) => (
            <div key={user.id || user._id} className="rounded-md p-3 text-sm hover:bg-muted">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          ))}
          {data.transactions?.map((tx) => (
            <div key={tx._id} className="rounded-md p-3 text-sm hover:bg-muted">
              <p className="font-medium">{tx.description}</p>
              <p className="text-muted-foreground">{tx.type} · {formatCurrency(tx.amount)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-6">
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <Button aria-label="Toggle theme" variant="outline" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Logout"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
