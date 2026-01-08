import crypto from "node:crypto";

import { QueryTypes } from "sequelize";

import { validateEnv, env } from "../config/env";
import { connectDB } from "../db/sequelize";
import { initModels } from "../models";
import { logger } from "../logger";

type SeedUser = { id: string; username: string };
type SeedDrop = {
  id: string;
  name: string;
  price: number;
  currency: string;
  totalStock: number;
  availableStock: number;
  startsAt: Date | null;
  endsAt: Date | null;
  status: "draft" | "scheduled" | "live" | "ended" | "cancelled";
  createdBy: string;
};

async function assertSchemaReady(sequelize: any) {
  const rows = (await sequelize.query(
    `SELECT 
      to_regclass('public.users') AS users,
      to_regclass('public.drops') AS drops,
      to_regclass('public.reservations') AS reservations,
      to_regclass('public.purchases') AS purchases
    `,
    { type: QueryTypes.SELECT, logging: false }
  )) as Array<{
    users: string | null;
    drops: string | null;
    reservations: string | null;
    purchases: string | null;
  }>;

  const r = rows[0];
  const missing = Object.entries(r)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    throw new Error(
      `DB schema not ready (missing: ${missing.join(", ")}). Run \`npm run db:migrate\` first.`
    );
  }
}

function pick<T>(arr: T[], idx: number) {
  return arr[idx % arr.length];
}

