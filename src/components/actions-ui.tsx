"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, Select, type ButtonSize, type ButtonVariant } from "./ui";
import { Dialog } from "./dialog";
import { showResult } from "./feedback-toast";
import { cn, titleCase } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

/** Button that asks for confirmation, then runs a server action. */
export function ConfirmAction({
  trigger,
  variant = "outline",
  size = "md",
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  action,
  redirectTo,
  ariaLabel,
}: {
  trigger: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  action: () => Promise<ActionResult>;
  redirectTo?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const close = useCallback(() => setOpen(false), []);

  function confirm() {
    startTransition(async () => {
      const result = await action();
      showResult(result);
      if (result.ok) {
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
      }
    });
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} aria-label={ariaLabel}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={close} title={title} description={description}>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** Button that runs a server action right away (no confirmation). */
export function ActionButton({
  children,
  action,
  variant = "ghost",
  size = "sm",
  className,
  title,
}: {
  children: ReactNode;
  action: () => Promise<ActionResult>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      title={title}
      aria-label={title}
      disabled={pending}
      onClick={() => startTransition(async () => showResult(await action()))}
    >
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

/** A compact select that calls a server action when its value changes. */
export function InlineSelect({
  value,
  options,
  action,
  className,
  label,
}: {
  value: string;
  options: string[];
  action: (next: string) => Promise<ActionResult>;
  className?: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      aria-label={label}
      value={value}
      disabled={pending}
      className={cn("h-8 w-auto text-xs", className)}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => showResult(await action(next)));
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {titleCase(o)}
        </option>
      ))}
    </Select>
  );
}
