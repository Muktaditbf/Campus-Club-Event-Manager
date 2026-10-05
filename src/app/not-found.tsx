import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClasses, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">That record doesn&apos;t exist. It may have been deleted.</p>
      <Link href="/" className={buttonClasses("outline", "md", "mt-6")}>
        Back to dashboard
      </Link>
    </Card>
  );
}
