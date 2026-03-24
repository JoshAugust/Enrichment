import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Key, MapPin, Target, Info } from "lucide-react";

const LICENSED_STATES = [
  "AZ", "CO", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "MI",
  "MN", "MS", "MO", "MT", "NE", "NM", "NC", "ND", "OH", "OK",
  "PA", "SC", "SD", "TN", "TX", "WI", "WY",
];

const HIGH_PRIORITY_STATES = ["TX", "LA", "OK", "AR", "TN", "MS"];

const LEAD_CRITERIA = [
  { label: "Agency Type", value: "Independent (non-captive)" },
  { label: "Specialization", value: "Trucking / Commercial Auto / Fleet" },
  { label: "Size Sweet Spot", value: "Small to Mid (2-50 employees)" },
  { label: "Independence", value: "Has multiple carrier relationships" },
  { label: "Activity", value: "Active web presence, working contact info" },
  { label: "Geography", value: "Licensed states preferred, others tracked" },
];

const SCORING_FACTORS = [
  { factor: "Trucking-only or trucking-first agency", points: "+20" },
  { factor: "Multiple carrier relationships (3+)", points: "+15" },
  { factor: "Dedicated trucking contact", points: "+15" },
  { factor: "Mid-size independent (sweet spot)", points: "+10" },
  { factor: "In licensed state", points: "+10" },
  { factor: "Regional specialist", points: "+5" },
  { factor: "Active web presence", points: "+5" },
  { factor: '"We do everything" generalist', points: "-10" },
  { factor: "Very large national broker", points: "-15" },
  { factor: "Solo operator / one-person shop", points: "-20" },
  { factor: "Captive agent signals", points: "-20" },
  { factor: "Unlicensed state (still tracked)", points: "-10" },
];

export default function SettingsPage() {
  const maskedKey = process.env.API_KEY
    ? `${process.env.API_KEY.slice(0, 8)}${"•".repeat(24)}`
    : "Not configured";

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configuration and lead criteria
        </p>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 font-mono text-sm">
            <code className="flex-1 truncate">{maskedKey}</code>
          </div>
          <p className="text-xs text-muted-foreground">
            Set via the <code className="text-primary">API_KEY</code>{" "}
            environment variable. Agents use this in the{" "}
            <code className="text-primary">X-API-Key</code> header.
          </p>
        </CardContent>
      </Card>

      {/* Lead Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Lead Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {LEAD_CRITERIA.map((item) => (
              <div key={item.label} className="flex justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-foreground font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Scoring */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            Quality Scoring Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Scores are 0–100. Green ≥70, Yellow 40–69, Red &lt;40.
          </p>
          <div className="space-y-1.5">
            {SCORING_FACTORS.map((item) => (
              <div
                key={item.factor}
                className="flex items-center justify-between py-1.5 text-sm border-b border-border last:border-0"
              >
                <span className="text-foreground/80">{item.factor}</span>
                <Badge
                  className={`text-xs border ml-2 shrink-0 ${
                    item.points.startsWith("+")
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}
                >
                  {item.points}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* State Priorities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            State Priorities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              High Priority
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HIGH_PRIORITY_STATES.map((s) => (
                <Badge
                  key={s}
                  className="bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Licensed States
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LICENSED_STATES.map((s) => (
                <Badge
                  key={s}
                  className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-xs"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
