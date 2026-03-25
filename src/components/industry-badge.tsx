import { Badge } from "@/components/ui/badge";

const INDUSTRY_COLORS: Record<string, string> = {
  trucking_insurance: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  insurance_brokers: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  tech_startups: "bg-green-500/20 text-green-300 border-green-500/30",
  property_management: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const INDUSTRY_LABELS: Record<string, string> = {
  trucking_insurance: "Trucking Insurance",
  insurance_brokers: "Insurance Brokers",
  tech_startups: "Tech Startups",
  property_management: "Property Management",
};

interface IndustryBadgeProps {
  industry: string | null | undefined;
  className?: string;
}

export function IndustryBadge({ industry, className }: IndustryBadgeProps) {
  if (!industry) return <span className="text-muted-foreground text-xs">—</span>;
  
  const colorClass = INDUSTRY_COLORS[industry] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
  const label = INDUSTRY_LABELS[industry] ?? industry.replace(/_/g, " ");

  return (
    <Badge className={`text-xs border ${colorClass} ${className ?? ""}`}>
      {label}
    </Badge>
  );
}

export const ALL_INDUSTRIES = Object.keys(INDUSTRY_LABELS);
export { INDUSTRY_LABELS };
