import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function CompanyNotFound() {
  return (
    <PlaceholderPage
      title="Company Not Found"
      description="This company profile does not exist or has been removed."
      icon={Building2}
    />
  );
}
