import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="py-12 text-center">
      <h2 className="text-lg font-medium text-foreground">Project not found</h2>
      <p className="mt-2 text-sm text-muted">
        This project may have been removed or archived.
      </p>
      <Link
        href="/projects"
        className="mt-4 inline-block text-sm text-accent hover:underline"
      >
        Back to Projects
      </Link>
    </div>
  );
}