function minutesFrom(nowMs: number, m: number) {
  return new Date(nowMs + m * 60_000);
}

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  validateEnv();

  const reset = !process.argv.includes("--no-reset");
  if (reset && env.nodeEnv !== "development") {
    throw new Error("Refusing to reset seed data unless NODE_ENV=development (use --no-reset to append)");
  }

  const sequelize = await connectDB();
  const { User, Drop, Reservation, Purchase } = initModels(sequelize);

  await assertSchemaReady(sequelize);

  if (reset) {
    logger.warn("Resetting seed data (TRUNCATE purchases/reservations/drops/users)...");
    await sequelize.query(
      `TRUNCATE TABLE purchases, reservations, drops, users RESTART IDENTITY CASCADE`,
      { logging: false }
    );
  }

  const nowMs = Date.now();

  async function ensureUser(username: string): Promise<SeedUser> {
    const [user] = await (User as any).findOrCreate({
      where: { username },
      defaults: { id: crypto.randomUUID(), username }
    });
    const plain = user.get ? user.get({ plain: true }) : user;
    return { id: plain.id as string, username: plain.username as string };
  }

  const admin = await ensureUser("admin");

  const userNames = [
    "alice",
    "bob",
    "charlie",
    "diana",
    "eve",
    "frank",
    "grace",
    "heidi",
    "ivan",
    "judy",
    "mallory",
    "nick",
    "oscar",
    "peggy",
    "trent",
    "victor",
    "wendy",
    "yuki",
    "zara"
  ];

  const users: SeedUser[] = [admin];
  for (const username of userNames) {
    users.push(await ensureUser(username));
  }

  // Create 15 drops, all "active" (live/scheduled but within time window) so they show on the dashboard.
  const dropTemplates = [
    "Air Jordan 1",
    "Dunk Low",
    "Yeezy Boost 350",
    "Air Max 97",
    "New Balance 550",
    "Jordan 4",
    "Jordan 11",
    "SB Dunk",
    "Air Force 1",
    "Gel-Kayano",
    "Air Max 1",
    "Jordan 3",
    "Dunk High",
    "Yeezy Slide",
    "Stan Smith"
  ];

  const drops: SeedDrop[] = dropTemplates.slice(0, 15).map((base, i) => {
    const id = crypto.randomUUID();
    const totalStock = 30 + (i % 5) * 10; // 30,40,50,60,70
    const startsAt = i % 3 === 0 ? minutesFrom(nowMs, -60) : minutesFrom(nowMs, -15);
    const endsAt = i % 7 === 0 ? minutesFrom(nowMs, 120) : null;
    const status: SeedDrop["status"] = i % 4 === 0 ? "scheduled" : "live";
    return {
      id,
      name: `${base} (Seed ${String(i + 1).padStart(2, "0")})`,
      price: 4500 + (i % 8) * 500, // cents
      currency: "USD",
      totalStock,
      availableStock: totalStock,
      startsAt,
      endsAt,
      status,
      createdBy: admin.id
    };
  });

  await (Drop as any).bulkCreate(drops, { validate: true });

  // We will create:
  // - 15 CONSUMED reservations + 15 purchases (paid) (counts toward activity feed)
  // - 5 ACTIVE reservations (hold stock)
  // - 5 EXPIRED reservations
  // - 5 CANCELLED reservations
  // Total reservations >= 30 and purchases >= 15
  const byDrop = new Map<string, { held: number; sold: number }>();
  for (const d of drops) byDrop.set(d.id, { held: 0, sold: 0 });

  const nonAdminUsers = users.filter((u) => u.id !== admin.id);

  // Purchases (and their consumed reservations)
  const purchaseCount = 15;
  const createdPurchases: Array<{ id: string; dropId: string; userId: string; reservationId: string }> = [];
  for (let i = 0; i < purchaseCount; i++) {
    const drop = pick(drops, i);
    const user = pick(nonAdminUsers, i);
    const reservationId = crypto.randomUUID();
    const purchaseId = crypto.randomUUID();

    await (Reservation as any).create({
      id: reservationId,
      userId: user.id,
      dropId: drop.id,
      status: "CONSUMED",
      // Keep a future expires_at for realism; status controls whether it "holds" stock.
      expiresAt: minutesFrom(nowMs, 10 + (i % 10))
    });

    const createdAt = minutesFrom(nowMs, -(90 - i * 3));
    await (Purchase as any).create({
      id: purchaseId,
      userId: user.id,
      dropId: drop.id,
      reservationId,
      qty: 1,
      amountCents: drop.price,
      currency: drop.currency,
      status: "paid",
      provider: "manual",
      createdAt,
      updatedAt: createdAt
    });

    const stats = byDrop.get(drop.id)!;
    stats.sold += 1;
    createdPurchases.push({ id: purchaseId, dropId: drop.id, userId: user.id, reservationId });
  }

  // ACTIVE reservations (unique per user+drop for ACTIVE enforced by DB)
  const activeCount = 5;
  const activePairs = new Set<string>();
  for (let i = 0; i < activeCount; i++) {
    const candidates = shuffle(drops).filter((d) => {
      const stats = byDrop.get(d.id)!;
      return d.totalStock - (stats.held + stats.sold) > 0;
    });
    const drop = candidates[0] ?? drops[0];

    // pick a user that doesn't already have an ACTIVE reservation on this drop
    const user = shuffle(nonAdminUsers).find((u) => !activePairs.has(`${u.id}:${drop.id}`)) ?? nonAdminUsers[0];
    activePairs.add(`${user.id}:${drop.id}`);

    await (Reservation as any).create({
      id: crypto.randomUUID(),
      userId: user.id,
      dropId: drop.id,
      status: "ACTIVE",
      expiresAt: minutesFrom(nowMs, 1 + (i % 3))
    });

    const stats = byDrop.get(drop.id)!;
    stats.held += 1;
  }

  // EXPIRED + CANCELLED reservations (do not hold stock)
  for (let i = 0; i < 5; i++) {
    const drop = pick(drops, i + 3);
    const user = pick(nonAdminUsers, i + 5);
    await (Reservation as any).create({
      id: crypto.randomUUID(),
      userId: user.id,
      dropId: drop.id,
      status: "EXPIRED",
      expiresAt: minutesFrom(nowMs, -(5 + i))
    });
  }

  for (let i = 0; i < 5; i++) {
    const drop = pick(drops, i + 7);
    const user = pick(nonAdminUsers, i + 9);
    await (Reservation as any).create({
      id: crypto.randomUUID(),
      userId: user.id,
      dropId: drop.id,
      status: "CANCELLED",
      expiresAt: minutesFrom(nowMs, 2 + i)
    });
  }

  // Update each drop's available_stock to match (total - held - sold).
  for (const d of drops) {
    const stats = byDrop.get(d.id)!;
    const available = Math.max(0, d.totalStock - (stats.held + stats.sold));
    await sequelize.query(
      `UPDATE drops SET available_stock = :available, updated_at = NOW() WHERE id = :dropId`,
      { replacements: { available, dropId: d.id }, logging: false }
    );
    d.availableStock = available;
  }

  const counts = (await sequelize.query(
    `SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM drops) AS drops,
      (SELECT COUNT(*)::int FROM reservations) AS reservations,
      (SELECT COUNT(*)::int FROM purchases) AS purchases
    `,
    { type: QueryTypes.SELECT, logging: false }
  )) as Array<{ users: number; drops: number; reservations: number; purchases: number }>;

  logger.info(
    {
      counts: counts[0],
      sample: {
        users: users.slice(0, 5).map((u) => ({ id: u.id, username: u.username })),
        drops: drops.slice(0, 5).map((d) => ({ id: d.id, name: d.name, available_stock: d.availableStock })),
        purchases: createdPurchases.slice(0, 5)
      }
    },
    "Seed complete"
  );

  await sequelize.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
