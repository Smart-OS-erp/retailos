import { StatusBadge } from "@/components/ui/status-badge";

export type ActivityFeedItem = Readonly<{
  id: string;
  label: string;
  status: string;
  timestampLabel: string;
}>;

export function ActivityFeed({ items }: { items: readonly ActivityFeedItem[] }) {
  return (
    <ol className="ui-activity-feed">
      {items.map((item) => (
        <li key={item.id}>
          <div>
            <strong>{item.label}</strong>
            <span>{item.timestampLabel}</span>
          </div>
          <StatusBadge status={item.status} />
        </li>
      ))}
    </ol>
  );
}
