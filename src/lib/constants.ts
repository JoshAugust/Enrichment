export const STATUS_COLORS: Record<string, string> = {
  New: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  Contacted: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Booked: "bg-green-500/20 text-green-300 border-green-500/30",
  "Bad Fit": "bg-red-500/20 text-red-300 border-red-500/30",
  "Not Interested": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Existing Partner": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Low Interest": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export const ALL_STATUSES = [
  "New",
  "Contacted",
  "Booked",
  "Bad Fit",
  "Not Interested",
  "Existing Partner",
  "Low Interest",
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  if (score >= 70) return "bg-green-500/20 text-green-300 border-green-500/30";
  if (score >= 40) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

export function getStatusColor(status: string | null | undefined): string {
  return STATUS_COLORS[status ?? "New"] ?? STATUS_COLORS["New"];
}
