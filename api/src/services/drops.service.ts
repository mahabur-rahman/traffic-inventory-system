import { Op, QueryTypes } from "sequelize";

import { getSequelize } from "../db/sequelize";
import { getModels } from "../models";

import type { z } from "zod";
import type { createDropBodySchema } from "../validators/drop.schemas";

export type CreateDropInput = z.infer<typeof createDropBodySchema> & { created_by: string };

function computeStatus(input: z.infer<typeof createDropBodySchema>) {
  if (input.status) return input.status;
  if (!input.starts_at) return "draft";
  return input.starts_at.getTime() > Date.now() ? "scheduled" : "live";
}

export async function createDrop(input: CreateDropInput) {
  const sequelize = getSequelize();
  const { Drop } = getModels();

  const status = computeStatus(input);

  return sequelize.transaction(async (transaction) => {
    const drop = await (Drop as any).create(
      {
        name: input.name,
        price: input.price,
        totalStock: input.total_stock,
        availableStock: input.total_stock,
        startsAt: input.starts_at ?? null,
        endsAt: input.ends_at ?? null,
        status,
        createdBy: input.created_by
      },
      { transaction }
    );
    return drop;
  });
}

export type ListDropsParams = {
  limit: number;
  offset: number;
  now?: Date;
};

export async function listActiveDrops(params: ListDropsParams) {
  const { Drop } = getModels();
  const now = params.now ?? new Date();

  const where = {
    status: { [Op.in]: ["scheduled", "live"] },
    [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }]
  };

  const result = await (Drop as any).findAndCountAll({
    where,
    order: [
      ["startsAt", "ASC"],
      ["createdAt", "DESC"]
    ],
    limit: params.limit,
    offset: params.offset
  });

  return result as { rows: any[]; count: number };
}

export type LatestPurchaser = {
  drop_id: string;
  user_id: string;
  username: string;
  qty: number;
  created_at: string;
};

export async function fetchLatestPurchasersByDropIds(dropIds: string[]) {
  if (!dropIds.length) return new Map<string, LatestPurchaser[]>();

  const sequelize = getSequelize();

  const rows = (await sequelize.query(
    `
      WITH ranked AS (
        SELECT
          p.drop_id,
          p.user_id,
          u.username,
          p.qty,
          p."createdAt" AS created_at,
          ROW_NUMBER() OVER (PARTITION BY p.drop_id ORDER BY p."createdAt" DESC) AS rn
        FROM purchases p
        JOIN users u ON u.id = p.user_id
        WHERE p.drop_id IN (:dropIds)
          AND p.status = 'paid'
      )
      SELECT drop_id, user_id, username, qty, created_at
      FROM ranked
      WHERE rn <= 3
      ORDER BY drop_id, created_at DESC
    `,
    {
      replacements: { dropIds },
      type: QueryTypes.SELECT
    }
  )) as LatestPurchaser[];

  const map = new Map<string, LatestPurchaser[]>();
  for (const row of rows) {
    const list = map.get(row.drop_id) ?? [];
    list.push(row);
    map.set(row.drop_id, list);
  }
  return map;
}
