
import dotenv from "dotenv";
import { Umzug, SequelizeStorage } from "umzug";

import sequelize from "../config/database.js";

dotenv.config();

const umzug = new Umzug({
  migrations: {
    glob: "src/database/migrations/*.js"
  },

  context: sequelize.getQueryInterface(),

  storage: new SequelizeStorage({
    sequelize,
    tableName: "sequelize_meta"
  }),

  logger: console
});

const runMigrations = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connection successful.");

    const command = process.argv[2];

    if (command === "down") {
      const migration = await umzug.down();
      console.log("Migration rollback completed:", migration);
    } else {
      const migrations = await umzug.up();

      console.log("Migration execution completed.");
      console.log(
        "Executed migrations:",
        migrations.map(item => item.name)
      );
    }

  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;

  } finally {
    await sequelize.close();
  }
};

runMigrations();

