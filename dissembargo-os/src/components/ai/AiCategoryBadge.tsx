import { Badge } from "@/components/ui/Badge";
import { AI_CATEGORY_LABELS } from "@/lib/ai/constants";
import type { AiEmailCategory } from "@/types/database";

export function AiCategoryBadge({
  category,
}: {
  category: AiEmailCategory | null;
}) {
  if (!category) {
    return <Badge>Uncategorised</Badge>;
  }

  const variant =
    category === "new_business_opportunity"
      ? "success"
      : category === "spam"
        ? "danger"
        : category === "marketing" || category === "recruitment"
          ? "warning"
          : "default";

  return <Badge variant={variant}>{AI_CATEGORY_LABELS[category]}</Badge>;
}

export function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge>—</Badge>;

  const variant =
    score >= 90 ? "success" : score >= 70 ? "warning" : "default";

  return <Badge variant={variant}>{score}%</Badge>;
}
