import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
