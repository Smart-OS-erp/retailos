const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

const root = path.resolve(__dirname, "../..");
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error(
    "Live Phase 1 workflow smoke blocked: configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in ignored .env.local.",
  );
  process.exit(1);
}

const authOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

const admin = createClient(supabaseUrl, serviceRoleKey, authOptions);
const runId = randomUUID().replaceAll("-", "").slice(0, 16);
const password = `R0s-${randomUUID()}!`;
const createdUserIds = [];
const createdOrganizationIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createConfirmedUser(label) {
  const email = `phase1-${label}-${runId}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Could not create ${label} test identity: ${error?.message ?? "missing user"}`);
  }

  createdUserIds.push(data.user.id);
  return { email, id: data.user.id };
}

async function authenticatedClient(identity) {
  const client = createClient(supabaseUrl, anonKey, authOptions);
  const { error } = await client.auth.signInWithPassword({
    email: identity.email,
    password,
  });
  if (error) throw new Error(`Could not authenticate synthetic test identity: ${error.message}`);
  return client;
}

async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name} failed: ${error.message}`);
  return data;
}

async function expectRpcFailure(client, name, args, expectedMessage) {
  const { error } = await client.rpc(name, args);
  assert(error, `${name} unexpectedly succeeded`);
  if (expectedMessage) {
    assert(
      error.message.includes(expectedMessage),
      `${name} failed with unexpected message: ${error.message}`,
    );
  }
}

async function cleanup() {
  const cleanupErrors = [];

  if (createdOrganizationIds.length) {
    const tenantTables = [
      "inventory_watchlist_items",
      "inventory_operation_idempotency_keys",
      "transfer_discrepancies",
      "inventory_movements",
      "reconciliation_issues",
      "stock_count_items",
      "stock_counts",
      "transfer_items",
      "transfer_requests",
      "stock_adjustment_items",
      "stock_adjustments",
      "inventory_positions",
      "inventory_snapshots",
      "skus",
      "products",
      "data_uploads",
      "location_assignments",
      "event_log",
      "locations",
      "audit_events",
      "memberships",
    ];

    for (const table of tenantTables) {
      const { error } = await admin.from(table).delete().in("organization_id", createdOrganizationIds);
      if (error) cleanupErrors.push(`${table}: ${error.message}`);
    }

    const { error: organizationError } = await admin
      .from("organizations")
      .delete()
      .in("id", createdOrganizationIds);
    if (organizationError) cleanupErrors.push(`organizations: ${organizationError.message}`);
  }

  for (const userId of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) cleanupErrors.push(`auth user: ${error.message}`);
  }

  return cleanupErrors;
}

async function seedTenant(owner, ownerClient) {
  const organizationId = await rpc(ownerClient, "create_organization", {
    organization_name: "RetailOS Phase 1 Smoke Tenant",
    organization_slug: `phase1-smoke-${runId}`,
  });
  createdOrganizationIds.push(organizationId);

  const { data: locations, error: locationError } = await admin
    .from("locations")
    .insert([
      {
        organization_id: organizationId,
        name: "Phase 1 Smoke Lagos",
        code: `p1-lag-${runId.slice(0, 6)}`,
        timezone: "Africa/Lagos",
        created_by: owner.id,
      },
      {
        organization_id: organizationId,
        name: "Phase 1 Smoke Abuja",
        code: `p1-abj-${runId.slice(0, 6)}`,
        timezone: "Africa/Lagos",
        created_by: owner.id,
      },
    ])
    .select("id, code");
  if (locationError || !locations || locations.length !== 2) {
    throw new Error(`Could not seed smoke locations: ${locationError?.message ?? "missing locations"}`);
  }

  const locationLagos = locations.find((location) => location.code.startsWith("p1-lag-"));
  const locationAbuja = locations.find((location) => location.code.startsWith("p1-abj-"));
  if (!locationLagos || !locationAbuja) {
    throw new Error("Could not resolve seeded smoke locations by code");
  }

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      organization_id: organizationId,
      name: "Phase 1 Smoke Jacket",
      style_code: `P1-${runId.slice(0, 8)}`,
      created_by: owner.id,
    })
    .select("id")
    .single();
  if (productError || !product) throw new Error(`Could not seed smoke product: ${productError?.message ?? "missing product"}`);

  const { data: sku, error: skuError } = await admin
    .from("skus")
    .insert({
      organization_id: organizationId,
      product_id: product.id,
      sku_code: `P1-SMOKE-${runId}`,
      barcode: `P1BAR${runId}`,
      approved_unit_cost: 12500,
      currency_code: "NGN",
      created_by: owner.id,
    })
    .select("id")
    .single();
  if (skuError || !sku) throw new Error(`Could not seed smoke SKU: ${skuError?.message ?? "missing sku"}`);

  const { data: upload, error: uploadError } = await admin
    .from("data_uploads")
    .insert({
      organization_id: organizationId,
      upload_type: "sample",
      file_name: "phase1-smoke.csv",
      content_sha256: "7".repeat(64),
      byte_size: 10,
      row_count: 2,
      status: "consolidated",
      created_by: owner.id,
    })
    .select("id")
    .single();
  if (uploadError || !upload) throw new Error(`Could not seed smoke upload: ${uploadError?.message ?? "missing upload"}`);

  const { data: snapshot, error: snapshotError } = await admin
    .from("inventory_snapshots")
    .insert({
      organization_id: organizationId,
      upload_id: upload.id,
      observed_at: new Date().toISOString(),
      status: "approved",
      created_by: owner.id,
    })
    .select("id")
    .single();
  if (snapshotError || !snapshot) throw new Error(`Could not seed smoke snapshot: ${snapshotError?.message ?? "missing snapshot"}`);

  const { error: positionError } = await admin.from("inventory_positions").insert([
    {
      organization_id: organizationId,
      snapshot_id: snapshot.id,
      sku_id: sku.id,
      location_id: locationLagos.id,
      on_hand_quantity: 20,
      approved_unit_cost: 12500,
      currency_code: "NGN",
    },
    {
      organization_id: organizationId,
      snapshot_id: snapshot.id,
      sku_id: sku.id,
      location_id: locationAbuja.id,
      on_hand_quantity: 2,
      approved_unit_cost: 12500,
      currency_code: "NGN",
    },
  ]);
  if (positionError) throw new Error(`Could not seed smoke positions: ${positionError.message}`);

  return {
    locationAbujaId: locationAbuja.id,
    locationLagosId: locationLagos.id,
    organizationId,
    skuId: sku.id,
    skuCode: `P1-SMOKE-${runId}`,
  };
}

async function addRoleMember(organizationId, user, role, createdBy, locationId, status = "active") {
  const { data: membership, error } = await admin
    .from("memberships")
    .insert({
      organization_id: organizationId,
      user_id: user.id,
      role,
      status,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error || !membership) throw new Error(`Could not create ${role} membership: ${error?.message ?? "missing membership"}`);

  if (locationId) {
    const { error: assignmentError } = await admin.from("location_assignments").insert({
      organization_id: organizationId,
      location_id: locationId,
      membership_id: membership.id,
      created_by: createdBy,
    });
    if (assignmentError) throw new Error(`Could not create location assignment: ${assignmentError.message}`);
  }
}

async function currentBalance(client, organizationId, skuId, locationId) {
  const { data, error } = await client
    .from("current_inventory_balances")
    .select("on_hand_quantity,available_quantity,reserved_quantity,in_transit_quantity")
    .eq("organization_id", organizationId)
    .eq("sku_id", skuId)
    .eq("location_id", locationId)
    .single();
  if (error || !data) throw new Error(`Could not read current balance: ${error?.message ?? "missing balance"}`);
  return data;
}

async function run() {
  const owner = await createConfirmedUser("owner");
  const viewer = await createConfirmedUser("viewer");
  const store = await createConfirmedUser("store");
  const suspended = await createConfirmedUser("suspended");

  const ownerClient = await authenticatedClient(owner);
  const viewerClient = await authenticatedClient(viewer);
  const storeClient = await authenticatedClient(store);
  const suspendedClient = await authenticatedClient(suspended);

  const fixture = await seedTenant(owner, ownerClient);
  await addRoleMember(fixture.organizationId, viewer, "viewer", owner.id);
  await addRoleMember(fixture.organizationId, store, "store_manager", owner.id, fixture.locationLagosId);
  await addRoleMember(fixture.organizationId, suspended, "merchandising_manager", owner.id, null, "suspended");

  const search = await rpc(ownerClient, "search_inventory_items", {
    result_limit: 25,
    search_term: fixture.skuCode,
    target_location_id: null,
  });
  assert(Array.isArray(search), "Inventory search did not return a result array");
  assert(search.length > 0, "Inventory search did not find the seeded SKU code");

  const watchlistId = await rpc(ownerClient, "add_inventory_watchlist_item", {
    target_location_id: fixture.locationLagosId,
    target_note: "Smoke saved watchlist",
    target_sku_id: fixture.skuId,
    target_watch_status: "manual",
  });
  const duplicateWatchlistId = await rpc(ownerClient, "add_inventory_watchlist_item", {
    target_location_id: fixture.locationLagosId,
    target_note: "Smoke saved watchlist updated",
    target_sku_id: fixture.skuId,
    target_watch_status: "low_stock",
  });
  assert(watchlistId === duplicateWatchlistId, "Saved watchlist duplicate was not idempotently updated");
  await expectRpcFailure(viewerClient, "add_inventory_watchlist_item", {
    target_location_id: fixture.locationLagosId,
    target_note: "Viewer should fail",
    target_sku_id: fixture.skuId,
    target_watch_status: "manual",
  }, "permission_denied");
  await rpc(ownerClient, "remove_inventory_watchlist_item", {
    target_watchlist_item_id: watchlistId,
  });

  const startingLagos = await currentBalance(ownerClient, fixture.organizationId, fixture.skuId, fixture.locationLagosId);
  const adjustmentId = await rpc(ownerClient, "create_stock_adjustment", {
    target_items: [{ quantity_delta: -2, sku_id: fixture.skuId }],
    target_location_id: fixture.locationLagosId,
    target_reason: "Smoke adjustment",
  });
  await rpc(ownerClient, "approve_stock_adjustment", { target_adjustment_id: adjustmentId });
  await rpc(ownerClient, "execute_stock_adjustment", {
    target_adjustment_id: adjustmentId,
    target_idempotency_key: `smoke-adjust-execute-${runId}`,
  });
  await rpc(ownerClient, "execute_stock_adjustment", {
    target_adjustment_id: adjustmentId,
    target_idempotency_key: `smoke-adjust-execute-${runId}`,
  });
  const adjustedLagos = await currentBalance(ownerClient, fixture.organizationId, fixture.skuId, fixture.locationLagosId);
  assert(adjustedLagos.on_hand_quantity === startingLagos.on_hand_quantity - 2, "Adjustment did not reconcile to expected on-hand quantity");
  await rpc(ownerClient, "reverse_stock_adjustment", {
    target_adjustment_id: adjustmentId,
    target_idempotency_key: `smoke-adjust-reverse-${runId}`,
    target_reversal_reason: "Smoke reversal",
  });
  const reversedLagos = await currentBalance(ownerClient, fixture.organizationId, fixture.skuId, fixture.locationLagosId);
  assert(reversedLagos.on_hand_quantity === startingLagos.on_hand_quantity, "Adjustment reversal did not reconcile to starting on-hand quantity");

  const transferId = await rpc(ownerClient, "create_transfer_request", {
    destination_location_id: fixture.locationAbujaId,
    origin_location_id: fixture.locationLagosId,
    target_items: [{ quantity: 4, sku_id: fixture.skuId }],
    target_reason: "Smoke transfer",
  });
  await rpc(ownerClient, "approve_transfer_request", { target_transfer_id: transferId });
  await rpc(ownerClient, "dispatch_transfer_request", {
    target_idempotency_key: `smoke-transfer-dispatch-${runId}`,
    target_transfer_id: transferId,
  });
  await rpc(ownerClient, "dispatch_transfer_request", {
    target_idempotency_key: `smoke-transfer-dispatch-${runId}`,
    target_transfer_id: transferId,
  });

  const { data: transferItems, error: transferItemsError } = await ownerClient
    .from("transfer_items")
    .select("id")
    .eq("organization_id", fixture.organizationId)
    .eq("transfer_request_id", transferId);
  if (transferItemsError || !transferItems?.[0]) {
    throw new Error(`Could not read transfer item: ${transferItemsError?.message ?? "missing item"}`);
  }
  await rpc(ownerClient, "receive_transfer_request", {
    target_idempotency_key: `smoke-transfer-receive-partial-${runId}`,
    target_receipts: [{ received_quantity: 1, transfer_item_id: transferItems[0].id }],
    target_transfer_id: transferId,
  });
  const partialAbuja = await currentBalance(ownerClient, fixture.organizationId, fixture.skuId, fixture.locationAbujaId);
  assert(partialAbuja.in_transit_quantity === 3, "Partial receipt did not keep expected in-transit quantity");
  await rpc(ownerClient, "receive_transfer_request", {
    target_idempotency_key: `smoke-transfer-receive-final-${runId}`,
    target_receipts: [{ received_quantity: 3, transfer_item_id: transferItems[0].id }],
    target_transfer_id: transferId,
  });
  const receivedAbuja = await currentBalance(ownerClient, fixture.organizationId, fixture.skuId, fixture.locationAbujaId);
  assert(receivedAbuja.in_transit_quantity === 0, "Final receipt did not clear in-transit quantity");

  const countCurrent = receivedAbuja.on_hand_quantity;
  const countId = await rpc(ownerClient, "submit_stock_count", {
    target_counted_at: new Date().toISOString(),
    target_items: [{
      counted_quantity: countCurrent + 1,
      expected_quantity: countCurrent,
      sku_id: fixture.skuId,
    }],
    target_location_id: fixture.locationAbujaId,
  });
  await rpc(ownerClient, "review_stock_count", {
    target_review_notes: "Smoke review",
    target_stock_count_id: countId,
  });
  const { data: countIssues, error: countIssuesError } = await ownerClient
    .from("reconciliation_issues")
    .select("id")
    .eq("organization_id", fixture.organizationId)
    .eq("stock_count_id", countId);
  if (countIssuesError || !countIssues?.[0]) {
    throw new Error(`Could not read count issue: ${countIssuesError?.message ?? "missing issue"}`);
  }
  await rpc(ownerClient, "close_stock_count", {
    target_closure_notes: "Smoke closure",
    target_create_corrections: true,
    target_idempotency_key: `smoke-count-close-${runId}`,
    target_issue_decisions: [{
      issue_id: countIssues[0].id,
      resolution_note: "Smoke count verified",
      status: "resolved",
    }],
    target_stock_count_id: countId,
  });
  await rpc(ownerClient, "close_stock_count", {
    target_closure_notes: "Smoke closure retry",
    target_create_corrections: true,
    target_idempotency_key: `smoke-count-close-${runId}`,
    target_issue_decisions: [],
    target_stock_count_id: countId,
  });
  const countedAbuja = await currentBalance(ownerClient, fixture.organizationId, fixture.skuId, fixture.locationAbujaId);
  assert(countedAbuja.on_hand_quantity === countCurrent + 1, "Count correction did not reconcile on-hand quantity");

  await expectRpcFailure(storeClient, "create_transfer_request", {
    destination_location_id: fixture.locationAbujaId,
    origin_location_id: fixture.locationLagosId,
    target_items: [{ quantity: 1, sku_id: fixture.skuId }],
    target_reason: "Store unassigned destination should fail",
  }, "permission_denied");
  await expectRpcFailure(suspendedClient, "create_stock_adjustment", {
    target_items: [{ quantity_delta: 1, sku_id: fixture.skuId }],
    target_location_id: fixture.locationLagosId,
    target_reason: "Suspended should fail",
  }, "permission_denied");

  const { data: auditEvents, error: auditError } = await ownerClient
    .from("audit_events")
    .select("action")
    .eq("organization_id", fixture.organizationId);
  if (auditError) throw new Error(`Could not verify audit events: ${auditError.message}`);
  const auditActions = new Set(auditEvents.map((event) => event.action));
  for (const action of [
    "inventory_watchlist_item.added",
    "inventory_watchlist_item.removed",
    "stock_adjustment.requested",
    "stock_adjustment.approved",
    "stock_adjustment.executed",
    "stock_adjustment.reversed",
    "transfer_request.requested",
    "transfer_request.approved",
    "transfer_request.dispatched",
    "transfer_request.received",
    "stock_count.submitted",
    "stock_count.reviewed",
    "stock_count.closed",
  ]) {
    assert(auditActions.has(action), `Missing audit action ${action}`);
  }

  console.log(
    JSON.stringify({
      cleanup: "pending",
      deployment_url: "database-live",
      organization_suffix: fixture.organizationId.slice(-8),
      status: "passed",
      workflows: [
        "inventory_search",
        "saved_watchlist_add_remove",
        "adjustment_execute_reverse",
        "transfer_partial_full_receipt",
        "stock_count_close_correction",
        "role_location_restrictions",
        "audit_events",
      ],
    }),
  );
}

run()
  .catch((error) => {
    console.error(`Live Phase 1 workflow smoke failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const cleanupErrors = await cleanup();
    if (cleanupErrors.length) {
      console.error(`Live Phase 1 workflow cleanup requires attention: ${cleanupErrors.join("; ")}`);
      process.exitCode = 1;
    } else if (process.exitCode !== 1) {
      console.log("Live Phase 1 workflow synthetic cleanup passed.");
    }
  });
