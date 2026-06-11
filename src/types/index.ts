export type Role = "admin" | "user";
export type Status = "active" | "inactive";
export type TransactionType = "IN" | "OUT";

export type BalanceSummary = {
  initialBalance: number;
  totalIn: number;
  totalOut: number;
  currentBalance: number;
};

export type User = {
  id: string;
  _id?: string;
  name: string;
  username: string;
  role: Role;
  initial_balance: number;
  status: Status;
  totalIn?: number;
  totalOut?: number;
  currentBalance?: number;
  balance?: BalanceSummary;
  createdAt?: string;
};

export type Transaction = {
  _id: string;
  userId: User | string | null;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  createdAt: string;
};

export type Paginated<T> = {
  page: number;
  limit: number;
  total: number;
  pages: number;
} & T;

export type DashboardData = {
  totalUsers: number;
  activeUsers: number;
  totalBalance: number;
  totalIn: number;
  totalOut: number;
  balance: BalanceSummary | null;
  monthly: Array<{ month: string; IN: number; OUT: number; count: number }>;
  balanceTrend: Array<{ month: string; balance: number }>;
  topUsers: Array<{ id: string; name: string; username: string; balance: number }>;
  recentTransactions: Transaction[];
};

export type MonthlyReport = {
  month: number;
  year: number;
  reports: Array<{
    userId: string;
    name: string;
    username: string;
    openingBalance: number;
    totalIn: number;
    totalOut: number;
    closingBalance: number;
  }>;
};
