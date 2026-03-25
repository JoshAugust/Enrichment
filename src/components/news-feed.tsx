"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface NewsItem {
  title: string;
  url?: string;
  sentiment?: "positive" | "negative" | "neutral" | string;
  published_at?: string;
  summary?: string;
  source?: string;
}

interface NewsFeedProps {
  items: NewsItem[] | null | undefined;
}

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment) return null;
  const colorMap: Record<string, string> = {
    positive: "bg-green-500/20 text-green-300 border-green-500/30",
    negative: "bg-red-500/20 text-red-300 border-red-500/30",
    neutral: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };
  const color = colorMap[sentiment] ?? colorMap.neutral;
  return (
    <Badge className={`text-xs border ${color} capitalize`}>
      {sentiment}
    </Badge>
  );
}

export function NewsFeed({ items }: NewsFeedProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No news items available.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Run enrichment to discover recent news.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded-lg border border-border bg-card/50 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 min-w-0"
                >
                  <span className="truncate">{item.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <p className="text-sm font-medium text-foreground">{item.title}</p>
              )}
            </div>
            <SentimentBadge sentiment={item.sentiment} />
          </div>
          {item.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            {item.source && <span>{item.source}</span>}
            {item.published_at && (
              <>
                {item.source && <span>·</span>}
                <span>{new Date(item.published_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
