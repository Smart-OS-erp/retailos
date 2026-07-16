export type ProvisionalDashboardCard = Readonly<{
  description: string;
  id: string;
  label: string;
  metricKey: string;
  provisional: true;
}>;

export type ProvisionalDashboardConfig = Readonly<{
  cards: readonly ProvisionalDashboardCard[];
  disclaimer: string;
  id: string;
  provisional: true;
}>;

export const provisionalDashboardConfig: ProvisionalDashboardConfig = {
  cards: [
    {
      description: "Placeholder card slot for future persisted inventory value.",
      id: "inventory-value",
      label: "Inventory Value",
      metricKey: "inventory_value",
      provisional: true,
    },
    {
      description: "Placeholder card slot for future persisted stock-at-risk value.",
      id: "stock-at-risk",
      label: "Stock at Risk",
      metricKey: "stock_at_risk",
      provisional: true,
    },
    {
      description: "Placeholder card slot for future recovery opportunity value.",
      id: "recovery-opportunity",
      label: "Recovery Opportunity",
      metricKey: "recovery_opportunity",
      provisional: true,
    },
  ],
  disclaimer:
    "M0-UI dashboard configuration is provisional and validates component architecture only.",
  id: "m0-ui-provisional-dashboard",
  provisional: true,
};
