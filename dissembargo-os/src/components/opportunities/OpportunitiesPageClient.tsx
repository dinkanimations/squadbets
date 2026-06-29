"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getContactsForCompanyAction } from "@/lib/opportunities/actions";
import { OpportunitiesTable } from "./OpportunitiesTable";
import { OpportunitiesToolbar } from "./OpportunitiesToolbar";
import { OpportunityFormModal } from "./OpportunityFormModal";
import type { OpportunityWithRelations } from "@/lib/opportunities/constants";

type CompanyOption = { id: string; company_name: string };
type ContactOption = {
  id: string;
  full_name: string;
  email: string | null;
  company_id: string;
};

interface OpportunitiesPageClientProps {
  opportunities: OpportunityWithRelations[];
  companies: CompanyOption[];
  hasFilters?: boolean;
}

export function OpportunitiesPageClient({
  opportunities,
  companies,
  hasFilters = false,
}: OpportunitiesPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<OpportunityWithRelations | null>(null);
  const [initialContacts, setInitialContacts] = useState<ContactOption[]>([]);

  const handleCreate = () => {
    setEditingOpportunity(null);
    setInitialContacts([]);
    setModalOpen(true);
  };

  const handleEdit = async (opportunity: OpportunityWithRelations) => {
    const contacts = await getContactsForCompanyAction(opportunity.company_id);
    setInitialContacts(contacts);
    setEditingOpportunity(opportunity);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingOpportunity(null);
    setInitialContacts([]);
  };

  return (
    <>
      <OpportunitiesToolbar onCreateClick={handleCreate} />

      {opportunities.length > 0 ? (
        <OpportunitiesTable opportunities={opportunities} onEdit={handleEdit} />
      ) : (
        <EmptyState
          title={
            hasFilters ? "No matching opportunities" : "No opportunities yet"
          }
          description={
            hasFilters
              ? "Try adjusting your search or filter criteria."
              : "Create your first opportunity manually, or wait for Gmail integration to populate this inbox automatically."
          }
          action={
            !hasFilters ? (
              <Button onClick={handleCreate}>New Opportunity</Button>
            ) : undefined
          }
        />
      )}

      <OpportunityFormModal
        open={modalOpen}
        onClose={handleClose}
        companies={companies}
        opportunity={editingOpportunity}
        initialContacts={initialContacts}
      />
    </>
  );
}
