"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label, Select, Textarea, type ButtonSize, type ButtonVariant } from "./ui";
import { Dialog } from "./dialog";
import { showResult } from "./feedback-toast";
import { cn } from "@/lib/utils";
import type { ActionResult, FieldDef } from "@/lib/types";

/**
 * A button that opens a form built from `fields` and submits it to a server action.
 * Errors from MySQL (constraints, triggers, procedures) come back as toasts.
 */
export function FormDialog({
  trigger,
  triggerVariant = "primary",
  triggerSize = "md",
  title,
  description,
  fields,
  action,
  submitLabel = "Save",
  note,
}: {
  trigger: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  title: string;
  description?: ReactNode;
  fields: FieldDef[];
  action: (fd: FormData) => Promise<ActionResult>;
  submitLabel?: string;
  note?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const close = useCallback(() => setOpen(false), []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(fd);
      showResult(result);
      if (result.ok) setOpen(false);
    });
  }

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={close} title={title} description={description}>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={cn(field.full || field.type === "textarea" ? "sm:col-span-2" : "")}>
                <Label htmlFor={`f-${field.name}`} hint={field.hint}>
                  {field.label}
                  {field.required && <span className="text-rose-500"> *</span>}
                </Label>
                <FieldInput field={field} />
              </div>
            ))}
          </div>
          {note && (
            <div className="rounded-lg border border-dashed border-border bg-subtle px-3 py-2.5 text-xs text-muted-foreground">
              {note}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function FieldInput({ field }: { field: FieldDef }) {
  const common = {
    id: `f-${field.name}`,
    name: field.name,
    required: field.required,
    defaultValue: field.defaultValue ?? undefined,
  };
  if (field.type === "select") {
    return (
      <Select {...common} defaultValue={field.defaultValue ?? ""}>
        {!field.required && <option value="">— None —</option>}
        {field.required && field.defaultValue == null && (
          <option value="" disabled>
            Select…
          </option>
        )}
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  }
  if (field.type === "textarea") {
    return <Textarea {...common} placeholder={field.placeholder} />;
  }
  return (
    <Input
      {...common}
      type={field.type}
      min={field.min}
      max={field.max}
      step={field.step}
      placeholder={field.placeholder}
    />
  );
}
