import { CircleAlert } from "lucide-react";

export function AlertaError({ mensaje }: { mensaje: string }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{mensaje}</p>
    </div>
  );
}
