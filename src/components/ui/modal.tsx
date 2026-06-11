import { X } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "./button";

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button aria-label="Close modal" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
