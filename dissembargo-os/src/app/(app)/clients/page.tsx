import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { getClients } from "@/lib/database/clients";

export default async function ClientsPage() {
  const { data: clients } = await getClients({ pageSize: 100 });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Active client accounts linked to approved quotes and projects."
        icon={Users}
      />

      {clients.length > 0 ? (
        <ClientsTable clients={clients} />
      ) : (
        <EmptyState
          title="No clients yet"
          description="Clients are created automatically when quotes are approved, or when projects are set up for a company."
        />
      )}
    </>
  );
}
