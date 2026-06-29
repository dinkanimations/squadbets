import Link from "next/link";

export default function CompanyNotFound() {
  return (
    <div className="py-12 text-center">
      <h2 className="text-lg font-medium text-foreground">Company not found</h2>
      <p className="mt-2 text-sm text-muted">
        This company profile does not exist or has been removed.
      </p>
      <Link
        href="/companies"
        className="mt-4 inline-block text-sm text-accent hover:underline"
      >
        Back to Companies
      </Link>
    </div>
  );
}
