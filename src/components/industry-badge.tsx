import { Badge } from "@/components/ui/badge";

const INDUSTRY_COLORS: Record<string, string> = {
  trucking_insurance: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  insurance_brokers: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  tech_startups: "bg-green-500/20 text-green-300 border-green-500/30",
  property_management: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  healthcare_tech: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  fintech: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cybersecurity: "bg-red-500/20 text-red-300 border-red-500/30",
  climate_tech: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  devtools: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  legal_tech: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  robotics_hardware: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  marketing_tech: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  web3_crypto: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  edtech: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  hr_workforce: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

const INDUSTRY_LABELS: Record<string, string> = {
  trucking_insurance: "Trucking Insurance",
  insurance_brokers: "Insurance Brokers",
  tech_startups: "Tech Startups",
  property_management: "Property Management",
  healthcare_tech: "Healthcare Tech",
  fintech: "Fintech / Payments",
  cybersecurity: "Cybersecurity",
  climate_tech: "Climate / Clean Tech",
  devtools: "Developer Tools / Infra",
  legal_tech: "Legal Tech",
  robotics_hardware: "Robotics / Hardware",
  marketing_tech: "Marketing / Sales Tech",
  web3_crypto: "Web3 / Crypto",
  edtech: "Education Tech",
  hr_workforce: "HR / Workforce Tech",
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
