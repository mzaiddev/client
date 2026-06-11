import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value?: string | Date) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

export function isPopulatedUser(value: User | string | null | undefined): value is User {
  return Boolean(value && typeof value === "object");
}

export function formatTransactionUser(value: User | string | null | undefined) {
  return isPopulatedUser(value) ? value.name : "-";
}

export function getTransactionUserId(value: User | string | null | undefined) {
  if (isPopulatedUser(value)) return value.id || value._id || "";
  return value || "";
}
