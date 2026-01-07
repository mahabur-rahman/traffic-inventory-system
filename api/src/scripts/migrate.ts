import { validateEnv } from "../config/env";
import { connectDB } from "../db/sequelize";
import { createMigrator } from "../db/umzug";

async function main() {
  validateEnv();
  const sequelize = await connectDB();
  const migrator = createMigrator(sequelize);

  const direction = process.argv[2] || "up";
  if (direction === "up") {
    await migrator.up();
  } else if (direction === "down") {
    await migrator.down({ step: 1 });
  } else {
    throw new Error('Usage: npm run db:migrate -- "up|down"');
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

