import path from "node:path";

import { Umzug, SequelizeStorage } from "umzug";
import type { Sequelize } from "sequelize";

export function createMigrator(sequelize: Sequelize) {
  const migrationsGlob = path
    .join(process.cwd(), "dist", "db", "migrations", "*.js")
    .replace(/\\/g, "/");

  return new Umzug({
    migrations: {
      glob: migrationsGlob
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console
  });
}
