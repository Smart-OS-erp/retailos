import type { Client as PgClient } from "pg";

const { randomBytes } = require("node:crypto");
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const CREDENTIALS_PATH = join(ROOT, ".tmp", "hosted-aso-credentials.json");
const EMAIL = "aso.owner@retailos.example";
const ORG_SLUG = "aso-collective";
const ORG_NAME = "Aṣọ Collective";
const DATASET_VERSION = "ASO_MERCHANDISING_PILOT_V3";
const RULE_VERSION = "retailos-operating-model-v0.9.0";

type Env = {
  DATABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type SupabaseAdminUser = {
  app_metadata?: Record<string, unknown>;
  email?: string;
  id: string;
  user_metadata?: Record<string, unknown>;
};

function loadEnv(): Env {
  const envPath = join(ROOT, ".env.local");
  if (existsSync(envPath)) {
    const envText = readFileSync(envPath, "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  }

  for (const key of [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    if (!process.env[key]) throw new Error(`${key} is required in ignored env/secret management`);
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

function generatePassword(): string {
  return `Aso-${randomBytes(18).toString("base64url")}!9`;
}

function readOrCreatePassword(): string {
  if (existsSync(CREDENTIALS_PATH)) {
    const parsed = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
    if (parsed?.email === EMAIL && typeof parsed.password === "string") return parsed.password;
  }
  const password = generatePassword();
  mkdirSync(dirname(CREDENTIALS_PATH), { recursive: true });
  writeFileSync(
    CREDENTIALS_PATH,
    JSON.stringify(
      {
        dataset_version: DATASET_VERSION,
        email: EMAIL,
        organization: ORG_NAME,
        password,
        role: "ORG_OWNER",
        url: "https://retailos-ten.vercel.app",
      },
      null,
      2,
    ),
  );
  return password;
}

async function ensureDemoUser(env: Env, password: string): Promise<string> {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.error) throw users.error;
  const existing = (users.data.users as SupabaseAdminUser[]).find((user) => user.email?.toLowerCase() === EMAIL);
  if (existing) {
    const updated = await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        dataset_version: DATASET_VERSION,
        organization_slug: ORG_SLUG,
        role: "ORG_OWNER",
        synthetic_demo: true,
      },
      email_confirm: true,
      password,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        display_name: "Aso Demo Owner",
        organization: ORG_NAME,
        synthetic_demo: true,
      },
    });
    if (updated.error) throw updated.error;
    return existing.id;
  }

  const created = await supabase.auth.admin.createUser({
    app_metadata: {
      dataset_version: DATASET_VERSION,
      organization_slug: ORG_SLUG,
      role: "ORG_OWNER",
      synthetic_demo: true,
    },
    email: EMAIL,
    email_confirm: true,
    password,
    user_metadata: {
      display_name: "Aso Demo Owner",
      organization: ORG_NAME,
      synthetic_demo: true,
    },
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

async function queryOne<T>(client: PgClient, sql: string, params: unknown[]): Promise<T> {
  const result = await client.query(sql, params);
  return result.rows[0] as T;
}

async function clearSyntheticTenant(client: PgClient, organizationId: string): Promise<void> {
  const tables = [
    "event_log",
    "audit_events",
    "markdown_plan_drafts",
    "merchandising_recommendations",
    "assortment_plan_items",
    "merchandising_plan_cycles",
    "campaign_briefs",
    "recovery_projects",
    "recovery_opportunities",
    "inventory_risk_insights",
    "intelligence_runs",
    "sales_facts",
    "inventory_positions",
    "inventory_snapshots",
    "data_uploads",
    "skus",
    "products",
    "categories",
    "brands",
    "location_assignments",
    "locations",
  ];
  for (const table of tables) {
    await client.query(`delete from public.${table} where organization_id = $1`, [organizationId]);
  }
}

async function provision() {
  const env = loadEnv();
  const password = readOrCreatePassword();
  const userId = await ensureDemoUser(env, password);
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin");
    const org = await queryOne<{ id: string }>(
      client,
      `insert into public.organizations (name, slug, created_by)
       values ($1, $2, $3)
       on conflict (slug) do update set name = excluded.name, updated_at = timezone('utc', now())
       returning id`,
      [ORG_NAME, ORG_SLUG, userId],
    );
    await clearSyntheticTenant(client, org.id);
    await client.query(
      `insert into public.memberships (organization_id, user_id, role, status, created_by)
       values ($1, $2, 'org_owner', 'active', $2)
       on conflict (organization_id, user_id) do update set role = 'org_owner', status = 'active', updated_at = timezone('utc', now())`,
      [org.id, userId],
    );
    await client.query(
      `insert into public.onboarding_checklists (organization_id, user_id, step, status, completed_at, completed_by)
       select $1, $2, checklist_step, 'completed', timezone('utc', now()), $2
       from unnest(enum_range(null::public.onboarding_step)) as checklist_step
       on conflict (organization_id, user_id, step)
       do update set status = 'completed', completed_at = timezone('utc', now()), completed_by = excluded.completed_by, updated_at = timezone('utc', now())`,
      [org.id, userId],
    );

    const locationInputs = [
      ["Lagos Island Flagship", "lagos-island"],
      ["Lekki Store", "lekki"],
      ["Abuja Store", "abuja"],
      ["Ibadan Store", "ibadan"],
      ["Ecommerce Pool", "ecommerce-pool"],
    ];
    const locations: Record<string, string> = {};
    for (const [name, code] of locationInputs) {
      const row = await queryOne<{ id: string }>(
        client,
        `insert into public.locations (organization_id, name, code, timezone, created_by)
         values ($1, $2, $3, 'Africa/Lagos', $4)
         returning id`,
        [org.id, name, code, userId],
      );
      locations[code] = row.id;
    }

    const brand = await queryOne<{ id: string }>(
      client,
      `insert into public.brands (organization_id, name, code, created_by)
       values ($1, 'Aso Studio', 'aso-studio', $2)
       returning id`,
      [org.id, userId],
    );
    const categories: Record<string, string> = {};
    for (const name of ["Womenswear", "Menswear", "Footwear", "Accessories"]) {
      const row = await queryOne<{ id: string }>(
        client,
        `insert into public.categories (organization_id, name, created_by)
         values ($1, $2, $3)
         returning id`,
        [org.id, name, userId],
      );
      categories[name] = row.id;
    }

    const products = [
      ["Adire Wrap Dress", "ASO-AA001", "Womenswear"],
      ["Gold Aso-Oke Blazer", "ASO-AB002", "Womenswear"],
      ["Core Black Tee", "ASO-AC003", "Menswear"],
      ["Palm Resort Shirt", "ASO-AD004", "Menswear"],
      ["Kano Leather Sandal", "ASO-AE005", "Footwear"],
      ["Beaded Mini Bag", "ASO-AF006", "Accessories"],
    ];
    const productIds: Record<string, string> = {};
    for (const [name, style, category] of products) {
      const row = await queryOne<{ id: string }>(
        client,
        `insert into public.products (organization_id, brand_id, category_id, name, style_code, created_by)
         values ($1, $2, $3, $4, $5, $6)
         returning id`,
        [org.id, brand.id, categories[category], name, style, userId],
      );
      productIds[style] = row.id;
    }

    const skuInputs = [
      ["ASO-AA001-BLA-S", "ASO-AA001", "S", "Black", 42000],
      ["ASO-AA001-BLA-M", "ASO-AA001", "M", "Black", 42000],
      ["ASO-AB002-GOL-S", "ASO-AB002", "S", "Gold", 60000],
      ["ASO-AB002-GOL-M", "ASO-AB002", "M", "Gold", 60000],
      ["ASO-AC003-BLK-M", "ASO-AC003", "M", "Black", 9000],
      ["ASO-AC003-BLK-L", "ASO-AC003", "L", "Black", 9000],
      ["ASO-AD004-PAL-S", "ASO-AD004", "S", "Palm", null],
      ["ASO-AD004-PAL-M", "ASO-AD004", "M", "Palm", 18000],
      ["ASO-AE005-TAN-42", "ASO-AE005", "42", "Tan", 22000],
      ["ASO-AF006-BLU-OS", "ASO-AF006", "OS", "Blue", 15000],
    ];
    const skus: Record<string, string> = {};
    for (const [skuCode, style, size, color, cost] of skuInputs) {
      const row = await queryOne<{ id: string }>(
        client,
        `insert into public.skus (organization_id, product_id, sku_code, size, color, approved_unit_cost, currency_code, created_by)
         values ($1, $2, $3, $4, $5, $6, 'NGN', $7)
         returning id`,
        [org.id, productIds[style], skuCode, size, color, cost, userId],
      );
      skus[skuCode] = row.id;
    }

    const upload = await queryOne<{ id: string }>(
      client,
      `insert into public.data_uploads (
        organization_id, upload_type, file_name, content_sha256, byte_size, row_count, status, warnings_accepted_at, warnings_accepted_by, created_by
      ) values ($1, 'sample', 'aso-hosted-v3-synthetic.csv', repeat('a', 64), 2048, 50, 'consolidated', timezone('utc', now()), $2, $2)
      returning id`,
      [org.id, userId],
    );
    const snapshot = await queryOne<{ id: string }>(
      client,
      `insert into public.inventory_snapshots (organization_id, upload_id, observed_at, status, created_by)
       values ($1, $2, '2026-07-31T00:00:00Z', 'approved', $3)
       returning id`,
      [org.id, upload.id, userId],
    );

    const positionInputs = [
      ["ASO-AB002-GOL-S", "lagos-island", 64, 4, 2, "2026-01-02T00:00:00Z"],
      ["ASO-AA001-BLA-S", "lagos-island", 9, 18, 10, "2026-07-10T00:00:00Z"],
      ["ASO-AD004-PAL-S", "ibadan", 21, 1, 1, "2025-12-12T00:00:00Z"],
      ["ASO-AC003-BLK-M", "abuja", 3, 34, 14, "2026-05-15T00:00:00Z"],
      ["ASO-AE005-TAN-42", "lekki", 30, 2, 0, "2026-02-20T00:00:00Z"],
      ["ASO-AF006-BLU-OS", "ecommerce-pool", 18, 12, 5, "2026-04-05T00:00:00Z"],
    ];
    const positions: Record<string, string> = {};
    for (const [skuCode, locationCode, onHand, sold90, sold30, firstAvailable] of positionInputs) {
      const row = await queryOne<{ id: string }>(
        client,
        `insert into public.inventory_positions (
          organization_id, snapshot_id, sku_id, location_id, on_hand_quantity,
          approved_unit_cost, currency_code, first_available_at, units_sold_90, units_sold_30
        )
        select $1, $2, sku.id, $3, $4, sku.approved_unit_cost, 'NGN', $5, $6, $7
        from public.skus sku
        where sku.organization_id = $1 and sku.id = $8
        returning id`,
        [org.id, snapshot.id, locations[locationCode], onHand, firstAvailable, sold90, sold30, skus[skuCode]],
      );
      positions[`${skuCode}:${locationCode}`] = row.id;
      await client.query(
        `insert into public.sales_facts (
          organization_id, upload_id, sku_id, location_id, sold_at, quantity, gross_amount, currency_code, source_record_key
        ) values ($1, $2, $3, $4, '2026-07-20T00:00:00Z', $5, $6, 'NGN', $7)`,
        [
          org.id,
          upload.id,
          skus[skuCode],
          locations[locationCode],
          Math.max(1, Number(sold90)),
          Math.max(1, Number(sold90)) * 90000,
          `sale:${skuCode}:${locationCode}`,
        ],
      );
    }

    const run = await queryOne<{ id: string }>(
      client,
      `insert into public.intelligence_runs (organization_id, snapshot_id, rule_version, status, evaluated_at, created_by)
       values ($1, $2, $3, 'completed', timezone('utc', now()), $4)
       returning id`,
      [org.id, snapshot.id, RULE_VERSION, userId],
    );
    const riskRows = [
      ["ASO-AB002-GOL-S:lagos-island", "dead", "critical", 92, "strong", 88, "urgent", 91, 3840000, "Transfer excess Lagos gold blazer stock to Abuja demand before markdown.", "transfer"],
      ["ASO-AA001-BLA-S:lagos-island", "fresh", "low", 72, "review", 0, "low", 20, 0, "Protect newness; monitor replenishment rather than dead-stock action.", "investigate"],
      ["ASO-AD004-PAL-S:ibadan", "dead", "high", 38, "strong", 70, "high", 74, 0, "Missing cost suppresses margin markdown; prepare campaign review.", "campaign"],
    ];
    for (const [positionKey, ageBand, riskBand, confidence, opportunityBand, opportunityScore, attentionBand, attentionScore, value, title, action] of riskRows) {
      const insight = await queryOne<{ id: string; location_id: string }>(
        client,
        `insert into public.inventory_risk_insights (
          organization_id, intelligence_run_id, inventory_position_id, location_id,
          age_status, age_days, age_band, sales_status, sales_trend,
          data_confidence_status, data_confidence_score, inventory_risk_status, inventory_risk_score, inventory_risk_band,
          recovery_opportunity_status, recovery_opportunity_score, recovery_opportunity_band,
          attention_priority_status, attention_priority_score, attention_priority_band,
          inventory_value, currency_code, rule_version, evidence, caveats, evaluated_at
        )
        select $1, $2, position.id, position.location_id,
          'known', 210, $3, 'known', 'declining',
          'known', $4, 'known', $5, $6,
          'known', $7, $8,
          'known', $9, $10,
          $11, 'NGN', $12, $13::jsonb, $14::jsonb, timezone('utc', now())
        from public.inventory_positions position
        where position.organization_id = $1 and position.id = $15
        returning id, location_id`,
        [
          org.id,
          run.id,
          ageBand,
          confidence,
          opportunityScore,
          riskBand,
          opportunityScore,
          opportunityBand,
          attentionScore,
          attentionBand,
          value,
          RULE_VERSION,
          JSON.stringify({ dataset_version: DATASET_VERSION, synthetic_demo: true, position: positionKey }),
          JSON.stringify(["Synthetic Aso scenario; not customer validation."]),
          positions[positionKey],
        ],
      );
      const opportunity = await queryOne<{ id: string }>(
        client,
        `insert into public.recovery_opportunities (
          organization_id, inventory_risk_insight_id, location_id, title, proposed_action, status,
          recovery_opportunity_score, recovery_opportunity_band, attention_priority_score, attention_priority_band,
          estimated_value, currency_code, rule_version, evidence, caveats
        ) values ($1, $2, $3, $4, $5, 'open', $6, $7, $8, $9, $10, 'NGN', $11, $12::jsonb, $13::jsonb)
        returning id`,
        [
          org.id,
          insight.id,
          insight.location_id,
          title,
          action,
          opportunityScore,
          opportunityBand,
          attentionScore,
          attentionBand,
          value,
          RULE_VERSION,
          JSON.stringify({ dataset_version: DATASET_VERSION, synthetic_demo: true }),
          JSON.stringify(["Expected synthetic opportunity only; no real recovery claim."]),
        ],
      );
      if (action === "transfer") {
        const project = await queryOne<{ id: string }>(
          client,
          `insert into public.recovery_projects (
            organization_id, recovery_opportunity_id, location_id, name, status, evidence_version, evidence_snapshot, created_by
          ) values ($1, $2, $3, 'Aso Lagos to Abuja transfer recovery review', 'draft', $4, $5::jsonb, $6)
          returning id`,
          [org.id, opportunity.id, insight.location_id, DATASET_VERSION, JSON.stringify({ rule_version: RULE_VERSION }), userId],
        );
        await client.query(
          `insert into public.campaign_briefs (organization_id, recovery_project_id, location_id, status, content, evidence_version, evidence_snapshot, created_by)
           values ($1, $2, $3, 'draft', $4::jsonb, $5, $6::jsonb, $7)`,
          [
            org.id,
            project.id,
            insight.location_id,
            JSON.stringify({ headline: "Synthetic Aso transfer-first recovery brief", disclaimer: "Synthetic demo only." }),
            DATASET_VERSION,
            JSON.stringify({ rule_version: RULE_VERSION }),
            userId,
          ],
        );
      }
    }

    await client.query(
      `insert into public.merchandising_recommendations (
        organization_id, recommendation_type, product_id, sku_id, location_id,
        title, rationale, confidence_level, status, source_milestone, source_metrics, created_by
      )
      select $1, 'allocation_review', product.id, sku.id, $2,
        'Transfer-first review for Gold Aso-Oke Blazer',
        'Synthetic Aso V3 scenario identifies Lagos excess and Abuja demand. This is not autonomous execution.',
        'high', 'proposed', 'M2.11', $3::jsonb, $4
      from public.skus sku
      join public.products product on product.organization_id = sku.organization_id and product.id = sku.product_id
      where sku.organization_id = $1 and sku.sku_code = 'ASO-AB002-GOL-S'`,
      [
        org.id,
        locations["lagos-island"],
        JSON.stringify({ dataset_version: DATASET_VERSION, rule_version: RULE_VERSION, planning_signal: "transfer_first" }),
        userId,
      ],
    );
    const markdownRecommendation = await queryOne<{ id: string; product_id: string; sku_id: string }>(
      client,
      `insert into public.merchandising_recommendations (
        organization_id, recommendation_type, product_id, sku_id, location_id,
        title, rationale, confidence_level, status, source_milestone, source_metrics, created_by
      )
      select $1, 'markdown', product.id, sku.id, $2,
        'Campaign/markdown review suppressed by missing cost',
        'Synthetic Aso V3 scenario has missing cost; margin-sensitive claims are suppressed.',
        'low', 'proposed', 'M2.11', $3::jsonb, $4
      from public.skus sku
      join public.products product on product.organization_id = sku.organization_id and product.id = sku.product_id
      where sku.organization_id = $1 and sku.sku_code = 'ASO-AD004-PAL-S'
      returning id, product_id, sku_id`,
      [
        org.id,
        locations["ibadan"],
        JSON.stringify({ dataset_version: DATASET_VERSION, rule_version: RULE_VERSION, planning_signal: "campaign_review" }),
        userId,
      ],
    );
    await client.query(
      `insert into public.markdown_plan_drafts (
        organization_id, recommendation_id, product_id, sku_id, location_id,
        recommended_discount_percent, reason, status, confidence_level, created_by
      ) values ($1, $2, $3, $4, $5, 10, 'Synthetic controlled markdown draft; missing cost prevents margin recovery claim.', 'draft', 'low', $6)`,
      [org.id, markdownRecommendation.id, markdownRecommendation.product_id, markdownRecommendation.sku_id, locations["ibadan"], userId],
    );
    const cycle = await queryOne<{ id: string }>(
      client,
      `insert into public.merchandising_plan_cycles (organization_id, cycle_type, season_label, status, notes, created_by)
       values ($1, 'assortment', 'Synthetic Aso V3 review', 'draft', 'Prepared for M2.12 domain review; not pilot validated.', $2)
       returning id`,
      [org.id, userId],
    );
    await client.query(
      `insert into public.assortment_plan_items (organization_id, plan_cycle_id, product_id, product_role, target_location_count, notes, created_by)
       select $1, $2, id, 'review', 3, 'Validate role with domain reviewer.', $3
       from public.products
       where organization_id = $1 and style_code in ('ASO-AA001', 'ASO-AB002', 'ASO-AD004')`,
      [org.id, cycle.id, userId],
    );

    await client.query("commit");
    console.log(JSON.stringify({ dataset_version: DATASET_VERSION, email: EMAIL, organization_slug: ORG_SLUG, provisioned: true }, null, 2));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

async function verify() {
  const env = loadEnv();
  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await supabase.auth.signInWithPassword({ email: EMAIL, password: credentials.password });
  if (signIn.error) throw signIn.error;

  const orgs = await supabase.from("organizations").select("id,name,slug").eq("slug", ORG_SLUG);
  if (orgs.error) throw orgs.error;
  if (orgs.data.length !== 1) throw new Error(`Expected exactly one visible Aso organization, found ${orgs.data.length}`);
  const orgId = orgs.data[0].id;

  const [membership, locations, balances, recommendations, markdowns, cycles] = await Promise.all([
    supabase.from("memberships").select("role,status").eq("organization_id", orgId),
    supabase.from("locations").select("id").eq("organization_id", orgId),
    supabase.from("current_inventory_balances").select("sku_code,available_quantity").eq("organization_id", orgId),
    supabase.from("merchandising_recommendations").select("id").eq("organization_id", orgId),
    supabase.from("markdown_plan_drafts").select("id").eq("organization_id", orgId),
    supabase.from("merchandising_plan_cycles").select("id").eq("organization_id", orgId),
  ]);
  for (const result of [membership, locations, balances, recommendations, markdowns, cycles]) {
    if (result.error) throw result.error;
  }
  const role = membership.data?.find((row) => row.role === "org_owner" && row.status === "active");
  if (!role) throw new Error("Aso owner membership is not active ORG_OWNER.");
  if ((locations.data?.length ?? 0) !== 5) throw new Error("Expected five Aso locations.");
  if ((balances.data?.length ?? 0) < 6) throw new Error("Expected at least six inventory balances.");
  if ((recommendations.data?.length ?? 0) < 2) throw new Error("Expected merchandising recommendations.");
  if ((markdowns.data?.length ?? 0) < 1) throw new Error("Expected markdown draft.");
  if ((cycles.data?.length ?? 0) < 1) throw new Error("Expected merchandising plan cycle.");

  console.log(JSON.stringify({
    authenticated: true,
    dataset_version: DATASET_VERSION,
    locations: locations.data.length,
    inventory_balances: balances.data.length,
    markdown_drafts: markdowns.data.length,
    merchandising_recommendations: recommendations.data.length,
    organization: orgs.data[0].name,
    role: "ORG_OWNER",
  }, null, 2));
}

const command = process.argv[2];
if (command === "provision") {
  provision().catch((error) => {
    console.error(`Hosted Aso provision failed: ${error.message}`);
    process.exit(1);
  });
} else if (command === "verify") {
  verify().catch((error) => {
    console.error(`Hosted Aso verify failed: ${error.message}`);
    process.exit(1);
  });
} else {
  console.error("Usage: node scripts/demo/hosted-aso.ts <provision|verify>");
  process.exit(1);
}
