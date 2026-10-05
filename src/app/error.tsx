"use client";

import { DatabaseZap, RotateCcw } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-xl p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
        <DatabaseZap className="size-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Couldn&apos;t load data from MySQL</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The database may still be starting (in Codespaces this takes about half a minute the first time), or the connection
        settings are wrong. Check <code className="font-mono text-xs">DB_HOST</code>, <code className="font-mono text-xs">DB_USER</code> and{" "}
        <code className="font-mono text-xs">DB_PASSWORD</code>.
      </p>
      {error.message && (
        <p className="mt-4 rounded-lg bg-subtle px-3 py-2 text-left font-mono text-xs text-muted-foreground">{error.message}</p>
      )}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </Card>
  );
}
