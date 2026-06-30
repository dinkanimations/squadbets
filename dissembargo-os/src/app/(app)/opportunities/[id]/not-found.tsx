import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function OpportunityNotFound() {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Opportunity not found
      </h2>
      <p className="mt-2 text-sm text-muted">
        This opportunity may have been deleted or does not exist.
      </p>
      <Link href="/opportunities" className="mt-6">
        <Button>Back to Opportunities</Button>
      </Link>
    </Card>
  );
}
