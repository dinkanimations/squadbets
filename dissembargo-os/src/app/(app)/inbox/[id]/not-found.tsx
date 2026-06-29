import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function InboxEmailNotFound() {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">Email not found</h2>
      <p className="mt-2 text-sm text-muted">
        This email may have been removed or does not exist.
      </p>
      <Link href="/inbox" className="mt-6">
        <Button>Back to Inbox</Button>
      </Link>
    </Card>
  );
}
