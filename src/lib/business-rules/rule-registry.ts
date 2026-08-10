import { RETAIL_RULESET_VERSION } from "./retail-rules";

export type RuleImplementationStatus =
  | "AUTHORITATIVE_REFERENCE"
  | "EQUIVALENT_DATABASE_IMPLEMENTATION"
  | "HISTORICAL_COMPATIBILITY"
  | "PERSISTED_RESULT_CONSUMER"
  | "NOT_IMPLEMENTED";

export type BusinessRuleImplementation = {
  copilotConsumer: string;
  databaseImplementation: {
    classification: RuleImplementationStatus;
    object: string | null;
    notes: string;
  };
  definition: string;
  knownCompatibilityBehavior: string;
  ruleId: string;
  ruleVersion: typeof RETAIL_RULESET_VERSION;
  tests: string[];
  typescriptImplementation: string;
  uiConsumer: string;
};

export const businessRuleRegistry = [
  {
    ruleId: "inventory.available_quantity",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition:
      "Available Inventory = On Hand - Reserved - Quarantined - Damaged - Protected Presentation Qty - Committed Outbound Qty, floored at zero for normal workflow availability.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#calculateAvailableInventory",
    databaseImplementation: {
      classification: "EQUIVALENT_DATABASE_IMPLEMENTATION",
      object: "public.current_inventory_balances.available_quantity",
      notes:
        "Current SQL subtracts transfer reservations and floors at zero. Damaged/quarantined/protected presentation are represented as zero in the current Phase 1 view until those operational dimensions are implemented.",
    },
    uiConsumer: "src/app/inventory/page.tsx and inventory detail routes read current_inventory_balances.",
    copilotConsumer: "src/lib/intelligence/copilot.ts consumes persisted inventory/recovery records.",
    tests: [
      "tests/domain/retail-rule-contract.test.ts",
      "tests/integration/business-rule-database-parity.test.ts",
    ],
    knownCompatibilityBehavior:
      "Imported negative inventory may be retained as reconciliation evidence, but workflow availability is floored at zero.",
  },
  {
    ruleId: "inventory.position",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition:
      "Inventory position is the latest approved inventory snapshot for organization/SKU/location plus audited movement deltas and current transfer reservations/transit.",
    typescriptImplementation: "No duplicate authoritative TypeScript calculator; TypeScript reads database result.",
    databaseImplementation: {
      classification: "AUTHORITATIVE_REFERENCE",
      object: "public.current_inventory_balances",
      notes: "SQL view is the application source for current inventory position.",
    },
    uiConsumer: "src/app/inventory/* reads current_inventory_balances.",
    copilotConsumer: "src/lib/intelligence/copilot.ts consumes persisted inventory/recovery records.",
    tests: ["tests/integration/phase1-inventory-core.test.ts"],
    knownCompatibilityBehavior:
      "Phase 0 current_inventory_positions remains historical consolidation output; Phase 1 current_inventory_balances is the operational position view.",
  },
  {
    ruleId: "sales.net_units_sold",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition: "Net Units Sold = Sold Units - Returned Units.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#calculateNetUnitsSold",
    databaseImplementation: {
      classification: "HISTORICAL_COMPATIBILITY",
      object: "public.product_productivity_metrics.units_sold_30/units_sold_90",
      notes:
        "Current SQL uses sales_facts.quantity windows and does not yet model returned units separately in this view. Return-aware parity is blocked until persisted return evidence is represented.",
    },
    uiConsumer: "Merchandising pages display persisted productivity metrics.",
    copilotConsumer: "Copilot must cite persisted sales/productivity evidence, not recompute returns.",
    tests: ["tests/domain/retail-rule-contract.test.ts"],
    knownCompatibilityBehavior: "Classified as VERSION_DIFFERENCE until return-adjusted sales facts exist in SQL.",
  },
  {
    ruleId: "merchandising.net_sell_through",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition: "Net Sell-Through = Net Units Sold / (Opening Available Inventory + Receipts During Period).",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#calculateSellThrough",
    databaseImplementation: {
      classification: "HISTORICAL_COMPATIBILITY",
      object: "public.product_productivity_metrics.sell_through_rate_90",
      notes:
        "Current SQL exposes a historical 90-day productivity ratio as percentage: units_sold_90 / (units_sold_90 + on_hand_quantity) * 100. It is not equivalent to operating-model net sell-through.",
    },
    uiConsumer: "src/app/merchandising/productivity/page.tsx displays persisted sell_through_rate_90.",
    copilotConsumer: "Copilot must cite persisted metric label/window and avoid presenting it as net sell-through.",
    tests: [
      "tests/domain/retail-rule-contract.test.ts",
      "tests/integration/business-rule-database-parity.test.ts",
    ],
    knownCompatibilityBehavior:
      "Classified as VERSION_DIFFERENCE/HISTORICAL_COMPATIBILITY; M2.12 must decide whether to introduce a separate net_sell_through field.",
  },
  {
    ruleId: "merchandising.weighted_average_weekly_net_sales",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition: "Weighted average weekly net sales uses 50/30/20 weighting over recent two, previous two, and previous four week windows.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#calculateWeightedAverageWeeklyNetSales",
    databaseImplementation: {
      classification: "NOT_IMPLEMENTED",
      object: null,
      notes: "No persisted SQL equivalent exists yet; golden fixtures exercise the reference implementation only.",
    },
    uiConsumer: "No current UI consumer.",
    copilotConsumer: "Copilot must not invent this value unless persisted/system-derived evidence exists.",
    tests: ["tests/domain/retail-rule-contract.test.ts"],
    knownCompatibilityBehavior: "Unsupported in SQL; expose insufficient data rather than fake precision.",
  },
  {
    ruleId: "merchandising.weeks_of_cover",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition: "Weeks of Cover = Available Inventory / Weighted Average Weekly Net Sales.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#calculateWeeksOfCover",
    databaseImplementation: {
      classification: "NOT_IMPLEMENTED",
      object: null,
      notes: "No current SQL field exists for weeks of cover.",
    },
    uiConsumer: "No current UI consumer.",
    copilotConsumer: "Copilot must not invent weeks of cover without system-derived evidence.",
    tests: ["tests/domain/retail-rule-contract.test.ts"],
    knownCompatibilityBehavior: "Unsupported in SQL; M2.12 should validate formula and thresholds before broad use.",
  },
  {
    ruleId: "inventory.merchandise_age_weeks",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition:
      "Merchandise age uses receipt date, then first availability date, purchase date, first sale date, then low-confidence category/source proxy.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#calculateMerchandiseAge",
    databaseImplementation: {
      classification: "HISTORICAL_COMPATIBILITY",
      object: "public.inventory_positions.first_available_at and public.current_inventory_balances.first_available_at",
      notes:
        "Database stores first availability evidence but does not currently expose a merchandise_age_weeks calculation.",
    },
    uiConsumer: "Current inventory pages may display first availability; age must be system-derived before display as a metric.",
    copilotConsumer: "Copilot may explain persisted age evidence only when present.",
    tests: ["tests/domain/retail-rule-contract.test.ts"],
    knownCompatibilityBehavior: "Returns/transfers must preserve source age when lineage exists.",
  },
  {
    ruleId: "inventory.risk_state",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition:
      "Risk state is derived from age, weeks of cover, available quantity, cost confidence, and protections for newness/core/exclusive/recent-positive-velocity products.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#classifyInventoryRisk",
    databaseImplementation: {
      classification: "HISTORICAL_COMPATIBILITY",
      object: "public.inventory_risk_insights.inventory_risk_band",
      notes:
        "Phase 0 risk bands are persisted from existing recovery intelligence. They are not yet a direct SQL implementation of operating-model v0.9 risk_state.",
    },
    uiConsumer: "Inventory recovery and merchandising pages read persisted risk/recovery records.",
    copilotConsumer: "Copilot cites persisted inventory risk insights.",
    tests: ["tests/domain/retail-rule-contract.test.ts"],
    knownCompatibilityBehavior: "Inventory risk score/band remains a Phase 0 compatibility metric pending M2.12 validation.",
  },
  {
    ruleId: "confidence",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition: "Confidence must degrade when required evidence is missing, stale, conflicting, or unsupported.",
    typescriptImplementation: "src/lib/intelligence/confidence.ts and src/lib/business-rules/retail-rules.ts",
    databaseImplementation: {
      classification: "HISTORICAL_COMPATIBILITY",
      object: "public.inventory_risk_insights.data_confidence_score and merchandising confidence_level fields",
      notes: "Numeric Phase 0 confidence and categorical Phase 2A recommendation confidence coexist as compatibility outputs.",
    },
    uiConsumer: "UI displays persisted confidence fields.",
    copilotConsumer: "Copilot explains persisted confidence and missing-evidence caveats.",
    tests: ["tests/domain/retail-rule-contract.test.ts", "tests/integration/phase2-merchandising-planning.test.ts"],
    knownCompatibilityBehavior: "Do not silently upgrade validation level from internal/synthetic evidence.",
  },
  {
    ruleId: "recovery.recommendation_action",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition:
      "Recommendation action prefers transfer before markdown when receiving-location demand exists; missing cost suppresses margin-sensitive markdown precision.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#recommendRecoveryAction",
    databaseImplementation: {
      classification: "HISTORICAL_COMPATIBILITY",
      object: "public.recovery_opportunities and public.merchandising_recommendations",
      notes:
        "Current SQL produces Phase 0 recovery opportunities and Phase 2A directional merchandising recommendations using persisted metrics.",
    },
    uiConsumer: "Inventory recovery, projectisation, and merchandising pages read persisted recommendations/opportunities.",
    copilotConsumer: "Copilot must explain persisted recommendations and source chips.",
    tests: ["tests/domain/retail-rule-contract.test.ts", "tests/integration/phase2-merchandising-planning.test.ts"],
    knownCompatibilityBehavior: "Recommendations are drafts/reviews only; no autonomous execution.",
  },
  {
    ruleId: "merchandising.productivity",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition: "Productivity classifies historical SKU/location performance from persisted inventory and sales facts; it is not a forecast.",
    typescriptImplementation: "No duplicate authoritative TypeScript calculator; TypeScript reads database result.",
    databaseImplementation: {
      classification: "AUTHORITATIVE_REFERENCE",
      object: "public.product_productivity_metrics.productivity_band",
      notes: "SQL view is the current persisted productivity metric implementation.",
    },
    uiConsumer: "src/app/merchandising/* reads product_productivity_metrics.",
    copilotConsumer: "Copilot must cite persisted productivity metrics.",
    tests: ["tests/integration/phase2-merchandising-planning.test.ts"],
    knownCompatibilityBehavior: "Directional only; not advanced forecasting.",
  },
  {
    ruleId: "markdown.eligibility_recommendation",
    ruleVersion: RETAIL_RULESET_VERSION,
    definition: "Markdown eligibility/recommendation is a controlled planning review; missing cost lowers/suppresses confidence.",
    typescriptImplementation: "src/lib/business-rules/retail-rules.ts#recommendRecoveryAction for reference suppression behavior.",
    databaseImplementation: {
      classification: "HISTORICAL_COMPATIBILITY",
      object: "public.generate_merchandising_recommendations and public.create_markdown_plan_draft",
      notes:
        "Current SQL creates review recommendations/drafts but does not execute discounts or price changes.",
    },
    uiConsumer: "src/app/merchandising/markdowns/page.tsx reads persisted markdown drafts.",
    copilotConsumer: "Copilot may explain markdown drafts but must not execute markdowns.",
    tests: ["tests/integration/phase2-merchandising-planning.test.ts"],
    knownCompatibilityBehavior: "No external price write-back; no margin claim from missing cost.",
  },
] as const satisfies readonly BusinessRuleImplementation[];

export function findBusinessRule(ruleId: string): BusinessRuleImplementation | undefined {
  return businessRuleRegistry.find((rule) => rule.ruleId === ruleId);
}
