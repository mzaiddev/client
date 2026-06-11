import { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-card scrollbar-thin">
      {children}
    </div>
  );
}

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full min-w-full border-collapse text-sm", className)}
      {...props}
    />
  );
}

export function Th({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b bg-muted/50 px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}
